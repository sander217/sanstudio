# sanstudio

A design pipeline for AI agents. One request goes in. Research, a locked visual contract, three meaningfully different directions, a hi-fi mockup and, when you ask for it, a production design package come out. You decide at every gate.

Works in Claude Code and any agent that loads `SKILL.md` folders. Ships no scripts and makes no network calls of its own; it uses whatever search, image and Figma tools your agent already has.

## What you get

| Gate | Skill | Answers | Artifact |
|---|---|---|---|
| G0 | research-synthesis | Why does the user want this, what does the evidence support, what is unknown | `research/report.md` |
| G1 | context-lock | Who it is for, which surface, which colors and fonts | `DESIGN.md` |
| G2 | direction-lock | Three ways to solve it, each tied to a finding | `html/directions/` |
| G3 | design-lock | What the chosen way looks like, real content, lint passed | `html/`, `figma/design-export.json` |
| G4 | production-lock | What engineering needs to build it | `docs/` |

`design-chain` is the entry point. It picks a lane (fast, standard or major), runs the gates, and stops after each one for `APPROVE`, `ITERATE <note>`, `BACK G<n>` or `STOP`.

## Install

Copy the six folders under `skills/` into your agent's `skills/` directory (Claude Code: `.claude/skills/` in the project or `~/.claude/skills/`), or install the Agensi bundle. The gates reference each other as `skills/<name>/...`, so the parent folder must be named `skills`. Keep each folder's `references/` and `assets/` intact.

Then, in your project root (both optional, both recommended):

```bash
cp <skills>/design-chain/assets/TASTE.template.md ./TASTE.md
```

```bash
mkdir -p .sanstudio && cp <skills>/design-chain/assets/PRODUCT.template.md ./.sanstudio/PRODUCT.md
```

Edit `TASTE.md` with your brand's colors, type and Do's and Don'ts. It is yours; the chain loads it as defaults in every session. `PRODUCT.md` holds durable product truth (users, purpose, positioning, evidence on hand) so sessions stop re-asking it.

## Use

Write the request the way you would brief a designer. Attach what you have: a screenshot, a ticket, a competitor URL, a paragraph of context.

```text
lane: standard
The transaction list in our budgeting app feels cluttered. Users say they
cannot find last week's coffee. Screenshot attached. Keep the tab bar.
```

The chain researches first, then asks at most two questions, then shows a `DESIGN.md`. Reply `APPROVE`. It shows three directions. Reply `APPROVE` or `B, with A's grouping`. It builds the hi-fi mockup. Reply `ITERATE make the balance larger` or `APPROVE`. Everything lands in `./sanstudio-output/latest/`.

Prefix controls: `lane: fast|standard|major`, `research: provided`, `taste: none`, `output: <path>`.

Refine verbs give scoped passes at Gate 3: `ITERATE polish|bolder|quieter|distill|harden|clarify|typeset|layout|colorize|motion|adapt|onboard [target]`. Each touches only its target and adds no new color, font or component without asking. `REVIEW` runs the fresh-eyes review on demand.

## How it avoids the same page every time

- **Visitor mode** (Persuade, Operate, Read, Experience) sets the ambition: a landing page commits to a point of view, a dashboard commits to precision and one signature move.
- **The rut.** Gate 2 names the page the category always ships and its predictable opposite, refuses both, and picks three directions from a candidate pool by spread rather than rank.
- **Direction contract.** Six short blocks (thesis, own world, story, first viewport, signature move, finish) that Gate 3 builds to.
- **Fresh-eyes review.** Gate 3's result is captured in a browser and reviewed by a context that did not build it: specificity, Nielsen heuristics, persona walks, P0 to P3 issues, and a ship, fix, rebuild or recapture disposition.

## What binds and what is yours

- `skills/design-lock/references/craft-rules.md` holds brand-independent rules with ids, for example `UI-PILL-001` (no dots inside chips) and `UI-STROKE-001` (no bordered cards). They apply to every brand. Exceptions need your words and are recorded in `docs/decisions.md`.
- `TASTE.md` is your brand. The session `DESIGN.md` can override its tokens; craft rules override both.

## Figma

With a Figma MCP connected, Gate 3 pushes the mockup directly. Without one it writes `figma/design-export.json` in the session folder, following `skills/design-lock/figma-schema-v0.2.md`.

## Repository layout for maintainers

```text
skills/            the product; see CLAUDE.md for the gate map
TASTE.md           the maintainer's own taste, not shipped
design-systems/    73 imported DESIGN.md references (Apache 2.0 and MIT), not shipped
figma-plugin/      optional local bridge for maintainers, not shipped
packaging/agensi/  pack README, NOTICE and listing draft for the marketplace
scripts/package-agensi.sh   builds dist/sanstudio-pack-v<version>.zip and runs the Agensi checks
```

## License

Commercial. See `LICENSE`. The files under `design-systems/` keep their upstream licenses, see `design-systems/NOTICE.md`.
