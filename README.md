**English** · [繁體中文](README.zh-TW.md)

# Design Agent Studio — Installation Guide

Step-by-step setup for team members. Once installed, you can use Claude Code to take fuzzy requirements through design thinking → direction exploration → hi-fi design → automatic Figma export.

Total install time: **15–20 minutes** (including basic training).

---

## What it is

Design Agent Studio is a **3-gate design system** that turns vague requirements into Figma-ready hi-fi designs:

```text
You say: "I need to design an onboarding flow"
    │
    ▼
Gate 1 (/context-lock)    → Understand requirement, extract visual contract, emit DESIGN.md
Gate 2 (/direction-lock)  → Explore 3 directions, validate feasibility
Gate 3 (/design-lock)     → Generate hi-fi HTML + Figma JSON → auto-import to Figma
```

Every run produces a **DESIGN.md** (YAML tokens + Do's/Don'ts) — the cross-gate visual contract. Gate 3 lints it (WCAG contrast, broken token refs) before shipping.

---

## Prerequisites

| Item | How to verify | If missing |
|------|---------------|------------|
| Node.js 18+ | `node -v` in Terminal | Install LTS from https://nodejs.org |
| Claude Code | `claude --version` in Terminal | https://docs.anthropic.com/en/docs/claude-code |
| Figma desktop app | Open Figma | Download from https://figma.com/downloads |
| Git | `git --version` in Terminal | macOS: `xcode-select --install` · Windows: https://git-scm.com |

---

## Phase 1 — Install Skills (5 min)

Skills are the instruction files that teach Claude Code how to do design work.

### Step 1: Clone the repo

In your project directory:

```bash
cd ~/your-project

git clone https://github.com/sander217/sanstudio.git .claude/skills/design-agent-studio
```

> If `.claude/skills/` doesn't exist, the command creates it.

### Step 2: Add routing to your project's CLAUDE.md

Claude Code needs to know these skills exist:

```bash
cat .claude/skills/design-agent-studio/CLAUDE.md >> CLAUDE.md
```

> If you don't have a `CLAUDE.md`, this creates one.

### Step 3: Verify

Open Claude Code:

```bash
claude
```

Type:

```
I need to design a new feature
```

If installed correctly, Claude Code launches `/context-lock` (Gate 1) and starts asking structured requirement questions. If it answers directly without entering the gate flow, double-check that `CLAUDE.md` was written correctly.

---

## Phase 2 — Install Figma Plugin (3 min)

The plugin turns AI-generated design JSON into editable Figma components.

### Step 1: Compile the plugin

```bash
cd .claude/skills/design-agent-studio/figma-plugin

npm install --save-dev @figma/plugin-typings
npx tsc
```

> If TypeScript errors appear, confirm `tsconfig.json` has `strict: false`.

### Step 2: Load the plugin into Figma

1. Open the **Figma desktop app**
2. Top-left **Figma logo** → **Plugins** → **Development** → **Import plugin from manifest...**
3. Select: `.claude/skills/design-agent-studio/figma-plugin/manifest.json`
4. The plugin appears under **Plugins → Development → Design Agent Studio**

### Step 3: Test the plugin

1. Open a new file in Figma
2. Right-click → **Plugins** → **Development** → **Design Agent Studio**
3. The plugin panel opens with three tabs: **Paste JSON** / **Upload file** / **Auto-import**
4. Open `figma-plugin/test-sample.json`, copy the JSON
5. Paste into **Paste JSON** tab
6. Preview shows "2 screens, 15+ nodes" → click **Import to Figma**
7. Two frames appear on canvas: **Welcome / default** and **Welcome / empty**

Two frames visible = plugin installed correctly.

---

## Phase 3 — Set up auto-export (2 min)

Lets you say "export" in Claude Code and have the design pushed to Figma automatically.

### Step 1: Start the bridge server

In a new Terminal tab (keep it running):

```bash
cd .claude/skills/design-agent-studio
node figma-plugin/server.js
```

You should see:

```
  Design Agent Studio — Bridge Server
  Listening on http://localhost:3333

  POST /push  — send JSON from Claude Code
  GET  /pull  — Figma Plugin fetches pending JSON
  GET  /status — health check
```

> Keep this Terminal open. Generated HTML / JSON / DESIGN.md / handoff docs land in `~/sanstudio-ai-output/`, not your repo.

### Step 2: Plugin starts listening

1. Open the plugin in Figma
2. Switch to the **Auto-import** tab
3. Click **Start listening**
4. Status indicator turns yellow ("Connected — waiting for export...")

