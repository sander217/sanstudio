// Polls the dev server's /sessions.json (served by the Vite middleware in
// vite.config.ts) and emits "latest session changed" events. v0 uses a 1.5s
// poll interval — cheap, simple, and the chattiness is bounded to a single
// localhost JSON request.
//
// In Layer 1 (daemon) this becomes a WebSocket subscription so updates are
// instant. The interface here stays the same so the React layer doesn't care.

import type { Dispatch, SetStateAction } from 'react';

export interface SessionEntry {
  slug: string;
  modifiedMs: number;
  htmlFiles: string[];
}

export interface SessionsManifest {
  root: string;
  sessions: SessionEntry[];
}

export interface SessionState {
  /** Newest session's slug, or null if no sessions exist yet. */
  latestSlug: string | null;
  /** Best-guess primary HTML file for the latest session (e.g. "index.html"). */
  latestHtml: string | null;
  /** All sessions, newest first. */
  all: SessionEntry[];
  /** Last successful poll timestamp (ms). */
  lastPolledMs: number;
  /** Last error if the most recent poll failed. */
  error: string | null;
}

export const EMPTY_SESSION_STATE: SessionState = {
  latestSlug: null,
  latestHtml: null,
  all: [],
  lastPolledMs: 0,
  error: null,
};

export function pickPrimaryHtml(files: string[]): string | null {
  if (files.length === 0) return null;
  // Preference order: index.html > home.html > first alphabetically.
  if (files.includes('index.html')) return 'index.html';
  if (files.includes('home.html')) return 'home.html';
  return [...files].sort()[0] ?? null;
}

function manifestToState(m: SessionsManifest, lastPolledMs: number): SessionState {
  const latest = m.sessions[0] ?? null;
  return {
    latestSlug: latest?.slug ?? null,
    latestHtml: latest ? pickPrimaryHtml(latest.htmlFiles) : null,
    all: m.sessions,
    lastPolledMs,
    error: null,
  };
}

export function startSessionPolling(
  setState: Dispatch<SetStateAction<SessionState>>,
  intervalMs = 1500,
): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastSlug: string | null = null;
  let lastHtml: string | null = null;
  let lastModified: number = 0;

  async function tick() {
    if (cancelled) return;
    try {
      const res = await fetch('/sessions.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const manifest = (await res.json()) as SessionsManifest;
      const next = manifestToState(manifest, Date.now());
      // Only churn React state if something actually changed — avoids
      // refreshing the iframe on every tick and clobbering the user's
      // current refine session.
      const changed =
        next.latestSlug !== lastSlug ||
        next.latestHtml !== lastHtml ||
        (next.all[0]?.modifiedMs ?? 0) !== lastModified;
      if (changed) {
        lastSlug = next.latestSlug;
        lastHtml = next.latestHtml;
        lastModified = next.all[0]?.modifiedMs ?? 0;
        setState(next);
      } else {
        // Update lastPolledMs only — mark we're alive without re-render.
        setState((prev) => ({ ...prev, lastPolledMs: next.lastPolledMs, error: null }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        lastPolledMs: Date.now(),
        error: err instanceof Error ? err.message : String(err),
      }));
    } finally {
      if (!cancelled) timer = setTimeout(tick, intervalMs);
    }
  }
  void tick();

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}

export function artifactUrl(slug: string, htmlFile: string): string {
  // Encoded so slugs with timestamps and dashes stay clean.
  return `/sessions/${encodeURIComponent(slug)}/html/${encodeURIComponent(htmlFile)}`;
}
