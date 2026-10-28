# Visitor mode and invention scope

Gate 1 sets two classifications that every later gate reads. They decide how
ambitious the work should be and how much of it is open for invention. Neither
is a style. A dashboard and a landing page for the same product get different
modes; a new screen in an existing app and a rebrand get different scopes.

## Visitor mode

Pick the mode from the surface being designed, not from the product. A
developer tool's landing page is Persuade; its settings page is Operate; its
docs are Read.

| Mode | Typical surfaces | The visitor succeeds when | Ambition shows as |
|---|---|---|---|
| Persuade | landing page, marketing site, pricing, campaign, onboarding promo | they understand the offer and act | a committed point of view: a world, a demonstration, one working action |
| Operate | app screens, dashboards, editors, admin, settings, tools, forms | they finish a task | precision, consistency, familiar controls, one signature move |
| Read | docs, help, articles, changelogs, reports | they understand something | a calm reading column inside a frame that carries the brand |
| Experience | portfolio, gallery, showcase, game menus, brand moments | they are inside the work | the work leads from the first viewport; the interface recedes |

A surface that mixes modes takes the mode of its first viewport and names the
second one for the section where it applies (a pricing page with a calculator
is Persuade with an Operate section).

### What each mode changes

**Typography register** (`CR-TYPE-002`). Operate and Read are well served by
workhorse UI faces and system stacks (Inter, SF Pro, Roboto, IBM Plex Sans,
Source Sans): on these surfaces they are a chosen answer, not a default.
Persuade and Experience want a face with a point of view; the faces models
reach for first (Inter as display, Fraunces, Playfair Display, Space Grotesk,
DM Sans, Instrument Serif, Outfit, Plus Jakarta Sans) need a reason specific
to this brief, and a subject association ("serif because it is premium") is
not one.

**Color posture** (`CR-COLOR-004`). Operate defaults to Restrained, but color
still does real jobs: the shell (a tinted rail or header), state, data series,
selection, the signature move. A grey screen with one blue button is the
category default without its polish, not restraint. Read is frame-led: the
frame may commit, the column stays calm. Persuade and Experience may take
Committed or Drenched when the brief allows.

**What the world may supply.** On Persuade and Experience the chosen world can
structure the page. On Operate it lends four things only: type, palette,
density and one signature move. It never supplies the layout, the navigation
model or the controls; a terminal's function-key bar or an instrument bezel on
a working screen is a costume (`CR-MODE-001`). On Read the world owns the frame
(masthead, rail, section openers, how code and tables are set) and never the
reading order or the column.

**What Gate 2 directions vary.**
- Persuade: the world, and how the opening demonstrates the product.
- Operate: the navigation model (side rail, top bar, command-first), how work
  areas divide the screen, which data leads, density, where the signature move
  sits. Never the controls.
- Read: the navigation model (tree, tabs, inline contents), the column and
  margin system, how densely reference material sits.
- Experience: what leads, and how exploration unfolds.

**What the first viewport must do** (Gate 3, checked in the review).
- Persuade: make the offer intelligible, expose the action the category's
  visitors came to take in its working form (a search, an open slot, add to
  cart; not a link to it elsewhere), and show one thing only this product can
  prove.
- Operate: the shell first (navigation, the work areas and what each is for,
  the data read first and its states), then the signature move.
- Read: where the reader is, an opening that answers or frames their question,
  the column, the way forward.
- Experience: the work itself.

**Self-check.**
- Persuade: the memory test. If someone left after one viewport, what would
  they describe an hour later? A mood means the concept has not committed.
- Operate: cover the product name. Does it read as a working product of its
  category, could the task be done from it, and is it at least as clean as the
  category's best and more distinctive?
- Read: can a reader tell where they are and where to go next? Cover the name:
  could this be any other product's docs?
- Experience: does the work lead, or the chrome?

## Invention scope

| Scope | When | What is open | Gate 2 |
|---|---|---|---|
| `extend` | a change inside an existing surface: a new section, component, state or field | purpose, content, hierarchy, states, how it joins the surroundings | none; fast lane |
| `surface` | a whole new page, screen or flow inside an established world (a `DESIGN.md`, a `.sanstudio/` contract or coherent production UI) | structure and composition; the world is fixed | directions vary structure only |
| `world` | no visual authority yet, or a redesign or rebrand that replaces the look | the world and the structure | directions vary world and structure |

