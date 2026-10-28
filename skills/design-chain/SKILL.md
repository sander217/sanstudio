---
name: design-chain
description: One entry point for the whole sanstudio design pipeline. Turns a design request plus evidence into research, a locked visual contract, meaningfully different directions, a hi-fi mockup and, when asked, a production design package, pausing for your decision at every gate.
when_to_use: Use when the user wants to design, redesign, critique or iterate on any interface (website, landing page, mobile app, dashboard, component or flow) and has not named a single gate. Triggers include "design this", "redesign", "make a mockup", "I need a landing page", "help me design", "幫我設計", "設計一個", "改一下這個 UI", a UI screenshot, a Figma link or a reference URL. Do not use for a one-line copy fix or a question that needs no design artifact.
metadata:
  version: 3.1.0
  suite: sanstudio
  role: orchestrator
---

# Design Chain

You run sanstudio as one pipeline. The user gives a need and whatever evidence they have. You pick the depth, run the gates in order, stop at each gate for their decision, and hand them artifacts they can keep. They never have to know the gate names.

Canonical entry: any design request. The user may prefix controls such as `lane: fast` or `research: provided`; see [references/control.md](references/control.md).

## 0. Resolve the installation

Locate the suite root: walk upward from this file to the directory whose `skills/` child holds `design-chain`, `research-synthesis`, `context-lock`, `direction-lock`, `design-lock` and `production-lock`. In the repository that is the repo root; in Claude Code it is `.claude/` or `~/.claude/`; in the marketplace package it is the `sanstudio/` folder. Every path written as `skills/<gate>/...` in a gate file resolves against that root. Never assume a user-specific path.

Resolve the user-owned inputs in the working directory, in this order:

0. `PRODUCT.md`: durable product truth (users, purpose, positioning, operating context, evidence on hand), at `.sanstudio/PRODUCT.md` or the working directory root. G0 reads it as supplied context and G1 fills user and goal from it instead of re-asking. Template: `assets/PRODUCT.template.md`.
1. `.sanstudio/`: a project contract folder (brand `DESIGN.md`, `TASTE.md` or `taste.yml`, `EXPERIENCE.md`, `qa-policy.yml`, `memory/`). When present, read [references/contracts.md](references/contracts.md) and announce `CONTRACT LOADED`. The contract's `DESIGN.md` becomes the base of the session `DESIGN.md`; its QA gates join Gate 3 and 4 checks; its accepted memory becomes prior decisions.
2. `TASTE.md` in the working directory, when `.sanstudio/` has no taste file: the user's brand taste. If neither exists, use `assets/TASTE.template.md` defaults and tell the user once that they can copy the template to `TASTE.md` to make the chain theirs.
3. Output root: `$SANSTUDIO_OUTPUT` if set, else `./sanstudio-output/`. Every artifact goes under `<output-root>/sessions/<YYYYMMDD-HHMM>-<slug>/` with `html/`, `figma/`, `docs/`, `research/` and `DESIGN.md`. Refresh `<output-root>/latest` to point at the current session. Never write artifacts into `skills/`.

Announce once:

```
DESIGN CHAIN READY
  contract: .sanstudio/ (<brand>[/<product>]) | none
  product: .sanstudio/PRODUCT.md | PRODUCT.md | none
  taste: .sanstudio/taste.yml | TASTE.md (user) | template defaults
  output: <output-root>/sessions/<slug>/
  lane: <fast|standard|major> (<reason>)
```

## 0.5 No request yet

When the user invokes the chain with no design request ("what next?", the bare
skill name), do not start a lane. Read the state and offer two or three next
steps, each one line with the exact words to type, then stop:

- No `PRODUCT.md` and no `.sanstudio/`: set up `PRODUCT.md` first (one short
  interview, three questions at most, confirmed facts only).
- The latest session's `docs/review.md` has open P0 or P1 items:
  `ITERATE polish` on that session.
- The latest session ended in a `-PARTIAL-` block: resume at that gate.
- A mockup or production screen exists that was never reviewed: `CRITIQUE <path>`.
- Otherwise: ask for the surface to design.

Never auto-run a suggestion.

## 1. Classify and pick a lane

Read the request and evidence. Decide the lane with [references/lanes.md](references/lanes.md):

