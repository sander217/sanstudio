// Renders the latest Gate 3 artifact in an iframe and injects the
// refinetool companion script every time a new artifact loads. Exposes the
// loaded iframe element to the parent so RefinePanel can postMessage to it.

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface PreviewIframeHandle {
  /** The actual iframe element; null until first render finishes. */
  element: HTMLIFrameElement | null;
}

interface Props {
  /** Path under /sessions/* — e.g. "/sessions/2026-04-30-fintech/html/index.html" */
  src: string | null;
  /** URL where the companion script lives on the same origin. */
  companionUrl: string;
  /** Notified once the companion has been injected for this src. */
  onCompanionReady?: () => void;
}

export const PreviewIframe = forwardRef<PreviewIframeHandle, Props>(function PreviewIframe(
  { src, companionUrl, onCompanionReady },
  ref,
) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const companionTextRef = useRef<string | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      get element() {
        return iframeRef.current;
      },
    }),
    [],
  );

  useEffect(() => {
    const el = iframeRef.current;
    if (!el || !src) return;

    async function loadCompanionText(): Promise<string> {
      if (companionTextRef.current) return companionTextRef.current;
      const res = await fetch(companionUrl);
      if (!res.ok) throw new Error(`companion fetch ${res.status}`);
      const text = await res.text();
      companionTextRef.current = text;
      return text;
    }

    async function inject() {
      try {
        const doc = el?.contentDocument;
        if (!doc) {
          console.warn(
            '[shell] iframe.contentDocument unavailable — same-origin required (artifact must be served under /sessions/*)',
          );
          return;
        }
        if (doc.getElementById('ifl-companion-script')) return; // already injected this load
        const text = await loadCompanionText();
        const script = doc.createElement('script');
        script.id = 'ifl-companion-script';
        script.textContent = text;
        doc.documentElement.appendChild(script);
        onCompanionReady?.();
      } catch (err) {
        console.error('[shell] companion injection failed', err);
      }
    }

    const onLoad = () => void inject();
    el.addEventListener('load', onLoad);
    // If the iframe is already loaded by the time this effect fires (HMR),
    // inject immediately.
    if (el.contentDocument?.readyState === 'complete') void inject();

    return () => el.removeEventListener('load', onLoad);
  }, [src, companionUrl, onCompanionReady]);

  if (!src) {
    return (
      <div style={emptyStyle}>
        <p style={emptyTitle}>No Gate 3 artifact yet</p>
        <p style={emptyHint}>
          Run a sanstudio session in Claude Code. When Gate 3 emits an HTML file under
          <code style={code}> sanstudio-ai-output/sessions/</code>, it'll show up here.
        </p>
      </div>
    );
  }

  return <iframe ref={iframeRef} src={src} title="Gate 3 artifact" style={iframeStyle} />;
});

const iframeStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 0,
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
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
};
const emptyTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, margin: 0, color: '#0f172a' };
const emptyHint: React.CSSProperties = { fontSize: 13, lineHeight: 1.6, maxWidth: 460 };
const code: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  background: '#f1f5f9',
  padding: '2px 6px',
  borderRadius: 4,
};
