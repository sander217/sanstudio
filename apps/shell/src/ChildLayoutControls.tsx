// Per-child layout controls — shown when the user selects a container
// element. Each child gets two modes:
//
//   Position (default) — translateX / translateY. Moves the child visually
//                        without pushing siblings, like a Figma frame's
//                        free-form layer. Implemented via inline
//                        `transform: translate()`.
//
//   Padding            — top/bottom (V) and left/right (H). Changes the
//                        child's intrinsic size and DOES affect siblings,
//                        because padding participates in flow layout.
//
// Why this lives in the shell, not the refinetool companion:
//   The vendored companion's RPC only addresses the currently-pending
//   selection. Mutating siblings would need either a per-click select
//   round-trip or a protocol extension. Here we read/write the iframe DOM
//   directly (same-origin via the Vite middleware) and push synthetic
//   SavedRefinements so the iterate prompt still ships every change.
//
// Layout constraint warning:
//   Translate works visually almost everywhere, but the parent's CSS can
//   still produce surprising results — `overflow: hidden` clips children
//   that move beyond the parent's box, `display: grid`/`flex` with strict
//   alignment may make the visual shift look "stuck". When we detect such
//   a parent, we surface an AI-prompt tip so the user can ask Claude to
//   restructure the layout for true free positioning.

import { useEffect, useMemo, useState } from 'react';

import type { PendingSelection, SelectedTarget, StyleChangeDiff } from './refineProtocol';
import type { SavedRefinement } from './RefinementToPrompt';
import {
  buildAiRestructurePrompt,
  clampInput,
  detectParentConstraints,
  isContainerCandidate,
  paddingShorthand,
  readNumericStyle,
  readTranslateFromMatrix,
  shortSnippet,
  type ParentConstraint,
} from './layoutHelpers';

interface Props {
  pending: PendingSelection;
  iframe: HTMLIFrameElement | null;
  /** Push (or in-place update) a refinement in the saved list. */
  upsertSaved: (item: SavedRefinement) => void;
  /** Path of the currently-loaded artifact (for AI prompt context). */
  artifactPath: string | null;
  /** Forces re-mount when selection changes / panel is reset. */
  resetSignal: number;
}

interface ChildInfo {
  selector: string;
  tag: string;
  snippet: string;
  /** Original computed translate (px). Usually 0 unless author set one. */
  originalTranslateY: number;
  originalTranslateX: number;
  /** Original inline `transform` string — restored on reset. */
  originalTransformInline: string;
  /** Original computed padding-top / padding-left in px. */
  originalPaddingY: number;
  originalPaddingX: number;
  /** Original inline padding shorthand (often empty) — restored on reset. */
  originalPaddingInline: string;
  /** CSS shorthand of the original padding (for diff `before`). */
  originalPaddingCss: string;
}

const POS_SLIDER_MIN = -200;
const POS_SLIDER_MAX = 200;
const POS_INPUT_MIN = -1000;
const POS_INPUT_MAX = 1000;
const PAD_SLIDER_MIN = 0;
const PAD_SLIDER_MAX = 80;
const PAD_INPUT_MIN = 0;
const PAD_INPUT_MAX = 400;