| Lane | When | Gates |
|---|---|---|
| fast | A bounded change to an existing screen, or an ITERATE on a prior session | G0 light, G1, G3 single direction |
| standard | A new screen or flow, or a redesign where the approach is open | G0, G1, G2, G3 |
| major | A new product surface, a multi-screen system, or anything engineering will build from | G0, G1, G2, G3, G4 |

The user can override with `lane:`. You may upgrade a lane after G0 or G1 when research shows the scope is larger than the request implied. Say so and continue. Never downgrade silently.

G1 also sets two classifications every later gate reads, defined in [references/modes.md](references/modes.md):

- **Visitor mode** (Persuade, Operate, Read, Experience): what success looks like for the person on this surface. It sets the typography register, the color posture, what directions vary and what the first viewport must do.
- **Invention scope** (`extend`, `surface`, `world`): how much is open. `extend` never runs G2; `world` needs at least the standard lane. Refinement preserves; redesign replaces.

## 2. Run the gates

Read only the current gate's SKILL.md when you enter it. The previous gate's output is already in the conversation. Each gate ends with its handoff block, then you stop and wait (section 3).

### G0 Research, always

Invoke `research-synthesis` with the request and all supplied material. It decides its mode (Synthesize, Explore, Evaluate or Refresh). The minimum deliverable, even on the fast lane, answers: why does the user want this, what evidence supports the problem, what evidence supports any proposed solution, and what is unknown. It ends with a `---RESEARCH-LOCK---` block. Write the full report to `research/report.md`.

If the user passes `research: provided` with their own findings, run Evaluate on that material instead of starting from zero. There is no `research: skip`.

### G1 Context lock

Invoke `context-lock` with the research lock. Its key insight must cite at least one research finding by id. It emits the session `DESIGN.md` and the `---CONTEXT-LOCK---` block. Its `routed_to` is advisory; the lane decides.

### G2 Direction lock, standard and major

Invoke `direction-lock`. It first names the rut (the category default and its predictable opposite), builds a candidate pool from the audience's world and picks three by spread, not rank. The three must differ in information architecture, interaction, composition or visual emphasis, never only in color, and vary what the visitor mode allows. Each states which research finding it answers, what it optimizes, and its cost. One is recommended; the familiar version (the category's usual answer, done well) is offered as a quiet option. On lock it writes the six-block direction contract (`references/modes.md`) that G3 builds to.

### G3 Design lock

Invoke `design-lock` for the chosen direction (fast lane: the single inferred direction). It loads `DESIGN.md`, the craft rules, the user's taste and the reference library, produces hi-fi HTML with real content, runs the Anti-Slop Pass, Hi-Fi Fill Checklist and `DESIGN.md` lint, then a **fresh-eyes review** from rendered captures by a context that did not build it (`skills/design-lock/references/review.md`), and acts on its disposition before the user sees anything. It exports Figma JSON when a Figma tool is connected.

### G4 Production lock, major only

Invoke `production-lock`. It hardens the locked design into a buildable spec and reports an honest readiness scorecard.

## 3. Stop at every gate

After each handoff block, print the gate summary and wait. Accept exactly these replies, described in [references/control.md](references/control.md):

- `APPROVE`: continue to the next gate.
- `ITERATE <note>`: redo the current gate with the note. Stay in the gate. When the note starts with a refine verb (`polish`, `bolder`, `quieter`, `distill`, `harden`, `clarify`, `typeset`, `layout`, `colorize`, `motion`, `adapt`, `onboard`), follow its recipe in [references/refine.md](references/refine.md): scoped to the named target, no new primitives without asking.
- `BACK <gate>`: return to an earlier gate. Later artifacts become stale and are marked so.
- `STOP`: save a PARTIAL block and summarize what exists.

Do not continue on silence, on a question, or on a message that is not one of these. If the user's reply is ambiguous, ask which of the four they mean, in one line.

`REVIEW` at any gate with a rendered artifact runs the fresh-eyes review on demand. After G1 is approved and no `PRODUCT.md` exists, offer once to write `.sanstudio/PRODUCT.md` from the confirmed facts; write it only on a yes.

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
| Captures and review (G3) | `review/`, `docs/review.md` |
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
5a. The builder does not grade its own work. G3's review runs from rendered captures in a separate context when the agent can spawn one, and says DEGRADED when it cannot.
5b. Scope is sovereign on ITERATE. A refine verb touches only its target and adds no color, font or component without asking.
6. No em or en dashes in any user-facing copy, and no trailing punctuation in titles.
7. Match the user's language. Keep design terms in English.
