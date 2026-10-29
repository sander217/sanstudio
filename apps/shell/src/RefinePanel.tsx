// Refine sidebar — restructured around a "shopping cart" model.
//
//   Header        : Refine title · Picker toggle · Send to Claude (when
//                   the cart has anything to send).
//   Selected card : current pending selection (target, position, border
//                   radius, action buttons, advanced details). Shown only
//                   when the user has clicked an element.
//   Cart          : list of saved refinements with expand / edit / delete.
//                   Like an e-commerce cart — every entry is a discrete
//                   thing the user committed.
//   Output        : streaming claude --print output (when iterate is
//                   active or recently finished).
//
// Selection-side actions:
//   - Voice / Text buttons open a modal where the user dictates or types
//     a refinement note. Save lands a SavedRefinement in the cart.
//   - Edit text uses the companion's inline-text-edit RPC (existing flow);
//     when active, the panel + the floating ContextualToolbar show a
//     "Done" affordance and other buttons hide.
//   - Position is keyboard-driven: ↑↓→← nudges by 1px, Shift = 10px. The
//     useKeyboardNudge hook applies inline transform: translate() and
//     upserts a `keyboard-translate:<sel>` cart entry.
//
// Color, font, padding, border-width adjustments live inside an Advanced
// <details> so the primary surface stays focused on the common moves
// (text edit, position, radius).

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  RefineRpc,
  type EditDiff,
  type PendingSelection,
  type SelectedTarget,
  type StyleChangeDiff,
} from './refineProtocol';
import { buildIteratePrompt, type SavedRefinement } from './RefinementToPrompt';
import { StyleControls } from './StyleControls';
import { ImageControls } from './ImageControls';
import { ContextualToolbar } from './ContextualToolbar';
import { TextInputModal } from './TextInputModal';
import { VoiceInputModal } from './VoiceInputModal';
import { useKeyboardNudge, resetKeyboardNudge } from './useKeyboardNudge';
import { runIterate, type DaemonHealth } from './DaemonClient';
import { readTranslateFromMatrix } from './layoutHelpers';

interface Props {
  iframe: HTMLIFrameElement | null;
  artifactPath: string | null;
  sessionSlug: string | null;
  resetKey: number;
  daemon: DaemonHealth | null;
  projectId: string | null;
}

type ModalKind = null | 'text' | 'voice';
interface ModalState {
  kind: ModalKind;
  /** When editing an existing cart item, its id; null for a new note. */
  editingId: string | null;
  initialNote: string;
  /** Captured at modal-open time so target stays stable even after the
   * underlying pending selection clears. */
  target: SelectedTarget | null;
}

