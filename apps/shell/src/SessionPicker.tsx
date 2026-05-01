// Two-dropdown picker: which session to load + which HTML file inside it.
//
// `selectedSlug = null` means "auto-follow the latest session by mtime" — the
// default. Picking a specific session pins the iframe; picking "Auto" again
// resumes following.
//
// Closes on outside-click. No portal — the menus are absolute-positioned
// inside the picker so they stay tied to the trigger row.

import { useEffect, useRef, useState } from 'react';

import type { SessionEntry } from './SessionWatcher';

interface Props {
  sessions: SessionEntry[];
  /** Currently shown slug (effective — auto-follow resolves to latest). */
  effectiveSlug: string | null;
  /** Currently shown HTML file (effective). */
  effectiveHtml: string | null;
  /** null = auto-follow latest. Setting to a slug pins that session. */
  selectedSlug: string | null;
  onPickSession: (slug: string | null) => void;
  /** null = primary file in current session. */
  selectedHtml: string | null;
  onPickHtml: (file: string | null) => void;
}

export function SessionPicker({
  sessions,
  effectiveSlug,
  effectiveHtml,
  selectedSlug,
  onPickSession,
  selectedHtml,
  onPickHtml,
}: Props) {
  const [openMenu, setOpenMenu] = useState<'session' | 'html' | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    function onDocClick(ev: MouseEvent) {
      if (!wrapRef.current?.contains(ev.target as Node)) setOpenMenu(null);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [openMenu]);

  const effectiveSession = sessions.find((s) => s.slug === effectiveSlug);
  const htmlFiles = effectiveSession?.htmlFiles ?? [];
  const isAuto = selectedSlug === null;

  return (
    <div ref={wrapRef} style={bar}>
      <span style={label}>Session</span>

      <button
        type="button"
        onClick={() => setOpenMenu(openMenu === 'session' ? null : 'session')}
        style={trigger}
      >
        {isAuto ? <span style={autoBadge}>auto</span> : null}
        <span style={triggerText} title={effectiveSlug ?? undefined}>
          {effectiveSlug ?? 'no sessions yet'}
        </span>
        <span style={caret}>▾</span>
      </button>

      {htmlFiles.length > 1 ? (
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === 'html' ? null : 'html')}
          style={triggerSm}
          title={effectiveHtml ?? undefined}
        >
          <span style={triggerText}>{effectiveHtml ?? '—'}</span>
          <span style={caret}>▾</span>
        </button>
      ) : effectiveHtml ? (
        <span style={fileStatic} title={effectiveHtml}>{effectiveHtml}</span>
      ) : null}

      <span style={count}>
        {sessions.length} session{sessions.length === 1 ? '' : 's'}
      </span>

      {openMenu === 'session' ? (
        <div style={menu}>
          <button
            type="button"
            onClick={() => {
              onPickSession(null);
              setOpenMenu(null);
            }}
            style={isAuto ? menuItemActive : menuItem}
          >
            <span style={menuIcon}>{isAuto ? '✓' : ''}</span>
            <span style={menuLabelGrow}>Auto-follow latest</span>
            <span style={menuMeta}>follow mtime</span>
          </button>
          <div style={menuDivider} />
          {sessions.map((s) => {
            const active = !isAuto && s.slug === selectedSlug;
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => {
                  onPickSession(s.slug);
                  onPickHtml(null);
                  setOpenMenu(null);
                }}
                style={active ? menuItemActive : menuItem}
                title={s.slug}
              >
                <span style={menuIcon}>{active ? '✓' : ''}</span>
                <span style={menuLabelGrow}>{s.slug}</span>
                <span style={menuMeta}>{formatRelative(s.modifiedMs)}</span>
              </button>
            );
          })}
          {sessions.length === 0 ? (
            <div style={menuEmpty}>No sessions yet — run a sanstudio flow.</div>
          ) : null}
        </div>
      ) : null}

      {openMenu === 'html' ? (
        <div style={menuHtml}>
          {htmlFiles.map((file) => {
            const active = file === effectiveHtml;
            return (
              <button
                key={file}
                type="button"
                onClick={() => {
                  onPickHtml(file);
                  setOpenMenu(null);
                }}
                style={active ? menuItemActive : menuItem}
                title={file}
              >
                <span style={menuIcon}>{active ? '✓' : ''}</span>
                <span style={menuLabelGrow}>{file}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function formatRelative(ms: number): string {
  const diffSec = Math.max(1, Math.round((Date.now() - ms) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 48) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 14) return `${diffDay}d ago`;
  return new Date(ms).toLocaleDateString();
}

const bar: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
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
  maxWidth: 380,
};
const triggerSm: React.CSSProperties = {
  ...trigger,
  maxWidth: 200,
  background: '#fff',
};
const triggerText: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11,
};
const caret: React.CSSProperties = { color: '#94a3b8', fontSize: 10 };
const autoBadge: React.CSSProperties = {
  background: '#dbeafe',
  color: '#1d4ed8',
  fontSize: 10,
  fontWeight: 600,
  padding: '1px 6px',
  borderRadius: 4,
  letterSpacing: 0.4,
};
const fileStatic: React.CSSProperties = {
  ...triggerText,
  padding: '4px 8px',
  color: '#64748b',
};
const count: React.CSSProperties = {
  marginLeft: 'auto',
  color: '#94a3b8',
  fontSize: 11,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};
const menu: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 56,
  marginTop: 4,
  width: 420,
  maxHeight: 360,
  overflowY: 'auto',
  background: '#fff',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
  zIndex: 50,
  padding: 4,
};
const menuHtml: React.CSSProperties = {
  ...menu,
  left: 'auto',
  right: 110,
  width: 260,
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
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11,
};
const menuMeta: React.CSSProperties = {
  fontSize: 10,
  color: '#94a3b8',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  marginLeft: 8,
};
const menuDivider: React.CSSProperties = {
  height: 1,
  background: '#e2e8f0',
  margin: '4px 0',
};
const menuEmpty: React.CSSProperties = {
  padding: '12px 8px',
  fontSize: 11,
  color: '#94a3b8',
  textAlign: 'center',
};
