// The right-side panel: picker toggle, current selection card with edit
// buttons (text / hide / remove), style controls (sliders + color pickers),
// saved-refinement list, and the "Generate iterate prompt" button that
// builds the Claude Code paste-back.
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
import { StyleControls } from './StyleControls';
import { ImageControls } from './ImageControls';
import { ChildLayoutControls } from './ChildLayoutControls';
import { SelfPositionControls } from './SelfPositionControls';
import { runIterate, type DaemonHealth } from './DaemonClient';

interface Props {
  iframe: HTMLIFrameElement | null;
  /** Slug + path of the current artifact (for prompt context). */
  artifactPath: string | null;
  sessionSlug: string | null;
  /** Bumped each time the user wants the panel to reset (e.g. new artifact loaded). */
  resetKey: number;
  /** Daemon health from /api/claude/health. null = still probing. */
  daemon: DaemonHealth | null;
  /** Project ID — passed to runIterate so claude spawns with the right cwd. */
  projectId: string | null;
}

export function RefinePanel({ iframe, artifactPath, sessionSlug, resetKey, daemon, projectId }: Props) {
  const [rpc, setRpc] = useState<RefineRpc | null>(null);
  const [refineOn, setRefineOn] = useState(false);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [saved, setSaved] = useState<SavedRefinement[]>([]);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  /** Transient banner shown after Save → "Saved + copied. Paste in Claude Code." */
  const [toast, setToast] = useState<string | null>(null);
  /** Live streaming output from claude --print. Populated by streamToClaude. */
  const [stream, setStream] = useState<{
    /** All lines from stdout/stderr in order, capped at MAX_STREAM_LINES. */
    lines: string[];
    /** "running" while claude is alive; "ok"/"err" once done. null = no stream yet. */
    status: 'running' | 'ok' | 'err' | null;
    /** Final summary line shown next to the title. */
    summary: string;
    /** Wall-clock duration in ms once status flips off "running". */
    durationMs: number;
  }>({ lines: [], status: null, summary: '', durationMs: 0 });
  const streamCancelRef = useRef<AbortController | null>(null);
  const streamScrollRef = useRef<HTMLPreElement | null>(null);
  /**
   * Tracks the previous pending so the auto-save useEffect below can decide
   * whether to flush its diffs into the saved list when the user switches
   * selections. Refs (vs state) so the effect can read it without becoming
   * its own trigger.
   */
  const prevPendingRef = useRef<PendingSelection | null>(null);
  /**
   * When saveCurrent or discardSelection clear pending intentionally, we
   * don't want the auto-save effect to also fire. Set this just before
   * clearing pending; the effect respects it for one tick then resets.
   */
  const skipAutoSaveRef = useRef(false);

  // Reset on new artifact.
  useEffect(() => {
    setPending(null);
    setNote('');
    setEditing(false);
    setRefineOn(false);
    setSaved([]);
    prevPendingRef.current = null;
    skipAutoSaveRef.current = false;
  }, [resetKey]);

  // Auto-save: when pending changes and the previous one had unsaved diffs,
  // archive them into the saved list so the user doesn't lose work.
  // - Switching elements (pending → different pending) → save previous.
  // - Pending → null via TARGET_CLEARED (clicked empty space) → save previous.
  // - Pending → null via saveCurrent / discardSelection → those code paths
  //   pre-set skipAutoSaveRef so we don't double-handle.
  useEffect(() => {
    const previous = prevPendingRef.current;
    prevPendingRef.current = pending;

    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }
    if (!previous || previous.diffs.length === 0) return;
    // Re-selecting the same element (companion broadcasts on every click) —
    // no save needed.
    if (pending && previous.target.selector === pending.target.selector) return;

    setSaved((prev) => [
      {
        id: `r-${Date.now()}-auto`,
        region: previous.target,
        note: '',
        diffs: previous.diffs as EditDiff[],
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }, [pending]);

  // Cmd+Z / Ctrl+Z anywhere in the shell window: global undo. Reads the
  // latest pending + saved state via the closure (effect re-binds when
  // either changes), so undoLastDiff sees current state.
  useEffect(() => {
    if (!rpc) return;
    function onKey(ev: KeyboardEvent) {
      const isUndo = (ev.metaKey || ev.ctrlKey) && !ev.shiftKey && ev.key.toLowerCase() === 'z';
      if (!isUndo) return;
      // Don't fight a real text-edit undo (textarea / input / contenteditable).
      const target = ev.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'input' || target?.isContentEditable) return;
      ev.preventDefault();
      void undoLastDiff();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rpc, pending, saved]);

  // Convenience flag: drives Undo button enabled state.
  const hasAnyDiff =
    (pending?.diffs.length ?? 0) > 0 || saved.some((r) => r.diffs.length > 0);

  // Wire the RPC each time the iframe element changes.
  useEffect(() => {
    if (!iframe) {
      setRpc(null);
      return;
    }
    const next = new RefineRpc(() => iframe.contentWindow);
    next.attach();
    setRpc(next);
    const offMode = next.onModeChange((enabled) => setRefineOn(enabled));
    const offTarget = next.onTargetSelected((p) => {
      setPending(p);
      setEditing(false);
    });
    // Iframe broadcasts TARGET_CLEARED when the user clicks empty space.
    // Drop the pending; the auto-save effect will preserve any unsaved
    // diffs into the Saved list automatically (we deliberately do NOT
    // set skipAutoSaveRef here).
    const offCleared = next.onTargetCleared(() => {
      setPending(null);
      setEditing(false);
    });
    return () => {
      offMode();
      offTarget();
      offCleared();
      next.detach();
    };
  }, [iframe]);

  async function togglePicker() {
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
    if (!rpc) return;
    await rpc.applyDirectEdit({ type: 'reset_pending_selection', revert: true });
    skipAutoSaveRef.current = true;
    setPending(null);
    setNote('');
    setEditing(false);
  }

  /** Stream the cumulative iterate prompt to Claude. Pipes ALL output into
   * the inline Output panel; toast becomes a one-line status. Cancellable
   * mid-stream via the AbortController stashed in streamCancelRef. */
  async function streamToClaude(refinements: SavedRefinement[]) {
    if (refinements.length === 0) {
      setToast('Nothing to send — make a refinement first.');
      setTimeout(() => setToast(null), 2500);
      return;
    }
    const promptText = buildIteratePrompt(refinements, {
      artifactPath: artifactPath ?? undefined,
      sessionSlug: sessionSlug ?? undefined,
    });
    if (!daemon?.ok) {
      try {
        await navigator.clipboard.writeText(promptText);
        setToast(
          `Daemon offline · ${refinements.length} refinement${refinements.length === 1 ? '' : 's'} copied. Paste in Claude Code (Cmd+V).`,
        );
      } catch (err) {
        console.error('[shell] clipboard write failed', err);
        setToast('Daemon offline AND clipboard write failed — see terminal.');
      }
      setTimeout(() => setToast(null), 4500);
      return;
    }

    // Refuse a second concurrent send — cancel the prior first.
    if (streamCancelRef.current) streamCancelRef.current.abort();
    const ac = new AbortController();
    streamCancelRef.current = ac;

    const startedAt = Date.now();
    setStream({
      lines: [
        `── Sending ${refinements.length} refinement${refinements.length === 1 ? '' : 's'} to Claude ──`,
        `cwd: project ${projectId ?? '(default)'}`,
        ``,
      ],
      status: 'running',
      summary: 'running…',
      durationMs: 0,
    });
    setToast(`Claude running — see Output panel below`);

    function appendChunk(chunk: string) {
      // Split on newlines, keep order; cap total lines so a runaway log
      // doesn't unbound memory.
      setStream((prev) => {
        if (prev.status !== 'running' && prev.status !== null) return prev;
        const newLines = chunk.split('\n');
        const next = [...prev.lines, ...newLines];
        const MAX = 2000;
        return {
          ...prev,
          lines: next.length > MAX ? next.slice(-MAX) : next,
        };
      });
    }

    try {
      for await (const evt of runIterate({ prompt: promptText, projectId, signal: ac.signal })) {
        if (evt.type === 'started') {
          appendChunk('▸ claude --print started');
        } else if (evt.type === 'stdout') {
          appendChunk(evt.chunk);
        } else if (evt.type === 'stderr') {
          appendChunk(evt.chunk);
        } else if (evt.type === 'done') {
          const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
          const ok = evt.code === 0;
          appendChunk(`\n── ${ok ? '✓ done' : `✗ exit ${evt.code}`} in ${seconds}s ──`);
          setStream((prev) => ({
            ...prev,
            status: ok ? 'ok' : 'err',
            summary: ok ? `✓ done in ${seconds}s` : `✗ exit ${evt.code} (${seconds}s)`,
            durationMs: Date.now() - startedAt,
          }));
          setToast(ok ? `✓ Iterate done — preview should refresh shortly` : `✗ Claude exited ${evt.code} — see Output panel`);
          setTimeout(() => setToast(null), 4000);
        } else if (evt.type === 'error') {
          appendChunk(`\n── ✗ error: ${evt.message} ──`);
          setStream((prev) => ({
            ...prev,
            status: 'err',
            summary: `✗ ${evt.message}`,
            durationMs: Date.now() - startedAt,
          }));
          setToast(`✗ ${evt.message}`);
          setTimeout(() => setToast(null), 5000);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Aborts surface as DOMException AbortError — don't treat that as a failure.
      if (ac.signal.aborted) {
        appendChunk(`\n── ⏹ cancelled by user ──`);
        setStream((prev) => ({
          ...prev,
          status: 'err',
          summary: 'cancelled',
          durationMs: Date.now() - startedAt,
        }));
      } else {
        console.error('[shell] daemon send failed', err);
        appendChunk(`\n── ✗ ${msg} ──`);
        setStream((prev) => ({
          ...prev,
          status: 'err',
          summary: `✗ ${msg}`,
          durationMs: Date.now() - startedAt,
        }));
        setToast(`✗ daemon send failed: ${msg}`);
        setTimeout(() => setToast(null), 5000);
      }
    } finally {
      if (streamCancelRef.current === ac) streamCancelRef.current = null;
    }
  }

  function cancelStream() {
    streamCancelRef.current?.abort();
  }

  function clearStream() {
    setStream({ lines: [], status: null, summary: '', durationMs: 0 });
  }

  // Auto-scroll the output panel as new lines arrive — only when the user
  // is already at the bottom, so manual scroll-up isn't fought.
  useEffect(() => {
    const el = streamScrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [stream.lines]);

  async function saveCurrent() {
    if (!pending) return;
    // Only push a "pending → saved" record when the pending selection
    // actually carries content (text/style/color edits via the companion,
    // OR a note from the user). Slider-driven Position/Padding edits go
    // straight into `saved` via upsertSaved, so without this guard we'd
    // append an empty SavedRefinement that adds noise to the prompt.
    const pendingHasContent = !!note.trim() || pending.diffs.length > 0;
    let nextSaved = saved;
    if (pendingHasContent) {
      const item: SavedRefinement = {
        id: `r-${Date.now()}`,
        region: pending.target,
        note: note.trim(),
        diffs: pending.diffs as EditDiff[],
        createdAt: new Date().toISOString(),
      };
      nextSaved = [item, ...saved];
      setSaved(nextSaved);
    }

    // Clear active selection BEFORE the long-running send — user can pick
    // another region while Claude works. visual changes persist (revert: false).
    void rpc?.applyDirectEdit({ type: 'reset_pending_selection', revert: false });
    skipAutoSaveRef.current = true;
    setPending(null);
    setNote('');
    setEditing(false);

    await streamToClaude(nextSaved);
  }

  async function drillIntoText() {
    if (!rpc) return;
    const r = await rpc.applyDirectEdit({ type: 'pick_inner_text' });
    if (r && !r.ok) {
      setToast(r.error ?? 'No inner text element to drill into.');
      setTimeout(() => setToast(null), 3000);
    }
    // The companion broadcasts a new TARGET_SELECTED with the inner element;
    // RefineRpc.onTargetSelected will update `pending`. No manual update needed.
  }

  /**
   * Global undo: pops the most recent diff regardless of whether it lives
   * on the current pending or on a previously-saved refinement. The visual
   * rollback always goes through the companion (DOM mutation); the shell
   * is the single source of truth for which diff was "most recent."
   */
  async function undoLastDiff() {
    if (!rpc) return;

    // Case 1: current selection has diffs — companion-side pop+revert,
    // which keeps activePending in sync atomically.
    if (pending && pending.diffs.length > 0) {
      const r = await rpc.applyDirectEdit({ type: 'undo_last_diff' });
      if (r && r.ok && r.pending) setPending(r.pending);
      else if (r && !r.ok) {
        setToast(r.error ?? 'Nothing to undo.');
        setTimeout(() => setToast(null), 2000);
      }
      return;
    }

    // Case 2: no current diffs — walk back through saved refinements
    // (newest-first since we prepend on save) and pop the latest diff
    // from the first non-empty one.
    const idx = saved.findIndex((r) => r.diffs.length > 0);
    if (idx === -1) {
      setToast('Nothing to undo.');
      setTimeout(() => setToast(null), 1500);
      return;
    }

    const item = saved[idx];
    const last = item.diffs[item.diffs.length - 1];
    const r = await rpc.revertDiffs([last]);
    if (!r.ok) {
      setToast(r.error ?? 'Revert failed.');
      setTimeout(() => setToast(null), 2200);
      return;
    }

    setSaved((prev) => {
      const next = [...prev];
      const updatedDiffs = next[idx].diffs.slice(0, -1);
      // Drop the saved entry if it has no diffs left AND no user note
      // (auto-saved entries with empty notes shouldn't linger when emptied).
      if (updatedDiffs.length === 0 && !next[idx].note.trim()) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], diffs: updatedDiffs };
      }
      return next;
    });
    setToast(`Undone · ${item.region.label}`);
    setTimeout(() => setToast(null), 1500);
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
      setToast('Copied to clipboard.');
      setTimeout(() => setToast(null), 2200);
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

      {toast && <div style={toastStyle}>{toast}</div>}

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
            <button onClick={drillIntoText} style={btn} title="Pick the text element inside this region">
              Pick text inside
            </button>
            <button onClick={hide} style={btn}>Hide</button>
            <button onClick={remove} style={btn}>Remove</button>
            <button
              onClick={undoLastDiff}
              disabled={!hasAnyDiff}
              style={!hasAnyDiff ? btnGhost : btn}
              title="Undo the most recent change across this session (⌘Z / Ctrl+Z)"
            >
              ↶ Undo
            </button>
            <button onClick={discardSelection} style={btnGhost}>Discard</button>
          </div>

          <StyleControls pending={pending} rpc={rpc} resetSignal={resetKey} />

          <SelfPositionControls
            pending={pending}
            iframe={iframe}
            artifactPath={artifactPath}
            resetSignal={resetKey}
            upsertSaved={(item) => {
              setSaved((prev) => {
                const idx = prev.findIndex((s) => s.id === item.id);
                if (idx === -1) return [item, ...prev];
                const next = [...prev];
                next[idx] = item;
                return next;
              });
            }}
          />
          <ImageControls pending={pending} rpc={rpc} resetSignal={resetKey} />

          <ChildLayoutControls
            pending={pending}
            iframe={iframe}
            artifactPath={artifactPath}
            resetSignal={resetKey}
            upsertSaved={(item) => {
              // Replace if a refinement with the same id already exists
              // (slider drag = many calls); else prepend so newest is on top.
              setSaved((prev) => {
                const idx = prev.findIndex((s) => s.id === item.id);
                if (idx === -1) return [item, ...prev];
                const next = [...prev];
                next[idx] = item;
                return next;
              });
            }}
          />

          {pending.diffs.length > 0 && (
            <ul style={diffList}>
              {pending.diffs.map((d) => (
                <li key={d.id} style={diffItem}>
                  <span style={diffType}>{d.type.replace('_', ' ')}</span>{' '}
                  <span style={diffTarget}>{d.target}</span>
                  {('after' in d && d.after) ? (
                    <span style={diffValue}>
                      {' → '}
                      {String(d.after)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={saveCurrent}
            disabled={
              !note.trim() &&
              pending.diffs.length === 0 &&
              saved.length === 0
            }
            style={btnPrimary}
            title={
              daemon?.ok
                ? 'Send all refinements (this selection + previously saved) to Claude'
                : 'Save this refinement and copy the cumulative iterate prompt to your clipboard'
            }
          >
            {daemon?.ok
              ? `Send to Claude${saved.length > 0 ? ` (${saved.length + (pending.diffs.length > 0 || note.trim() ? 1 : 0)})` : ''}`
              : 'Save'}
          </button>
        </section>
      )}

      {saved.length > 0 && (
        <section>
          <div style={sectionHeader}>
            <span>Saved ({saved.length})</span>
            <button
              onClick={undoLastDiff}
              disabled={!hasAnyDiff}
              style={!hasAnyDiff ? linkBtnGhost : linkBtn}
              title="Undo the most recent change in this session (⌘Z / Ctrl+Z)"
            >
              ↶ Undo
            </button>
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
            {daemon?.ok && (
              <button
                onClick={() => void streamToClaude(saved)}
                style={btnPrimary}
                title="Send all saved refinements to Claude (no pending selection needed)"
              >
                Send saved to Claude ({saved.length})
              </button>
            )}
            <button onClick={copyPrompt} style={daemon?.ok ? btn : btnPrimary}>
              Copy iterate prompt
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

      {stream.status !== null && (
        <section style={outputSection}>
          <div style={outputHeader}>
            <div style={outputTitleRow}>
              <span style={outputDot(stream.status)} />
              <strong style={{ fontSize: 12 }}>Claude output</strong>
              <span style={outputSummary}>{stream.summary}</span>
            </div>
            <div style={outputActions}>
              {stream.status === 'running' ? (
                <button onClick={cancelStream} style={cancelBtn} title="Stop the running claude process">
                  ⏹ Cancel
                </button>
              ) : (
                <button onClick={clearStream} style={linkBtn} title="Clear the output panel">
                  Clear
                </button>
              )}
            </div>
          </div>
          <pre ref={streamScrollRef} style={streamPre}>
            {stream.lines.join('\n')}
          </pre>
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
const linkBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  fontSize: 11,
  cursor: 'pointer',
  padding: 0,
};
const linkBtnGhost: React.CSSProperties = {
  ...linkBtn,
  color: '#cbd5e1',
  cursor: 'not-allowed',
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
const diffValue: React.CSSProperties = {
  color: '#0f172a',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};
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
const toastStyle: React.CSSProperties = {
  background: '#ecfdf5',
  border: '1px solid #6ee7b7',
  color: '#065f46',
  padding: '10px 12px',
  borderRadius: 6,
  fontSize: 12,
  lineHeight: 1.45,
};
const pre: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11,
  margin: '8px 0 0',
  color: '#1e293b',
};
const outputSection: React.CSSProperties = {
  marginTop: 12,
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  background: '#0f172a',
  overflow: 'hidden',
};
const outputHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 10px',
  background: '#1e293b',
  borderBottom: '1px solid #334155',
};
const outputTitleRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#f8fafc',
  minWidth: 0,
};
const outputSummary: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 220,
};
const outputActions: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  flex: '0 0 auto',
};
const cancelBtn: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  border: '1px solid #dc2626',
  borderRadius: 4,
  background: '#dc2626',
  color: '#fff',
  cursor: 'pointer',
};
const streamPre: React.CSSProperties = {
  margin: 0,
  padding: 12,
  maxHeight: 320,
  overflowY: 'auto',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11,
  lineHeight: 1.45,
  color: '#e2e8f0',
  background: '#0f172a',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

function outputDot(status: 'running' | 'ok' | 'err' | null): React.CSSProperties {
  const color =
    status === 'running' ? '#fbbf24' : status === 'ok' ? '#22c55e' : status === 'err' ? '#dc2626' : '#475569';
  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: color,
    boxShadow: status === 'running' ? '0 0 0 3px rgba(251,191,36,0.25)' : 'none',
    flex: '0 0 auto',
  };
}
