import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
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

export default defineConfig({
  plugins: [react(), sessionsPlugin()],
  server: {
    port: 5180,
    strictPort: true,
  },
});
