# Agensi listing

The fields as submitted for review on 2026-10-28 (draft
471344ee-c98e-4c31-995d-b5cb56dd8a04, pack v3.1.0, free). Update this file
whenever the live listing changes, so the repo and the listing stay in step.
Lengths are checked by `scripts/package-agensi.sh --check`.

## Name (60 characters max)

sanstudio Design Chain

## Summary (300 characters max)

A gated design pipeline for your agent: research why the change is wanted, lock a visual contract, compare three real directions, build a hi-fi HTML mockup reviewed by a fresh context, and hand off a production package. You approve every gate.

## Pricing

Free. Converting to paid later needs a connected payout method and a
confirmation on Agensi; past installs are never charged.

## Categories (up to 3, first is primary)

Branding & Design, Research & Analysis, Frontend & Web Apps

## Tags

branding, web-design, research, ux-research, design-system, ui-design, figma,
design-review

## Description

The first paragraph is plain text on purpose: Agensi shows it as the listing
header, and markdown there renders raw.

A design pipeline for your agent that researches before it designs, offers three real directions, reviews its own mockup with fresh eyes, and waits for your approval at every gate.

**What it does.** Six skills that turn a design request into artifacts you can keep: a research report, a session `DESIGN.md` with tokens and rules, three directions that differ in structure (not color), a hi-fi HTML mockup with real content, a review with heuristic scores and P0 to P3 issues, Figma JSON, and on the major lane a production package with states, components and a readiness scorecard.

**How it works.** `design-chain` picks a lane (fast, standard, major), a visitor mode (Persuade, Operate, Read, Experience) and an invention scope, then runs the gates in order. Research always comes first. Directions refuse the category's default page. Gate 3 is checked against 50+ craft rules (no dots in chips, no gradient text, generous spacing, chosen fonts) and then reviewed from rendered captures by a context that did not build it. After every gate you reply APPROVE, ITERATE, BACK or STOP; refine verbs such as `bolder`, `quieter` and `distill` give scoped passes.

| Gate | Skill | Output |
|---|---|---|
| entry | design-chain | lane, mode, gate control |
| G0 | research-synthesis | research report with findings and gaps |
| G1 | context-lock | session DESIGN.md (tokens and rules) |
| G2 | direction-lock | three directions and a direction contract |
| G3 | design-lock | hi-fi HTML, captures, review, Figma JSON |
| G4 | production-lock | states, components, handoff, readiness scorecard |

**Where it stops.** It designs; it does not write your product code or merge anything. Mockups are proposals, not shipped UI. It uses the tools your agent already has (search, browser, Figma MCP) and records any missing tool as an evidence gap instead of faking it. Your brand stays yours: a `TASTE.md`, `PRODUCT.md` or `.sanstudio/` contract in your project overrides its defaults.

**Credits.** Original pipeline and rules, with a few ideas adapted in new wording from impeccable (Apache 2.0), design.md (Apache 2.0), hallmark (MIT) and taste-skill (MIT). Full credits and licence texts ship in `NOTICE.md` and `licenses/`.

## See it in action

Keep file paths out of the result text: Agensi turns any filename it finds into
a generated "example file from a real run" card, which this demo is not.

### Request

```text
lane: standard
Our budgeting app's transaction list feels cluttered. Users say they can't find last week's coffee. Screenshot attached. Keep the tab bar. iOS first.
```

### Result

_Illustrative session, abridged. The chain stops after every gate; each block below is one stop, and the user's reply is shown in italics._

```
DESIGN CHAIN READY
  contract: none   product: none   taste: user taste file
  lane: standard (redesign of one screen, approach open)
```

#### G0 Research

| Id | Finding | Confidence |
|---|---|---|
| C1 | Users report trouble finding one past payment | problem: supported (2 quotes); cause: plausible |
| C2 | The list is flat reverse-chronological with no grouping | observed in screenshot |
| Gap | Are people searching for one payment or scanning a week? | decides the direction |

G0 done. Reply APPROVE, ITERATE, BACK or STOP. _APPROVE_

#### G1 Context lock

- Visitor mode: **Operate**. Invention scope: **surface** (existing app look kept).
- Category default to refuse: a flat dated list with category color chips.
- Tokens extracted from the screenshot into the design contract: real hex values, SF Pro, 16px gutters.
- One question: is search already in the app? _"No, add it if it helps."_ _APPROVE_

#### G2 Three directions