### Step 3: Test auto-export

```bash
curl -s -X POST http://localhost:3333/push \
  -H "Content-Type: application/json" \
  -d @.claude/skills/design-agent-studio/figma-plugin/test-sample.json
```

Expected response:

```json
{"status":"ok","push_id":1,"screens":2,"nodes":15}
```

Check Figma — the design appears automatically.

---

## Phase 4 — Train your design DNA (5 min onward, can keep adding)

**This is what turns the system from "generic hi-fi" into "things that look like you made them."** Skipping this still works, but the output won't have your taste.

### 4.1 — Required: fill `style-manifesto.md` (10 rules ≈ 30 min)

Open `.claude/skills/design-agent-studio/skills/design-lock/references/style-manifesto.md`.

This is a **partial DESIGN.md** loaded as hard constraint on every Gate 3 run.

Minimum: fill the `Do's and Don'ts` section:

```markdown
### Do
- Real content always: every amount, name, number must be real data
- At least one data viz: any app with numbers needs chart / sparkline / progress
- Type scale ≥3 levels: display / headline / body / label
- ...

### Don't
- No gray placeholders: any #E5E5E5 empty box = fail
- No emoji as icon: 🦷 in UI = instant reject, use Iconify SVG
- No web patterns in app frames: 80–120px section gap, 50/50 split = wrong surface
- ...
```

10–20 specific rules is enough. Write prescriptively (when to do, when not to), not as opinions.

### 4.2 — Strongly recommended: build the reference library (5–10 min per screenshot)

Under `.claude/skills/design-agent-studio/skills/design-lock/references/mobile-app-examples/`:

```
mobile-app-examples/
├── finance/
├── accounting/
├── ecommerce/
├── social/
├── wellness/
├── productivity/
└── content/
```

For each industry you regularly design for, drop 3–5 Mobbin / Dribbble screenshots, copy `_template.md` for each, and fill it in — **especially the "我的處方" (My Prescription) section**: when to copy this pattern, when never to.

> **20–30 annotated screenshots beats 200 unannotated ones.** Don't hoard.

### 4.3 — Optional: fill `extracted_tokens`

Each screenshot annotation has an `extracted_tokens` YAML block. Copy the hex / fontSize / rounded values in — Gate 3 can pull them as starting tokens.

---

## Daily usage

### Startup (every working session)

```bash
# Terminal Tab 1 — Bridge Server (keep open)
cd your-project
node .claude/skills/design-agent-studio/figma-plugin/server.js

# Terminal Tab 2 — Claude Code
cd your-project
claude
```

In Figma: open the plugin → Auto-import → Start listening.

### Using it

Just describe what you need in natural language:

```
> I need to design an onboarding flow — new users churn 55% within 3 days

> Which version is better? (with screenshots)

> This checkout has a 23% conversion rate, what's wrong with it?

> Make this progress indicator feel more motivating
```

The system routes automatically:

| You say | System does |
|---------|-------------|
| "I need to design..." | All 3 gates: requirement → directions → hi-fi |
| "Which is better?" | Evaluation/analysis, you decide whether to continue |
| "What's wrong with this?" | Diagnosis, you decide whether to let AI fix |
| "Tweak this button" | Skip direction exploration, edit directly |

### Export to Figma

When you're happy with the design, say "export". Claude Code pushes JSON to the bridge server, Figma plugin auto-imports it.

HTML mockups + DESIGN.md stay in the external session folder. Figma only reads `figma/design-export.json`.

---

## DESIGN.md — the cross-gate visual contract

Every Gate 1 run emits a `DESIGN.md` to:

```text
~/sanstudio-ai-output/sessions/<timestamp>-<slug>/DESIGN.md
```

It's **YAML frontmatter (machine-readable design tokens) + markdown body (rationale + Do's/Don'ts)**:

```yaml
---
colors:
  primary: "#0B0F1A"
  on-surface: "#F4F4F5"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 700
components:
  button-primary:
    backgroundColor: "{colors.primary}"   # token reference
    rounded: "{rounded.full}"
---

## Do's and Don'ts
- Don't use purple as primary
- Do make balance ≥48pt
```

**On every Gate 3 run, the skill**:
- Resolves token references (`{colors.primary}` → `#0B0F1A`)
- Lints (WCAG AA contrast ≥ 4.5:1, broken refs, section order)
- Annotates generated HTML with token-trace comments: `<!-- {components.button-primary.backgroundColor} -->`
- Blocks export if any BLOCKING rule fails