Rules:
- A missing `DESIGN.md` does not make a project greenfield. A coherent identity
  already in production code is an established world; record it, do not
  replace it.
- **Refinement preserves; redesign replaces.** An `extend` or `surface` job
  keeps the incumbent identity, behavior, copy and everything outside scope. A
  `world` redesign keeps product truth, content, function and constraints, and
  treats the old look as evidence of what the product is, not authority over
  what it becomes. Never split the difference by polishing a look you were
  asked to replace.
- `world` scope needs at least the standard lane. An `extend` job never runs a
  direction round.

## The rut

Before Gate 2 proposes anything on `surface` or `world` scope, write two
lines in the direction brief:

- **Category default:** the page this category always ships (for a fintech
  dashboard: a left nav, four KPI tiles, a line chart, a recent-transactions
  table on white with one blue accent).
- **Predictable opposite:** the reflexive escape from it (the same dashboard,
  dark, with neon accents and glass cards).

Both are the rut. Neither may be one of the three directions. They are named so
everyone can see what the directions are refusing.

Also refuse the clusters AI interfaces fall into regardless of subject when
the brief leaves the aesthetic free (`CR-WORLD-001`): warm cream ground with a
high-contrast serif and a terracotta accent; near-black with one neon accent
and glowing edges; broadsheet hairlines with an italic display serif and small
tracked mono labels; flat saturated ink with black boxes, hard offset shadows
and heavy condensed type. Each is legitimate when the brief, `TASTE.md` or a
contract calls for it. Landing in one when nothing called for it means the
direction was not decided.

## Candidate pool and spread

For `world` scope (and `surface` scope when the structure is genuinely open):

1. Name the product's mechanism in one sentence, the audience's real scene,
   and what this first surface must prove.
2. List five to seven concrete things the audience knows by heart: artifacts,
   places, rituals, publications, notations, data graphics, interfaces. For
   each, one line on why it can carry the mechanism and one on how it looks
   (ground and main colors, type voices, the one signature). Order by
   resonance. On Operate and Read surfaces the candidates still come from
   anywhere in that world; the mode decides how much of each may enter.
3. Spend at most one candidate on the brief's literal metaphor (a product
   called "Harbor" does not need three nautical directions).
4. Choose the three to show by spread, not by rank: one from the top third,
   one from the middle, one from the far end that still holds. The most obvious
   reading never fills all three slots.
5. Pair each chosen candidate with a scope cut (Doable MVP, Ideal, Creative
   Wildcard) so the three differ on both axes.

Show the full pool in one compact table under the three directions, so the
user can pull a different candidate in by number.

**The standing door.** Below the three, one quiet line: "Category standard,
played straight". It is the user's door, never the recommendation and never
weighed against the three. When the user takes it, ask for two or three
products it should sit beside and make their craft the bar.

## Direction contract

When the user locks a direction, Gate 2 writes six short blocks, about 150
words in all, into the direction brief and the `---DIRECTION-LOCK---` block.
Gate 3 builds to it and the review checks each block was kept.

- **THESIS:** the one idea this surface owns, and the category-default
  arrangement it refuses.
- **OWN-WORLD:** the palette and component language, specific enough to
  recognize with all content removed.
- **STORY:** what the visitor understands, believes and does, in order.
- **FIRST VIEWPORT:** the exact composition: what is where, at what scale, and
  where the primary action sits.
- **SIGNATURE MOVE:** the one product-specific device or interaction, named
  concretely ("service health drawn as a transit map", "the schedule set in a
  timetable's column rhythm"). A direction whose world shows up only as a color
  scheme has not found its move.
- **FINISH:** what done means for this surface: review disposition `ship`,
  every craft rule checked, named risks.

The contract is development material. It never goes into the mockup's HTML,
comments, `data-*` attributes or visible copy.

Sources: the visitor modes, invention scope, rut, spread and direction contract
are adapted from impeccable by Paul Bakaus (Apache 2.0), rewritten for a
gated, prose-only chain.
