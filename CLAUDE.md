# Design Agent Studio

A 3-gate design thinking system that takes designers from fuzzy requirements to Figma-ready output. Each gate is a skill file — invoke the right one based on what the user needs.

## Skills

```
skills/
├── context-lock/SKILL.md      # Gate 1: understand the problem
├── direction-lock/SKILL.md    # Gate 2: explore and validate directions
└── design-lock/SKILL.md       # Gate 3: design, iterate, export
```

## Routing

When the user brings a design-related request, invoke `/context-lock` first. It will classify the request and route to the appropriate next step. Do NOT answer design questions directly — the skill has structured workflows that produce better results.

### Trigger patterns → invoke /context-lock

- User describes a design need: "I need to design...", "幫我設計..."
- User uploads a UI screenshot or mockup for feedback
- User shares a Figma link
- User asks to compare designs: "which version is better", "A 還是 B"
- User asks for design critique: "is this good", "這個設計有什麼問題"
- User asks for design changes: "change the header", "改一下這個按鈕"
- User describes a product/UX problem that needs a design solution
- User mentions wireframe, mockup, prototype, UI, UX, layout, component, flow

### How the gates connect

```
User request
    │
    ▼
/context-lock (Gate 1)
    │
    ├── BLANK / GENERATE / CONSTRAINED
    │       ▼
    │   /direction-lock (Gate 2)
    │       ▼
    │   /design-lock (Gate 3)
    │       ▼
    │   Figma JSON export
    │
    ├── COMPARE
    │   Evaluation Output produced in Gate 1
    │       ├── User satisfied → done
    │       ├── User wants mockup → /design-lock (Gate 3)
    │       └── User wants exploration → /direction-lock (Gate 2) → /design-lock
    │
    ├── CRITIQUE
    │   Analysis Output produced in Gate 1
    │       ├── User satisfied → done
    │       ├── User wants redesign → /design-lock (Gate 3)
    │       └── User wants exploration → /direction-lock (Gate 2) → /design-lock
    │
    └── ITERATE
        Lightweight context lock
            ▼
        /design-lock (Gate 3) directly
```

### Skill loading rule

Read ONLY the current gate's skill file. Do NOT pre-read downstream gates.

- Entering Gate 1 → read `context-lock-SKILL.md` only
- Transitioning to Gate 2 → read `direction-lock-SKILL.md` only
- Transitioning to Gate 3 → read `design-lock-SKILL.md` only

The previous gate's skill file is already in conversation history. Do not re-read it.

### Automatic transitions

When a gate completes and the user confirms, read the skill file for the next gate and follow its instructions. The handoff block produced by the completing gate contains all context the next gate needs.

- After `/context-lock` confirms → read the `routed_to` field in the CONTEXT-LOCK block and invoke the corresponding gate skill
- After `/direction-lock` confirms → invoke `/design-lock`
- After `/design-lock` confirms → export JSON + companion docs + push to Figma

Do NOT re-read the previous gate's skill file during the next gate. Each gate's skill file is self-contained.

## Figma Export Automation

When Gate 3 completes and the user says "export" (or confirms the final design):

### Output location
Do not write generated artifacts into the `sanstudio` repo root.
Write them to the external session-based output directory instead:

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

### Step 1: Export into a session directory
Prefer the helper script:
```bash
./scripts/export-design-session.sh \
  --session "checkout-v1" \
  --html /absolute/path/to/mockup.html \
  --json /absolute/path/to/design-export.json \
  --interaction-spec /absolute/path/to/design-interaction-spec.md \
  --ddr /absolute/path/to/design-ddr.md \
  --handoff /absolute/path/to/design-handoff.md
```

If writing files directly, keep the same structure:
- `html/*.html` for visual artifacts the user reviews
- `figma/design-export.json` for the Figma plugin
- `docs/*.md` for handoff and rationale
- `session.json` to link the artifacts together

### Step 2: Push to Figma via bridge
Figma reads the JSON file, not the HTML. If the bridge server is running, push the session JSON:
```bash
OUTPUT_ROOT="/Users/sanderchen/Documents/Claude/Projects/sanstudio-ai-output"
curl -s -X POST http://localhost:3333/push \
  -H "Content-Type: application/json" \
  -d @"$OUTPUT_ROOT/latest/figma/design-export.json"
```

