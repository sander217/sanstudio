// The right-side panel: picker toggle, current selection card with edit
// buttons (text / hide / remove), saved-refinement list, and the
// "Generate iterate prompt" button that builds the Claude Code paste-back.
//
// All DOM mutation happens inside the iframe via the companion + RefineRpc.
// This component never touches iframe content directly.

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  RefineRpc,
  type EditDiff,
  type PendingSelection,
} from './refineProtocol';
import { buildIteratePrompt, type SavedRefinement } from './RefinementToPrompt';

interface Props {
  iframe: HTMLIFrameElement | null;
  /** Slug + path of the current artifact (for prompt context). */
  artifactPath: string | null;
  sessionSlug: string | null;
  /** Bumped each time the user wants the panel to reset (e.g. new artifact loaded). */
  resetKey: number;
}

export function RefinePanel({ iframe, artifactPath, sessionSlug, resetKey }: Props) {
  const rpcRef = useRef<RefineRpc | null>(null);
  const [refineOn, setRefineOn] = useState(false);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [saved, setSaved] = useState<SavedRefinement[]>([]);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset on new artifact.
  useEffect(() => {
    setPending(null);
    setNote('');
    setEditing(false);
    setRefineOn(false);
    // Saved refinements: in v0 they reset per artifact. The user generates a
    // prompt, pastes it, gets a new artifact — saved list is no longer
    // applicable to the new HTML.
    setSaved([]);
  }, [resetKey]);

  // Wire the RPC each time the iframe element changes.
  useEffect(() => {
    if (!iframe) return;
    const rpc = new RefineRpc(() => iframe.contentWindow);
    rpc.attach();
    rpcRef.current = rpc;
    const offMode = rpc.onModeChange((enabled) => setRefineOn(enabled));
    const offTarget = rpc.onTargetSelected((p) => {
      setPending(p);
      setEditing(false);
    });
    return () => {
      offMode();
      offTarget();
      rpc.detach();
      rpcRef.current = null;
    };
  }, [iframe]);

  async function togglePicker() {
    const rpc = rpcRef.current;
    if (!rpc) return;
    const next = !refineOn;
    try {
      await rpc.setRefineMode(next);
      setRefineOn(next);
    } catch (err) {
      console.error('[shell] toggle picker failed', err);
    }
  }

  async function applyAndUpdatePending(action: Parameters<RefineRpc['applyDirectEdit']>[0]) {
    const rpc = rpcRef.current;
    if (!rpc) return;
    const r = await rpc.applyDirectEdit(action);
    if (r.ok && r.pending) setPending(r.pending);
    return r;
  }

  async function startEdit() {
    const r = await applyAndUpdatePending({ type: 'start_inline_text_edit' });
    if (r?.ok) setEditing(true);
  }

  async function stopEdit() {
    const r = await applyAndUpdatePending({ type: 'stop_inline_text_edit' });
    if (r?.ok) setEditing(false);
  }

  async function hide() {
    await applyAndUpdatePending({ type: 'hide_selected' });
  }

  async function remove() {
    await applyAndUpdatePending({ type: 'remove_selected' });
  }

  async function discardSelection() {
    const rpc = rpcRef.current;
    if (!rpc) return;
    await rpc.applyDirectEdit({ type: 'reset_pending_selection', revert: true });
    setPending(null);
    setNote('');
    setEditing(false);
  }

  function saveCurrent() {
    if (!pending) return;
    const item: SavedRefinement = {
      id: `r-${Date.now()}`,
      region: pending.target,
      note: note.trim(),
      diffs: pending.diffs as EditDiff[],
      createdAt: new Date().toISOString(),
    };
    setSaved((prev) => [item, ...prev]);
    // Clear the active selection so the user can pick another region.
    void rpcRef.current?.applyDirectEdit({ type: 'reset_pending_selection', revert: false });
    setPending(null);
    setNote('');
    setEditing(false);
  }

  function deleteSaved(id: string) {
    setSaved((prev) => prev.filter((r) => r.id !== id));
  }

  const promptText = useMemo(
    () =>
      buildIteratePrompt(saved, {
        artifactPath: artifactPath ?? undefined,
        sessionSlug: sessionSlug ?? undefined,
      }),
    [saved, artifactPath, sessionSlug],
  );

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[shell] clipboard write failed', err);
    }
  }

  return (
    <div style={panel}>
      <header style={panelHeader}>
        <strong style={{ fontSize: 13 }}>Refine</strong>
        <button
          onClick={togglePicker}
          disabled={!iframe}
          style={refineOn ? btnPrimary : btn}
        >
          {refineOn ? 'Picker ON · click iframe' : 'Start picker'}
        </button>
      </header>

      {!iframe && <p style={hint}>Iframe not ready — load an artifact first.</p>}

      {iframe && !pending && !refineOn && saved.length === 0 && (
        <p style={hint}>
          Click <em>Start picker</em>, then click any region in the artifact iframe to select it.
        </p>
      )}

      {pending && (
        <section style={card}>
          <div>
            <strong style={{ fontSize: 13 }}>{pending.target.label}</strong>
            <div style={meta}>
              {pending.target.tag} · {pending.diffs.length} edit{pending.diffs.length === 1 ? '' : 's'}
            </div>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What should change about this region?"
            rows={4}
            style={textarea}
          />
          <div style={btnRow}>
            {!editing ? (
              <button onClick={startEdit} style={btn}>Edit text</button>
            ) : (
              <button onClick={stopEdit} style={btnPrimary}>Done editing</button>
            )}
            <button onClick={hide} style={btn}>Hide</button>
            <button onClick={remove} style={btn}>Remove</button>
            <button onClick={discardSelection} style={btnGhost}>Discard</button>
          </div>
          {pending.diffs.length > 0 && (
            <ul style={diffList}>
              {pending.diffs.map((d) => (
                <li key={d.id} style={diffItem}>
                  <span style={diffType}>{d.type.replace('_', ' ')}</span>{' '}
                  <span style={diffTarget}>{d.target}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={saveCurrent}
            disabled={!note.trim() && pending.diffs.length === 0}
            style={btnPrimary}
          >
            Save refinement
          </button>
        </section>
      )}

      {saved.length > 0 && (
        <section>
          <div style={sectionHeader}>
            <span>Saved ({saved.length})</span>
          </div>
          <ul style={savedList}>
            {saved.map((r) => (
              <li key={r.id} style={savedRow}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 12 }}>{r.region.label}</strong>
                  <div style={meta}>{r.note || '_(no note)_'}</div>
                  <div style={metaSmall}>
                    {r.diffs.length} diff{r.diffs.length === 1 ? '' : 's'}
                  </div>
                </div>
                <button onClick={() => deleteSaved(r.id)} style={iconBtn} title="delete">
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={copyPrompt} style={btnPrimary}>
              {copied ? 'Copied ✓' : 'Copy iterate prompt'}
            </button>
            <details style={detailsBox}>
              <summary style={{ cursor: 'pointer', fontSize: 12, color: '#475569' }}>
                Preview prompt
              </summary>
              <pre style={pre}>{promptText}</pre>
            </details>
          </div>
        </section>
      )}
    </div>
  );
}

const panel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 16,
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  fontSize: 13,
  color: '#0f172a',
  background: '#fff',
  height: '100%',
  overflow: 'auto',
};
const panelHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};
const sectionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '12px 0 6px',
  color: '#475569',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};
const card: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  background: '#f8fafc',
};
const textarea: React.CSSProperties = {
  width: '100%',
  resize: 'vertical',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  padding: 8,
  fontFamily: 'inherit',
  fontSize: 13,
};
const btnRow: React.CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' };
const btn: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 12,
};
const btnPrimary: React.CSSProperties = {
  ...btn,
  background: '#2563eb',
  color: '#fff',
  borderColor: '#2563eb',
};
const btnGhost: React.CSSProperties = { ...btn, color: '#64748b', borderColor: '#e2e8f0' };
const iconBtn: React.CSSProperties = {
  ...btn,
  width: 24,
  padding: 0,
  fontSize: 14,
  lineHeight: '20px',
  color: '#94a3b8',
};
const hint: React.CSSProperties = { color: '#64748b', fontSize: 12, lineHeight: 1.5 };
const meta: React.CSSProperties = { color: '#64748b', fontSize: 11 };
const metaSmall: React.CSSProperties = { color: '#94a3b8', fontSize: 10, marginTop: 2 };
const diffList: React.CSSProperties = { listStyle: 'none', padding: 0, margin: 0 };
const diffItem: React.CSSProperties = {
  fontSize: 11,
  padding: '4px 0',
  borderTop: '1px solid #e2e8f0',
};
const diffType: React.CSSProperties = {
  textTransform: 'uppercase',
  color: '#0f172a',
  fontWeight: 600,
  letterSpacing: 0.4,
};
const diffTarget: React.CSSProperties = { color: '#475569' };
const savedList: React.CSSProperties = { listStyle: 'none', padding: 0, margin: 0 };
const savedRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  borderBottom: '1px solid #f1f5f9',
  padding: '8px 0',
};
const detailsBox: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  padding: 8,
  background: '#f8fafc',
};
const pre: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11,
  margin: '8px 0 0',
  color: '#1e293b',
};
