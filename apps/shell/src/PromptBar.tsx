// Top bar — composes the user's design intent into a Gate 1 prompt and
// gives them a one-click "Copy to clipboard" so they can paste it into
// Claude Code (Layer 0). Layer 1 will replace the copy button with a Send
// button that talks to the local daemon.

import { useState } from 'react';

import { runIterate, type DaemonHealth } from './DaemonClient';

interface Props {
  /** Most recent session slug, if any — shown for context. */
  sessionSlug: string | null;
  /** Most recent poll error (red dot in status). */
  lastError: string | null;
  /** Daemon health from /api/claude/health. null = still probing. */
  daemon: DaemonHealth | null;
}

export function PromptBar({ sessionSlug, lastError, daemon }: Props) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<'sending' | 'copied' | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const daemonReady = daemon?.ok === true;

  function buildEntryPrompt(): string {
    const trimmed = draft.trim();
    if (!trimmed) return '';
    return [
      '/context-lock',
      '',
      trimmed,
      '',
      '(Run sanstudio Gate 1 → Gate 2 → Gate 3. Emit the final HTML to the session output dir.)',
    ].join('\n');
  }

  async function copyPrompt() {
    const text = buildEntryPrompt();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setBusy('copied');
      setTimeout(() => setBusy(null), 1800);
    } catch (err) {
      console.error('[shell] clipboard failed', err);
    }
  }

  async function sendPrompt() {
    const text = buildEntryPrompt();
    if (!text) return;
    setBusy('sending');
    setProgress('Starting Claude…');
    try {
      const startedAt = Date.now();
      for await (const evt of runIterate({ prompt: text })) {
        if (evt.type === 'started') setProgress('Claude is running Gate 1 → 2 → 3…');
        else if (evt.type === 'stdout') {
          // Show the last non-empty line as a heartbeat.
          const last = evt.chunk.split('\n').reverse().find((l) => l.trim());
          if (last) setProgress(last.slice(0, 80));
        } else if (evt.type === 'stderr') {
          // Treat as info, not error — claude prints status to stderr too.
          setProgress(evt.chunk.slice(0, 80));
        } else if (evt.type === 'done') {
          const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
          setProgress(
            evt.code === 0
              ? `✓ Done in ${seconds}s — iframe will refresh shortly`
              : `✗ Claude exited ${evt.code} after ${seconds}s`,
          );
          setTimeout(() => setProgress(null), 4000);
        } else if (evt.type === 'error') {
          setProgress(`✗ ${evt.message}`);
          setTimeout(() => setProgress(null), 5000);
        }
      }
    } catch (err) {
      console.error('[shell] sendPrompt failed', err);
      setProgress(`✗ ${err instanceof Error ? err.message : 'send failed'}`);
      setTimeout(() => setProgress(null), 5000);
    } finally {
      setBusy(null);
    }
  }

  const action = daemonReady ? sendPrompt : copyPrompt;
  const buttonLabel = busy === 'sending'
    ? 'Sending…'
    : busy === 'copied'
      ? 'Copied ✓'
      : daemonReady
        ? 'Send Gate 1 prompt'
        : 'Copy Gate 1 prompt';

  const layerLabel = daemonReady
    ? 'Layer 1 · live'
    : daemon === null
      ? 'probing claude…'
      : 'Layer 0 · manual sync';

  return (
    <header style={bar}>
      <div style={brand}>
        <span style={dot} />
        <strong style={brandText}>sanstudio · shell</strong>
        <span style={subtle} title={daemon && !daemon.ok ? daemon.error : undefined}>
          {layerLabel}
        </span>
      </div>

      <div style={center}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder='New design — e.g. "design a fintech dashboard like Stripe"'
          style={input}
          disabled={busy === 'sending'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void action();
            }
          }}
        />
        <button
          onClick={action}
          disabled={!draft.trim() || busy === 'sending'}
          style={draft.trim() ? btnPrimary : btnDisabled}
        >
          {buttonLabel}
        </button>
      </div>

      <div style={status}>
        {progress ? (
          <span style={statusBusy} title={progress}>{progress}</span>
        ) : lastError ? (
          <span style={statusError} title={lastError}>● error</span>
        ) : sessionSlug ? (
          <span style={statusOk}>● {sessionSlug}</span>
        ) : (
          <span style={statusIdle}>● waiting for first artifact</span>
        )}
      </div>
    </header>
  );
}

const bar: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '220px 1fr 200px',
  alignItems: 'center',
  gap: 16,
  padding: '10px 16px',
  borderBottom: '1px solid #e2e8f0',
  background: '#fff',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
};
const brand: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
const dot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#2563eb',
};
const brandText: React.CSSProperties = { fontSize: 13, color: '#0f172a' };
const subtle: React.CSSProperties = { fontSize: 11, color: '#94a3b8', marginLeft: 4 };
const center: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center' };
const input: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontFamily: 'inherit',
  fontSize: 13,
};
const btnPrimary: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};
const btnDisabled: React.CSSProperties = { ...btnPrimary, background: '#cbd5e1', cursor: 'not-allowed' };
const status: React.CSSProperties = {
  textAlign: 'right',
  fontSize: 11,
  color: '#64748b',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};
const statusOk: React.CSSProperties = { color: '#16a34a' };
const statusError: React.CSSProperties = { color: '#dc2626' };
const statusIdle: React.CSSProperties = { color: '#94a3b8' };
const statusBusy: React.CSSProperties = {
  color: '#1e293b',
  background: '#fef3c7',
  padding: '2px 8px',
  borderRadius: 4,
  display: 'inline-block',
  maxWidth: 220,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
