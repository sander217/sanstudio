# Design Agent Studio

A 3-gate design system: fuzzy requirements → Figma-ready output.

## Skills

```
context-lock-SKILL-v2.md       # Gate 1: understand + infer + extract visual contract
direction-lock-SKILL-v2.md     # Gate 2: research + validate + propose directions
design-lock-SKILL-v2.md        # Gate 3: design + iterate + export
skills/
└── design-lock/
    ├── design-techniques-db.md
    └── figma-schema-v0.2.md
```

## Routing

Design requests → invoke `/context-lock` first. Do NOT answer design questions directly.

### Trigger patterns

- User describes a design need: "I need to design...", "幫我設計..."
- User uploads a UI screenshot or mockup
- User shares a Figma link or reference URL
- User asks for design critique, comparison, or changes
- User mentions wireframe, mockup, prototype, UI, UX, layout, component, flow

### Gate flow

```
User request
    │
    ▼
/context-lock (Gate 1) — infer, decompose, extract visual contract
    │
    ├── BLANK / GENERATE / CONSTRAINED
    │       ▼
    │   /direction-lock (Gate 2) — research, validate, propose
    │       ▼
    │   /design-lock (Gate 3) — design, iterate, export
    │
    ├── COMPARE / CRITIQUE
    │   Evaluation/Analysis in Gate 1
    │       ├── Done
    │       ├── → Gate 3
    │       └── → Gate 2 → Gate 3
    │
    └── ITERATE → Gate 3 directly
```

### Skill loading rule

Read ONLY the current gate's skill file. Do not pre-read downstream gates.

## Key behaviors

- **Infer before asking.** Gate 1 decomposes vague prompts, researches references, 
  simulates end users, and extracts concrete visual values — all before the first question.
- **Visual contract is binding.** When a user provides a reference URL or screenshot, 
  Gate 1 extracts hex colors, font families, layout patterns, and excluded colors. 
  Gate 3 uses these exact values. No reinterpretation, no drift.
- **Match the user's language.** Traditional Chinese if Chinese, English if English.
- **Match the user's energy.** ITERATE = fast. BLANK = exploratory.
- **Every visual artifact is an HTML file.** Write to file, provide path + summary.
- **Images are mandatory in hi-fi.** Use image_search tool or web_search for stock. 
  CSS-only is a last resort, not a default. No gray placeholder rectangles ever.

## Figma Export

When Gate 3 completes:

### Output location
```
/Users/sanderchen/Documents/Claude/Projects/sanstudio-ai-output/
  latest -> sessions/<timestamp>-<slug>
  sessions/<timestamp>-<slug>/
    session.json
    html/
    figma/
    docs/
```

### Export steps
1. Export via `./scripts/export-design-session.sh`
2. Push to Figma bridge: `curl -X POST http://localhost:3333/push -d @latest/figma/design-export.json`
3. Write companion docs to `docs/`

### HTML Capture Rule
If using HTML capture: every screen renders correct state on fresh page load.
Never rely on click-only state changes before capture.

## Handoff blocks

Gates communicate via structured text blocks:
- `---CONTEXT-LOCK---` / `---CONTEXT-LOCK-EVALUATED---` / `---CONTEXT-LOCK-PARTIAL---`
- `---DIRECTION-LOCK---` / `---DIRECTION-LOCK-PARTIAL---`
- `---DESIGN-LOCK---` / `---DESIGN-LOCK-PARTIAL---`

## Retreat

- Gate 3 direction wrong → retreat to Gate 2
- Gate 3 context wrong → retreat to Gate 1
- Gate 2 after 6 rejected directions → retreat to Gate 1

## Design system

Gate 1 creates digest. Gate 2 uses for feasibility. Gate 3 enforces compliance.
