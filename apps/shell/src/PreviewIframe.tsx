// Renders the latest Gate 3 artifact in an iframe and injects the
// refinetool companion script every time a new artifact loads. Reports the
// iframe element back to the parent via onIframeChange so the RefinePanel
// can postMessage to it.
//
// Deliberately uses a callback ref instead of forwardRef + useImperativeHandle
// — simpler and more predictable when the component sometimes returns an
// iframe and sometimes returns an empty-state placeholder.

import { useCallback, useEffect, useRef } from 'react';

interface Props {
  /** Path under /sessions/* — e.g. "/sessions/<slug>/html/index.html" */
  src: string | null;
  /** URL where the companion script lives on the same origin. */
  companionUrl: string;
  /** Fires whenever the iframe element changes (mount, src change, unmount). */
  onIframeChange: (el: HTMLIFrameElement | null) => void;
  /** Fires after the companion script has been injected for this load. */
  onCompanionReady?: () => void;
}

export function PreviewIframe({ src, companionUrl, onIframeChange, onCompanionReady }: Props) {
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

  return <iframe ref={setIframeNode} src={src} title="Gate 3 artifact" style={iframeStyle} />;
}

const iframeStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 0,
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  display: 'block',
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
