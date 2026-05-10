// Per-child padding controls — shown when the user selects a container
// element (a <div> or similar with >0 element children). Lists each child
// with a padding slider so the user can tighten / loosen spacing without
// having to re-pick each child individually.
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

import type { EditDiff, PendingSelection, SelectedTarget, StyleChangeDiff } from './refineProtocol';
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
  /** Computed padding in px AT MOUNT TIME — captured so slider drags can
   * compose a `before`/`after` diff and so reset returns to truth. */
  originalPx: number;
  /** Inline-style padding present when we mounted, if any — restored on
   * reset so we don't strip the original author's choice. */
  originalInline: string;
}

const PADDING_MIN = 0;
const PADDING_MAX = 80;
const PADDING_STEP = 1;

function readNumericStyle(el: Element, prop: string): number {
  const raw = (el.ownerDocument?.defaultView ?? window).getComputedStyle(el).getPropertyValue(prop);
  const m = raw.match(/-?\d+(?:\.\d+)?/);
  return m ? Math.round(Number(m[0])) : 0;
}

function shortSnippet(el: Element): string {
  const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ');
  if (text) return text.length > 40 ? text.slice(0, 37) + '…' : text;
  // Fallback for empty (icon, image, etc.) — show the className or src
  if (el.tagName === 'IMG') return `<img src="${(el as HTMLImageElement).getAttribute('src') ?? ''}">`;
  const cls = (el as HTMLElement).className;
  if (typeof cls === 'string' && cls) return `.${cls.split(/\s+/).slice(0, 2).join('.')}`;
  return '(empty)';
}

function isContainerCandidate(tag: string): boolean {
  // We only show the picker for elements that typically wrap other
  // elements. Inline emphasis tags and leaf text tags don't qualify.
  const containerTags = new Set([
    'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'NAV',
    'UL', 'OL', 'FORM', 'FIELDSET', 'FIGURE', 'PICTURE',
  ]);
  return containerTags.has(tag.toUpperCase());
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
      // nth-child is 1-indexed and survives sibling shuffles for stable
      // pointers within the iterate prompt.
      const sel = `${containerSelector} > :nth-child(${i + 1})`;
      out.push({
        selector: sel,
        tag: child.tagName.toLowerCase(),
        snippet: shortSnippet(child),
        originalPx: readNumericStyle(child, 'padding'),
        originalInline: (child as HTMLElement).style.padding,
      });
    }
    return out;
  }, [containerSelector, containerTag, iframe, resetSignal]);

  // Live values per child — seeded from originalPx so slider sits at the
  // computed value, not 0. Keyed by selector.
  const [values, setValues] = useState<Record<string, number>>({});
  useEffect(() => {
    const seed: Record<string, number> = {};
    for (const c of children) seed[c.selector] = c.originalPx;
    setValues(seed);
  }, [children]);

  if (children.length === 0) return null;

  function applyPadding(child: ChildInfo, next: number) {
    setValues((prev) => ({ ...prev, [child.selector]: next }));
    if (!iframe?.contentDocument) return;
    let el: Element | null = null;
    try {
      el = iframe.contentDocument.querySelector(child.selector);
    } catch {
      // Selector got invalidated — bail silently rather than crash.
      return;
    }
    if (!el) return;
    (el as HTMLElement).style.padding = `${next}px`;

    // Push (or update) a saved refinement so the change makes it into
    // the iterate prompt. ID is stable per (container, child) so we
    // overwrite instead of piling up while dragging.
    const id = `child-padding:${child.selector}`;
    const target: SelectedTarget = {
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
      target: target.label,
      createdAt: new Date().toISOString(),
      type: 'style_change',
      property: 'padding',
      before: `${child.originalPx}px`,
      after: `${next}px`,
    };
    upsertSaved({
      id,
      region: target,
      note: `Adjust padding of child inside ${containerTag.toLowerCase()}`,
      diffs: [diff],
      createdAt: diff.createdAt,
    });
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
    // re-exposes the stylesheet rule the page originally used).
    (el as HTMLElement).style.padding = child.originalInline;
    setValues((prev) => ({ ...prev, [child.selector]: child.originalPx }));
    // Note: we don't remove the saved diff — the user can drop it from
    // the saved list manually. Keeping a "reset to original" record
    // lets the iterate prompt explicitly say "this was reverted".
  }

  return (
    <details open style={detailsBox}>
      <summary style={summary}>
        Child padding · {children.length} child{children.length === 1 ? '' : 'ren'}
      </summary>
      <div style={listWrap}>
        {children.map((c) => (
          <div key={c.selector} style={row}>
            <div style={labelCol}>
              <span style={tagBadge}>{c.tag}</span>
              <span style={snippetText} title={c.snippet}>{c.snippet}</span>
            </div>
            <input
              type="range"
              min={PADDING_MIN}
              max={PADDING_MAX}
              step={PADDING_STEP}
              value={values[c.selector] ?? c.originalPx}
              onChange={(e) => applyPadding(c, Number(e.target.value))}
              style={slider}
            />
            <span style={valueText}>
              {(values[c.selector] ?? c.originalPx)}px
            </span>
            <button
              type="button"
              onClick={() => resetChild(c)}
              style={resetBtn}
              title={`Reset to ${c.originalPx}px`}
            >
              ↺
            </button>
          </div>
        ))}
      </div>
    </details>
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
  gap: 8,
  marginTop: 10,
  maxHeight: 280,
  overflowY: 'auto',
  paddingRight: 4,
};
const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '120px 1fr 48px 24px',
  alignItems: 'center',
  gap: 8,
};
const labelCol: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 0,
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
};
const slider: React.CSSProperties = {
  width: '100%',
  accentColor: '#2563eb',
};
const valueText: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  color: '#0f172a',
  textAlign: 'right',
};
const resetBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  border: '1px solid #e2e8f0',
  borderRadius: 4,
  background: '#f8fafc',
  cursor: 'pointer',
  fontSize: 12,
  color: '#64748b',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