If the curl succeeds (returns `{"status":"ok",...}`), the Figma Plugin auto-imports 
the design. Tell the user: "Exported to Figma. Check your canvas."

If the curl fails (connection refused), tell the user:
"Bridge server isn't running. Start it with `node figma-plugin/server.js`, 
then open the Figma Plugin and click 'Auto-import' → 'Start listening'. 
I'll push again when you're ready."

### Step 3: Write companion docs
Write companion docs into the same session under `docs/`.

### Bridge setup (one-time)
The bridge server is at `figma-plugin/server.js`. Start it before exporting:
```bash
node figma-plugin/server.js
```
It runs on `http://localhost:3333`. In Figma, open the Plugin → "Auto-import" tab → 
"Start listening". The Plugin polls the bridge every 2 seconds.

## Handoff blocks

Gates communicate via structured text blocks in the conversation. These are flat key-value pairs with complex values as inline JSON strings.

```
---CONTEXT-LOCK---
...fields...
---END-CONTEXT-LOCK---

---DIRECTION-LOCK---
...fields...
---END-DIRECTION-LOCK---

---DESIGN-LOCK---
...fields...
---END-DESIGN-LOCK---
```

There are also variant blocks:
- `---CONTEXT-LOCK-EVALUATED---` — for COMPARE/CRITIQUE that go directly to Gate 3
- `---CONTEXT-LOCK-PARTIAL---` — aborted Gate 1
- `---DIRECTION-LOCK-PARTIAL---` — aborted Gate 2
- `---DESIGN-LOCK-PARTIAL---` — aborted Gate 3

When you see a PARTIAL block from a previous session, the user is resuming. Parse the block, identify which gate and step they stopped at, and continue from there.

## Retreat

Gates can retreat upstream:
- Gate 3 discovers direction is wrong → retreat to Gate 2 (re-read `/direction-lock` skill)
- Gate 3 discovers context is wrong → retreat to Gate 1 (re-read `/context-lock` skill)
- Gate 2 after 6 rejected directions → retreat to Gate 1

When retreating, preserve upstream LOCK blocks that are still valid. Only re-run the gate that needs rework.

## Abort

Any gate can be aborted. The gate produces a PARTIAL block with progress saved. Acknowledge cleanly, summarize what was done, and don't push the user to continue.

## Output files

Gate 3 produces files for export:
- `*.json` — Figma-ready structured JSON (schema v0.2), consumed by the Figma Plugin
- `*.html` — user-facing visual artifacts kept outside the repo
- `*-interaction-spec.md` — interaction documentation for developers
- `*-ddr.md` — Design Decision Record linking every choice to its rationale
- `*-handoff.md` — quick reference for the designer working in Figma

Write these to `/Users/sanderchen/Documents/Claude/Projects/sanstudio-ai-output` in a timestamped session folder, not to the `sanstudio` repo. The JSON file is the Figma deliverable; the HTML files are review artifacts.

## Design system

If the user provides a design system (tokens, style guide, component library), Gate 1 creates a digest in the CONTEXT-LOCK block. Gate 2 uses it for feasibility assessment. Gate 3 uses it for full compliance. The design system is a hard constraint — Gate 3 flags every deviation.

## Key behaviors

- **Never answer design questions directly.** Always invoke the appropriate skill. The structured workflow produces better results than ad-hoc answers.
- **Match the user's language.** Traditional Chinese if they write in Chinese, English if English. Design terminology stays in English with Chinese annotation when needed.
- **Match the user's energy.** ITERATE users want speed. BLANK users want exploration. Don't lecture an ITERATE user or rush a BLANK user.
- **Every visual artifact is an HTML file.** Flow diagrams, wireframes, and hi-fi mockups are all generated as self-contained HTML. Gate 2 uses grayscale system fonts. Gate 3 uses the confirmed visual language.
- **HTML artifacts are files, not inline content.** When generating HTML (wireframes, mockups, flow diagrams), write the HTML to a file and provide: (1) the file path, (2) a 3-sentence summary describing what the artifact shows, (3) key design decisions embedded in the artifact. Never paste raw HTML source code into the conversation.
- **The insight is the product.** Generic observations ("improve usability") are failures. Every insight must be specific, contextual, and actionable.
