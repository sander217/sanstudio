# Design Agent Studio

A 3-gate design system: fuzzy requirements → Figma-ready output.

## Skills

```text
skills/
├── context-lock/
│   └── SKILL.md               # Gate 1: understand + infer + extract visual contract
├── direction-lock/
│   └── SKILL.md               # Gate 2: research + validate + propose directions
└── design-lock/
    ├── SKILL.md               # Gate 3: design + iterate + export
    ├── design-md-spec.md      # DESIGN.md format spec (cross-gate visual language)
    ├── design-techniques-db.md
    ├── figma-schema-v0.2.md
    ├── svg-patterns.md
    ├── mobile-app-patterns.md # iOS / Android anatomy, components, CSS
    └── references/            # curated hi-fi library (mobile-app)
        ├── INDEX.md           # lookup by industry / style / component
        ├── _template.md       # per-screenshot annotation template
        ├── _DESIGN.example.md # worked DESIGN.md example (mobile finance app)
        ├── style-manifesto.md # binding design rules — partial DESIGN.md, loaded every Gate 3 run
        ├── mobile-app-examples/
        │   ├── finance/       # Cash App, Revolut…
        │   ├── accounting/
        │   ├── ecommerce/
        │   ├── social/
        │   ├── wellness/
        │   ├── productivity/
        │   └── content/
        └── style-presets/
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

- Entering Gate 1 → read `skills/context-lock/SKILL.md` only
- Transitioning to Gate 2 → read `skills/direction-lock/SKILL.md` only
- Transitioning to Gate 3 → read `skills/design-lock/SKILL.md` only
  - Gate 3 may also read support files:
    - `skills/design-lock/design-md-spec.md` (every Gate 3 run — DESIGN.md format)
    - `skills/design-lock/design-techniques-db.md`
    - `skills/design-lock/figma-schema-v0.2.md`
    - `skills/design-lock/svg-patterns.md`
    - `skills/design-lock/mobile-app-patterns.md` (when surface = mobile-app)
    - `skills/design-lock/references/style-manifesto.md` (every Gate 3 run)
    - `skills/design-lock/references/INDEX.md` (every Gate 3 run targeting mobile)
    - Matched reference `.md` files under `references/mobile-app-examples/`
    - The session DESIGN.md, if Gate 1 emitted one (path in CONTEXT-LOCK block)

The previous gate's skill file is already in conversation history. Do not re-read it.

### Automatic transitions

When a gate completes and the user confirms, read the skill file for the next gate and follow its instructions. The handoff block produced by the completing gate contains all context the next gate needs.

- After `/context-lock` confirms → read the `routed_to` field in the CONTEXT-LOCK block and invoke the corresponding gate skill
- After `/direction-lock` confirms → invoke `/design-lock`
- After `/design-lock` confirms → export JSON + companion docs + push to Figma

## Key behaviors

- **Infer before asking.** Gate 1 decomposes vague prompts, researches references, simulates end users, and extracts concrete visual values before the first question.
- **Visual contract is binding.** When a user provides a reference URL or screenshot, Gate 1 extracts hex colors, font families, layout patterns, and excluded colors. Gate 3 uses those values directly.
- **DESIGN.md is the cross-gate language.** Gate 1 emits a session DESIGN.md (markdown + YAML token frontmatter, format spec at `skills/design-lock/design-md-spec.md`) capturing colors, typography, layout, components, and Do's/Don'ts. Gate 2 validates directions against it. Gate 3 reads it as the single source of truth and lints it (WCAG AA contrast, broken refs, section order). The format is adapted from [google-labs-code/design.md](https://github.com/google-labs-code/design.md).
- **Reference library anchors hi-fi.** Gate 3 Step 2.5 loads curated Mobbin-style screenshots + their `.md` prescriptions + `style-manifesto.md` before every mobile-app generation. This is what prevents wireframe-disguised-as-hi-fi output.
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

## Reference library

Populate `skills/design-lock/references/` over time:

1. Drop Mobbin / Dribbble screenshots into the correct industry folder under `mobile-app-examples/`
2. For each screenshot, copy `_template.md` and fill in (especially the **我的處方** section + the `extracted_tokens` YAML — this is what encodes your design brain into the DESIGN.md format)
3. Update `INDEX.md` with the new entry's ID
4. Edit `style-manifesto.md` when your design philosophy evolves (it's a partial DESIGN.md — fill `Do's and Don'ts` minimum)

20–30 curated entries across 4–6 industries outperforms 200 undecorated screenshots.

## DESIGN.md format

The visual system across all three gates speaks one language: **DESIGN.md** — a single markdown file with YAML frontmatter (machine-readable design tokens) and prose body (rationale + Do's/Don'ts). Format spec at `skills/design-lock/design-md-spec.md`, worked example at `skills/design-lock/references/_DESIGN.example.md`.

Per-session DESIGN.md is written to:

```
/Users/sanderchen/Documents/Claude/Projects/sanstudio-ai-output/sessions/<timestamp>-<slug>/DESIGN.md
```

This file is the canonical visual contract — its path is passed via `design_md_path` in the CONTEXT-LOCK handoff block. Gate 3 lints it before export (WCAG AA contrast, broken refs, section order, etc.) and blocks shipping if BLOCKING rules fail.

Token references like `{colors.primary}` in the YAML resolve against the same file's token tree. Gate 3 also annotates generated HTML with token-trace comments (`<!-- {components.button-primary.backgroundColor} -->`) so review can verify which tokens were actually used.