export function RefinePanel({
  iframe,
  artifactPath,
  sessionSlug,
  resetKey,
  daemon,
  projectId,
}: Props) {
  const [rpc, setRpc] = useState<RefineRpc | null>(null);
  const [refineOn, setRefineOn] = useState(false);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const [saved, setSaved] = useState<SavedRefinement[]>([]);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({
    kind: null,
    editingId: null,
    initialNote: '',
    target: null,
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [stream, setStream] = useState<{
    lines: string[];
    status: 'running' | 'ok' | 'err' | null;
    summary: string;
    durationMs: number;
  }>({ lines: [], status: null, summary: '', durationMs: 0 });
  const streamCancelRef = useRef<AbortController | null>(null);
  const streamScrollRef = useRef<HTMLPreElement | null>(null);

  const prevPendingRef = useRef<PendingSelection | null>(null);
  const skipAutoSaveRef = useRef(false);

  // ---- effects ---------------------------------------------------------

  useEffect(() => {
    setPending(null);
    setEditing(false);
    setRefineOn(false);
    setSaved([]);
    setExpanded(new Set());
    prevPendingRef.current = null;
    skipAutoSaveRef.current = false;
    setModal({ kind: null, editingId: null, initialNote: '', target: null });
  }, [resetKey]);

  // Auto-save: when pending switches, archive any previous diffs into cart.
  useEffect(() => {
    const previous = prevPendingRef.current;
    prevPendingRef.current = pending;
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }
    if (!previous || previous.diffs.length === 0) return;
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

  // Cmd+Z / Ctrl+Z global undo (only when not in a text input).
  useEffect(() => {
    if (!rpc) return;
    function onKey(ev: KeyboardEvent) {
      const isUndo = (ev.metaKey || ev.ctrlKey) && !ev.shiftKey && ev.key.toLowerCase() === 'z';
      if (!isUndo) return;
      const target = ev.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'input' || target?.isContentEditable) return;
      ev.preventDefault();
      void undoLastDiff();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rpc, pending, saved]);

  // Wire RPC.
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

  // ---- helpers (saved/cart) -------------------------------------------

  function upsertSaved(item: SavedRefinement) {
    setSaved((prev) => {
      const idx = prev.findIndex((s) => s.id === item.id);
      if (idx === -1) return [item, ...prev];
      const next = [...prev];
      next[idx] = item;
      return next;
    });
  }

  function removeSaved(id: string) {
    setSaved((prev) => prev.filter((s) => s.id !== id));
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Keyboard nudge for Position — replaces SelfPositionControls slider.
  useKeyboardNudge({ pending, iframe, upsertSaved, resetSignal: resetKey });

  // Live position display — read on every selection / nudge so the panel
  // shows the actual current translate, not a stale snapshot.
  const livePosition = useMemo(() => {
    if (!pending || !iframe?.contentDocument) return { x: 0, y: 0 };
    let el: Element | null = null;
    try {
      el = iframe.contentDocument.querySelector(pending.target.selector);
    } catch {
      return { x: 0, y: 0 };
    }
    if (!el) return { x: 0, y: 0 };
    return readTranslateFromMatrix(el);
    // saved.length is intentionally a dep so the position re-reads after a
    // keyboard nudge upserts a cart entry.
  }, [pending?.target.selector, iframe, resetKey, saved.length]);

  // ---- helpers (RPC) --------------------------------------------------

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
    setEditing(false);
  }

  async function undoLastDiff() {
    if (!rpc) return;
    const r = await rpc.applyDirectEdit({ type: 'undo_last_diff' });
    if (r.ok && r.pending) setPending(r.pending);
  }

  function resetPosition() {
    if (!pending) return;
    const removed = resetKeyboardNudge(pending, iframe, removeSaved);
    if (removed) setToast('Position reset to original');
    setTimeout(() => setToast(null), 1800);
  }

  // ---- modals ---------------------------------------------------------

  function openTextModal(opts: { editingId?: string; initialNote?: string; target: SelectedTarget }) {
    setModal({
      kind: 'text',
      editingId: opts.editingId ?? null,
      initialNote: opts.initialNote ?? '',
      target: opts.target,
    });
  }

  function openVoiceModal(opts: { editingId?: string; initialNote?: string; target: SelectedTarget }) {
    setModal({
      kind: 'voice',
      editingId: opts.editingId ?? null,
      initialNote: opts.initialNote ?? '',
      target: opts.target,
    });
  }

  function closeModal() {
    setModal({ kind: null, editingId: null, initialNote: '', target: null });
  }

  function saveModalNote(note: string) {
    if (!modal.target || !note.trim()) return;
    const id = modal.editingId ?? `note-${Date.now()}`;
    const existing = modal.editingId ? saved.find((s) => s.id === modal.editingId) : null;
    upsertSaved({
      id,
      region: existing?.region ?? modal.target,
      note: note.trim(),
      diffs: existing?.diffs ?? [],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    closeModal();
    setToast(modal.editingId ? 'Updated in cart' : 'Added to cart');
    setTimeout(() => setToast(null), 1800);
  }

  function saveAndSendModalNote(note: string) {
    if (!modal.target || !note.trim()) return;
    const id = modal.editingId ?? `note-${Date.now()}`;
    const existing = modal.editingId ? saved.find((s) => s.id === modal.editingId) : null;
    const newItem: SavedRefinement = {
      id,
      region: existing?.region ?? modal.target,
      note: note.trim(),
      diffs: existing?.diffs ?? [],
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    // Optimistic upsert + close — then send the full cart including the new item.
    setSaved((prev) => {
      const idx = prev.findIndex((s) => s.id === newItem.id);
      const nextList = idx === -1 ? [newItem, ...prev] : prev.map((s, i) => (i === idx ? newItem : s));
      void streamToClaude(nextList);
      return nextList;
    });
    closeModal();
  }

  // ---- claude streaming ------------------------------------------------

  async function streamToClaude(refinements: SavedRefinement[]) {
    if (refinements.length === 0) {
      setToast('Cart is empty — add a refinement first.');
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
        setToast('Daemon offline AND clipboard write failed.');
      }
      setTimeout(() => setToast(null), 4500);
      return;
    }

    if (streamCancelRef.current) streamCancelRef.current.abort();
    const ac = new AbortController();
    streamCancelRef.current = ac;
    const startedAt = Date.now();

    setStream({
      lines: [
        `── Sending ${refinements.length} refinement${refinements.length === 1 ? '' : 's'} to Claude ──`,
        ``,
      ],
      status: 'running',
      summary: 'running…',
      durationMs: 0,
    });
    setToast('Claude running — see Output panel');

    function appendChunk(chunk: string) {
      setStream((prev) => {
        if (prev.status !== 'running' && prev.status !== null) return prev;
        const next = [...prev.lines, ...chunk.split('\n')];
        return { ...prev, lines: next.length > 2000 ? next.slice(-2000) : next };
      });
    }

    try {
      for await (const evt of runIterate({ prompt: promptText, projectId, signal: ac.signal })) {
        if (evt.type === 'started') appendChunk('▸ claude --print started');
        else if (evt.type === 'stdout' || evt.type === 'stderr') appendChunk(evt.chunk);
        else if (evt.type === 'done') {
          const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
          const ok = evt.code === 0;
          appendChunk(`\n── ${ok ? '✓ done' : `✗ exit ${evt.code}`} in ${seconds}s ──`);
          setStream((prev) => ({
            ...prev,
            status: ok ? 'ok' : 'err',
            summary: ok ? `✓ done in ${seconds}s` : `✗ exit ${evt.code} (${seconds}s)`,
            durationMs: Date.now() - startedAt,
          }));
          setToast(ok ? `✓ Iterate done — preview should refresh` : `✗ Claude exited ${evt.code}`);
          setTimeout(() => setToast(null), 4000);
        } else if (evt.type === 'error') {
          appendChunk(`\n── ✗ error: ${evt.message} ──`);
          setStream((prev) => ({
            ...prev,
            status: 'err',
            summary: `✗ ${evt.message}`,
            durationMs: Date.now() - startedAt,
          }));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (ac.signal.aborted) {
        appendChunk(`\n── ⏹ cancelled ──`);
        setStream((prev) => ({ ...prev, status: 'err', summary: 'cancelled', durationMs: Date.now() - startedAt }));
      } else {
        console.error('[shell] daemon send failed', err);
        appendChunk(`\n── ✗ ${msg} ──`);
        setStream((prev) => ({ ...prev, status: 'err', summary: `✗ ${msg}`, durationMs: Date.now() - startedAt }));
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

  useEffect(() => {
    const el = streamScrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [stream.lines]);

  // ---- prompt preview --------------------------------------------------

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
      setToast('Prompt copied to clipboard.');
      setTimeout(() => setToast(null), 2200);
    } catch (err) {
      console.error('[shell] clipboard write failed', err);
    }
  }

  // ---- derived ---------------------------------------------------------

  const cartCount = saved.length;
  const sendDisabled = cartCount === 0 || stream.status === 'running';

  // ---- render ----------------------------------------------------------

  return (
    <div style={panel}>
      {/* Top strip — sits at the same vertical row as the Session bar in
       * main, so the two columns visually align. Stays put while the scroll
       * area below moves; doesn't overlap content. */}
      <header style={panelStrip}>
        <strong style={stripTitle}>Refine</strong>
        <div style={stripActions}>
          <button
            onClick={togglePicker}
            disabled={!iframe}
            style={refineOn ? stripBtnActive : stripBtn}
            title="Toggle picker — click iframe regions to select"
          >
            {refineOn ? '● Picker on' : 'Picker off'}
          </button>
          <button
            onClick={() => void streamToClaude(saved)}
            disabled={sendDisabled}
            style={sendDisabled ? stripBtnDisabled : stripBtnSend}
            title={
              sendDisabled
                ? cartCount === 0
                  ? 'Cart is empty — add a refinement first'
                  : 'Already sending — wait or cancel below'
                : `Send ${cartCount} refinement${cartCount === 1 ? '' : 's'} to Claude`
            }
          >
            {daemon?.ok
              ? cartCount > 0
                ? `Send (${cartCount})`
                : 'Send'
              : 'Copy'}
          </button>
        </div>
      </header>

      <div style={scrollArea}>
      {toast && <div style={toastStyle}>{toast}</div>}

      {!iframe && <p style={hint}>Iframe not ready — load an artifact first.</p>}

      {iframe && !pending && cartCount === 0 && !refineOn && (
        <p style={hint}>
          Click <em>Picker off</em> to enable, then click any region in the iframe to select it.
        </p>
      )}

      {/* SELECTED CARD */}
      {pending && (
        <section style={selectedCard}>
          <div>
            <div style={selectedHeader}>
              <span style={tagBadge}>{pending.target.tag}</span>
              <strong style={{ fontSize: 13, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pending.target.label}
              </strong>
              <button onClick={discardSelection} style={iconBtn} title="Discard selection">×</button>
            </div>
            <div style={selectorMeta} title={pending.target.selector}>{pending.target.selector}</div>
          </div>

          {!editing && (
            <>
              {/* Position — keyboard-driven */}
              <div style={miniRow}>
                <span style={miniLabel}>Position</span>
                <span style={miniValue}>
                  X: <strong>{livePosition.x}</strong>px &nbsp;·&nbsp;
                  Y: <strong>{livePosition.y}</strong>px
                </span>
                <button onClick={resetPosition} style={iconBtn} title="Reset to original position">↺</button>
              </div>
              <div style={kbHint}>
                ↑↓→← to nudge · <strong>Shift</strong> = 10px (click iframe area first if keys don't respond)
              </div>

              {/* Border radius — primary control */}
              <BorderRadiusInline pending={pending} iframe={iframe} upsertSaved={upsertSaved} />

              {/* Action buttons */}
              <div style={btnRow}>
                <button onClick={() => openVoiceModal({ target: pending.target })} style={btnAction} title="Voice input — record a refinement note">
                  🎤 Voice
                </button>
                <button onClick={() => openTextModal({ target: pending.target })} style={btnAction} title="Text input — type a refinement note">
                  ✏️ Text
                </button>
                <button onClick={startEdit} style={btnAction} title="Edit the element's text directly in the iframe">
                  📝 Edit text
                </button>
              </div>
              <div style={btnRow}>
                <button onClick={hide} style={btnGhost}>Hide</button>
                <button onClick={remove} style={btnGhost}>Remove</button>
                <button
                  onClick={undoLastDiff}
                  disabled={!pending.diffs.length && !saved.some((r) => r.diffs.length)}
                  style={btnGhost}
                  title="Undo last edit (⌘Z)"
                >
                  ↶ Undo
                </button>
              </div>

              {/* Advanced — colors / fonts / etc. */}
              <details style={advancedBox}>
                <summary style={advancedSummary}>Advanced (color, font, padding…)</summary>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <StyleControls pending={pending} rpc={rpc} resetSignal={resetKey} />
                  <ImageControls pending={pending} rpc={rpc} resetSignal={resetKey} />
                </div>
              </details>
            </>
          )}

          {editing && (
            <div style={editingBlock}>
              <span>📝 Editing text inline — type in the iframe element.</span>
              <button onClick={stopEdit} style={btnPrimary}>Done editing</button>
            </div>
          )}
        </section>
      )}

      {/* CART */}
      {cartCount > 0 && (
        <section>
          <div style={sectionHeader}>
            <span>Cart ({cartCount})</span>
            <button
              onClick={() => {
                if (confirm(`Clear all ${cartCount} refinements from the cart?`)) {
                  setSaved([]);
                  setExpanded(new Set());
                }
              }}
              style={linkBtn}
              title="Remove every refinement"
            >
              Clear all
            </button>
          </div>
          <ul style={cartList}>
            {saved.map((r) => {
              const open = expanded.has(r.id);
              return (
                <li key={r.id} style={cartItem}>
                  <div style={cartItemHeader} onClick={() => toggleExpand(r.id)}>
                    <span style={cartCaret}>{open ? '▾' : '▸'}</span>
                    <span style={tagBadgeSm}>{r.region.tag}</span>
                    <span style={cartLabel} title={r.region.label}>{r.region.label}</span>
                    <span style={cartCount_}>
                      {r.diffs.length > 0 ? `${r.diffs.length} edit${r.diffs.length === 1 ? '' : 's'}` : 'note'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openTextModal({ editingId: r.id, initialNote: r.note, target: r.region });
                      }}
                      style={iconBtnInline}
                      title="Edit note"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSaved(r.id);
                      }}
                      style={iconBtnInline}
                      title="Remove from cart"
                    >
                      ✕
                    </button>
                  </div>
                  {(open || r.note) && (
                    <div style={cartItemBody}>
                      {r.note ? (
                        <div style={cartNote}>{r.note}</div>
                      ) : (
                        <div style={cartNoteMuted}>(no note — applied edits only)</div>
                      )}
                      {open && r.diffs.length > 0 && (
                        <ul style={diffList}>
                          {r.diffs.map((d) => (
                            <li key={d.id} style={diffItem}>
                              <span style={diffType}>{d.type.replace('_', ' ')}</span>{' '}
                              <span style={diffTarget}>{d.target}</span>
                              {('after' in d && d.after) ? (
                                <span style={diffValue}> → {String(d.after)}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button onClick={copyPrompt} style={btn}>📋 Copy prompt</button>
            <details style={{ flex: 1 }}>
              <summary style={{ cursor: 'pointer', fontSize: 11, color: '#475569' }}>
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
            <div style={{ display: 'flex', gap: 6 }}>
              {stream.status === 'running' ? (
                <button onClick={cancelStream} style={cancelBtn} title="Stop the running claude process">
                  ⏹ Cancel
                </button>
              ) : (
                <button onClick={clearStream} style={linkBtn}>Clear</button>
              )}
            </div>
          </div>
          <pre ref={streamScrollRef} style={streamPre}>{stream.lines.join('\n')}</pre>
        </section>
      )}

      </div>

      <ContextualToolbar
        pending={pending}
        iframe={iframe}
        isEditing={editing}
        onVoice={() => pending && openVoiceModal({ target: pending.target })}
        onText={() => pending && openTextModal({ target: pending.target })}
        onEdit={startEdit}
        onStopEdit={stopEdit}
      />

      <TextInputModal
        open={modal.kind === 'text'}
        target={modal.target}
        initialNote={modal.initialNote}
        onSave={saveModalNote}
        onCancel={closeModal}
      />
      <VoiceInputModal
        open={modal.kind === 'voice'}
        target={modal.target}
        initialNote={modal.initialNote}
        onSave={saveModalNote}
        onSaveAndSend={daemon?.ok ? saveAndSendModalNote : undefined}
        onCancel={closeModal}
      />
    </div>
  );
}

// Inline border-radius slider — separate from StyleControls so the primary
// surface of the panel stays focused on the most common moves.
function BorderRadiusInline({
  pending,
  iframe,
  upsertSaved,
}: {
  pending: PendingSelection;
  iframe: HTMLIFrameElement | null;
  upsertSaved: (item: SavedRefinement) => void;
}) {
  const [original, setOriginal] = useState<{ value: number; inline: string } | null>(null);
  const [value, setValue] = useState(0);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!iframe?.contentDocument) return;
    let el: Element | null = null;
    try {
      el = iframe.contentDocument.querySelector(pending.target.selector);
    } catch {
      return;
    }
    if (!el) return;
    const cs = (el.ownerDocument?.defaultView ?? window).getComputedStyle(el);
    const m = cs.borderTopLeftRadius.match(/-?\d+(?:\.\d+)?/);
    const v = m ? Math.round(Number(m[0])) : 0;
    setOriginal({ value: v, inline: (el as HTMLElement).style.borderRadius });
    setValue(v);
    setDraft('');
  }, [pending.target.selector, iframe]);

  function apply(next: number) {
    setValue(next);
    if (!iframe?.contentDocument) return;
    let el: Element | null = null;
    try {
      el = iframe.contentDocument.querySelector(pending.target.selector);
    } catch {
      return;
    }
    if (!el) return;
    (el as HTMLElement).style.borderRadius = `${next}px`;
    if (!original) return;
    const id = `border-radius:${pending.target.selector}`;
    const diff: StyleChangeDiff = {
      id,
      selector: pending.target.selector,
      target: pending.target.label,
      createdAt: new Date().toISOString(),
      type: 'style_change',
      property: 'borderRadius',
      before: `${original.value}px`,
      after: `${next}px`,
    };
    upsertSaved({
      id,
      region: pending.target,
      note: 'Adjust border radius',
      diffs: [diff],
      createdAt: diff.createdAt,
    });
  }

  function commitDraft() {
    if (draft.trim() === '') {
      setDraft('');
      return;
    }
    const n = Math.max(0, Math.min(400, Math.round(Number(draft))));
    if (Number.isFinite(n)) apply(n);
    setDraft('');
  }

  return (
    <div style={miniRow}>
      <span style={miniLabel}>Radius</span>
      <input
        type="range"
        min={0}
        max={80}
        step={1}
        value={Math.min(80, value)}
        onChange={(e) => apply(Number(e.target.value))}
        style={{ flex: 1, accentColor: '#2563eb' }}
      />
      <input
        type="number"
        min={0}
        max={400}
        step={1}
        value={draft === '' ? String(value) : draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        style={numInputInline}
      />
      <span style={miniUnit}>px</span>
    </div>
  );
}

// ---- styles ---------------------------------------------------------

const panel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  fontSize: 13,
  color: '#0f172a',
  background: '#fff',
  height: '100%',
  overflow: 'hidden',
  // No outer padding — the strip is flush with the sidebar's top edge so
  // it sits at the same Y as the SessionPicker bar in main.
};
// Top strip — height matches the SessionPicker pill in main (~32-36px) so
// the two columns align at the eye line. This is OUTSIDE the scroll area
// so it never overlaps cart content when the user scrolls.
const panelStrip: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  background: '#fff',
  borderBottom: '1px solid #e2e8f0',
  flex: '0 0 auto',
  minHeight: 44,
};
const stripTitle: React.CSSProperties = {
  fontSize: 13,
  color: '#0f172a',
};
const stripActions: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  alignItems: 'center',
};
const stripBtn: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'inherit',
  color: '#0f172a',
  fontWeight: 500,
};
const stripBtnActive: React.CSSProperties = {
  ...stripBtn,
  background: '#2563eb',
  color: '#fff',
  borderColor: '#2563eb',
};
const stripBtnSend: React.CSSProperties = {
  ...stripBtn,
  background: '#16a34a',
  color: '#fff',
  borderColor: '#16a34a',
  fontWeight: 600,
};
const stripBtnDisabled: React.CSSProperties = {
  ...stripBtn,
  background: '#cbd5e1',
  color: '#fff',
  borderColor: '#cbd5e1',
  cursor: 'not-allowed',
};
// Inner scroll area — everything below the strip lives here so the strip
// stays put and content can grow/scroll without overlapping it.
const scrollArea: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};
const sectionHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '4px 0 6px',
  color: '#475569',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  fontWeight: 600,
};
const selectedCard: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  background: '#f8fafc',
};
const selectedHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};
const selectorMeta: React.CSSProperties = {
  fontSize: 10,
  color: '#94a3b8',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  marginTop: 4,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
const tagBadge: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  background: '#e0e7ff',
  color: '#3730a3',
  padding: '2px 5px',
  borderRadius: 3,
  flex: '0 0 auto',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};
const tagBadgeSm: React.CSSProperties = {
  ...tagBadge,
  fontSize: 9,
};
const miniRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};
const miniLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  width: 56,
};
const miniValue: React.CSSProperties = {
  fontSize: 12,
  color: '#0f172a',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  flex: 1,
};
const miniUnit: React.CSSProperties = {
  fontSize: 10,
  color: '#94a3b8',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};
const kbHint: React.CSSProperties = {
  fontSize: 10,
  color: '#64748b',
  background: '#f1f5f9',
  padding: '4px 8px',
  borderRadius: 4,
};
const numInputInline: React.CSSProperties = {
  width: 56,
  padding: '3px 6px',
  border: '1px solid #cbd5e1',
  borderRadius: 4,
  background: '#fff',
  fontSize: 11,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  color: '#0f172a',
  textAlign: 'right',
  boxSizing: 'border-box',
};
const advancedBox: React.CSSProperties = {
  padding: '6px 10px',
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
};
const advancedSummary: React.CSSProperties = {
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 600,
  color: '#475569',
  letterSpacing: 0.3,
};
const editingBlock: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: 10,
  background: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: 6,
  fontSize: 12,
  color: '#78350f',
};
const cartList: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};
const cartItem: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  background: '#fff',
};
const cartItemHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 10px',
  cursor: 'pointer',
};
const cartCaret: React.CSSProperties = {
  width: 12,
  color: '#94a3b8',
  fontSize: 10,
};
const cartLabel: React.CSSProperties = {
  flex: 1,
  fontSize: 12,
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
};
const cartCount_: React.CSSProperties = {
  fontSize: 10,
  color: '#94a3b8',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};
const cartItemBody: React.CSSProperties = {
  padding: '0 10px 10px',
  borderTop: '1px solid #f1f5f9',
};
const cartNote: React.CSSProperties = {
  fontSize: 12,
  color: '#0f172a',
  padding: '8px 0',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};
const cartNoteMuted: React.CSSProperties = {
  ...cartNote,
  color: '#94a3b8',
  fontStyle: 'italic',
};
const iconBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  border: '1px solid #e2e8f0',
  borderRadius: 4,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 12,
  color: '#64748b',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const iconBtnInline: React.CSSProperties = {
  ...iconBtn,
  width: 22,
  height: 22,
  fontSize: 11,
};
const btn: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'inherit',
  color: '#0f172a',
};
const btnPrimary: React.CSSProperties = {
  ...btn,
  background: '#2563eb',
  color: '#fff',
  borderColor: '#2563eb',
  fontWeight: 600,
};
const btnSendPrimary: React.CSSProperties = {
  ...btnPrimary,
  background: '#16a34a',
  borderColor: '#16a34a',
};
const btnGhost: React.CSSProperties = { ...btn, color: '#64748b' };
const btnPrimaryDisabled: React.CSSProperties = {
  ...btn,
  background: '#cbd5e1',
  color: '#fff',
  borderColor: '#cbd5e1',
  cursor: 'not-allowed',
};
const btnAction: React.CSSProperties = {
  ...btn,
  fontWeight: 500,
};
const btnRow: React.CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' };
const linkBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#dc2626',
  fontSize: 11,
  cursor: 'pointer',
  padding: 0,
  fontFamily: 'inherit',
};
const hint: React.CSSProperties = { color: '#64748b', fontSize: 12, lineHeight: 1.5 };
const diffList: React.CSSProperties = { listStyle: 'none', padding: 0, margin: '6px 0 0' };
const diffItem: React.CSSProperties = {
  fontSize: 11,
  padding: '4px 0',
  borderTop: '1px solid #f1f5f9',
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
  marginTop: 4,
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
