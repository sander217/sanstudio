// Header-bar dropdown for switching between project folders. Each project is
// a Claude Code working directory the shell scans for sessions. The dropdown
// also surfaces the "Add project" + "Start design session" actions because
// they're both project-scoped.

import { useEffect, useRef, useState } from 'react';

import {
  addProject,
  launchInTerminal,
  pickFolder,
  removeProject,
  suggestProjectName,
  type Project,
} from './ProjectStore';

interface Props {
  projects: Project[];
  selectedId: string | null;
  /** Called when a different project is picked OR after add/remove changes. */
  onSelect: (id: string) => void;
  /** Called after add/remove so the parent re-fetches the project list. */
  onProjectsChanged: () => void;
  /** Artifact iframe — needed so clicks INSIDE it also close this menu
   * (cross-document; iframe clicks don't reach shell's document listener). */
  iframe?: HTMLIFrameElement | null;
}

export function ProjectPicker({ projects, selectedId, onSelect, onProjectsChanged, iframe }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close() {
      setOpen(false);
    }
    function onShellClick(ev: MouseEvent) {
      if (!wrapRef.current?.contains(ev.target as Node)) close();
    }
    document.addEventListener('mousedown', onShellClick);
    const iframeDoc = iframe?.contentDocument;
    iframeDoc?.addEventListener('mousedown', close);
    return () => {
      document.removeEventListener('mousedown', onShellClick);
      iframeDoc?.removeEventListener('mousedown', close);
    };
  }, [open, iframe]);

  const selected = projects.find((p) => p.id === selectedId) ?? projects[0] ?? null;

  async function handleAdd() {
    setBusy('picking');
    try {
      const path = await pickFolder();
      if (!path) {
        setBusy(null);
        return;
      }
      const name = suggestProjectName(path);
      const created = await addProject(name, path);
      onProjectsChanged();
      onSelect(created.id);
      setOpen(false);
    } catch (err) {
      console.error('[shell] add project failed', err);
      alert(`Failed to add project: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove(project: Project) {
    if (projects.length <= 1) {
      alert('Keep at least one project — add another first if you want to remove this one.');
      return;
    }
    if (!confirm(`Remove "${project.name}" from the project list?\n(The folder itself is not deleted.)`)) {
      return;
    }
    setBusy(`removing-${project.id}`);
    try {
      await removeProject(project.id);
      onProjectsChanged();
      // If we just removed the active one, switch to whatever comes first.
      if (project.id === selectedId) {
        const next = projects.find((p) => p.id !== project.id);
        if (next) onSelect(next.id);
      }
    } catch (err) {
      alert(`Failed to remove project: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleLaunch(project: Project, tool: 'claude' | 'codex' | 'shell') {
    setBusy(`launch-${project.id}-${tool}`);
    try {
      await launchInTerminal(project.root, tool);
      // Leave the menu open briefly so the user gets visual confirmation.
      setTimeout(() => setOpen(false), 600);
    } catch (err) {
      alert(`Failed to launch: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div ref={wrapRef} style={wrap}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={trigger}
        title={selected?.root ?? 'No project selected'}
      >
        <span style={icon}>📁</span>
        <span style={triggerText}>{selected?.name ?? 'No project'}</span>
        <span style={caret}>▾</span>
      </button>

      {open ? (
        <div style={menu}>
          <div style={menuHeader}>Projects</div>
          {projects.map((p) => {
            const active = p.id === (selectedId ?? selected?.id);
            return (
              <div key={p.id} style={projectRow}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(p.id);
                    setOpen(false);
                  }}
                  style={active ? projectMainActive : projectMain}
                  title={p.root}
                >
                  <span style={menuIcon}>{active ? '✓' : ''}</span>
                  <div style={projectMeta}>
                    <div style={projectName}>{p.name}</div>
                    <div style={projectPath}>{p.root}</div>
                  </div>
                </button>
                <div style={projectActions}>
                  <button
                    type="button"
                    onClick={() => handleLaunch(p, 'claude')}
                    style={iconBtn}
                    disabled={busy === `launch-${p.id}-claude`}
                    title="Open Terminal here and run `claude`"
                  >
                    {busy === `launch-${p.id}-claude` ? '…' : '🚀'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunch(p, 'codex')}
                    style={iconBtn}
                    disabled={busy === `launch-${p.id}-codex`}
                    title="Open Terminal here and run `codex`"
                  >
                    {busy === `launch-${p.id}-codex` ? '…' : '🤖'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunch(p, 'shell')}
                    style={iconBtn}
                    disabled={busy === `launch-${p.id}-shell`}
                    title="Open Terminal here (no command)"
                  >
                    {busy === `launch-${p.id}-shell` ? '…' : '⌨️'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(p)}
                    style={iconBtnDanger}
                    disabled={busy === `removing-${p.id}` || projects.length <= 1}
                    title={projects.length <= 1 ? 'Cannot remove the only project' : 'Remove from list'}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          <div style={menuDivider} />
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy === 'picking'}
            style={addBtn}
          >
            {busy === 'picking' ? 'Opening folder picker…' : '＋ Add project folder'}
          </button>
          <div style={menuFooter}>
            🚀 = Claude Code &nbsp;·&nbsp; 🤖 = Codex &nbsp;·&nbsp; ⌨️ = Plain shell
          </div>
        </div>
      ) : null}
    </div>
  );
}

const wrap: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};
const trigger: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  background: '#fff',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 13,
  color: '#0f172a',
  maxWidth: 320,
};
const icon: React.CSSProperties = { fontSize: 14 };
const triggerText: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 500,
};
const caret: React.CSSProperties = { color: '#94a3b8', fontSize: 11 };
const menu: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: 6,
  width: 460,
  background: '#fff',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  boxShadow: '0 12px 36px rgba(15,23,42,0.15)',
  zIndex: 100,
  padding: 6,
  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
};
const menuHeader: React.CSSProperties = {
  padding: '6px 8px 4px',
  fontSize: 10,
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: 0.6,
};
const projectRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 4,
  padding: '2px 0',
};
const projectMain: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 10px',
  border: 0,
  background: 'transparent',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: 6,
  font: 'inherit',
  color: '#0f172a',
  minWidth: 0,
};
const projectMainActive: React.CSSProperties = {
  ...projectMain,
  background: '#f1f5f9',
};
const menuIcon: React.CSSProperties = {
  width: 14,
  textAlign: 'center',
  color: '#16a34a',
  fontSize: 12,
  flex: '0 0 14px',
};
const projectMeta: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};
const projectName: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
const projectPath: React.CSSProperties = {
  fontSize: 10,
  color: '#94a3b8',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  marginTop: 2,
};
const projectActions: React.CSSProperties = {
  display: 'flex',
  gap: 2,
  padding: '0 6px',
  alignItems: 'center',
};
const iconBtn: React.CSSProperties = {
  border: '1px solid transparent',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 13,
  width: 28,
  height: 28,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  color: '#475569',
};
const iconBtnDanger: React.CSSProperties = {
  ...iconBtn,
  color: '#dc2626',
};
const menuDivider: React.CSSProperties = {
  height: 1,
  background: '#e2e8f0',
  margin: '6px 0',
};
const addBtn: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  cursor: 'pointer',
  borderRadius: 6,
  font: 'inherit',
  fontSize: 12,
  color: '#475569',
  textAlign: 'center',
};
const menuFooter: React.CSSProperties = {
  padding: '8px 8px 4px',
  fontSize: 10,
  color: '#94a3b8',
  textAlign: 'center',
};
