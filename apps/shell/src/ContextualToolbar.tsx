// Floating button row that appears above the currently-selected element
// inside the iframe. Three actions: 🎤 Voice / ✏️ Text / 📝 Edit text.
//
// Implementation: shell-side overlay (NOT a React Portal into the iframe).
// We compute the toolbar's viewport position by combining the iframe's
// getBoundingClientRect() with the selected element's getBoundingClientRect()
// inside the iframe doc. Re-positions on:
//   - selection change
//   - iframe scroll (listened on contentDocument)
//   - shell window resize / scroll
//   - a periodic rAF tick so animated content (e.g. carousels) stays tracked
//
// Hides when no pending selection, when picker mode is off, or when the
// selected element has no rect (display:none, removed, etc.).

import { useEffect, useState } from 'react';

import type { PendingSelection } from './refineProtocol';

interface Props {
  pending: PendingSelection | null;
  iframe: HTMLIFrameElement | null;
  onVoice: () => void;
  onText: () => void;
  onEdit: () => void;
  /** True when the iframe is in inline-text-edit mode — the Edit button
   * flips to "Done" and other actions hide. */
  isEditing: boolean;
  onStopEdit: () => void;
}

interface Pos {
  top: number;
  left: number;
  /** Width of the selection — used so the toolbar can right-align if it'd
   * overflow the iframe edge on the left side. */
  width: number;
}

const TOOLBAR_HEIGHT = 36;
const GAP = 8;

export function ContextualToolbar({
  pending,
  iframe,
  onVoice,
  onText,
  onEdit,
  isEditing,
  onStopEdit,
}: Props) {
  const [pos, setPos] = useState<Pos | null>(null);

  useEffect(() => {
    if (!pending || !iframe) {
      setPos(null);
      return;
    }
    const doc = iframe.contentDocument;
    if (!doc) {
      setPos(null);
      return;
    }

    let raf = 0;
    let cancelled = false;

    function compute(): Pos | null {
      if (cancelled || !iframe) return null;
      const innerDoc = iframe.contentDocument;
      if (!innerDoc) return null;
      let el: Element | null = null;
      try {
        el = pending && innerDoc.querySelector(pending.target.selector);
      } catch {
        return null;
      }
      if (!el) return null;
      const elRect = el.getBoundingClientRect();
      // Element collapsed (display:none, removed) — hide.
      if (elRect.width === 0 && elRect.height === 0) return null;
      const iframeRect = iframe.getBoundingClientRect();
      // Position above the element by default; if it would clip the top
      // of the iframe, flip below.
      const aboveTop = iframeRect.top + elRect.top - TOOLBAR_HEIGHT - GAP;
      const flipBelow = aboveTop < iframeRect.top + 4;
      const top = flipBelow
        ? iframeRect.top + elRect.bottom + GAP
        : aboveTop;
      const left = iframeRect.left + elRect.left;
      return { top, left, width: elRect.width };
    }

    function tick() {
      const next = compute();
      setPos((prev) => {
        if (!next) return null;
        if (
          prev &&
          Math.abs(prev.top - next.top) < 0.5 &&
          Math.abs(prev.left - next.left) < 0.5 &&
          Math.abs(prev.width - next.width) < 0.5
        ) {
          return prev;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    }
    tick();

    function onScrollOrResize() {
      // Already covered by rAF tick, but trigger an immediate recompute so
      // the toolbar doesn't lag visibly on a deliberate scroll.
      const next = compute();
      setPos(next);
    }
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    doc.addEventListener('scroll', onScrollOrResize, true);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      doc.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [pending, iframe]);

  if (!pos || !pending) return null;

  return (
    <div style={{ ...container, top: pos.top, left: pos.left }}>
      {isEditing ? (
        <>
          <span style={editingBadge}>Editing text…</span>
          <button onClick={onStopEdit} style={btnPrimary} title="Commit text edit and exit">
            Done
          </button>
        </>
      ) : (
        <>
          <button onClick={onVoice} style={btn} title="Voice input — record a refinement note">
            🎤 <span style={btnLabel}>Voice</span>
          </button>
          <button onClick={onText} style={btn} title="Text input — type a refinement note">
            ✏️ <span style={btnLabel}>Text</span>
          </button>
          <button onClick={onEdit} style={btn} title="Edit the element's text directly">
            📝 <span style={btnLabel}>Edit</span>
          </button>
        </>
      )}
    </div>
  );
}

const container: React.CSSProperties = {
  position: 'fixed',
  zIndex: 999,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: 4,
  background: '#0f172a',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
  height: TOOLBAR_HEIGHT,
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
};
const btn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  border: 'none',
  background: 'transparent',
  color: '#f8fafc',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  borderRadius: 4,
  height: 28,
};
const btnLabel: React.CSSProperties = {
  fontSize: 11,
};
const btnPrimary: React.CSSProperties = {
  padding: '4px 12px',
  border: 'none',
  background: '#16a34a',
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  borderRadius: 4,
  height: 28,
};
const editingBadge: React.CSSProperties = {
  padding: '0 8px',
  fontSize: 11,
  color: '#fbbf24',
  fontWeight: 500,
};
