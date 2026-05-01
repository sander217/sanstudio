# Sanstudio Shell — Layer 0

Web shell that hosts a Gate 3 artifact preview alongside an embedded refinetool panel.

This is **Layer 0**: shell + manual sync. You still drive Claude Code in your terminal; the shell handles the preview and the refinement loop, and gives you a one-click "Copy iterate prompt" to paste back.

```
┌─ sanstudio shell (browser) ─────────────────────────────┐
│  [prompt bar — copy /context-lock prompt to paste]      │
│  ┌─ iframe (latest Gate 3 artifact) ─┐ ┌─ refinetool ─┐ │
│  │ auto-loads from sessions/...     │ │ pick · edit │ │
│  │                                   │ │ save · copy │ │
│  └───────────────────────────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Run it

```bash
cd apps/shell
npm install
npm run dev
# opens http://localhost:5180
```

Vite dev server adds two extra routes:
- `GET /sessions.json` — manifest of every session in `sanstudio-ai-output/sessions/`, newest first
- `GET /sessions/<slug>/html/<file>.html` — proxied access to the artifact, served same-origin so refinetool's companion can be injected

## Loop

1. Type your design intent in the prompt bar → click **Copy Gate 1 prompt**
2. Paste into Claude Code in your terminal → Claude runs sanstudio Gate 1/2/3
3. When Gate 3 writes HTML to `sanstudio-ai-output/sessions/<slug>/html/`, the iframe auto-loads it
4. Click **Start picker** → click any region in the iframe → write a note → optionally edit text / hide / remove
5. Click **Save refinement**
6. Repeat for as many regions as needed
7. Click **Copy iterate prompt** → paste into the same Claude Code session → it'll run `/design-lock ITERATE` against the saved refinements
8. New artifact lands → loop

## File overview

```
apps/shell/
├── public/refinetool/
│   ├── companion.iife.js     vendored from refinetool (npm run sync:refinetool)
│   └── README.md             how the vendored bundle is used
├── scripts/sync-refinetool.mjs   re-vendor the companion
├── src/
│   ├── main.tsx              React entry
│   ├── App.tsx               layout + session polling
│   ├── PromptBar.tsx         top bar — Gate 1 prompt builder
│   ├── PreviewIframe.tsx     iframe wrapper + companion injection
│   ├── RefinePanel.tsx       picker controls + saved-refinement list
│   ├── SessionWatcher.ts     polls /sessions.json
│   ├── RefinementToPrompt.ts diff JSON → ITERATE prompt
│   └── refineProtocol.ts     postMessage wire types + RefineRpc class
├── vite.config.ts            includes the /sessions middleware
└── index.html
```

## Why no daemon (yet)?

Layer 0 deliberately ships **without** a long-running Node daemon so we can validate the loop end-to-end with no new infra. Layer 1 will add `apps/daemon/` (Express + Claude Agent SDK + WebSocket) so the **Copy iterate prompt** button becomes a **Send to Claude** button and the user never leaves the browser.

## Why poll instead of websocket?

A 1.5 s poll on `/sessions.json` is one localhost HTTP roundtrip — it's effectively free and the code is trivial. Layer 1 swaps it for a real WS push when there's a daemon to push from.

## Refinetool sync

The companion script under `public/refinetool/` is a **vendored build artifact**, not a git submodule. To pull updates:

```bash
npm run sync:refinetool                  # default ../../../refinetool
npm run sync:refinetool -- ../path/here  # explicit path
```
