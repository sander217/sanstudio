import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { existsSync, statSync, watch } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Sanstudio repo root — the default cwd for spawned `claude` and the seed
// project on first boot.
const SANSTUDIO_ROOT = resolve(__dirname, '../..');

// Default sessions location for the seeded sanstudio project — sibling to
// the repo per CLAUDE.md.
const DEFAULT_SESSIONS_ROOT = resolve(SANSTUDIO_ROOT, '..', 'sanstudio-ai-output', 'sessions');

// Configurable via env so users can override (e.g. `CLAUDE_BIN=/opt/claude
// npm run dev`). Defaults to `claude` resolved on PATH.
const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude';

// Persistent project list — JSON at ~/.sanstudio/projects.json so it
// survives across sessions and works for both the dev server and the
// packaged .app launcher.
const PROJECTS_FILE = join(homedir(), '.sanstudio', 'projects.json');

interface Project {
  id: string;
  name: string;
  /** Absolute path to project root (Claude Code cwd). */
  root: string;
  /** Optional explicit override for sessions dir; auto-resolved when missing. */
  sessionsRoot?: string;
}

interface SessionEntry {
  slug: string;
  modifiedMs: number;
  htmlFiles: string[];
}

async function loadProjects(): Promise<Project[]> {
  try {
    const raw = await fs.readFile(PROJECTS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as { projects?: Project[] };
    return Array.isArray(parsed.projects) ? parsed.projects : [];
  } catch {
    return [];
  }
}

async function saveProjects(projects: Project[]): Promise<void> {
  await fs.mkdir(dirname(PROJECTS_FILE), { recursive: true });
  await fs.writeFile(PROJECTS_FILE, JSON.stringify({ projects }, null, 2));
}

async function ensureSeeded(): Promise<Project[]> {
  const existing = await loadProjects();
  if (existing.length > 0) return existing;
  const seed: Project = {
    id: 'sanstudio-default',
    name: 'Sanstudio',
    root: SANSTUDIO_ROOT,
    sessionsRoot: DEFAULT_SESSIONS_ROOT,
  };
  await saveProjects([seed]);
  return [seed];
}

/**
 * Given a project root, find where its sessions live. Tries (in order):
 *   1. Explicit `sessionsRoot` override on the project record
 *   2. Sibling `<root>/../sanstudio-ai-output/sessions` (sanstudio convention)
 *   3. Inside `<root>/sanstudio-ai-output/sessions`
 *   4. Inside `<root>/sessions`
 *   5. Fallback: the project root itself (loose mode — root contains html/ folders)
 */
function resolveSessionsRoot(project: Project): string {
  if (project.sessionsRoot && existsSync(project.sessionsRoot)) return project.sessionsRoot;
  const sibling = resolve(project.root, '..', 'sanstudio-ai-output', 'sessions');
  if (existsSync(sibling)) return sibling;
  const inside = join(project.root, 'sanstudio-ai-output', 'sessions');
  if (existsSync(inside)) return inside;
  const sessions = join(project.root, 'sessions');
  if (existsSync(sessions)) return sessions;
  return project.root;
}

async function listSessions(sessionsRoot: string): Promise<SessionEntry[]> {
  if (!existsSync(sessionsRoot)) return [];
  const slugs = await fs.readdir(sessionsRoot);
  const out: SessionEntry[] = [];
  for (const slug of slugs) {
    if (slug.startsWith('.')) continue;
    const slugDir = join(sessionsRoot, slug);
    let stat;
    try {
      stat = await fs.stat(slugDir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    // Prefer <slug>/html/*.html (sanstudio standard); fall back to <slug>/*.html
    let htmlFiles: string[] = [];
    const htmlDir = join(slugDir, 'html');
    if (existsSync(htmlDir)) {
      const entries = await fs.readdir(htmlDir);
      htmlFiles = entries.filter((f) => f.endsWith('.html'));
    } else {
      const entries = await fs.readdir(slugDir);
      htmlFiles = entries.filter((f) => f.endsWith('.html'));
    }
    if (htmlFiles.length === 0) continue;
    out.push({ slug, modifiedMs: stat.mtimeMs, htmlFiles });
  }
  out.sort((a, b) => b.modifiedMs - a.modifiedMs);
  return out;
}

/** Resolve session-relative path → absolute path with traversal guard. */
function safeJoin(root: string, rel: string): string | null {
  const abs = resolve(root, rel);
  const normalizedRoot = resolve(root) + '/';
  if (abs !== resolve(root) && !abs.startsWith(normalizedRoot)) return null;
  return abs;
}

/** Map slug+file → absolute path within the resolved sessions root. */
function resolveArtifactPath(sessionsRoot: string, rel: string): string | null {
  // rel looks like "<slug>/html/file.html" or "<slug>/file.html"
  const candidate = safeJoin(sessionsRoot, rel);
  if (!candidate) return null;
  if (existsSync(candidate)) return candidate;
  // If the standard html/ subdir is missing, also try the loose layout
  // (file directly inside slug dir) — useful for codex output etc.
  const parts = rel.split('/');
  if (parts.length >= 3 && parts[1] === 'html') {
    const loose = safeJoin(sessionsRoot, [parts[0], ...parts.slice(2)].join('/'));
    if (loose && existsSync(loose)) return loose;
  }
  return null;
}

async function getProjectById(id: string): Promise<Project | null> {
  const all = await loadProjects();
  return all.find((p) => p.id === id) ?? null;
}

/** Pull `?project=<id>` from a request URL. */
function projectIdFromUrl(url: string): string | null {
  const idx = url.indexOf('?');
  if (idx === -1) return null;
  const params = new URLSearchParams(url.slice(idx + 1));
  return params.get('project');
}

async function readJsonBody(req: { on: (e: string, h: (...args: unknown[]) => void) => void }): Promise<unknown> {
  return new Promise((resolveBody, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += (chunk as Buffer).toString('utf8');
    });
    req.on('end', () => {
      if (!body) return resolveBody({});
      try {
        resolveBody(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function shellQuote(s: string): string {
  // Single-quote-safe AppleScript string: escape any embedded double quotes
  // and backslashes for the inner shell command.
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Open Terminal.app at <root>, optionally running a command. */
function openTerminalAt(root: string, command?: string): { ok: true } | { ok: false; error: string } {
  const inner = command ? `cd "${shellQuote(root)}" && ${command}` : `cd "${shellQuote(root)}"`;
  // AppleScript: tell Terminal to do script + activate window.
  const script =
    `tell application "Terminal"\n` +
    `  do script "${inner.replace(/"/g, '\\"')}"\n` +
    `  activate\n` +
    `end tell`;
  const result = spawnSync('osascript', ['-e', script], { encoding: 'utf8' });
  if (result.status !== 0) {
    return { ok: false, error: result.stderr.trim() || `osascript exited ${result.status}` };
  }
  return { ok: true };
}

/** Open the native macOS folder picker, return absolute POSIX path. */
function pickFolderNative(): { ok: true; path: string } | { ok: false; error: string } {
  const script =
    `try\n` +
    `  set folderPath to choose folder with prompt "Pick a project folder for Sanstudio"\n` +
    `  return POSIX path of folderPath\n` +
    `on error errMsg number errNum\n` +
    `  if errNum is -128 then return ""\n` +
    `  error errMsg number errNum\n` +
    `end try`;
  const result = spawnSync('osascript', ['-e', script], { encoding: 'utf8' });
  if (result.status !== 0) {
    return { ok: false, error: result.stderr.trim() || `osascript exited ${result.status}` };
  }
  const path = result.stdout.trim().replace(/\/$/, '');
  if (!path) return { ok: false, error: 'cancelled' };
  return { ok: true, path };
}

// Vite middleware plugin: maps /sessions/* to the resolved sessions root for
// the requested project AND publishes a polling-friendly manifest at
// /sessions.json. Both endpoints accept ?project=<id>.
function sessionsPlugin(): Plugin {
  return {
    name: 'sanstudio-shell-sessions',
    async configureServer(server) {
      // Seed the default project on first boot so the shell isn't empty.
      const seeded = await ensureSeeded();
      server.config.logger.info(
        `[sanstudio-shell] ${seeded.length} project(s) registered (config: ${PROJECTS_FILE})`,
      );

      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        if (req.url === '/sessions.json' || req.url.startsWith('/sessions.json?')) {
          try {
            const projectId = projectIdFromUrl(req.url);
            const projects = await loadProjects();
            // Default to the first project when none specified — keeps the
            // legacy single-project flow working out of the box.
            const project = projectId ? projects.find((p) => p.id === projectId) : projects[0];
            if (!project) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'no projects configured' }));
              return;
            }
            const sessionsRoot = resolveSessionsRoot(project);
            const sessions = await listSessions(sessionsRoot);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store');
            res.end(
              JSON.stringify({
                project: { id: project.id, name: project.name, root: project.root },
                sessionsRoot,
                sessions,
              }),
            );
          } catch (err) {
            res.statusCode = 500;
            res.end(String(err));
          }
          return;
        }

        if (req.url.startsWith('/sessions/')) {
          const projectId = projectIdFromUrl(req.url);
          const projects = await loadProjects();
          const project = projectId ? projects.find((p) => p.id === projectId) : projects[0];
          if (!project) {
            res.statusCode = 404;
            res.end('no project');
            return;
          }
          const sessionsRoot = resolveSessionsRoot(project);
          // Strip query string before extracting the path
          const pathOnly = req.url.split('?')[0];
          const rel = decodeURIComponent(pathOnly.replace(/^\/sessions\//, ''));
          if (rel.includes('..')) {
            res.statusCode = 400;
            res.end('bad path');
            return;
          }
          const abs = resolveArtifactPath(sessionsRoot, rel);
          if (!abs) {
            res.statusCode = 404;
            res.end('session file not found: ' + rel);
            return;
          }
          if (statSync(abs).isDirectory()) {
            res.statusCode = 403;
            res.end('directory listing disabled');
            return;
          }
          const ext = abs.split('.').pop()?.toLowerCase() ?? '';
          const mime =
            ext === 'html'
              ? 'text/html; charset=utf-8'
              : ext === 'css'
                ? 'text/css'
                : ext === 'js'
                  ? 'application/javascript'
                  : ext === 'json'
                    ? 'application/json'
                    : 'application/octet-stream';
          res.setHeader('Content-Type', mime);
          res.setHeader('Cache-Control', 'no-store');
          const buf = await fs.readFile(abs);
          res.end(buf);
          return;
        }

        next();
      });

      // Watch every known sessions root once, log when artifacts land.
      // Watchers are best-effort — sessions roots that don't yet exist
      // get re-checked on each /sessions.json poll anyway.
      for (const project of seeded) {
        const root = resolveSessionsRoot(project);
        if (!existsSync(root)) continue;
        try {
          watch(root, { recursive: true }, (event, name) => {
            if (name && name.endsWith('.html')) {
              server.config.logger.info(
                `[sanstudio-shell] [${project.name}] artifact ${event}: ${name}`,
              );
            }
          });
        } catch {
          // recursive watch unsupported on this platform — skip silently
        }
      }
    },
  };
}

// Vite plugin: project CRUD + native folder picker + Terminal launcher.
function projectsPlugin(): Plugin {
  return {
    name: 'sanstudio-shell-projects',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();
        const path = req.url.split('?')[0];

        if (path === '/api/projects' && req.method === 'GET') {
          const projects = await loadProjects();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          // Decorate with resolved sessions root so the picker can show
          // "found N sessions" or "empty" indicators without an extra trip.
          const decorated = projects.map((p) => ({
            ...p,
            resolvedSessionsRoot: resolveSessionsRoot(p),
          }));
          res.end(JSON.stringify({ projects: decorated }));
          return;
        }

        if (path === '/api/projects' && req.method === 'POST') {
          try {
            const body = (await readJsonBody(req)) as Partial<Project>;
            if (!body.name || !body.root) {
              res.statusCode = 400;
              res.end('name and root required');
              return;
            }
            if (!existsSync(body.root)) {
              res.statusCode = 400;
              res.end('root does not exist: ' + body.root);
              return;
            }
            const projects = await loadProjects();
            // Dedupe by absolute root — switching to existing project rather
            // than creating a duplicate is the right behavior here.
            const existing = projects.find((p) => resolve(p.root) === resolve(body.root!));
            if (existing) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ project: existing, deduped: true }));
              return;
            }
            const id = `proj_${randomBytes(6).toString('hex')}`;
            const project: Project = {
              id,
              name: body.name,
              root: resolve(body.root),
              ...(body.sessionsRoot ? { sessionsRoot: resolve(body.sessionsRoot) } : {}),
            };
            await saveProjects([...projects, project]);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ project }));
          } catch (err) {
            res.statusCode = 500;
            res.end(String(err));
          }
          return;
        }

        const deleteMatch = path.match(/^\/api\/projects\/([^/]+)$/);
        if (deleteMatch && req.method === 'DELETE') {
          const id = deleteMatch[1];
          const projects = await loadProjects();
          const next = projects.filter((p) => p.id !== id);
          if (next.length === projects.length) {
            res.statusCode = 404;
            res.end('project not found');
            return;
          }
          await saveProjects(next);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        if (path === '/api/projects/pick-folder' && req.method === 'POST') {
          const result = pickFolderNative();
          res.setHeader('Content-Type', 'application/json');
          if (!result.ok) {
            res.statusCode = result.error === 'cancelled' ? 200 : 500;
            res.end(JSON.stringify(result));
            return;
          }
          res.end(JSON.stringify(result));
          return;
        }

        if (path === '/api/projects/launch' && req.method === 'POST') {
          try {
            const body = (await readJsonBody(req)) as { root?: string; tool?: string };
            if (!body.root) {
              res.statusCode = 400;
              res.end('root required');
              return;
            }
            if (!existsSync(body.root)) {
              res.statusCode = 400;
              res.end('root does not exist');
              return;
            }
            // Whitelisted tool commands — never interpolate user-supplied
            // strings into the shell. The resolved binary names are short
            // and well-known.
            const tool = body.tool ?? 'claude';
            const command =
              tool === 'claude'
                ? CLAUDE_BIN
                : tool === 'codex'
                  ? 'codex'
                  : tool === 'shell'
                    ? undefined
                    : null;
            if (command === null) {
              res.statusCode = 400;
              res.end('unknown tool: ' + tool);
              return;
            }
            const result = openTerminalAt(body.root, command);
            res.setHeader('Content-Type', 'application/json');
            if (!result.ok) {
              res.statusCode = 500;
              res.end(JSON.stringify(result));
              return;
            }
            res.end(JSON.stringify({ ok: true, tool, root: body.root }));
          } catch (err) {
            res.statusCode = 500;
            res.end(String(err));
          }
          return;
        }

        next();
      });
    },
  };
}

