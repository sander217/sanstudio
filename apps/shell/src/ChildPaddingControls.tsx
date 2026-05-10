// Per-child padding controls — shown when the user selects a container
// element (a <div> or similar with >0 element children). Lists each child
// with TWO axis sliders so vertical (top+bottom) and horizontal (left+right)
// padding can be tuned independently. Each axis has both a slider and an
// editable number input, so users can scrub OR type an exact value.
//
// Why this lives here and not inside the refinetool companion:
//   The vendored companion's RPC (`set_style_value`) only targets the
//   currently-pending selection. Letting the user mutate children would
//   need either (a) a "pick-this-child-then-edit" round trip or (b) a
//   companion protocol extension. Both touch the vendored bundle.
//
// Instead: shell reads/writes the iframe DOM directly (same-origin via the
// Vite middleware), and pushes a synthetic SavedRefinement per change so
// the iterate prompt still includes the edit. Children are matched by an
// `:nth-child` selector relative to the container.

import { useEffect, useMemo, useState } from 'react';

import type { PendingSelection, SelectedTarget, StyleChangeDiff } from './refineProtocol';
import type { SavedRefinement } from './RefinementToPrompt';

interface Props {
  pending: PendingSelection;
  iframe: HTMLIFrameElement | null;
  /** Push a refinement into the saved list. Updates in-place when an
   * entry with the same id already exists (so dragging a slider doesn't
   * spam the list). */
  upsertSaved: (item: SavedRefinement) => void;
  /** Forces re-mount when selection changes / panel is reset. */
  resetSignal: number;
}

interface ChildInfo {
  /** Stable selector relative to iframe doc — used for both DOM lookup
   * and the recorded diff. */
  selector: string;
  tag: string;
  snippet: string;
  /** Computed padding-top in px AT MOUNT TIME — captured for diff `before` and reset. */
  originalY: number;
  /** Computed padding-left in px AT MOUNT TIME. */
  originalX: number;
  /** CSS-shorthand form of the original (e.g. "24px" or "40px 16px") for the diff `before`. */
  originalCss: string;
  /** Inline-style padding present when we mounted, if any — restored on
   * reset so we don't strip the original author's choice. */
  originalInline: string;
}

// Slider stays at 0–80 (designer-friendly default range), but the number
// input accepts up to 400 for the rare case of a hero section that needs
// more — slider position clamps at the upper edge when value exceeds it.
const SLIDER_MIN = 0;
const SLIDER_MAX = 80;
const INPUT_MIN = 0;
const INPUT_MAX = 400;

function readNumericStyle(el: Element, prop: string): number {
  const raw = (el.ownerDocument?.defaultView ?? window).getComputedStyle(el).getPropertyValue(prop);
  const m = raw.match(/-?\d+(?:\.\d+)?/);
  return m ? Math.round(Number(m[0])) : 0;
}

function shortSnippet(el: Element): string {
  const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ');
  if (text) return text.length > 40 ? text.slice(0, 37) + '…' : text;
  if (el.tagName === 'IMG') return `<img src="${(el as HTMLImageElement).getAttribute('src') ?? ''}">`;
  const cls = (el as HTMLElement).className;
  if (typeof cls === 'string' && cls) return `.${cls.split(/\s+/).slice(0, 2).join('.')}`;
  return '(empty)';
}

function isContainerCandidate(tag: string): boolean {
  const containerTags = new Set([
    'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'NAV',
    'UL', 'OL', 'FORM', 'FIELDSET', 'FIGURE', 'PICTURE',
  ]);
  return containerTags.has(tag.toUpperCase());
}

/** CSS shorthand: omit the second value when V === H so the diff is concise. */
function paddingShorthand(y: number, x: number): string {
  return y === x ? `${y}px` : `${y}px ${x}px`;
}

function clampInput(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.max(INPUT_MIN, Math.min(INPUT_MAX, Math.round(n)));
}

