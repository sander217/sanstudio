// Device-size picker that lets the user preview the artifact at fixed
// mobile/tablet/desktop dimensions instead of the default fluid stage.
//
// Inspired by open-design v0.8.0's Playwright "3 viewports" stage harness —
// designers need to validate hi-fi artifacts at the dimensions they'll
// actually ship at, not just whatever the shell window happens to be.
//
// Layout: a single horizontal bar above the iframe. Preset dropdown +
// editable W×H number inputs + rotate + Fit toggle. Picks close on
// outside-click (shell document + iframe document — same pattern as
// SessionPicker/ProjectPicker).

import { useEffect, useRef, useState } from 'react';

import type { Viewport } from './viewportPresets';
import { DEVICE_PRESETS, FLUID_VIEWPORT, presetById } from './viewportPresets';

interface Props {
  viewport: Viewport;
  onChange: (next: Viewport) => void;
  /** Force-refresh the iframe (bumps a cache-bust nonce on the src). Use
   * when assets look stale or broken after a server-side fix. */
  onRefresh?: () => void;
  /** Iframe — so dropdown closes when user clicks inside the artifact. */
  iframe?: HTMLIFrameElement | null;
}

export function ViewportPicker({ viewport, onChange, onRefresh, iframe }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [draftW, setDraftW] = useState<string>('');
  const [draftH, setDraftH] = useState<string>('');

  // Keep drafts in sync when viewport changes from outside (preset pick).
  useEffect(() => {
    setDraftW(viewport.width != null ? String(viewport.width) : '');
    setDraftH(viewport.height != null ? String(viewport.height) : '');
  }, [viewport.width, viewport.height]);

  useEffect(() => {
    if (!open) return;
    function close() {
      setOpen(false);
    }
    function onShellClick(ev: MouseEvent) {
      if (!wrapRef.current?.contains(ev.target as Node)) close();
    }
    document.addEventListener('mousedown', onShellClick);
    const doc = iframe?.contentDocument;
    doc?.addEventListener('mousedown', close);
    return () => {
      document.removeEventListener('mousedown', onShellClick);
      doc?.removeEventListener('mousedown', close);
    };
  }, [open, iframe]);

  function commitDimension(axis: 'w' | 'h', raw: string) {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) {
      // Invalid → silently revert by re-syncing the draft from props.
      setDraftW(viewport.width != null ? String(viewport.width) : '');
      setDraftH(viewport.height != null ? String(viewport.height) : '');
      return;
    }
    const clamped = Math.min(4000, Math.max(120, n));
    const next: Viewport = {
      ...viewport,
      mode: 'fixed',
      presetId: null, // typed dims → no longer a known preset
      width: axis === 'w' ? clamped : viewport.width ?? FLUID_VIEWPORT.width ?? clamped,
      height: axis === 'h' ? clamped : viewport.height ?? FLUID_VIEWPORT.height ?? clamped,
    };
    onChange(next);
  }

  function pickPreset(presetId: string) {
    if (presetId === 'fluid') {
      onChange({ ...FLUID_VIEWPORT });
      setOpen(false);
      return;
    }
    const p = presetById(presetId);
    if (!p) return;
    onChange({
      mode: 'fixed',
      presetId: p.id,
      width: p.width,
      height: p.height,
      rotated: false,
      fit: viewport.fit,
    });
    setOpen(false);
  }

  function rotate() {
    if (viewport.mode !== 'fixed' || viewport.width == null || viewport.height == null) return;
    onChange({
      ...viewport,
      width: viewport.height,
      height: viewport.width,
      rotated: !viewport.rotated,
    });
  }

  function toggleFit() {
    onChange({ ...viewport, fit: !viewport.fit });
  }

  const current = viewport.presetId ? presetById(viewport.presetId) : null;
  const displayName = current?.label ?? (viewport.mode === 'fluid' ? 'Fluid' : 'Custom');
  const displayIcon = current?.icon ?? (viewport.mode === 'fluid' ? '🖥' : '📐');

  // Group presets by category for the dropdown.
  const phones = DEVICE_PRESETS.filter((p) => p.category === 'phone');
  const tablets = DEVICE_PRESETS.filter((p) => p.category === 'tablet');
  const desktops = DEVICE_PRESETS.filter((p) => p.category === 'desktop');

  return (
    <div ref={wrapRef} style={bar}>
      <span style={label}>Viewport</span>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={trigger}
        title="Pick a device preset"
      >
        <span style={icon}>{displayIcon}</span>
        <span style={triggerText}>{displayName}</span>
        <span style={caret}>▾</span>
      </button>

      {viewport.mode === 'fixed' ? (
        <>
          <input
            type="number"
            value={draftW}
            onChange={(e) => setDraftW(e.target.value)}
            onBlur={(e) => commitDimension('w', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setDraftW(viewport.width != null ? String(viewport.width) : '');
                (e.target as HTMLInputElement).blur();
              }
            }}
            onFocus={(e) => e.currentTarget.select()}
            style={dimInput}
            title="Width (px)"
          />
          <span style={times}>×</span>
          <input
            type="number"
            value={draftH}
            onChange={(e) => setDraftH(e.target.value)}
            onBlur={(e) => commitDimension('h', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setDraftH(viewport.height != null ? String(viewport.height) : '');
                (e.target as HTMLInputElement).blur();
              }
            }}
            onFocus={(e) => e.currentTarget.select()}
            style={dimInput}
            title="Height (px)"
          />
          <button type="button" onClick={rotate} style={iconBtn} title="Rotate (swap W ↔ H)">
            ↻
          </button>
          <button
            type="button"
            onClick={toggleFit}
            style={viewport.fit ? toggleBtnActive : toggleBtn}
            title="Scale down to fit when stage is smaller than the device"
          >
            Fit
          </button>
        </>
      ) : (
        <span style={fluidHint}>fills the stage</span>
      )}

      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          style={{ ...iconBtn, marginLeft: 'auto' }}
          title="Reload iframe + re-fetch all assets (bypasses any stale browser cache)"
          aria-label="Refresh iframe"
        >
          ⟳
        </button>
      ) : null}

      {open ? (
        <div style={menu}>
          <button
            type="button"
            onClick={() => pickPreset('fluid')}
            style={viewport.mode === 'fluid' ? menuItemActive : menuItem}
          >
            <span style={menuIcon}>{viewport.mode === 'fluid' ? '✓' : ''}</span>
            <span style={menuLabelGrow}>🖥 Fluid</span>
            <span style={menuMeta}>fills stage</span>
          </button>

          <div style={menuSection}>Phone</div>
          {phones.map((p) => renderRow(p))}

          <div style={menuSection}>Tablet</div>
          {tablets.map((p) => renderRow(p))}

          <div style={menuSection}>Desktop</div>
          {desktops.map((p) => renderRow(p))}
        </div>
      ) : null}
    </div>
  );

  function renderRow(p: (typeof DEVICE_PRESETS)[number]) {
    const active = viewport.presetId === p.id;
    return (
      <button
        key={p.id}
        type="button"
        onClick={() => pickPreset(p.id)}
        style={active ? menuItemActive : menuItem}
        title={`${p.width} × ${p.height}`}
      >
        <span style={menuIcon}>{active ? '✓' : ''}</span>
        <span style={menuLabelGrow}>
          {p.icon} {p.label}
        </span>
        <span style={menuMeta}>
          {p.width} × {p.height}
        </span>
      </button>
    );
  }
}