**Why it matters**: previously Gate 1 → Gate 3 passed visual intent through prose (lossy). Now it passes through a machine-readable, lintable contract.

---

## Directory structure

```
your-project/
├── CLAUDE.md                                    ← your project (now has routing rules appended)
└── .claude/skills/design-agent-studio/
    ├── CLAUDE.md                                ← skill routing config
    ├── README.md
    ├── scripts/
    │   └── export-design-session.sh
    ├── skills/
    │   ├── context-lock/SKILL.md                ← Gate 1
    │   ├── direction-lock/SKILL.md              ← Gate 2
    │   └── design-lock/
    │       ├── SKILL.md                         ← Gate 3
    │       ├── design-md-spec.md                ← DESIGN.md format spec
    │       ├── design-techniques-db.md
    │       ├── figma-schema-v0.2.md
    │       ├── svg-patterns.md
    │       ├── mobile-app-patterns.md
    │       └── references/
    │           ├── INDEX.md
    │           ├── _template.md
    │           ├── _DESIGN.example.md
    │           ├── style-manifesto.md           ← your personal design manifesto (REQUIRED)
    │           └── mobile-app-examples/         ← annotated screenshots (you fill these)
    │               ├── finance/
    │               ├── ecommerce/
    │               └── ...
    └── figma-plugin/
        ├── manifest.json
        ├── code.ts / code.js
        ├── ui.html
        ├── tsconfig.json
        ├── test-sample.json
        └── server.js
```

External output (auto-created on export):

```text
~/sanstudio-ai-output/
├── latest -> sessions/<timestamp>-<slug>
└── sessions/
    └── <timestamp>-<slug>/
        ├── session.json
        ├── DESIGN.md            ← emitted by Gate 1, linted by Gate 3
        ├── html/                ← hi-fi mockup (one per screen)
        ├── figma/
        │   └── design-export.json
        └── docs/                ← handoff docs / decisions
```

---

## FAQ

### Claude Code doesn't enter the gate flow, just answers me directly

Check that `CLAUDE.md` (in your project root) contains the "Design Agent Studio" section. If not, re-run:

```bash
cat .claude/skills/design-agent-studio/CLAUDE.md >> CLAUDE.md
```

### Gate 3 output looks generic, doesn't have my taste

Fill `references/style-manifesto.md` Do's/Don'ts and add annotated screenshots to the reference library. **Without Phase 4, Gate 3 only has the model's default taste to work with.**

### Plugin not visible in Figma

Make sure you're on the **Figma desktop app**, not the browser. Browser Figma can't load local plugins.

### Plugin imports but nothing shows up in Figma

Possible causes:
1. **Invalid JSON** — plugin UI shows a red error message, check it
2. **Missing font** — plugin defaults to Inter; install from https://rsms.me/inter/
3. **Frames off-screen** — try `Cmd+Shift+1` (Zoom to fit)

### Bridge server unreachable

```bash
curl http://localhost:3333/status
```

If `connection refused`, the server isn't running. Restart:

```bash
node .claude/skills/design-agent-studio/figma-plugin/server.js
```

### Auto-import indicator stays red

Red = plugin can't reach the bridge server. Check:
1. Bridge server is running (look for "Listening on http://localhost:3333" in its terminal)
2. `manifest.json` `devAllowedDomains` includes `"http://localhost:3333"`
3. Reload the plugin

### TypeScript compile fails

Confirm `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["ES2017"],
    "module": "none",
    "strict": false,
    "skipLibCheck": true,
    "noEmitOnError": false,
    "removeComments": true
  },
  "include": ["./code.ts"]
}
```

### Export fails with "DESIGN.md lint failed: broken-ref"

A token reference in DESIGN.md points to an undeclared token (e.g. `{colors.brand}` but `colors.brand` isn't defined). Open the session's `DESIGN.md`, add the missing token, re-export.

### Export fails with "contrast-ratio < 4.5:1"

WCAG AA lint failed — foreground/background contrast too low. Adjust DESIGN.md colors or component color combinations.

### I'm using Claude.ai, not Claude Code

Design Agent Studio primarily targets Claude Code. On Claude.ai you can paste skill file contents into Project Instructions, but auto-export to Figma won't work — you'll need to copy-paste JSON into the plugin manually.

---

## Updates

```bash
cd .claude/skills/design-agent-studio
git pull
cd figma-plugin
npx tsc
```

Then reload the plugin in Figma (no need to re-import the manifest, just rerun the plugin).
