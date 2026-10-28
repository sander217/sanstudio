# Agensi listing draft

Fields as the Agensi submit form asks for them. Lengths are checked by
`scripts/package-agensi.sh --check`.

## Name (60 characters max)

sanstudio Design Chain

## Summary (300 characters max)

A gated design pipeline for your agent: research why the change is wanted, lock a visual contract, compare three real directions, build a hi-fi HTML mockup reviewed by a fresh context, and hand off a production package. You approve every gate.

## Categories (up to 3)

Design, UI/UX, Product

## Description

**What it does.** Six skills that turn a design request into artifacts you can
keep: a research report, a session `DESIGN.md` with tokens and rules, three
directions that differ in structure (not color), a hi-fi HTML mockup with real
content, a review with heuristic scores and P0 to P3 issues, Figma JSON, and on
the major lane a production package with states, components and a readiness
scorecard.

**How it works.** `design-chain` picks a lane (fast, standard, major), a visitor
mode (Persuade, Operate, Read, Experience) and an invention scope, then runs the
gates in order. Research always comes first. Directions refuse the category's
default page. Gate 3 is checked against 50+ craft rules (no dots in chips, no
gradient text, generous spacing, chosen fonts) and then reviewed from rendered
captures by a context that did not build it. After every gate you reply
APPROVE, ITERATE, BACK or STOP; refine verbs such as `bolder`, `quieter` and
`distill` give scoped passes.

**Where it stops.** It designs; it does not write your product code or merge
anything. Mockups are proposals, not shipped UI. It uses the tools your agent
already has (search, browser, Figma MCP) and records any missing tool as an
evidence gap instead of faking it. Your brand stays yours: a `TASTE.md`,
`PRODUCT.md` or `.sanstudio/` contract in your project overrides its defaults.

**Credits.** Original pipeline and rules, with a few ideas adapted in new
wording from impeccable (Apache 2.0), design.md (Apache 2.0), hallmark (MIT)
and taste-skill (MIT). Full credits and licence texts ship in `NOTICE.md` and
`licenses/`.

## See it in action (700+ characters works best)

A product designer asks: "lane: standard. Our budgeting app's transaction list
feels cluttered; users can't find last week's coffee. Screenshot attached. Keep
the tab bar." The chain first researches the complaint, separating what users
reported from guesses, and lists the open question that matters: are people
searching for one payment or scanning a week? Gate 1 reads the screenshot,
extracts the real hex values and fonts into a DESIGN.md, sets the mode to
Operate and asks one question. Gate 2 names the category default (a flat
reverse-chronological list) and offers three directions: grouped by day with a
fact row, grouped by merchant, and search-first. The designer replies "B, with
A's day headers". Gate 3 builds the hi-fi mockup in a phone frame with real
merchants and amounts, runs the anti-slop pass, captures it at device size and
hands the captures to an independent reviewer, which scores the heuristics,
walks it as a one-thumb commuter and a screen-reader user, and sends back one
P1 about a missing empty state. The fix lands before the designer sees the
screen. "ITERATE quieter" then tones down the category colors without touching
anything else.

## Requires

Any agent that loads SKILL.md folders. Recommended: web search, image search, a
browser tool, subagents. Optional: a Figma MCP.

## Screenshots to prepare (up to 6, 10 MB each)

1. The gate prompt line and a CONTEXT-LOCK block in a real session.
2. Three directions side by side with the rut line above them.
3. The hi-fi mockup (desktop and phone).
4. The review summary: heuristic table and priority issues.
5. A before and after from `ITERATE bolder`.
6. The production readiness scorecard.

Use your own sessions only; no third-party product screenshots.

## Price

Set at submission. One-time from $1 (under $5 is credit only) or a subscription
from $5 a month; the creator keeps 70%.
