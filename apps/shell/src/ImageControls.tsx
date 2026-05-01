// ImageControls — shown when the selected region is or contains an image
// (or is an SVG icon). Two modes:
//   - Replace: paste a URL (or Unsplash query result, etc.). The companion
//     swaps the live <img>.src so the user sees the change immediately.
//   - Regenerate: write a prompt like "make this a darker, more dramatic
//     version" and the companion stores an intent diff. The live image is
//     untouched; Claude reads the intent at iterate time and produces a
//     fresh image.

import { useEffect, useRef, useState } from 'react';

import type { PendingSelection, RefineRpc } from './refineProtocol';

interface Props {
  pending: PendingSelection;
  rpc: RefineRpc | null;
  /** Forces re-mount on selection change. */
  resetSignal: number;
}

export function ImageControls({ pending, rpc, resetSignal }: Props) {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState<'url' | 'prompt' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Reset when the selection changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useResetOnChange([pending.target.selector, resetSignal], () => {
    setUrl('');
    setPrompt('');
    setErr(null);
  });

  const tag = pending.target.tag;
  const looksLikeImage =
    tag === 'img' ||
    tag === 'svg' ||
    tag === 'picture' ||
    tag === 'figure' ||
    pending.target.hasImage;

  if (!looksLikeImage) return null;

  async function applyUrl() {
    if (!rpc || !url.trim()) return;
    setBusy('url');
    setErr(null);
    try {
      const r = await rpc.applyDirectEdit({
        type: 'attach_image_reference',
        referenceKind: 'url',
        referenceUrl: url.trim(),
      });
      if (!r.ok) setErr(r.error ?? 'image replace failed');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'image replace failed');
    } finally {
      setBusy(null);
    }
  }

  async function applyRegenerate() {
    if (!rpc) return;
    setBusy('prompt');
    setErr(null);
    try {
      const r = await rpc.applyDirectEdit({
        type: 'mark_image_regenerate',
        prompt: prompt.trim() || undefined,
      });
      if (!r.ok) setErr(r.error ?? 'regenerate intent failed');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'regenerate intent failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <details open style={detailsBox}>
      <summary style={summary}>Image / icon</summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
        <div style={section}>
          <div style={sectionTitle}>Replace with URL</div>
          <input
            type="text"
            placeholder="https://...  or paste any image URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={textInput}
          />
          <button
            onClick={applyUrl}
            disabled={!url.trim() || busy !== null}
            style={url.trim() ? btnPrimary : btnDisabled}
          >
            {busy === 'url' ? 'Replacing…' : 'Replace image'}
          </button>
          {tag !== 'img' && !pending.target.hasImage && (
            <p style={hint}>
              Selection isn't an &lt;img&gt;. The diff is still recorded — Claude will use it
              when generating. Live preview only updates for actual &lt;img&gt; tags.
            </p>
          )}
        </div>

        <div style={section}>
          <div style={sectionTitle}>Tell AI to regenerate</div>
          <textarea
            placeholder='e.g. "darker, more dramatic version of the same scene" or "swap to a coffee shop, not an office"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            style={textarea}
          />
          <button
            onClick={applyRegenerate}
            disabled={busy !== null}
            style={btnPrimary}
          >
            {busy === 'prompt' ? 'Marking…' : 'Mark for regeneration'}
          </button>
          <p style={hint}>
            No live change — this just adds an intent diff. Claude regenerates the image
            on the next ITERATE based on the prompt.
          </p>
        </div>

        {err && <p style={errorStyle}>{err}</p>}
      </div>
    </details>
  );
}

// Small hook helper to reset local state when a key changes.
function useResetOnChange(keys: unknown[], reset: () => void) {
  const prev = useRef<string>(JSON.stringify(keys));
  useEffect(() => {
    const current = JSON.stringify(keys);
    if (prev.current !== current) {
      prev.current = current;
      reset();
    }
  });
}

const detailsBox: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  padding: 10,
  background: '#fff',
};
const summary: React.CSSProperties = {
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  color: '#0f172a',
  letterSpacing: 0.3,
};
const section: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};
const sectionTitle: React.CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  color: '#94a3b8',
  letterSpacing: 0.6,
  fontWeight: 600,
};
const textInput: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  padding: '6px 8px',
  border: '1px solid #cbd5e1',
  borderRadius: 4,
  background: '#fff',
};
const textarea: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 12,
  padding: '6px 8px',
  border: '1px solid #cbd5e1',
  borderRadius: 4,
  resize: 'vertical',
};
const btnPrimary: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #2563eb',
  background: '#2563eb',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 12,
  alignSelf: 'flex-start',
};
const btnDisabled: React.CSSProperties = {
  ...btnPrimary,
  background: '#cbd5e1',
  borderColor: '#cbd5e1',
  cursor: 'not-allowed',
};
const hint: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  color: '#64748b',
  lineHeight: 1.5,
};
const errorStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  color: '#dc2626',
};
