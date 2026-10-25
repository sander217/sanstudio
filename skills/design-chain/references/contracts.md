# Project contracts

A brand or product that already has a design contract does not start every
session from a prompt. It puts the contract in a `.sanstudio/` folder in the
working directory and the chain reads it before anything else. This is how a
Design Harness contract pack, a company design system or a prior sanstudio
session is brought in.

## The folder

```text
<project>/
  .sanstudio/
    contract.yml        # optional manifest; when absent, the files below are found by name
    DESIGN.md           # brand design contract, sanstudio DESIGN.md format (YAML tokens + prose)
    TASTE.md            # taste in TASTE.template.md shape, or
    taste.yml           # a Harness taste profile (intent / signatureTraits / avoid), read directly
    EXPERIENCE.md       # product intent, information architecture, journeys, interaction model
    qa-policy.yml       # named QA gates with severity, phases and criteria
    memory/
      brand.yml         # accepted decisions, brand scope
      product.yml       # accepted decisions, product scope
    assets/             # logos and other brand files the mockup may use
  TASTE.md              # still honored when .sanstudio/ has no taste file
```

Only `DESIGN.md` changes the chain's behavior on its own; every other file is
additive. Files may be copies or symlinks into a cloned contract pack; the chain
never fetches a repository.

`contract.yml`, when present, names the files and the identity:

```yaml
schema: 1
brand: atlas
product: atlas-web            # optional
design: DESIGN.md
taste: taste.yml
experience: EXPERIENCE.md
qa: qa-policy.yml
memory: [memory/brand.yml, memory/product.yml]
source: your-org/atlas-design-contracts@<commit>   # provenance only, never fetched
```

## What each gate does with it

| File | Gate | Effect |
|---|---|---|
| `DESIGN.md` | G1 | Becomes the **base** of the session `DESIGN.md`. `design_system_ref` is set to `.sanstudio/DESIGN.md`. Gate 1 adds only project overrides on top and writes "Inherited from .sanstudio/DESIGN.md" in the prose. Tokens, fonts and component values in the contract are exact and binding, including a face such as Inter: the contract chose it, so `CR-TYPE-002` is satisfied. |
| `DESIGN.md` | G3, G4 | Loaded as Source 1.5 (library base). Any `### UI-*` section inside it is read as a product-specific variant of the matching craft rule. |
| `TASTE.md` or `taste.yml` | G1, G3 | The taste overlay. For `taste.yml`: `intent` lines become the Overview, `signatureTraits` become Do lines, `avoid` becomes Don't lines. A root `TASTE.md` is ignored when `.sanstudio/` carries a taste file. |
| `EXPERIENCE.md` | G0, G1, G2 | G0 treats it as supplied context (product intent, objects, journeys) and cites it as a source. G1 fills `user`, `goal`, `app_key_flows` and `constraints` from it before inferring. G2 directions must fit the named journeys and interaction model; a direction that changes a journey says so and is marked as a contract change. |
| `qa-policy.yml` | G3, G4 | Every gate with `severity: blocking` and `design` in `phases` is appended to Gate 3's QA checklist, with its `criteria` as the check lines. Gate 4 lists every gate (design and product phases) as a scorecard row. A `rule:` field maps the gate to a craft rule id. |
| `memory/*.yml` | G0, G1, G2 | Decisions with `status: accepted` are prior decisions, not laws: G0 lists them as existing knowledge, G1 carries them into `constraints`, G2 does not propose a direction that contradicts one without saying so. `proposed` or `rejected` decisions are context only. The chain never writes to these files; a new learning is proposed in `docs/decisions.md` for a human to move. |
| `assets/` | G3 | Logos and brand images referenced locally. Never redrawn, never recolored. |

Announce once, after `DESIGN CHAIN READY`:

```
CONTRACT LOADED  .sanstudio/  brand: atlas  product: atlas-web
  design: atlas-core@2.5.0 (DESIGN.md, 14 colors, 4 type roles, 9 components)
  taste: taste.yml (3 intent, 5 traits, 5 avoid)
  experience: EXPERIENCE.md (3 journeys)   qa: 7 gates (5 blocking)   memory: 4 accepted decisions
```

## Precedence

1. Craft rules (`skills/design-lock/references/craft-rules.md`): bans hold; a `(default)` line yields to the contract.
2. `.sanstudio/DESIGN.md` and `qa-policy.yml`: the brand's exact values and gates.
3. `.sanstudio/taste` and accepted memory: defaults and prior decisions.
4. Session `DESIGN.md` overrides written by Gate 1 for this request.
5. The user's words in this session.

A contract value that collides with a craft **ban** (a gradient without a recipe, a dot inside a pill, text flush to an edge) is flagged at G1 as a contract gap, not silently obeyed and not silently fixed. The user decides and the decision is recorded.

## Bringing in a Design Harness contract pack

A pack repository (`brands/<brand>/`, `contracts/<name>/`, `memory/`) maps one to one. From a clone of the pack, in the product repository:

```bash
PACK=~/src/atlas-design-contracts
mkdir -p .sanstudio/memory .sanstudio/assets
cp "$PACK/contracts/atlas-core/DESIGN.md"        .sanstudio/DESIGN.md
cp "$PACK/brands/atlas/taste.yml"                .sanstudio/taste.yml
cp "$PACK/contracts/atlas-next/EXPERIENCE.md"    .sanstudio/EXPERIENCE.md
cp "$PACK/contracts/atlas-next/qa-policy.yml"    .sanstudio/qa-policy.yml
cp "$PACK/memory/brands/atlas.yml"               .sanstudio/memory/brand.yml
cp "$PACK/memory/products/atlas-web.yml"         .sanstudio/memory/product.yml
```

Record the pack commit in `contract.yml` so a reviewer can tell which version the
session used. Re-copy after the pack changes; the chain does not sync.

The pack's `adapters/`, `products/*.yml`, `scenarios/` and `config/` belong to the
Harness coordinator (repositories, branches, delivery), not to the design chain,
and are not copied.

## Keeping contracts out of the public repository

Private brand contracts never enter the sanstudio repository or the marketplace
package. `.sanstudio/` lives in the product repository (or any working folder) and
is listed in that repository's `.gitignore` when the pack is private.
