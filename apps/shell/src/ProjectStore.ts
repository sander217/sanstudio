// Client wrapper around the /api/projects endpoints in vite.config.ts.
// Persists the user's currently-selected project ID in localStorage so the
// shell remembers which project they were viewing across reloads.

const SELECTED_KEY = 'shell.selectedProjectId';

export interface Project {
  id: string;
  name: string;
  root: string;
  sessionsRoot?: string;
  resolvedSessionsRoot: string;
}

export interface ProjectListResponse {
  projects: Project[];
}

export async function listProjects(signal?: AbortSignal): Promise<Project[]> {
  const res = await fetch('/api/projects', { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as ProjectListResponse;
  return json.projects;
}

export async function addProject(name: string, root: string): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, root }),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = (await res.json()) as { project: Project };
  return json.project;
}

export async function removeProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function pickFolder(): Promise<string | null> {
  const res = await fetch('/api/projects/pick-folder', { method: 'POST' });
  const json = (await res.json()) as { ok: boolean; path?: string; error?: string };
  if (!json.ok) {
    // Cancellation surfaces as ok:false + error:"cancelled" with HTTP 200.
    if (json.error === 'cancelled') return null;
    throw new Error(json.error ?? 'pick failed');
  }
  return json.path ?? null;
}

export async function launchInTerminal(
  root: string,
  tool: 'claude' | 'codex' | 'shell' = 'claude',
): Promise<void> {
  const res = await fetch('/api/projects/launch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ root, tool }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`launch failed: ${detail}`);
  }
}

export function readSelectedProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(SELECTED_KEY);
}

export function writeSelectedProjectId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id == null) window.localStorage.removeItem(SELECTED_KEY);
  else window.localStorage.setItem(SELECTED_KEY, id);
}

/** Best basename for a folder path — used as the default project name. */
export function suggestProjectName(rootPath: string): string {
  const trimmed = rootPath.replace(/\/$/, '');
  const parts = trimmed.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? rootPath;
}