export function ChildPaddingControls({ pending, iframe, upsertSaved, resetSignal }: Props) {
  const containerSelector = pending.target.selector;
  const containerTag = pending.target.tag;

  // Read children from the iframe DOM. Re-runs when the selection or
  // resetSignal changes — covers iframe reloads + new selections.
  const children = useMemo<ChildInfo[]>(() => {
    if (!iframe || !isContainerCandidate(containerTag)) return [];
    const doc = iframe.contentDocument;
    if (!doc) return [];
    let parent: Element | null = null;
    try {
      parent = doc.querySelector(containerSelector);
    } catch {
      return [];
    }
    if (!parent) return [];
    const out: ChildInfo[] = [];
    for (let i = 0; i < parent.children.length; i++) {
      const child = parent.children[i];
      const sel = `${containerSelector} > :nth-child(${i + 1})`;
      const y = readNumericStyle(child, 'padding-top');
      const x = readNumericStyle(child, 'padding-left');
      out.push({
        selector: sel,
        tag: child.tagName.toLowerCase(),
        snippet: shortSnippet(child),
        originalY: y,
        originalX: x,
        originalCss: paddingShorthand(y, x),
        originalInline: (child as HTMLElement).style.padding,
      });
    }
    return out;
  }, [containerSelector, containerTag, iframe, resetSignal]);

  /** Per-child {y, x} live values. Seeded from computed style so sliders
   * sit at the right initial position. The string-typed input field reads
   * from these too — kept as `number` here, formatted on render. */
  const [values, setValues] = useState<Record<string, { y: number; x: number }>>({});
  /** Per-child input drafts — separate from `values` so the user can be
   * mid-typing (e.g. "1" → "12" → "120") without each keystroke clamping
   * to a number. Empty string means "follow values". */
  const [drafts, setDrafts] = useState<Record<string, { y: string; x: string }>>({});

  useEffect(() => {
    const seedV: Record<string, { y: number; x: number }> = {};
    const seedD: Record<string, { y: string; x: string }> = {};
    for (const c of children) {
      seedV[c.selector] = { y: c.originalY, x: c.originalX };
      seedD[c.selector] = { y: '', x: '' };
    }
    setValues(seedV);
    setDrafts(seedD);
  }, [children]);

  if (children.length === 0) return null;

  function applyAxis(child: ChildInfo, axis: 'y' | 'x', next: number) {
    const cur = values[child.selector] ?? { y: child.originalY, x: child.originalX };
    const updated = { ...cur, [axis]: next };
    setValues((prev) => ({ ...prev, [child.selector]: updated }));

    if (!iframe?.contentDocument) return;
    let el: Element | null = null;
    try {
      el = iframe.contentDocument.querySelector(child.selector);
    } catch {
      return;
    }
    if (!el) return;
    // Apply each axis to BOTH sides — keeps top/bottom symmetric and
    // left/right symmetric. (Per-side asymmetric padding is uncommon
    // enough that we don't expose it in v1.)
    const target = el as HTMLElement;
    target.style.paddingTop = `${updated.y}px`;
    target.style.paddingBottom = `${updated.y}px`;
    target.style.paddingLeft = `${updated.x}px`;
    target.style.paddingRight = `${updated.x}px`;

    // Push (or update) a saved refinement so the change makes it into
    // the iterate prompt. ID is stable per child so we overwrite while
    // the user fiddles, instead of piling up.
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
      before: child.originalCss,
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

  function commitDraft(child: ChildInfo, axis: 'y' | 'x') {
    const draft = drafts[child.selector]?.[axis] ?? '';
    const n = clampInput(draft);
    // Empty / invalid draft → revert input to the live value (no apply).
    if (n === null) {
      setDrafts((prev) => ({
        ...prev,
        [child.selector]: { ...(prev[child.selector] ?? { y: '', x: '' }), [axis]: '' },
      }));
      return;
    }
    setDrafts((prev) => ({
      ...prev,
      [child.selector]: { ...(prev[child.selector] ?? { y: '', x: '' }), [axis]: '' },
    }));
    applyAxis(child, axis, n);
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
    // Restore the original inline padding (which may be empty — that
    // re-exposes the stylesheet rule the page originally used). Unlike
    // applyAxis, we wipe per-side properties so the shorthand can take
    // hold; otherwise stale paddingTop/paddingBottom would override it.
    const target = el as HTMLElement;
    target.style.paddingTop = '';
    target.style.paddingBottom = '';
    target.style.paddingLeft = '';
    target.style.paddingRight = '';
    target.style.padding = child.originalInline;
    setValues((prev) => ({
      ...prev,
      [child.selector]: { y: child.originalY, x: child.originalX },
    }));
    setDrafts((prev) => ({
      ...prev,
      [child.selector]: { y: '', x: '' },
    }));
  }

  return (
    <details open style={detailsBox}>
      <summary style={summary}>
        Child padding · {children.length} child{children.length === 1 ? '' : 'ren'}
      </summary>
      <div style={listWrap}>
        {children.map((c) => {
          const v = values[c.selector] ?? { y: c.originalY, x: c.originalX };
          const d = drafts[c.selector] ?? { y: '', x: '' };
          return (
            <div key={c.selector} style={childBlock}>
              <div style={childHeader}>
                <span style={tagBadge}>{c.tag}</span>
                <span style={snippetText} title={c.snippet}>{c.snippet}</span>
                <button
                  type="button"
                  onClick={() => resetChild(c)}
                  style={resetBtn}
                  title={`Reset to ${c.originalCss}`}
                >
                  ↺
                </button>
              </div>
              <AxisRow
                axis="y"
                label="V"
                title="Vertical padding (top + bottom)"
                sliderValue={Math.min(SLIDER_MAX, v.y)}
                inputValue={d.y === '' ? String(v.y) : d.y}
                onSlider={(n) => applyAxis(c, 'y', n)}
                onInputChange={(s) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [c.selector]: { ...(prev[c.selector] ?? { y: '', x: '' }), y: s },
                  }))
                }
                onInputCommit={() => commitDraft(c, 'y')}
              />
              <AxisRow
                axis="x"
                label="H"
                title="Horizontal padding (left + right)"
                sliderValue={Math.min(SLIDER_MAX, v.x)}
                inputValue={d.x === '' ? String(v.x) : d.x}
                onSlider={(n) => applyAxis(c, 'x', n)}
                onInputChange={(s) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [c.selector]: { ...(prev[c.selector] ?? { y: '', x: '' }), x: s },
                  }))
                }
                onInputCommit={() => commitDraft(c, 'x')}
              />
            </div>
          );
        })}
      </div>
    </details>
  );
}

interface AxisRowProps {
  axis: 'y' | 'x';
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
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={1}
        value={sliderValue}
        onChange={(e) => onSlider(Number(e.target.value))}
        style={slider}
      />
      <input
        type="number"
        min={INPUT_MIN}
        max={INPUT_MAX}
        step={1}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onBlur={onInputCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
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
const listWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginTop: 10,
  maxHeight: 360,
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
