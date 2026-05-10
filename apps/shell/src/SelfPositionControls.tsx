// Position controls (X/Y translate) for the *currently selected element
// itself* — distinct from ChildLayoutControls, which iterates over the
// children of a selected container.
//
// This is the more intuitive entry point: pick any element (text, image,
// box) and nudge it without affecting siblings. Implemented as inline
// `transform: translate()` so it doesn't reflow the page.
//
// We don't expose a Padding tab here because StyleControls already drives
// padding via the companion's `set_style_value` — exposing it twice would
// be redundant and produce duplicate diffs.

import { useEffect, useMemo, useState } from 'react';

import type { PendingSelection, SelectedTarget, StyleChangeDiff } from './refineProtocol';
import type { SavedRefinement } from './RefinementToPrompt';
import {
  buildAiRestructurePrompt,
  clampInput,
  detectParentConstraints,
  readTranslateFromMatrix,
  type ParentConstraint,
} from './layoutHelpers';

interface Props {
  pending: PendingSelection;
  iframe: HTMLIFrameElement | null;
  upsertSaved: (item: SavedRefinement) => void;
  artifactPath: string | null;
  resetSignal: number;
}

interface SelfInfo {
  selector: string;
  /** Original computed translate (px) — usually 0,0 unless author set one. */
  originalTranslateX: number;
  originalTranslateY: number;
  /** Original inline `transform` string — restored on reset. */
  originalTransformInline: string;
  /** Parent layout constraint, if any — drives the warning banner. */
  parentConstraint: ParentConstraint | null;
  /** Parent label for the AI-prompt context. */
  parentLabel: string;
  /** Parent selector for the AI-prompt context. */
  parentSelector: string;
}

const POS_SLIDER_MIN = -200;
const POS_SLIDER_MAX = 200;
const POS_INPUT_MIN = -1000;
const POS_INPUT_MAX = 1000;

function describeParent(parent: Element): { label: string; selector: string } {
  const tag = parent.tagName.toLowerCase();
  const cls = (parent as HTMLElement).className;
  const id = (parent as HTMLElement).id;
  if (id) return { label: `${tag}#${id}`, selector: `#${id}` };
  if (typeof cls === 'string' && cls.trim()) {
    const first = cls.trim().split(/\s+/)[0];
    return { label: `${tag}.${first}`, selector: `${tag}.${first}` };
  }
  return { label: tag, selector: tag };
}

export function SelfPositionControls({
  pending,
  iframe,
  upsertSaved,
  artifactPath,
  resetSignal,
}: Props) {
  const selfSelector = pending.target.selector;

  const info = useMemo<SelfInfo | null>(() => {
    if (!iframe) return null;
    const doc = iframe.contentDocument;
    if (!doc) return null;
    let el: Element | null = null;
    try {
      el = doc.querySelector(selfSelector);
    } catch {
      return null;
    }
    if (!el) return null;
    const t = readTranslateFromMatrix(el);
    const parent = el.parentElement;
    return {
      selector: selfSelector,
      originalTranslateX: t.x,
      originalTranslateY: t.y,
      originalTransformInline: (el as HTMLElement).style.transform,
      parentConstraint: parent ? detectParentConstraints(parent) : null,
      parentLabel: parent ? describeParent(parent).label : '<no parent>',
      parentSelector: parent ? describeParent(parent).selector : '',
    };
  }, [selfSelector, iframe, resetSignal]);

  const [values, setValues] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [drafts, setDrafts] = useState<{ x: string; y: string }>({ x: '', y: '' });

  useEffect(() => {
    if (!info) return;
    setValues({ x: info.originalTranslateX, y: info.originalTranslateY });
    setDrafts({ x: '', y: '' });
  }, [info]);

  if (!info) return null;

  function applyTranslate(axis: 'x' | 'y', next: number) {
    if (!info) return;
    const updated = { ...values, [axis]: next };
    setValues(updated);
    if (!iframe?.contentDocument) return;
    let el: Element | null = null;
    try {
      el = iframe.contentDocument.querySelector(info.selector);
    } catch {
      return;
    }
    if (!el) return;
    (el as HTMLElement).style.transform = `translate(${updated.x}px, ${updated.y}px)`;

    const id = `self-translate:${info.selector}`;
    const region: SelectedTarget = pending.target;
    const diff: StyleChangeDiff = {
      id,
      selector: info.selector,
      target: pending.target.label,
      createdAt: new Date().toISOString(),
      type: 'style_change',
      property: 'translate',
      before: `translate(${info.originalTranslateX}px, ${info.originalTranslateY}px)`,
      after: `translate(${updated.x}px, ${updated.y}px)`,
    };
    upsertSaved({
      id,
      region,
      note: `Reposition selected element (visual translate, no flow change)`,
      diffs: [diff],
      createdAt: diff.createdAt,
    });
  }

  function commitDraft(axis: 'x' | 'y') {
    const draft = drafts[axis];
    const n = clampInput(draft, POS_INPUT_MIN, POS_INPUT_MAX);
    setDrafts((prev) => ({ ...prev, [axis]: '' }));
    if (n !== null) applyTranslate(axis, n);
  }

  function reset() {
    if (!info || !iframe?.contentDocument) return;
    let el: Element | null = null;
    try {
      el = iframe.contentDocument.querySelector(info.selector);
    } catch {
      return;
    }
    if (!el) return;
    (el as HTMLElement).style.transform = info.originalTransformInline;
    setValues({ x: info.originalTranslateX, y: info.originalTranslateY });
    setDrafts({ x: '', y: '' });
  }

  async function copyAiPrompt() {
    if (!info?.parentConstraint) return;
    const prompt = buildAiRestructurePrompt(
      info.parentLabel,
      info.parentSelector || info.selector,
      artifactPath,
      info.parentConstraint.reason,
    );
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (err) {
      console.error('[shell] clipboard failed', err);
    }
  }

  return (
    <details open style={detailsBox}>
      <summary style={summaryRow}>
        <span style={summaryText}>Position</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            reset();
          }}
          style={resetBtn}
          title="Reset position to original"
        >
          ↺
        </button>
      </summary>

      {info.parentConstraint && (
        <div style={info.parentConstraint.blocking ? warnBoxBlocking : warnBoxSoft}>
          <div style={warnTitle}>
            {info.parentConstraint.blocking ? '⚠️' : '💡'} Parent layout limits free positioning
          </div>
          <div style={warnReason}>{info.parentConstraint.reason}</div>
          <div style={warnHint}>
            Translate shifts this element visually but doesn't change its layout slot.
            For true Figma-style free positioning, ask Claude to restructure the parent.
          </div>
          <button type="button" onClick={copyAiPrompt} style={warnBtn}>
            📋 Copy AI prompt to restructure parent
          </button>
        </div>
      )}

      <div style={listWrap}>
        <AxisRow
          label="Y"
          title="translateY — vertical visual offset (positive = down)"
          sliderValue={Math.max(POS_SLIDER_MIN, Math.min(POS_SLIDER_MAX, values.y))}
          inputValue={drafts.y === '' ? String(values.y) : drafts.y}
          onSlider={(n) => applyTranslate('y', n)}
          onInputChange={(s) => setDrafts((prev) => ({ ...prev, y: s }))}
          onInputCommit={() => commitDraft('y')}
        />
        <AxisRow
          label="X"
          title="translateX — horizontal visual offset (positive = right)"
          sliderValue={Math.max(POS_SLIDER_MIN, Math.min(POS_SLIDER_MAX, values.x))}
          inputValue={drafts.x === '' ? String(values.x) : drafts.x}
          onSlider={(n) => applyTranslate('x', n)}
          onInputChange={(s) => setDrafts((prev) => ({ ...prev, x: s }))}
          onInputCommit={() => commitDraft('x')}
        />
      </div>
    </details>
  );
}