// Vite plugin: exposes Claude Code as a streaming HTTP endpoint so the
// shell can drive iterate / generation turns without leaving the browser.
function claudeRunnerPlugin(): Plugin {
  let health: { ok: true; version: string; bin: string } | { ok: false; error: string };
  try {
    const probe = spawnSync(CLAUDE_BIN, ['--version'], { encoding: 'utf8' });
    if (probe.error) throw probe.error;
    if (probe.status !== 0) {
      throw new Error(`${CLAUDE_BIN} --version exited ${probe.status}: ${probe.stderr.trim()}`);
    }
    health = { ok: true, version: probe.stdout.trim(), bin: CLAUDE_BIN };
  } catch (err) {
    health = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return {
    name: 'sanstudio-shell-claude-runner',
    configureServer(server) {
      if (health.ok) {
        server.config.logger.info(
          `[sanstudio-shell] claude bridge ready — ${health.version}`,
        );
      } else {
        server.config.logger.warn(
          `[sanstudio-shell] claude not available — Send buttons will fall back to clipboard.\n` +
            `  reason: ${health.error}\n` +
            `  fix: install Claude Code (https://docs.claude.com/claude-code) or set CLAUDE_BIN.`,
        );
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        if (req.url === '/api/claude/health') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify({ ...health, sanstudioRoot: SANSTUDIO_ROOT }));
          return;
        }

        if (req.url === '/api/claude/iterate' && req.method === 'POST') {
          if (!health.ok) {
            res.statusCode = 503;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'claude not available', detail: health.error }));
            return;
          }

          let body = '';
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString('utf8');
          });
          req.on('end', async () => {
            let prompt = '';
            let cwd = SANSTUDIO_ROOT;
            try {
              const parsed = JSON.parse(body || '{}') as { prompt?: string; projectId?: string };
              prompt = parsed.prompt ?? '';
              if (parsed.projectId) {
                const project = await getProjectById(parsed.projectId);
                if (project) cwd = project.root;
              }
            } catch {
              res.statusCode = 400;
              res.end('invalid json body');
              return;
            }
            if (!prompt.trim()) {
              res.statusCode = 400;
              res.end('missing prompt');
              return;
            }

            res.setHeader('Content-Type', 'application/x-ndjson');
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('X-Accel-Buffering', 'no');
            const writeEvent = (event: object): void => {
              res.write(JSON.stringify(event) + '\n');
            };
            writeEvent({ type: 'started', at: Date.now(), cwd });

            let proc: ChildProcessWithoutNullStreams;
            try {
              proc = spawn(CLAUDE_BIN, ['--print'], {
                cwd,
                stdio: ['pipe', 'pipe', 'pipe'],
              }) as ChildProcessWithoutNullStreams;
            } catch (err) {
              writeEvent({
                type: 'error',
                message: err instanceof Error ? err.message : 'spawn failed',
              });
              res.end();
              return;
            }

            const startedAt = Date.now();
            proc.stdout.on('data', (chunk: Buffer) => {
              writeEvent({ type: 'stdout', chunk: chunk.toString('utf8') });
            });
            proc.stderr.on('data', (chunk: Buffer) => {
              writeEvent({ type: 'stderr', chunk: chunk.toString('utf8') });
            });
            proc.on('error', (err) => {
              writeEvent({ type: 'error', message: err.message });
              res.end();
            });
            proc.on('close', (code) => {
              writeEvent({
                type: 'done',
                code: code ?? -1,
                durationMs: Date.now() - startedAt,
              });
              res.end();
            });

            req.on('close', () => {
              if (!proc.killed) proc.kill('SIGTERM');
            });

            proc.stdin.write(prompt);
            proc.stdin.end();
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), sessionsPlugin(), projectsPlugin(), claudeRunnerPlugin()],
  server: {
    port: 5180,
    strictPort: true,
  },
});
