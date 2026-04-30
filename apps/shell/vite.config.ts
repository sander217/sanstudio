import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { existsSync, statSync, watch } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Output of Gate 3 lives outside the sanstudio repo (per CLAUDE.md):
//   /Users/sanderchen/Documents/Claude/Projects/sanstudio-ai-output/sessions/<slug>/
// Each <slug>/ has html/, figma/, docs/, session.json. The shell needs read-
// only HTTP access to html/ for the iframe, plus a quick way to know "what's
// the latest session?" — that's what /sessions.json provides.
const SESSIONS_ROOT = resolve(
  __dirname,
  '../../../sanstudio-ai-output/sessions',
);

// Sanstudio repo root — the cwd for spawned `claude` processes so the
// agent loads sanstudio's CLAUDE.md, skills/, design-systems/, etc.
const SANSTUDIO_ROOT = resolve(__dirname, '../..');

// Configurable via env so users can override (e.g. `CLAUDE_BIN=/opt/claude
// npm run dev`). Defaults to `claude` resolved on PATH.
const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude';

interface SessionEntry {
  slug: string;
  modifiedMs: number;
  htmlFiles: string[]; // relative to <slug>/html/
}

async function listSessions(): Promise<SessionEntry[]> {
  if (!existsSync(SESSIONS_ROOT)) return [];
  const slugs = await fs.readdir(SESSIONS_ROOT);
  const out: SessionEntry[] = [];
  for (const slug of slugs) {
    const slugDir = join(SESSIONS_ROOT, slug);
    let stat;
    try {
      stat = await fs.stat(slugDir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    const htmlDir = join(slugDir, 'html');
    let htmlFiles: string[] = [];
    if (existsSync(htmlDir)) {
      const entries = await fs.readdir(htmlDir);
      htmlFiles = entries.filter((f) => f.endsWith('.html'));
    }
    out.push({ slug, modifiedMs: stat.mtimeMs, htmlFiles });
  }
  out.sort((a, b) => b.modifiedMs - a.modifiedMs);
  return out;
}

// Vite middleware plugin: maps /sessions/* to the external sessions dir AND
// publishes a polling-friendly manifest at /sessions.json. We also try to
// upgrade the manifest to long-poll via a directory watcher when the
// platform supports it; clients fall back to plain polling otherwise.
function sessionsPlugin(): Plugin {
  return {
    name: 'sanstudio-shell-sessions',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        if (req.url === '/sessions.json' || req.url.startsWith('/sessions.json?')) {
          try {
            const sessions = await listSessions();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify({ root: SESSIONS_ROOT, sessions }));
          } catch (err) {
            res.statusCode = 500;
            res.end(String(err));
          }
          return;
        }

        if (req.url.startsWith('/sessions/')) {
          // /sessions/<slug>/html/<file>.html  →  SESSIONS_ROOT/<slug>/html/<file>.html
          const rel = decodeURIComponent(req.url.replace(/^\/sessions\//, ''));
          // basic traversal guard
          if (rel.includes('..')) {
            res.statusCode = 400;
            res.end('bad path');
            return;
          }
          const abs = join(SESSIONS_ROOT, rel);
          if (!existsSync(abs)) {
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
          // Critical: same-origin with the shell so refinetool's companion
          // can be injected via iframe.contentDocument.
          res.setHeader('Cache-Control', 'no-store');
          const buf = await fs.readFile(abs);
          res.end(buf);
          return;
        }

        next();
      });

      // Optional file watcher for HMR-style auto-reload. We don't actually
      // push to the client — the client polls /sessions.json — but watching
      // the dir gives us a place to log when new artifacts land.
      if (existsSync(SESSIONS_ROOT)) {
        try {
          watch(SESSIONS_ROOT, { recursive: true }, (event, name) => {
            if (name && name.endsWith('.html')) {
              server.config.logger.info(
                `[sanstudio-shell] artifact ${event}: ${name}`,
              );
            }
          });
        } catch {
          // recursive watch not supported on this platform — silently skip
        }
      } else {
        server.config.logger.warn(
          `[sanstudio-shell] sessions dir not found: ${SESSIONS_ROOT}\n` +
            '  shell will start, but iframe will be empty until Gate 3 emits an artifact.',
        );
      }
    },
  };
}

// Vite plugin: exposes Claude Code as a streaming HTTP endpoint so the
// shell can drive iterate / generation turns without leaving the browser.
//
// Endpoints:
//   GET  /api/claude/health
//        → { ok: true, version: "...", bin: "claude" } when `claude` is
//          executable; { ok: false, error } otherwise. Cached for the
//          lifetime of the dev server (one spawnSync at startup).
//
//   POST /api/claude/iterate
//        body: { prompt: string }
//        Spawns `${CLAUDE_BIN} --print` with cwd=sanstudio root and pipes
//        the prompt over stdin. Streams ND-JSON events back to the client:
//          { type: "started", at: epochMs }
//          { type: "stdout", chunk: string }    (one or more)
//          { type: "stderr", chunk: string }    (one or more)
//          { type: "done", code: number, durationMs }
//          { type: "error", message }           (only on spawn failure)
//        The client tees output and watches /sessions.json — the iframe
//        auto-reloads when claude writes a new artifact.
function claudeRunnerPlugin(): Plugin {
  // Probe once at startup. If the user installs claude later, they need to
  // restart `npm run dev` — that's an acceptable tradeoff for not paying a
  // shell-spawn cost on every health check.
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
          `[sanstudio-shell] claude bridge ready — ${health.version} (cwd: ${SANSTUDIO_ROOT})`,
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
          req.on('end', () => {
            let prompt = '';
            try {
              const parsed = JSON.parse(body || '{}') as { prompt?: string };
              prompt = parsed.prompt ?? '';
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
            writeEvent({ type: 'started', at: Date.now() });

            let proc: ChildProcessWithoutNullStreams;
            try {
              proc = spawn(CLAUDE_BIN, ['--print'], {
                cwd: SANSTUDIO_ROOT,
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

            // Client disconnect → kill the subprocess so we don't leak.
            req.on('close', () => {
              if (!proc.killed) proc.kill('SIGTERM');
            });

            // Pipe the prompt as stdin, then close.
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
  plugins: [react(), sessionsPlugin(), claudeRunnerPlugin()],
  server: {
    port: 5180,
    strictPort: true,
  },
});