| | Direction | Answers | Differs on |
|---|---|---|---|
| A | Day headers with a fact row per day (count, total) | C1 | information architecture |
| B | Grouped by merchant, last visit on top | C1, gap | information architecture |
| C | Search-first, list as results | gap | interaction |

Recommended: A. The familiar version is offered as a quiet option. _"B, with A's day headers."_ The direction contract (idea, look, journey, first screen, signature move, done when) is written to the brief.

#### G3 Hi-fi and review

- A hi-fi HTML mockup in a phone frame, real merchants and amounts, no dots in chips, no bordered cards.
- Anti-slop pass: clean. Captures taken at 390 x 844.
- Independent review: heuristics 29/40; persona walk as a one-thumb commuter and a screen-reader user; **one P1**: no empty state for a merchant with no visits this month. Fixed before the user saw the screen. Disposition: ship.
- Figma export JSON written to the session folder.

_ITERATE quieter_ tones down the merchant category colors without touching layout, then the review re-runs on the changed area.

**Next steps:** APPROVE to finish, or take it to G4 for a production package (all states, components, handoff).

## Compatibility note

Six SKILL.md folders, one pack. Built for Claude Code; works in any agent that loads SKILL.md folders. Best with web search, image search, a browser tool and subagents; a Figma MCP is optional. No scripts, no network calls of its own.

## Use cases

- Convert raw user feedback into evidence-backed design directions.
- Generate high-fidelity HTML mockups governed by strict visual contracts.
- Automate the creation of production handoff packages with state matrices.
- Turn a screenshot, Figma link or reference URL into a locked DESIGN.md visual contract.
- Enforce professional craft rules and brand taste across all UI outputs.

## Permissions

Tools used: Read Files, Write Files, Browser, Network Access.

Required tools and software:

```text
Optional: web search and image search
Optional: a browser tool (renders captures for the review)
Optional: subagents (independent review)
Optional: Figma MCP (direct export)
```

Notes: Read and write files: the chain reads your TASTE.md, PRODUCT.md and .sanstudio/ folder, and writes its artifacts (research report, DESIGN.md, HTML mockups, review, Figma JSON) to ./sanstudio-output/ in your project. Network: only through your agent's own web and image search during research and image sourcing; the pack ships no scripts and makes no network calls itself. Browser: renders the mockup to capture screenshots for the review. It never writes your product code.

## Known limitations

Designs, does not code: mockups are HTML proposals, never your product code, and it never edits your repository. It stops at every gate and waits for your reply, so it is not a one-shot generator. Output quality depends on the tools your agent has; a missing tool (image search, browser, subagents) is recorded as an evidence gap rather than faked. Gate 4 produces a buildable design spec with an honest readiness scorecard, not shippable code.

## FAQ

**What problem does it solve?**
Agents jump straight to a pretty screen that looks like every other AI screen and ignores why the change was asked for. The chain researches the reason first, locks your visual contract, offers three directions that differ in structure, and has a separate context review the result before you see it. You decide at every step.

**Which agents does it work with?**
Any agent that loads SKILL.md folders; it is built for Claude Code. It needs no MCP server. It works best when the agent has web search, image search, a browser tool and subagents. A Figma MCP is optional and only used to push the mockup into Figma.

**Can I use my own brand or design system?**
Yes. Put a TASTE.md in your project for colors, type and rules, a PRODUCT.md for durable product facts, or a whole design system in a .sanstudio/ folder (DESIGN.md, QA gates, accepted decisions). Contract values are used exactly; the chain only adds overrides for the current request, and raises any clash with its craft rules for you to decide.

**What is in the pack?**
Six skills (design-chain, research-synthesis, context-lock, direction-lock, design-lock, production-lock) with their reference files: the DESIGN.md format, 50+ numbered craft rules, the review protocol, refine verbs, mobile app patterns, a Figma export schema, and TASTE and PRODUCT templates. Text only; no scripts.

**Does it work with Figma?**
If your agent has a Figma MCP connected, Gate 3 pushes the mockup into Figma directly. Without one, it writes figma/design-export.json in the session folder. Gate 1 can also read a Figma link you give it as a reference. No Figma credentials are stored in the pack.

## Still to add after approval

- Logo, 512 x 512.
- Up to 6 screenshots from a real session (gate prompt and CONTEXT-LOCK block, three directions, hi-fi mockup, review summary, a before and after, the readiness scorecard). Own sessions only.
- Replace the illustrative demo with a real session once the chain has been run end to end.
