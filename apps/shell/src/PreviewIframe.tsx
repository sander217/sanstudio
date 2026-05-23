// Renders the latest Gate 3 artifact in an iframe and injects the
// refinetool companion script every time a new artifact loads. Reports the
// iframe element back to the parent via onIframeChange so the RefinePanel
// can postMessage to it.
//
// Deliberately uses a callback ref instead of forwardRef + useImperativeHandle
// — simpler and more predictable when the component sometimes returns an
// iframe and sometimes returns an empty-state placeholder.
//
// Two layout modes driven by `viewport`:
//   - fluid: iframe fills the stage (the historical behavior).
//   - fixed: iframe rendered at exact device dimensions, centered on the
//     stage with a soft "device frame" look. When viewport.fit is on and
//     the device is taller/wider than the stage, the frame is scaled down
//     via CSS transform so the whole screen stays visible without panning.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { Viewport } from './viewportPresets';

interface Props {
  /** Path under /sessions/* — e.g. "/sessions/<slug>/html/index.html" */
  src: string | null;
  /** URL where the companion script lives on the same origin. */
  companionUrl: string;
  /** Fires whenever the iframe element changes (mount, src change, unmount). */
  onIframeChange: (el: HTMLIFrameElement | null) => void;
  /** Fires after the companion script has been injected for this load. */
  onCompanionReady?: () => void;
  /** Device-size constraints. Defaults to fluid (full-stage). */
  viewport: Viewport;
}

const FRAME_PADDING = 24; // breathing room around the fixed device frame.

export function PreviewIframe({ src, companionUrl, onIframeChange, onCompanionReady, viewport }: Props) {
  const onChangeRef = useRef(onIframeChange);
  onChangeRef.current = onIframeChange;
  const onReadyRef = useRef(onCompanionReady);
  onReadyRef.current = onCompanionReady;

  // Stable callback ref: notify parent when the iframe element appears /
  // disappears, and wire the companion-injection load handler.
  const setIframeNode = useCallback(
    (el: HTMLIFrameElement | null) => {
      onChangeRef.current(el);
      if (!el) return;

      const inject = async () => {
        try {
          const doc = el.contentDocument;
          if (!doc) {
            console.warn(
              '[shell] iframe.contentDocument unavailable — same-origin required (artifact must be served under /sessions/*)',
            );
            return;
          }
          if (doc.getElementById('ifl-companion-script')) return;
          // Companion's "Refine Mode — click any region · ESC to exit"
          // banner. By default it's `position: fixed; top: 16px` and
          // floats over artifact content (covers the hero headline).
          // Push it up 80px so it sits flush with the iframe's top edge
          // (or clips off entirely) and stops obscuring the design. The
          // shell's [● Picker on] strip already conveys this state.
          //
          // Selector is #ifl-banner (id, set by spawn() in companion).
          if (!doc.getElementById('ifl-shell-overrides')) {
            const style = doc.createElement('style');
            style.id = 'ifl-shell-overrides';
            style.textContent = `#ifl-banner { top: -64px !important; }`;
            doc.documentElement.appendChild(style);
          }
          // Always re-fetch with no-store + a cache-buster query so dev
          // edits to refinetool propagate without a hard browser reload.
          // The bundle is small (~40KB) so re-fetching per iframe load is
          // cheap compared to confusing stale-bundle bugs.
          const res = await fetch(`${companionUrl}?t=${Date.now()}`, {
            cache: 'no-store',
          });
          if (!res.ok) throw new Error(`companion fetch ${res.status}`);
          const text = await res.text();
          const script = doc.createElement('script');
          script.id = 'ifl-companion-script';
          script.textContent = text;
          doc.documentElement.appendChild(script);
          onReadyRef.current?.();
        } catch (err) {
          console.error('[shell] companion injection failed', err);
        }
      };

      el.addEventListener('load', () => void inject());
      // If the iframe is already loaded by the time React attaches us
      // (rare but happens when iframe is reused across renders), inject now.
      if (el.contentDocument?.readyState === 'complete') void inject();
    },
    [companionUrl],
  );

  // Fall-through: if the iframe element gets recycled by React across src
  // changes (same-element-different-src), the load listener was attached
  // ONCE in setIframeNode and will refire on each `load`. No extra work
  // needed here.
  useEffect(() => {
    return () => onChangeRef.current(null);
  }, []);

  // Measure the outer stage container so the Fit toggle can scale the
  // device frame down to fit. Updates on window resize AND sidebar drags
  // (parent re-renders, container ResizeObserver fires).
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setStageSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!src) {
    return (
      <div style={emptyStyle}>
        <div style={emptyTitle}>No Gate 3 artifact yet</div>
        <p style={emptyHint}>
          Run a sanstudio session in Claude Code. When Gate 3 emits an HTML file under
          {' '}
          <code style={code}>sanstudio-ai-output/sessions/</code>, it'll show up here automatically.
        </p>
      </div>
    );
  }

  // Fluid mode — same as the historical behavior.
  if (viewport.mode === 'fluid') {
    return (
      <iframe
        ref={setIframeNode}
        src={src}
        title="Gate 3 artifact"
        style={fluidIframeStyle}
      />
    );
  }

  // Fixed device mode. Compute scale for Fit.
  const W = viewport.width ?? 393;
  const H = viewport.height ?? 852;
  const availW = Math.max(0, stageSize.w - FRAME_PADDING * 2);
  const availH = Math.max(0, stageSize.h - FRAME_PADDING * 2);
  const scale =
    viewport.fit && availW > 0 && availH > 0
      ? Math.min(availW / W, availH / H, 1)
      : 1;
  const scaledW = W * scale;
  const scaledH = H * scale;

  return (
    <div ref={containerRef} style={fixedStage}>
      <div
        style={{
          ...fixedFrameSlot,
          width: scaledW,
          height: scaledH,
        }}
      >
        <iframe
          ref={setIframeNode}
          src={src}
          title="Gate 3 artifact"
          style={{
            ...deviceIframeStyle,
            width: W,
            height: H,
            transform: scale !== 1 ? `scale(${scale})` : 'none',
          }}
        />
      </div>
      <div style={dimReadout}>
        {W} × {H}
        {scale !== 1 ? `  ·  ${Math.round(scale * 100)}%` : ''}
      </div>
    </div>
  );
}

const fluidIframeStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 0,
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  display: 'block',
};

const fixedStage: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'auto',
  padding: FRAME_PADDING,
  boxSizing: 'border-box',
};

const fixedFrameSlot: React.CSSProperties = {
  position: 'relative',
  flex: '0 0 auto',
};

const deviceIframeStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  background: '#fff',
  boxShadow: '0 12px 36px rgba(15,23,42,0.18)',
  transformOrigin: 'top left',
  display: 'block',
};

const dimReadout: React.CSSProperties = {
  position: 'absolute',
  bottom: 8,
  right: 12,
  fontSize: 10,
  color: '#94a3b8',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  background: 'rgba(255,255,255,0.9)',
  padding: '2px 6px',
  borderRadius: 4,
  pointerEvents: 'none',
};

const emptyStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  color: '#64748b',
  padding: 32,
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
};
const emptyTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 8 };
const emptyHint: React.CSSProperties = { fontSize: 13, lineHeight: 1.6, maxWidth: 460, margin: 0 };
const code: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  background: '#f1f5f9',
  padding: '2px 6px',
  borderRadius: 4,
};
