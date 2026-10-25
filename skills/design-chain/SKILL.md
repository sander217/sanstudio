---
name: design-chain
description: One entry point for the whole sanstudio design pipeline. Turns a design request plus evidence into research, a locked visual contract, meaningfully different directions, a hi-fi mockup and, when asked, a production design package, pausing for your decision at every gate.
when_to_use: Use when the user wants to design, redesign, critique or iterate on any interface (website, landing page, mobile app, dashboard, component or flow) and has not named a single gate. Triggers include "design this", "redesign", "make a mockup", "I need a landing page", "help me design", "幫我設計", "設計一個", "改一下這個 UI", a UI screenshot, a Figma link or a reference URL. Do not use for a one-line copy fix or a question that needs no design artifact.
metadata:
  version: 3.0.0
  suite: sanstudio
  role: orchestrator
---

# Design Chain

You run sanstudio as one pipeline. The user gives a need and whatever evidence they have. You pick the depth, run the gates in order, stop at each gate for their decision, and hand them artifacts they can keep. They never have to know the gate names.

Canonical entry: any design request. The user may prefix controls such as `lane: fast` or `research: provided`; see [references/control.md](references/control.md).

## 0. Resolve the installation

Locate the suite root: walk upward from this file to the directory whose `skills/` child holds `design-chain`, `research-synthesis`, `context-lock`, `direction-lock`, `design-lock` and `production-lock`. In the repository that is the repo root; in Claude Code it is `.claude/` or `~/.claude/`; in the marketplace package it is the `sanstudio/` folder. Every path written as `skills/<gate>/...` in a gate file resolves against that root. Never assume a user-specific path.

Resolve the user-owned inputs in the working directory, in this order:

1. `.sanstudio/`: a project contract folder (brand `DESIGN.md`, `TASTE.md` or `taste.yml`, `EXPERIENCE.md`, `qa-policy.yml`, `memory/`). When present, read [references/contracts.md](references/contracts.md) and announce `CONTRACT LOADED`. The contract's `DESIGN.md` becomes the base of the session `DESIGN.md`; its QA gates join Gate 3 and 4 checks; its accepted memory becomes prior decisions.
2. `TASTE.md` in the working directory, when `.sanstudio/` has no taste file: the user's brand taste. If neither exists, use `assets/TASTE.template.md` defaults and tell the user once that they can copy the template to `TASTE.md` to make the chain theirs.
3. Output root: `$SANSTUDIO_OUTPUT` if set, else `./sanstudio-output/`. Every artifact goes under `<output-root>/sessions/<YYYYMMDD-HHMM>-<slug>/` with `html/`, `figma/`, `docs/`, `research/` and `DESIGN.md`. Refresh `<output-root>/latest` to point at the current session. Never write artifacts into `skills/`.

Announce once:

```
DESIGN CHAIN READY
  contract: .sanstudio/ (<brand>[/<product>]) | none
  taste: .sanstudio/taste.yml | TASTE.md (user) | template defaults
  output: <output-root>/sessions/<slug>/
  lane: <fast|standard|major> (<reason>)
```

## 1. Classify and pick a lane

Read the request and evidence. Decide the lane with [references/lanes.md](references/lanes.md):

| Lane | When | Gates |
|---|---|---|
| fast | A bounded change to an existing screen, or an ITERATE on a prior session | G0 light, G1, G3 single direction |
| standard | A new screen or flow, or a redesign where the approach is open | G0, G1, G2, G3 |
| major | A new product surface, a multi-screen system, or anything engineering will build from | G0, G1, G2, G3, G4 |

The user can override with `lane:`. You may upgrade a lane after G0 or G1 when research shows the scope is larger than the request implied. Say so and continue. Never downgrade silently.

## 2. Run the gates

Read only the current gate's SKILL.md when you enter it. The previous gate's output is already in the conversation. Each gate ends with its handoff block, then you stop and wait (section 3).

### G0 Research, always

Invoke `research-synthesis` with the request and all supplied material. It decides its mode (Synthesize, Explore, Evaluate or Refresh). The minimum deliverable, even on the fast lane, answers: why does the user want this, what evidence supports the problem, what evidence supports any proposed solution, and what is unknown. It ends with a `---RESEARCH-LOCK---` block. Write the full report to `research/report.md`.

If the user passes `research: provided` with their own findings, run Evaluate on that material instead of starting from zero. There is no `research: skip`.

### G1 Context lock

Invoke `context-lock` with the research lock. Its key insight must cite at least one research finding by id. It emits the session `DESIGN.md` and the `---CONTEXT-LOCK---` block. Its `routed_to` is advisory; the lane decides.

### G2 Direction lock, standard and major

Invoke `direction-lock`. Three directions by default. They must differ in information architecture, interaction, composition or visual emphasis, never only in color. Each direction states which research finding it answers, what it optimizes, and its cost. One is recommended. The user may select, combine or reject.

### G3 Design lock

Invoke `design-lock` for the chosen direction (fast lane: the single inferred direction). It loads `DESIGN.md`, the craft rules, the user's taste and the reference library, produces hi-fi HTML with real content, runs the Hi-Fi Fill Checklist and `DESIGN.md` lint, and exports Figma JSON when a Figma tool is connected.

### G4 Production lock, major only

Invoke `production-lock`. It hardens the locked design into a buildable spec and reports an honest readiness scorecard.

## 3. Stop at every gate

After each handoff block, print the gate summary and wait. Accept exactly these replies, described in [references/control.md](references/control.md):

- `APPROVE`: continue to the next gate.
- `ITERATE <note>`: redo the current gate with the note. Stay in the gate.
- `BACK <gate>`: return to an earlier gate. Later artifacts become stale and are marked so.
- `STOP`: save a PARTIAL block and summarize what exists.

Do not continue on silence, on a question, or on a message that is not one of these. If the user's reply is ambiguous, ask which of the four they mean, in one line.

## 4. Tools and evidence gaps

Use whatever research and design tools the agent has: web search, image search, a browser, Mobbin or similar pattern libraries, a Figma MCP. When a tool is missing, record the gap in the artifact (`evidence gap: no image search, used Picsum seeds`) and continue. A missing optional tool never blocks a gate. This skill ships no scripts and makes no network calls of its own.

## 5. Deliver

At the end of the lane, list what exists and where:

| Artifact | Path |
|---|---|
| Research report | `research/report.md` |
| DESIGN.md | `DESIGN.md` |
| Direction wireframes (G2) | `html/directions/` |
| Hi-fi mockup (G3) | `html/` |
| Figma export (G3, when connected) | `figma/design-export.json` |
| Production package (G4) | `docs/` |
| Decision record | `docs/decisions.md` |

Then state remaining risks and evidence gaps in two or three lines. Do not describe the mockup as production code. Production code lives in the user's product repository, which this chain never writes.

## Rules

1. Research before context. G0 runs on every lane. A chain that skips it is wrong.
2. One stop per gate. The user decides; you do not pre-approve.
3. Lanes go up, never silently down.
4. Craft rules bind; taste is the user's. Load `skills/design-lock/references/craft-rules.md` as hard constraints. Load the user's `TASTE.md` as defaults they own.
4a. A project contract is exact. Values in `.sanstudio/DESIGN.md` and gates in `.sanstudio/qa-policy.yml` are used verbatim; the chain adds overrides on top and never edits the contract files. A contract value that collides with a craft ban is raised at G1 as a contract gap for the user to decide.
5. Evidence gaps are recorded, not papered over.
6. No em or en dashes in any user-facing copy, and no trailing punctuation in titles.
7. Match the user's language. Keep design terms in English.
