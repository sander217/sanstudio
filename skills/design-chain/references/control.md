# Control

The user steers the chain with a small vocabulary. Nothing else advances a gate.

## Prefix controls, at the start of a request

| Control | Effect |
|---|---|
| `lane: fast` / `standard` / `major` | Set the lane. Overrides classification. |
| `research: provided` | The user supplies findings. G0 runs Evaluate on them instead of Explore. G0 still runs. |
| `taste: none` | Ignore `TASTE.md` for this session. Craft rules still apply. |
| `output: <path>` | Use this output root for the session. |

## Gate replies, after a handoff block

| Reply | Effect |
|---|---|
| `APPROVE` | Lock this gate's output. Enter the next gate. |
| `ITERATE <note>` | Redo this gate with the note applied. Keep the gate's earlier output as a baseline for a before and after diff. |
| `BACK <gate>` | Return to `G0`, `G1`, `G2` or `G3`. Everything downstream is marked stale in `docs/decisions.md`. The returned gate reopens with its last output as a baseline. |
| `STOP` | Write a `---<GATE>-PARTIAL---` block and a summary of what exists. End. |

Accept lowercase and the Traditional Chinese equivalents: `確認` = APPROVE, `改` + note = ITERATE, `回到 G2` = BACK G2, `停` = STOP.

## What does not count

- Silence. Wait.
- A question. Answer it, then re-print the one-line prompt below.
- Praise or a comment with no verb. Ask which of the four they mean.
- A new request on a different topic. Treat as STOP, summarize, then start a new chain if they confirm.

## The prompt line

Print after every handoff block:

```
G<N> done. Reply APPROVE, ITERATE <note>, BACK G<n>, or STOP.
```

## Decision record

Append one line per decision to `docs/decisions.md`:

```
2026-10-24 14:02  G2  APPROVE  "B, with A's grouping"  by: user
```

Record ITERATE notes and BACK reasons verbatim. This file is what lets a later session (or a teammate) see why the design is what it is.
