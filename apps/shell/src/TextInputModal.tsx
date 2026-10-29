// Text input modal — opened from the Selected card or a cart item's Edit
// action. The user types a refinement note (free-form intent), saves, and
// it lands in the cart as a SavedRefinement.
//
// Re-opening with `initialNote` and the same item id (via the parent's
// upsertSaved-by-id flow) lets the user edit a previously-saved note in
// place rather than creating a duplicate.

import { useEffect, useRef, useState } from 'react';

import type { SelectedTarget } from './refineProtocol';

interface Props {
  open: boolean;
  /** The element this note is being attached to. */
  target: SelectedTarget | null;
  /** Pre-fill text — empty for a new note, the existing note when editing. */
  initialNote?: string;
  onSave: (note: string) => void;
  onCancel: () => void;
}

export function TextInputModal({ open, target, initialNote = '', onSave, onCancel }: Props) {
  const [note, setNote] = useState(initialNote);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Reset the draft each time the modal opens so editing one item doesn't
  // bleed into editing another.
  useEffect(() => {
    if (open) {
      setNote(initialNote);
      // Defer focus to next frame so the textarea is mounted + visible.
      requestAnimationFrame(() => {
        const ta = taRef.current;
        if (ta) {
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }
      });
    }
  }, [open, initialNote]);

  // Esc closes; Cmd/Ctrl+Enter saves.
  useEffect(() => {
    if (!open) return;
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        onCancel();
      } else if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
        ev.preventDefault();
        if (note.trim()) onSave(note.trim());
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, note, onCancel, onSave]);

  if (!open) return null;

  return (
    <div style={overlay} onClick={onCancel} role="dialog" aria-modal="true">
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <div>
            <strong style={title}>Text refinement</strong>
            {target && (
              <div style={subtitle} title={target.selector}>
                Target: {target.label}
              </div>
            )}
          </div>
          <button onClick={onCancel} style={closeBtn} aria-label="Close">×</button>
        </div>
        <textarea
          ref={taRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder='What should change about this region? e.g. "Make this headline punchier — drop the second clause."'
          style={textarea}
          rows={6}
        />
        <div style={footer}>
          <span style={hint}>⌘+Enter to save · Esc to cancel</span>
          <div style={btnRow}>
            <button onClick={onCancel} style={btnGhost}>Cancel</button>
            <button
              onClick={() => onSave(note.trim())}
              disabled={!note.trim()}
              style={!note.trim() ? btnPrimaryDisabled : btnPrimary}
            >
              Save to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
};
const modal: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  width: '100%',
  maxWidth: 520,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
};
const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '16px 18px 12px',
  borderBottom: '1px solid #e2e8f0',
  gap: 12,
};
const title: React.CSSProperties = { fontSize: 14, color: '#0f172a' };
const subtitle: React.CSSProperties = {
  fontSize: 11,
  color: '#64748b',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  marginTop: 4,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 380,
};
const closeBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  border: 'none',
  background: 'transparent',
  fontSize: 22,
  color: '#94a3b8',
  cursor: 'pointer',
  borderRadius: 4,
  padding: 0,
  lineHeight: 1,
};
const textarea: React.CSSProperties = {
  width: 'calc(100% - 36px)',
  margin: '12px 18px 0',
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  color: '#0f172a',
  resize: 'vertical',
  minHeight: 120,
};
const footer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 18px 16px',
  marginTop: 12,
  borderTop: '1px solid #e2e8f0',
};
const hint: React.CSSProperties = { fontSize: 11, color: '#94a3b8' };
const btnRow: React.CSSProperties = { display: 'flex', gap: 8 };
const btnGhost: React.CSSProperties = {
  padding: '8px 14px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  background: '#fff',
  color: '#475569',
  fontSize: 13,
  fontFamily: 'inherit',
  cursor: 'pointer',
};
const btnPrimary: React.CSSProperties = {
  padding: '8px 16px',
  border: '1px solid #2563eb',
  borderRadius: 6,
  background: '#2563eb',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
};
const btnPrimaryDisabled: React.CSSProperties = {
  ...btnPrimary,
  background: '#cbd5e1',
  borderColor: '#cbd5e1',
  cursor: 'not-allowed',
};
