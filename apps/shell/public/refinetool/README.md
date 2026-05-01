# Vendored from `sander217/refinetool`

`companion.iife.js` is the in-iframe runtime from refinetool's iframe variant
(branch `refinetool_0429`). Sanstudio shell injects it into the artifact iframe
and talks to it over `postMessage` (namespace `ifl/iframe`).

We intentionally do NOT vendor refinetool's `host.js` — sanstudio writes its
own panel UI in `apps/shell/src/RefinePanel.tsx` so the picker / annotate /
diff flow can be themed and laid out however sanstudio wants.

## Re-syncing

When refinetool ships new picker capabilities (reorder, drag-to-move, image
intent, style nudges), rebuild the companion and copy it back:

```bash
cd ../../../refinetool   # adjust path to wherever you cloned refinetool
npm run build:companion
cp public/companion.iife.js \
   ../sanstudio/apps/shell/public/refinetool/companion.iife.js
```

## Protocol

Requests sent from shell parent → companion (inside iframe):

```ts
{ ns: 'ifl/iframe', id: '<uuid>', type: 'SET_REFINE_MODE', enabled: boolean }
{ ns: 'ifl/iframe', id: '<uuid>', type: 'GET_REFINE_MODE' }
{ ns: 'ifl/iframe', id: '<uuid>', type: 'APPLY_DIRECT_EDIT', action: DirectEditAction }
{ ns: 'ifl/iframe', id: '<uuid>', type: 'REVERT_DIFFS', diffs: EditDiff[] }
```

Responses (echoed `id`):

```ts
{ ns: 'ifl/iframe', id: '<uuid>', ok: boolean, result?: unknown, error?: string }
```

Broadcasts (no `id`):

```ts
{ ns: 'ifl/iframe', type: 'REFINE_MODE_CHANGED', enabled: boolean }
{ ns: 'ifl/iframe', type: 'TARGET_SELECTED', pending: PendingSelection }
```

Action and diff types live in refinetool's `src/shared/types.ts`. We mirror
the subset we use in `apps/shell/src/refineProtocol.ts` to avoid pulling in
the whole refinetool repo as a dependency.