const bar: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  marginBottom: 8,
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  fontSize: 12,
  color: '#334155',
};
const label: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};
const trigger: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  background: '#f8fafc',
  cursor: 'pointer',
  font: 'inherit',
  color: '#0f172a',
  maxWidth: 240,
};
const icon: React.CSSProperties = { fontSize: 13 };
const triggerText: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12,
  fontWeight: 500,
};
const caret: React.CSSProperties = { color: '#94a3b8', fontSize: 10 };
const dimInput: React.CSSProperties = {
  width: 60,
  padding: '4px 6px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  background: '#fff',
  font: 'inherit',
  fontSize: 12,
  textAlign: 'center',
  color: '#0f172a',
  // Hide the spinner buttons on number inputs (we have rotate + drag UX).
  MozAppearance: 'textfield' as React.CSSProperties['MozAppearance'],
};
const times: React.CSSProperties = { color: '#94a3b8', fontSize: 11 };
const iconBtn: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  width: 26,
  height: 26,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  color: '#475569',
  fontSize: 14,
};
const toggleBtn: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#fff',
  cursor: 'pointer',
  padding: '4px 10px',
  borderRadius: 6,
  font: 'inherit',
  fontSize: 11,
  color: '#475569',
  height: 26,
};
const toggleBtnActive: React.CSSProperties = {
  ...toggleBtn,
  background: '#0f172a',
  color: '#fff',
  borderColor: '#0f172a',
};
const fluidHint: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 11,
  fontStyle: 'italic',
};
const menu: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 56,
  marginTop: 4,
  width: 320,
  maxHeight: 460,
  overflowY: 'auto',
  background: '#fff',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
  zIndex: 50,
  padding: 4,
};
const menuSection: React.CSSProperties = {
  padding: '8px 8px 4px',
  fontSize: 10,
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: 0.6,
};
const menuItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '6px 8px',
  border: 0,
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: 6,
  font: 'inherit',
  color: '#0f172a',
  gap: 8,
};
const menuItemActive: React.CSSProperties = {
  ...menuItem,
  background: '#f1f5f9',
};
const menuIcon: React.CSSProperties = {
  width: 14,
  textAlign: 'center',
  color: '#16a34a',
  fontSize: 12,
};
const menuLabelGrow: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12,
};
const menuMeta: React.CSSProperties = {
  fontSize: 10,
  color: '#94a3b8',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  marginLeft: 8,
};
