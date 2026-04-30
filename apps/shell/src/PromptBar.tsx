// Top bar — composes the user's design intent into a Gate 1 prompt and
// gives them a one-click "Copy to clipboard" so they can paste it into
// Claude Code (Layer 0). Layer 1 will replace the copy button with a Send
// button that talks to the local daemon.

import { useState } from 'react';

interface Props {
  /** Most recent session slug, if any — shown for context. */
  sessionSlug: string | null;
  /** Most recent poll error (red dot in status). */
  lastError: string | null;
}

export function PromptBar({ sessionSlug, lastError }: Props) {
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error('[shell] clipboard failed', err);
    }
  }

  return (
    <header style={bar}>
      <div style={brand}>
        <span style={dot} />
        <strong style={brandText}>sanstudio · shell</strong>
        <span style={subtle}>Layer 0 · manual sync</span>
      </div>

      <div style={center}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder='New design — e.g. "design a fintech dashboard like Stripe"'
          style={input}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void copyPrompt();
            }
          }}
        />
        <button
          onClick={copyPrompt}
          disabled={!draft.trim()}
          style={draft.trim() ? btnPrimary : btnDisabled}
        >
          {copied ? 'Copied ✓' : 'Copy Gate 1 prompt'}
        </button>
      </div>

      <div style={status}>
        {lastError ? (
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
