// Voice input modal — opens the browser's SpeechRecognition (Web Speech
// API) and shows the transcript live. The user can:
//   - Talk; final transcript builds up in the textarea
//   - Edit the textarea after recording
//   - Save to cart, OR Save + Send to Claude immediately
//
// Browser support: Chrome / Edge / Safari (with webkit prefix). Firefox
// does not implement SpeechRecognition; we surface a clear "not
// supported" message and let the user fall back to text input.
//
// Language: defaults to zh-TW because the user's other notes are in
// Traditional Chinese; a small button toggles to en-US for English.

import { useEffect, useRef, useState } from 'react';

import type { SelectedTarget } from './refineProtocol';

interface Props {
  open: boolean;
  target: SelectedTarget | null;
  initialNote?: string;
  onSave: (note: string) => void;
  /** Save AND immediately fire Send to Claude. Optional — only shown if
   * the parent says the daemon is up. */
  onSaveAndSend?: (note: string) => void;
  onCancel: () => void;
}

type RecognitionState = 'idle' | 'recording' | 'unsupported';

// minimal local typing for the Web Speech API — TS lib.dom doesn't ship it
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
  resultIndex: number;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

export function VoiceInputModal({
  open,
  target,
  initialNote = '',
  onSave,
  onSaveAndSend,
  onCancel,
}: Props) {
  const [state, setState] = useState<RecognitionState>('idle');
  const [lang, setLang] = useState<'zh-TW' | 'en-US'>('zh-TW');
  /** Text from completed (final) speech segments — these are committed. */
  const [finalText, setFinalText] = useState('');
  /** Text from in-progress speech — replaced on every interim event. */
  const [interimText, setInterimText] = useState('');
  /** The user's edited version, if they touched the textarea after talking. */
  const [edited, setEdited] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  // Reset on open / pre-fill from initialNote so editing a saved item
  // resumes its text.
  useEffect(() => {
    if (open) {
      setFinalText(initialNote);
      setInterimText('');
      setEdited(initialNote || null);
      setState(getRecognitionCtor() ? 'idle' : 'unsupported');
    } else {
      // Stop any active recording when the modal closes.
      try {
        recRef.current?.abort();
      } catch {
        // ignore — already stopped
      }
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
        const text = (edited ?? finalText).trim();
        if (text) onSave(text);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, edited, finalText, onCancel, onSave]);

  function startRecording() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setState('unsupported');
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (ev) => {
      let interim = '';
      let appendedFinal = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const result = ev.results[i];
        const text = result[0].transcript;
        if (result.isFinal) appendedFinal += text;
        else interim += text;
      }
      if (appendedFinal) {
        setFinalText((prev) => {
          const sep = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
          const next = prev + sep + appendedFinal;
          // Only auto-track if the user hasn't manually edited the textarea.
          setEdited((cur) => (cur === null ? null : next));
          return next;
        });
      }
      setInterimText(interim);
    };
    rec.onend = () => {
      setState('idle');
      setInterimText('');
    };
    rec.onerror = (e) => {
      console.warn('[shell] SpeechRecognition error', e.error);
      setState('idle');
      setInterimText('');
    };

    recRef.current = rec;
    setState('recording');
    try {
      rec.start();
    } catch (err) {
      // start() throws if a recognition is already running — abort + retry.
      console.warn('[shell] SpeechRecognition.start failed', err);
      try {
        rec.abort();
        rec.start();
      } catch {
        setState('idle');
      }
    }
  }

  function stopRecording() {
    try {
      recRef.current?.stop();
    } catch {
      // ignore
    }
  }

  if (!open) return null;

  // What the textarea shows: edited (if user typed) wins; otherwise the
  // accumulated final + interim live transcript.
  const liveText = (edited ?? finalText) + (interimText ? (interimText.startsWith(' ') ? interimText : ' ' + interimText) : '');
  const saveDisabled = !(edited ?? finalText).trim();

  return (
    <div style={overlay} onClick={onCancel} role="dialog" aria-modal="true">
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <div>
            <strong style={title}>Voice refinement</strong>
            {target && (
              <div style={subtitle} title={target.selector}>
                Target: {target.label}
              </div>
            )}
          </div>
          <button onClick={onCancel} style={closeBtn} aria-label="Close">×</button>
        </div>

        {state === 'unsupported' ? (
          <div style={errorBox}>
            <strong>Voice input not supported.</strong>
            <div style={{ fontSize: 12, marginTop: 4, color: '#475569' }}>
              Your browser doesn't expose <code>SpeechRecognition</code>. Use Chrome,
              Edge, or Safari for voice — or click "Use text input" below.
            </div>
          </div>
        ) : (
          <>
            <div style={controlRow}>
              <button
                onClick={state === 'recording' ? stopRecording : startRecording}
                style={state === 'recording' ? recBtnActive : recBtn}
              >
                {state === 'recording' ? '⏹ Stop' : '🎤 Start recording'}
              </button>
              <div style={langPill}>
                <button
                  onClick={() => setLang('zh-TW')}
                  style={lang === 'zh-TW' ? langActive : langInactive}
                >
                  中文
                </button>
                <button
                  onClick={() => setLang('en-US')}
                  style={lang === 'en-US' ? langActive : langInactive}
                >
                  EN
                </button>
              </div>
              {state === 'recording' && <span style={recHint}>Listening — speak now</span>}
            </div>

            <textarea
              value={liveText}
              onChange={(e) => {
                setEdited(e.target.value);
                setFinalText(e.target.value);
                setInterimText('');
              }}
              placeholder="Press Start recording and describe what should change. You can also edit the transcript directly."
              style={textarea}
              rows={6}
            />
          </>
        )}

        <div style={footer}>
          <span style={hint}>⌘+Enter to save · Esc to cancel</span>
          <div style={btnRow}>
            <button onClick={onCancel} style={btnGhost}>Cancel</button>
            {onSaveAndSend && (
              <button
                onClick={() => onSaveAndSend((edited ?? finalText).trim())}
                disabled={saveDisabled}
                style={saveDisabled ? btnPrimaryDisabled : btnAccent}
                title="Save to cart and send everything to Claude immediately"
              >
                Save + Send
              </button>
            )}
            <button
              onClick={() => onSave((edited ?? finalText).trim())}
              disabled={saveDisabled}
              style={saveDisabled ? btnPrimaryDisabled : btnPrimary}
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
  maxWidth: 560,
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
  maxWidth: 420,
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
const errorBox: React.CSSProperties = {
  margin: '14px 18px',
  padding: 12,
  background: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: 8,
  color: '#78350f',
};
const controlRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 18px 8px',
};
const recBtn: React.CSSProperties = {
  padding: '8px 14px',
  border: '1px solid #2563eb',
  borderRadius: 6,
  background: '#2563eb',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const recBtnActive: React.CSSProperties = {
  ...recBtn,
  background: '#dc2626',
  borderColor: '#dc2626',
};
const langPill: React.CSSProperties = {
  display: 'flex',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  overflow: 'hidden',
};
const langActive: React.CSSProperties = {
  padding: '6px 10px',
  border: 'none',
  background: '#0f172a',
  color: '#fff',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const langInactive: React.CSSProperties = {
  padding: '6px 10px',
  border: 'none',
  background: '#fff',
  color: '#475569',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const recHint: React.CSSProperties = {
  fontSize: 11,
  color: '#dc2626',
  fontWeight: 500,
};
const textarea: React.CSSProperties = {
  width: 'calc(100% - 36px)',
  margin: '0 18px',
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  color: '#0f172a',
  resize: 'vertical',
  minHeight: 140,
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
const btnAccent: React.CSSProperties = {
  ...btnPrimary,
  background: '#16a34a',
  borderColor: '#16a34a',
};
const btnPrimaryDisabled: React.CSSProperties = {
  ...btnPrimary,
  background: '#cbd5e1',
  borderColor: '#cbd5e1',
  cursor: 'not-allowed',
};
