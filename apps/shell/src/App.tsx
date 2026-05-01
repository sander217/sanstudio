// Top-level layout: prompt bar across the top, iframe in the middle, refine
// panel on the right. Polls /sessions.json to know what to load in the
// iframe. Bumps a resetKey whenever the latest session changes so the
// RefinePanel clears its state.

import { useEffect, useRef, useState } from 'react';

import { PromptBar } from './PromptBar';
import { PreviewIframe } from './PreviewIframe';
import { RefinePanel } from './RefinePanel';
import { SessionPicker } from './SessionPicker';
import {
  EMPTY_SESSION_STATE,
  artifactUrl,
  pickPrimaryHtml,
  startSessionPolling,
  type SessionState,
} from './SessionWatcher';
import { getHealth, type DaemonHealth } from './DaemonClient';

const COMPANION_URL = '/refinetool/companion.iife.js';

export function App() {
  const [session, setSession] = useState<SessionState>(EMPTY_SESSION_STATE);
  const [resetKey, setResetKey] = useState(0);
  const [iframeEl, setIframeEl] = useState<HTMLIFrameElement | null>(null);
  const [daemon, setDaemon] = useState<DaemonHealth | null>(null);
  // null = auto-follow latest by mtime. Setting to a slug pins the iframe
  // to that session even when newer ones arrive.
  const [pinnedSlug, setPinnedSlug] = useState<string | null>(null);
  // null = use the primary HTML (index/home/first). Setting to a file pins
  // that file inside whichever session is currently active.
  const [pinnedHtml, setPinnedHtml] = useState<string | null>(null);
  const lastSrcRef = useRef<string | null>(null);

  useEffect(() => startSessionPolling(setSession, 1500), []);

  // Probe the daemon at boot. We don't poll — if Claude becomes available
  // mid-session, the user can refresh; that's fine for Layer 1.
  useEffect(() => {
    const ac = new AbortController();
    void getHealth(ac.signal).then(setDaemon);
    return () => ac.abort();
  }, []);

  // Resolve which session + file the iframe should actually load.
  const effectiveSlug = pinnedSlug ?? session.latestSlug;
  const effectiveSession = session.all.find((s) => s.slug === effectiveSlug);
  const effectiveHtml =
    pinnedHtml && effectiveSession?.htmlFiles.includes(pinnedHtml)
      ? pinnedHtml
      : pickPrimaryHtml(effectiveSession?.htmlFiles ?? []);

  // If the user pinned a slug that no longer exists (e.g. they deleted the
  // session folder), fall back to auto-follow rather than showing nothing.
  useEffect(() => {
    if (pinnedSlug && session.all.length > 0 && !session.all.some((s) => s.slug === pinnedSlug)) {
      setPinnedSlug(null);
      setPinnedHtml(null);
    }
  }, [pinnedSlug, session.all]);

  const src = effectiveSlug && effectiveHtml ? artifactUrl(effectiveSlug, effectiveHtml) : null;

  // Reset the panel state when the artifact changes (auto-switch OR pin change).
  useEffect(() => {
    if (src !== lastSrcRef.current) {
      lastSrcRef.current = src;
      setResetKey((k) => k + 1);
    }
  }, [src]);

  return (
    <div style={layout}>
      <PromptBar
        sessionSlug={effectiveSlug}
        lastError={session.error}
        daemon={daemon}
      />
      <div style={body}>
        <main style={stage}>
          <SessionPicker
            sessions={session.all}
            effectiveSlug={effectiveSlug}
            effectiveHtml={effectiveHtml}
            selectedSlug={pinnedSlug}
            onPickSession={setPinnedSlug}
            selectedHtml={pinnedHtml}
            onPickHtml={setPinnedHtml}
          />
          <PreviewIframe
            src={src}
            companionUrl={COMPANION_URL}
            onIframeChange={setIframeEl}
            onCompanionReady={() => {
              // The iframe was just navigated; force the panel to re-attach
              // the postMessage RPC against the fresh contentWindow.
              setIframeEl((prev) => prev);
            }}
          />
        </main>
        <aside style={sidebar}>
          <RefinePanel
            iframe={iframeEl}
            artifactPath={
              effectiveSlug && effectiveHtml
                ? `sessions/${effectiveSlug}/html/${effectiveHtml}`
                : null
            }
            sessionSlug={effectiveSlug}
            resetKey={resetKey}
            daemon={daemon}
          />
        </aside>
      </div>
    </div>
  );
}

const layout: React.CSSProperties = {
  display: 'grid',
  gridTemplateRows: '52px minmax(0, 1fr)',
  height: '100vh',
  width: '100vw',
  background: '#f1f5f9',
};
const body: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 380px',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
};
const stage: React.CSSProperties = {
  padding: 16,
  minHeight: 0,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};
const sidebar: React.CSSProperties = {
  borderLeft: '1px solid #e2e8f0',
  background: '#fff',
  minHeight: 0,
  overflow: 'hidden',
};