export function ChildLayoutControls({
  pending,
  iframe,
  upsertSaved,
  artifactPath,
  resetSignal,
}: Props) {
  const containerSelector = pending.target.selector;
  const containerTag = pending.target.tag;
  const containerLabel = pending.target.label;

  const { children, parentConstraint } = useMemo<{
    children: ChildInfo[];
    parentConstraint: ParentConstraint | null;
  }>(() => {
    if (!iframe || !isContainerCandidate(containerTag)) {
      return { children: [], parentConstraint: null };
    }
    const doc = iframe.contentDocument;
    if (!doc) return { children: [], parentConstraint: null };
    let parent: Element | null = null;
    try {
      parent = doc.querySelector(containerSelector);
    } catch {
      return { children: [], parentConstraint: null };
    }
    if (!parent) return { children: [], parentConstraint: null };
    const out: ChildInfo[] = [];
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i];
      const sel = `${containerSelector} > :nth-child(${i + 1})`;
      const t = readTranslateFromMatrix(child);
      const py = readNumericStyle(child, 'padding-top');
      const px = readNumericStyle(child, 'padding-left');
      out.push({
        selector: sel,
        tag: child.tagName.toLowerCase(),
        snippet: shortSnippet(child),
        originalTranslateX: t.x,
        originalTranslateY: t.y,
        originalTransformInline: (child as HTMLElement).style.transform,
        originalPaddingY: py,
        originalPaddingX: px,
        originalPaddingInline: (child as HTMLElement).style.padding,
        originalPaddingCss: paddingShorthand(py, px),
      });
    }
    return { children: out, parentConstraint: detectParentConstraints(parent) };
  }, [containerSelector, containerTag, iframe, resetSignal]);

  // Per-child mode toggle ("position" by default — that's the Figma-like
  // free positioning the user usually wants).
  const [modes, setModes] = useState<Record<string, 'position' | 'padding'>>({});
  // Per-child live values for both modes. Kept independent so toggling
  // tabs doesn't lose the in-progress edit on the other axis pair.
  const [posValues, setPosValues] = useState<Record<string, { x: number; y: number }>>({});
  const [padValues, setPadValues] = useState<Record<string, { y: number; x: number }>>({});
  // Per-child raw input drafts so the user can type "120" without each
  // keystroke clamping. Empty string means "show the live value".
  const [posDrafts, setPosDrafts] = useState<Record<string, { x: string; y: string }>>({});
  const [padDrafts, setPadDrafts] = useState<Record<string, { y: string; x: string }>>({});

  useEffect(() => {
    const m: Record<string, 'position' | 'padding'> = {};
    const pv: Record<string, { x: number; y: number }> = {};
    const dv: Record<string, { y: number; x: number }> = {};
    const pd: Record<string, { x: string; y: string }> = {};
    const dd: Record<string, { y: string; x: string }> = {};
    for (const c of children) {
      m[c.selector] = 'position';
      pv[c.selector] = { x: c.originalTranslateX, y: c.originalTranslateY };
      dv[c.selector] = { y: c.originalPaddingY, x: c.originalPaddingX };
      pd[c.selector] = { x: '', y: '' };
      dd[c.selector] = { y: '', x: '' };
    }
    setModes(m);
    setPosValues(pv);
    setPadValues(dv);
    setPosDrafts(pd);
    setPadDrafts(dd);
  }, [children]);

  if (children.length === 0) return null;

  function applyTranslate(child: ChildInfo, axis: 'x' | 'y', next: number) {
    const cur = posValues[child.selector] ?? {
      x: child.originalTranslateX,
      y: child.originalTranslateY,
    };
    const updated = { ...cur, [axis]: next };
    setPosValues((prev) => ({ ...prev, [child.selector]: updated }));
    if (!iframe?.contentDocument) return;
    let el: Element | null = null;
    try {
      el = iframe.contentDocument.querySelector(child.selector);
    } catch {
      return;
    }
    if (!el) return;
    // Set a clean translate — overrides any other transform on the
    // inline style. Authors rarely set transform inline, so this is
    // safe; if they do, the original is restored on reset.
    (el as HTMLElement).style.transform = `translate(${updated.x}px, ${updated.y}px)`;

    const id = `child-translate:${child.selector}`;
    const region: SelectedTarget = {
      selector: child.selector,
      label: `${child.tag}${child.snippet ? ` "${child.snippet}"` : ''}`,
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      snippet: child.snippet,
      tag: child.tag,
      hasImage: child.tag === 'img',
      breadcrumb: pending.target.breadcrumb
        ? [...pending.target.breadcrumb, child.tag]
        : [containerTag.toLowerCase(), child.tag],
    };
    const diff: StyleChangeDiff = {
      id,
      selector: child.selector,
      target: region.label,
      createdAt: new Date().toISOString(),
      type: 'style_change',
      property: 'translate',
      before: `translate(${child.originalTranslateX}px, ${child.originalTranslateY}px)`,
      after: `translate(${updated.x}px, ${updated.y}px)`,
    };
    upsertSaved({
      id,
      region,
      note: `Reposition child inside ${containerTag.toLowerCase()} (visual translate, no flow change)`,
      diffs: [diff],
      createdAt: diff.createdAt,
    });
  }

  function applyPadding(child: ChildInfo, axis: 'y' | 'x', next: number) {
    const cur = padValues[child.selector] ?? {
      y: child.originalPaddingY,
      x: child.originalPaddingX,
    };
    const updated = { ...cur, [axis]: next };
    setPadValues((prev) => ({ ...prev, [child.selector]: updated }));
    if (!iframe?.contentDocument) return;
    let el: Element | null = null;
    try {
      el = iframe.contentDocument.querySelector(child.selector);
    } catch {
      return;
    }
    if (!el) return;
    const target = el as HTMLElement;
    target.style.paddingTop = `${updated.y}px`;
    target.style.paddingBottom = `${updated.y}px`;
    target.style.paddingLeft = `${updated.x}px`;
    target.style.paddingRight = `${updated.x}px`;

    const id = `child-padding:${child.selector}`;
    const region: SelectedTarget = {
      selector: child.selector,
      label: `${child.tag}${child.snippet ? ` "${child.snippet}"` : ''}`,
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      snippet: child.snippet,
      tag: child.tag,
      hasImage: child.tag === 'img',
      breadcrumb: pending.target.breadcrumb
        ? [...pending.target.breadcrumb, child.tag]
        : [containerTag.toLowerCase(), child.tag],
    };
    const diff: StyleChangeDiff = {
      id,
      selector: child.selector,
      target: region.label,
      createdAt: new Date().toISOString(),
      type: 'style_change',
      property: 'padding',
      before: child.originalPaddingCss,
      after: paddingShorthand(updated.y, updated.x),
    };
    upsertSaved({
      id,
      region,
      note: `Adjust padding of child inside ${containerTag.toLowerCase()}`,
      diffs: [diff],
      createdAt: diff.createdAt,
    });
  }

  function commitPosDraft(child: ChildInfo, axis: 'x' | 'y') {
    const draft = posDrafts[child.selector]?.[axis] ?? '';
    const n = clampInput(draft, POS_INPUT_MIN, POS_INPUT_MAX);
    setPosDrafts((prev) => ({
      ...prev,
      [child.selector]: { ...(prev[child.selector] ?? { x: '', y: '' }), [axis]: '' },
    }));
    if (n !== null) applyTranslate(child, axis, n);
  }

  function commitPadDraft(child: ChildInfo, axis: 'y' | 'x') {
    const draft = padDrafts[child.selector]?.[axis] ?? '';
    const n = clampInput(draft, PAD_INPUT_MIN, PAD_INPUT_MAX);
    setPadDrafts((prev) => ({
      ...prev,
      [child.selector]: { ...(prev[child.selector] ?? { y: '', x: '' }), [axis]: '' },
    }));
    if (n !== null) applyPadding(child, axis, n);
  }

  function resetChild(child: ChildInfo) {
    if (!iframe?.contentDocument) return;
    let el: Element | null = null;
    try {
      el = iframe.contentDocument.querySelector(child.selector);
    } catch {
      return;
    }
    if (!el) return;
    const target = el as HTMLElement;
    // Restore both flavors of edit — even if the user only touched one,
    // resetting both is the least-surprising behavior.
    target.style.transform = child.originalTransformInline;
    target.style.paddingTop = '';
    target.style.paddingBottom = '';
    target.style.paddingLeft = '';
    target.style.paddingRight = '';
    target.style.padding = child.originalPaddingInline;
    setPosValues((prev) => ({
      ...prev,
      [child.selector]: { x: child.originalTranslateX, y: child.originalTranslateY },
    }));
    setPadValues((prev) => ({
      ...prev,
      [child.selector]: { y: child.originalPaddingY, x: child.originalPaddingX },
    }));
    setPosDrafts((prev) => ({ ...prev, [child.selector]: { x: '', y: '' } }));
    setPadDrafts((prev) => ({ ...prev, [child.selector]: { y: '', x: '' } }));
  }

  async function copyAiPrompt() {
    if (!parentConstraint) return;
    const prompt = buildAiRestructurePrompt(
      containerLabel,
      containerSelector,
      artifactPath,
      parentConstraint.reason,
    );
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (err) {
      console.error('[shell] clipboard failed', err);
    }
  }

  return (
    <details open style={detailsBox}>
      <summary style={summary}>
        Child layout · {children.length} child{children.length === 1 ? '' : 'ren'}
      </summary>

      {parentConstraint && (
        <div style={parentConstraint.blocking ? warnBoxBlocking : warnBoxSoft}>
          <div style={warnTitle}>
            {parentConstraint.blocking ? '⚠️' : '💡'} Parent layout limits free positioning
          </div>
          <div style={warnReason}>{parentConstraint.reason}</div>
          <div style={warnHint}>
            Translate (Position mode) shifts the child visually but doesn't change
            its layout slot — siblings may not yield space. To make children truly
            repositionable like Figma frames, ask Claude to restructure the parent.
          </div>
          <button type="button" onClick={copyAiPrompt} style={warnBtn}>
            📋 Copy AI prompt to restructure parent
          </button>
        </div>
      )}

      <div style={listWrap}>
        {children.map((c) => {
          const mode = modes[c.selector] ?? 'position';
          const pv = posValues[c.selector] ?? { x: c.originalTranslateX, y: c.originalTranslateY };
          const pd = posDrafts[c.selector] ?? { x: '', y: '' };
          const dv = padValues[c.selector] ?? { y: c.originalPaddingY, x: c.originalPaddingX };
          const dd = padDrafts[c.selector] ?? { y: '', x: '' };
          return (
            <div key={c.selector} style={childBlock}>
              <div style={childHeader}>
                <span style={tagBadge}>{c.tag}</span>
                <span style={snippetText} title={c.snippet}>{c.snippet}</span>
                <button
                  type="button"
                  onClick={() => resetChild(c)}
                  style={resetBtn}
                  title="Reset both position and padding to original"
                >
                  ↺
                </button>
              </div>
              <div style={tabRow}>
                <button
                  type="button"
                  onClick={() => setModes((prev) => ({ ...prev, [c.selector]: 'position' }))}
                  style={mode === 'position' ? tabActive : tab}
                  title="Translate the child without affecting siblings (Figma-like)"
                >
                  Position
                </button>
                <button
                  type="button"
                  onClick={() => setModes((prev) => ({ ...prev, [c.selector]: 'padding' }))}
                  style={mode === 'padding' ? tabActive : tab}
                  title="Inner spacing — affects sibling positions in flow layout"
                >
                  Padding
                </button>
              </div>
              {mode === 'position' ? (
                <>
                  <AxisRow
                    label="Y"
                    title="translateY — vertical visual offset (positive = down)"
                    sliderMin={POS_SLIDER_MIN}
                    sliderMax={POS_SLIDER_MAX}
                    sliderValue={Math.max(POS_SLIDER_MIN, Math.min(POS_SLIDER_MAX, pv.y))}
                    inputValue={pd.y === '' ? String(pv.y) : pd.y}
                    inputMin={POS_INPUT_MIN}
                    inputMax={POS_INPUT_MAX}
                    onSlider={(n) => applyTranslate(c, 'y', n)}
                    onInputChange={(s) =>
                      setPosDrafts((prev) => ({
                        ...prev,
                        [c.selector]: { ...(prev[c.selector] ?? { x: '', y: '' }), y: s },
                      }))
                    }
                    onInputCommit={() => commitPosDraft(c, 'y')}
                  />
                  <AxisRow
                    label="X"
                    title="translateX — horizontal visual offset (positive = right)"
                    sliderMin={POS_SLIDER_MIN}
                    sliderMax={POS_SLIDER_MAX}
                    sliderValue={Math.max(POS_SLIDER_MIN, Math.min(POS_SLIDER_MAX, pv.x))}
                    inputValue={pd.x === '' ? String(pv.x) : pd.x}
                    inputMin={POS_INPUT_MIN}
                    inputMax={POS_INPUT_MAX}
                    onSlider={(n) => applyTranslate(c, 'x', n)}
                    onInputChange={(s) =>
                      setPosDrafts((prev) => ({
                        ...prev,
                        [c.selector]: { ...(prev[c.selector] ?? { x: '', y: '' }), x: s },
                      }))
                    }
                    onInputCommit={() => commitPosDraft(c, 'x')}
                  />
                </>
              ) : (
                <>
                  <AxisRow
                    label="V"
                    title="Vertical padding (top + bottom) — does shift siblings"
                    sliderMin={PAD_SLIDER_MIN}
                    sliderMax={PAD_SLIDER_MAX}
                    sliderValue={Math.min(PAD_SLIDER_MAX, dv.y)}
                    inputValue={dd.y === '' ? String(dv.y) : dd.y}
                    inputMin={PAD_INPUT_MIN}
                    inputMax={PAD_INPUT_MAX}
                    onSlider={(n) => applyPadding(c, 'y', n)}
                    onInputChange={(s) =>
                      setPadDrafts((prev) => ({
                        ...prev,
                        [c.selector]: { ...(prev[c.selector] ?? { y: '', x: '' }), y: s },
                      }))
                    }
                    onInputCommit={() => commitPadDraft(c, 'y')}
                  />
                  <AxisRow
                    label="H"
                    title="Horizontal padding (left + right) — does shift siblings"
                    sliderMin={PAD_SLIDER_MIN}
                    sliderMax={PAD_SLIDER_MAX}
                    sliderValue={Math.min(PAD_SLIDER_MAX, dv.x)}
                    inputValue={dd.x === '' ? String(dv.x) : dd.x}
                    inputMin={PAD_INPUT_MIN}
                    inputMax={PAD_INPUT_MAX}
                    onSlider={(n) => applyPadding(c, 'x', n)}
                    onInputChange={(s) =>
                      setPadDrafts((prev) => ({
                        ...prev,
                        [c.selector]: { ...(prev[c.selector] ?? { y: '', x: '' }), x: s },
                      }))
                    }
                    onInputCommit={() => commitPadDraft(c, 'x')}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}

interface AxisRowProps {
  label: string;
  title: string;
  sliderMin: number;
  sliderMax: number;
  sliderValue: number;
  inputMin: number;
  inputMax: number;
  inputValue: string;
  onSlider: (n: number) => void;
  onInputChange: (s: string) => void;
  onInputCommit: () => void;
}

function AxisRow({
  label,
  title,
  sliderMin,
  sliderMax,
  sliderValue,
  inputMin,
  inputMax,
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
        min={sliderMin}
        max={sliderMax}
        step={1}
        value={sliderValue}
        onChange={(e) => onSlider(Number(e.target.value))}
        style={slider}
      />
      <input
        type="number"
        min={inputMin}
        max={inputMax}
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
const summary: React.CSSProperties = {
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  color: '#0f172a',
  letterSpacing: 0.3,
};
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
  gap: 12,
  marginTop: 10,
  maxHeight: 400,
  overflowY: 'auto',
  paddingRight: 4,
};
const childBlock: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '8px 8px 10px',
  background: '#f8fafc',
  borderRadius: 6,
  border: '1px solid #e2e8f0',
};
const childHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 2,
};
const tagBadge: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  background: '#e0e7ff',
  color: '#3730a3',
  padding: '2px 5px',
  borderRadius: 3,
  flex: '0 0 auto',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};
const snippetText: React.CSSProperties = {
  fontSize: 11,
  color: '#475569',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
  minWidth: 0,
};
const tabRow: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  marginBottom: 6,
};
const tab: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  padding: '4px 10px',
  border: '1px solid #cbd5e1',
  borderRadius: 4,
  background: '#fff',
  color: '#64748b',
  cursor: 'pointer',
};
const tabActive: React.CSSProperties = {
  ...tab,
  background: '#2563eb',
  color: '#fff',
  borderColor: '#2563eb',
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
  flex: '0 0 auto',
};
