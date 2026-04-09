# Design Agent Studio

A 3-gate design system: fuzzy requirements → Figma-ready output.

## Skills

```text
context-lock-SKILL-v2.md       # Gate 1: understand + infer + extract visual contract
direction-lock-SKILL-v2.md     # Gate 2: research + validate + propose directions
design-lock-SKILL-v2.md        # Gate 3: design + iterate + export
skills/
├── context-lock/
│   └── SKILL.md               → symlink to ../../context-lock-SKILL-v2.md
├── direction-lock/
│   └── SKILL.md               → symlink to ../../direction-lock-SKILL-v2.md
└── design-lock/
    ├── SKILL.md               → symlink to ../../design-lock-SKILL-v2.md
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

```text
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

Read ONLY the current gate's skill file. Do NOT pre-read downstream gates.

- Entering Gate 1 → read `context-lock-SKILL-v2.md` only
- Transitioning to Gate 2 → read `direction-lock-SKILL-v2.md` only
- Transitioning to Gate 3 → read `design-lock-SKILL-v2.md` only

The previous gate's skill file is already in conversation history. Do not re-read it.

### Automatic transitions

When a gate completes and the user confirms, read the skill file for the next gate and follow its instructions. The handoff block produced by the completing gate contains all context the next gate needs.

- After `/context-lock` confirms → read the `routed_to` field in the CONTEXT-LOCK block and invoke the corresponding gate skill
- After `/direction-lock` confirms → invoke `/design-lock`
- After `/design-lock` confirms → export JSON + companion docs + push to Figma

## Key behaviors

- **Infer before asking.** Gate 1 decomposes vague prompts, researches references, simulates end users, and extracts concrete visual values before the first question.
- **Visual contract is binding.** When a user provides a reference URL or screenshot, Gate 1 extracts hex colors, font families, layout patterns, and excluded colors. Gate 3 uses those values directly.
- **Match the user's language.** Traditional Chinese if Chinese, English if English.
- **Match the user's energy.** ITERATE = fast. BLANK = exploratory.
- **Every visual artifact is an HTML file.** Write artifacts to files, not inline code blocks in the conversation.
- **Images are mandatory in hi-fi.** Use image search or web search for stock. CSS-only is a fallback, not the default.
- **HTML artifacts are files, not inline content.** When generating HTML, provide the file path, a short summary, and the key design decisions embedded in the artifact. Never paste raw HTML into the conversation.

## Figma Export

When Gate 3 completes:

### Output location

Do not write generated artifacts into the `sanstudio` repo root. Write them to the external session-based output directory instead:

```text
/Users/sanderchen/Documents/Claude/Projects/sanstudio-ai-output/
  latest -> sessions/<timestamp>-<slug>
  sessions/
    <timestamp>-<slug>/
      session.json
      html/
      figma/
      docs/
```

### Export steps

1. Export via `./scripts/export-design-session.sh`
2. Push to Figma bridge: `curl -X POST http://localhost:3333/push -d @/Users/sanderchen/Documents/Claude/Projects/sanstudio-ai-output/latest/figma/design-export.json`
3. Write companion docs to `docs/`

### HTML Capture Rule

If using HTML capture:

- Treat every screen capture as a fresh page load
- Apply URL-driven state immediately on load
- Never rely on click-only state changes before capture
- Verify each capture target renders the correct screen on first load

### Bridge setup

The bridge server is at `figma-plugin/server.js`. Start it before exporting:

```bash
node figma-plugin/server.js
```

It runs on `http://localhost:3333`. In Figma, open the Plugin → "Auto-import" tab → "Start listening".

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

Gate 1 creates the digest. Gate 2 uses it for feasibility. Gate 3 enforces compliance.
