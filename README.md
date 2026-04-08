# Design Agent Studio — Figma Plugin

Parses structured JSON from Gate 3 and creates editable Figma frames.

## Setup

```bash
# Install Figma Plugin typings
npm install --save-dev @figma/plugin-typings

# Compile TypeScript
npx tsc
```

This produces `code.js` from `code.ts`. The plugin needs two files to run:
- `code.js` — compiled parser logic
- `ui.html` — import UI

## Install in Figma

1. Open Figma → Plugins → Development → Import plugin from manifest
2. Select the `manifest.json` in this directory
3. The plugin appears under Plugins → Development → Design Agent Studio

## Usage

1. Run the plugin in Figma
2. Paste JSON from Gate 3 (or upload a `.json` file)
3. The UI validates the JSON and shows a preview (screen count, node count, design system)
4. Click "Import to Figma"
5. Screens appear on your canvas, arranged horizontally with labels

## What the parser handles

| Feature | Status |
|---------|--------|
| FRAME nodes (auto layout) | ✅ |
| TEXT nodes (font, size, weight, color, alignment) | ✅ |
| RECTANGLE nodes | ✅ |
| ELLIPSE nodes | ✅ |
| IMAGE nodes (placeholder fill) | ✅ Placeholder only |
| Flat array → tree (parentId) | ✅ |
| layoutSizingHorizontal/Vertical (FIXED, FILL, HUG) | ✅ |
| Auto Layout (padding, spacing, alignment) | ✅ |
| Fills (SOLID, hex colors) | ✅ |
| Strokes (SOLID, hex colors) | ✅ |
| Corner radius | ✅ |
| Multi-screen (horizontal layout) | ✅ |
| Multi-state (grouped by name/state) | ✅ |
| Font fallback (→ Inter if font unavailable) | ✅ |
| JSON validation (ids, parentId refs, required fields) | ✅ |
| Design system metadata (preserved, not consumed) | ✅ Passthrough |

## What the parser does NOT handle (yet)

| Feature | Status | Notes |
|---------|--------|-------|
| Gradient fills | ❌ | Only SOLID fills supported |
| Image fills (actual images) | ❌ | Creates gray placeholder |
| Drop shadows | ❌ | Schema defines them, parser ignores |
| Component instances | ❌ | Creates frames, not component references |
| Variants | ❌ | Each state is a separate frame |
| Prototype connections | ❌ | Transitions in JSON, not wired in Figma |
| Dark mode dual export | ❌ | Each theme is a separate screen entry |
| Reverse export (Figma → JSON) | ❌ | Phase 2 |

## Testing

Use `test-sample.json` to verify the parser:

```bash
# In Figma:
# 1. Run the plugin
# 2. Paste contents of test-sample.json
# 3. Click Import
# 4. You should see 2 frames: "Welcome / default" and "Welcome / empty"
```

The test file exercises: FRAME with auto layout, TEXT with various weights,
ELLIPSE, RECTANGLE, FILL/HUG sizing, nested auto layout, multi-screen,
multi-state, and the design_system block.

## Schema version

This parser targets **schema v0.2.0** as defined in `skills/design-lock/figma-schema-v0.2.md`.
Key differences from v0.1.0:
- `design_system` defined at flow level (not per-screen)
- `layoutSizingHorizontal/Vertical` replaces bare `width: "FILL"`
- `screens[]` array instead of single screen
- `transitions[]` for flow connections
- `metadata.decisions_applied` for design rationale