interface AxisRowProps {
  label: string;
  title: string;
  sliderValue: number;
  inputValue: string;
  onSlider: (n: number) => void;
  onInputChange: (s: string) => void;
  onInputCommit: () => void;
}

function AxisRow({
  label,
  title,
  sliderValue,
  inputValue,
  onSlider,
  onInputChange,
  onInputCommit,
}: AxisRowProps) {
  return (
    <div style={axisRow} title={title}>
      <span style={axisLabel}>{label}</span>
      <input
        type="range"
        min={POS_SLIDER_MIN}
        max={POS_SLIDER_MAX}
        step={1}
        value={sliderValue}
        onChange={(e) => onSlider(Number(e.target.value))}
        style={slider}
      />
      <input
        type="number"
        min={POS_INPUT_MIN}
        max={POS_INPUT_MAX}
        step={1}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={onInputCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        style={numInput}
      />
      <span style={unitLabel}>px</span>
    </div>
  );
}

const detailsBox: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  padding: 10,
  background: '#fff',
};
const summaryRow: React.CSSProperties = {
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  color: '#0f172a',
  letterSpacing: 0.3,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  listStyle: 'none',
};
const summaryText: React.CSSProperties = {};
const warnBoxBlocking: React.CSSProperties = {
  marginTop: 10,
  padding: 10,
  background: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: 6,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};
const warnBoxSoft: React.CSSProperties = {
  ...warnBoxBlocking,
  background: '#eff6ff',
  border: '1px solid #93c5fd',
};
const warnTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#92400e',
};
const warnReason: React.CSSProperties = {
  fontSize: 10,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  color: '#78350f',
  background: 'rgba(255,255,255,0.4)',
  padding: '4px 6px',
  borderRadius: 4,
};
const warnHint: React.CSSProperties = {
  fontSize: 11,
  color: '#475569',
  lineHeight: 1.4,
};
const warnBtn: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  padding: '6px 10px',
  border: '1px solid #cbd5e1',
  borderRadius: 4,
  background: '#fff',
  cursor: 'pointer',
  color: '#0f172a',
  alignSelf: 'flex-start',
};
const listWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginTop: 10,
};
const axisRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '20px 1fr 56px 18px',
  alignItems: 'center',
  gap: 8,
};
const axisLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: '#64748b',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  textAlign: 'center',
};
const slider: React.CSSProperties = {
  width: '100%',
  accentColor: '#2563eb',
};
const numInput: React.CSSProperties = {
  width: '100%',
  padding: '3px 6px',
  border: '1px solid #cbd5e1',
  borderRadius: 4,
  background: '#fff',
  fontSize: 11,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  color: '#0f172a',
  textAlign: 'right',
  boxSizing: 'border-box',
};
const unitLabel: React.CSSProperties = {
  fontSize: 10,
  color: '#94a3b8',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};
const resetBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  border: '1px solid #e2e8f0',
  borderRadius: 4,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 12,
  color: '#64748b',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
