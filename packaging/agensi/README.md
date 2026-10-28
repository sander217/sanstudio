# sanstudio Design Chain

A design pipeline for your agent. One request goes in. Research, a locked visual
contract, three meaningfully different directions, a hi-fi HTML mockup reviewed
by fresh eyes and, when you ask for it, a production design package come out.
You decide at every gate.

## Start

Ask for a design the way you would brief a designer, and attach what you have:

```text
lane: standard
The transaction list in our budgeting app feels cluttered. Users say they
cannot find last week's coffee. Screenshot attached. Keep the tab bar.
```

The `design-chain` skill picks up the request, researches why the change is
wanted, then stops after each gate for one of:

| Reply | Effect |
|---|---|
| `APPROVE` | lock this gate and continue |
| `ITERATE <note>` | redo this gate with your note |
| `ITERATE <verb> [target]` | a scoped refine pass: polish, bolder, quieter, distill, harden, clarify, typeset, layout, colorize, motion, adapt, onboard |
| `BACK G<n>` | return to an earlier gate |
| `REVIEW` | run the fresh-eyes review now |
| `STOP` | save progress and end |

Lanes set the depth: `fast` for a bounded change, `standard` for a new screen
or redesign, `major` when engineering will build from it.

## The six skills

| Gate | Skill | Output |
|---|---|---|
| entry | design-chain | lane, mode, gate control |
| G0 | research-synthesis | research report with findings and gaps |
| G1 | context-lock | session DESIGN.md (tokens and rules) |
| G2 | direction-lock | three directions and a direction contract |
| G3 | design-lock | hi-fi HTML, captures, review, Figma JSON |
| G4 | production-lock | states, components, handoff, readiness scorecard |

## Make it yours

Put a `TASTE.md` in your project (template in
`skills/design-chain/assets/TASTE.template.md`) for your brand's colors, type
and rules. Put a `PRODUCT.md` (template in the same folder) so the chain knows
your users and product without asking every session. A brand with an existing
design system can drop it into a `.sanstudio/` folder; see
`skills/design-chain/references/contracts.md`.

## Requires

Any agent that loads SKILL.md folders. Works best with web search, image
search, a browser tool for rendering captures, and subagents for the
independent review. A Figma MCP is optional for direct export. Missing tools
are recorded as evidence gaps, never faked.

This pack ships no scripts and makes no network calls of its own. Mockup HTML
may reference public image and icon CDNs (Iconify, Picsum, Simple Icons) when
the agent builds a page; those requests come from the rendered page, not from
the skill.
