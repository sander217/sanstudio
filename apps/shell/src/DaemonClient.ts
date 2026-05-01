// Talks to the Vite-side claudeRunner plugin (vite.config.ts).
//
// Exposes:
//   getHealth()       — one-shot health check, used at boot to decide
//                       whether to show "Send" or "Copy" buttons.
//   runIterate(args)  — POSTs the prompt and returns an async iterable of
//                       events streamed back as ND-JSON. Caller renders the
//                       events (status / stdout / stderr / done) however
//                       they want — the iframe will auto-reload separately
//                       once Claude writes new artifact files.
//
// No WebSocket, no reconnect logic, no daemon lifecycle. The "daemon" lives
// inside the Vite dev server, so it's up iff `npm run dev` is running.

export type DaemonHealth =
  | { ok: true; version: string; bin: string; sanstudioRoot: string }
  | { ok: false; error: string };

export type RunEvent =
  | { type: 'started'; at: number }
  | { type: 'stdout'; chunk: string }
  | { type: 'stderr'; chunk: string }
  | { type: 'done'; code: number; durationMs: number }
  | { type: 'error'; message: string };

export async function getHealth(signal?: AbortSignal): Promise<DaemonHealth> {
  try {
    const res = await fetch('/api/claude/health', { signal });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return (await res.json()) as DaemonHealth;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export interface RunIterateOptions {
  prompt: string;
  signal?: AbortSignal;
}

export async function* runIterate(opts: RunIterateOptions): AsyncGenerator<RunEvent> {
  const res = await fetch('/api/claude/iterate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: opts.prompt }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) {
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    yield {
      type: 'error',
      message: `iterate request failed (HTTP ${res.status}): ${detail}`,
    };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // ND-JSON: emit one event per newline, keep partial in buffer.
    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line) as RunEvent;
        yield event;
      } catch (err) {
        console.warn('[shell] daemon emitted non-JSON line', line, err);
      }
    }
  }
  // Flush any trailing event without newline (rare — server always
  // newline-terminates, but be lenient).
  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer) as RunEvent;
    } catch {
      // ignore
    }
  }
}
