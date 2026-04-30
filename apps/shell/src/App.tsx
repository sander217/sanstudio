// Top-level layout: prompt bar across the top, iframe in the middle, refine
// panel on the right. Polls /sessions.json to know what to load in the
// iframe. Bumps a resetKey whenever the latest session changes so the
// RefinePanel clears its state.

import { useEffect, useRef, useState } from 'react';

import { PromptBar } from './PromptBar';
import { PreviewIframe, type PreviewIframeHandle } from './PreviewIframe';
import { RefinePanel } from './RefinePanel';
import {
  EMPTY_SESSION_STATE,
  artifactUrl,
  startSessionPolling,
  type SessionState,
} from './SessionWatcher';

const COMPANION_URL = '/refinetool/companion.iife.js';

export function App() {
  const [session, setSession] = useState<SessionState>(EMPTY_SESSION_STATE);
  const [resetKey, setResetKey] = useState(0);
  const [iframeEl, setIframeEl] = useState<HTMLIFrameElement | null>(null);
  const previewRef = useRef<PreviewIframeHandle | null>(null);
  const lastSrcRef = useRef<string | null>(null);

  useEffect(() => startSessionPolling(setSession, 1500), []);

  // Resolve current src and bump resetKey when it changes.
  const src =
    session.latestSlug && session.latestHtml
      ? artifactUrl(session.latestSlug, session.latestHtml)
      : null;

  useEffect(() => {
    if (src !== lastSrcRef.current) {
      lastSrcRef.current = src;
      setResetKey((k) => k + 1);
    }
  }, [src]);

  // After the iframe mounts, expose its element to the panel.
  useEffect(() => {
    setIframeEl(previewRef.current?.element ?? null);
  }, [src, resetKey]);

  return (
    <div style={layout}>
      <PromptBar sessionSlug={session.latestSlug} lastError={session.error} />
      <div style={body}>
        <main style={stage}>
          <PreviewIframe
            ref={(handle) => {
              previewRef.current = handle;
              setIframeEl(handle?.element ?? null);
            }}
            src={src}
            companionUrl={COMPANION_URL}
            onCompanionReady={() => {
              // Re-set the iframe element so RefinePanel re-attaches its RPC
              // (the iframe was just navigated; its contentWindow is fresh).
              setIframeEl(previewRef.current?.element ?? null);
            }}
          />
        </main>
        <aside style={sidebar}>
          <RefinePanel
            iframe={iframeEl}
            artifactPath={
              session.latestSlug && session.latestHtml
                ? `sessions/${session.latestSlug}/html/${session.latestHtml}`
                : null
            }
            sessionSlug={session.latestSlug}
            resetKey={resetKey}
          />
        </aside>
      </div>
    </div>
  );
}

const layout: React.CSSProperties = {
  display: 'grid',
  gridTemplateRows: '52px 1fr',
  height: '100vh',
  background: '#f1f5f9',
};
const body: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 380px',
  height: '100%',
  overflow: 'hidden',
};
const stage: React.CSSProperties = { padding: 16, overflow: 'hidden' };
const sidebar: React.CSSProperties = {
  borderLeft: '1px solid #e2e8f0',
  background: '#fff',
  overflow: 'hidden',
};
