# Craft rules

Binding on every Gate 3 and Gate 4 run, for every brand. These are checkable
rules, not taste. The user's `TASTE.md` sits on top of them and may be stricter,
never looser. Each rule has an id so QA and the decision record can cite it.

## Content

- `CR-CONTENT-001` Real content only. Every amount, name, date and label is
  plausible real data. `$0.00`, "User Name", "Lorem" or an empty grey block in
  hi-fi is a failure.
- `CR-CONTENT-002` No grey placeholder rectangles (`#E5E5E5`, `#D1D1D1` or
  similar) standing in for images or text. Use a real image or remove the slot.
- `CR-CONTENT-003` Icons are SVG (Iconify or equivalent), one visual family per
  screen. Emoji as UI icons is an immediate reject.
- `CR-CONTENT-004` No em or en dashes in copy. No trailing punctuation in titles
  or headings.

## Color and contrast

- `CR-COLOR-001` At most three colors per screen: surface, primary, one accent.
  Semantic colors (success, danger, warning) do not count but stay restrained.
- `CR-COLOR-002` Body text contrast is WCAG AA or better (4.5:1; large text
  3:1). Low-contrast grey body text is a failure.
- `CR-COLOR-003` No pure `#000` or `#fff` as surface or text. Use off-white and
  charcoal.
- `CR-COLOR-004` No gradient, glow or second accent without a declared role in
  `DESIGN.md`.

## Hierarchy and layout

- `CR-TYPE-001` At least three type sizes on a screen. Hierarchy is built with
  size and weight before color.
- `CR-LAYOUT-001` One focal point per screen. Remove before adding.
- `CR-LAYOUT-002` Surface fit: no hero section, 80 to 120px section gaps or
  50/50 splits inside a phone frame. No phone shell or bottom tab bar on a
  marketing site.
- `CR-LAYOUT-003` Bento grids only when requested. Default to single column,
  asymmetric or editorial composition.
- `CR-FLOW-001` A sub-flow, modal or sheet returns to the screen it was opened
  from, with scroll position and state preserved. Redirecting elsewhere needs
  an explicit requirement and a note in the decision record.

## Controls

- `UI-PILL-001` No dot markers inside pills or chips. A status pill, filter
  chip, segmented option or tag never contains a standalone circular dot,
  bullet or status light, in any state (default, hover, selected, focus,
  disabled, loading, error), whether drawn as an icon, pseudo-element,
  background layer or animation. Selection uses fill, border, weight or a
  meaningful non-dot icon; focus uses the outer focus ring. A content icon,
  avatar or spinner is not a dot. Removing the dot must not leave a phantom gap.
- `UI-STROKE-001` No stroke as container boundary. Cards, chips, list rows,
  sections and panels do not get a 1px border. Separate them with surface
  difference, hairline dividers or space. Allowed strokes: input fields, focus
  rings, hairline dividers between rows. A bordered card or chip is a failure.
- `UI-CHIP-001` Chips are for enumerable tags or filters only, at most one
  group per screen, never decoration. Grey-on-grey chips or a row of colored
  chips carrying information is a failure; use a fact row, hairline label or
  weight emphasis instead.
- `UI-ICON-001` An icon paired with a label matches its apparent stroke weight
  and shares one optical center. The pair is centered in its hit area without
  moving the control from its intended horizontal position. Holds across all
  states and text sizes.
- `UI-EDGE-001` Controls and their opened menus keep a usable gutter from the
  viewport, safe area and container edges. Use one spacing token per layout
  context, not per-control margins. Menus flip, shift or constrain near an
  edge rather than clipping; focus rings need room outside the control.

## Navigation and responsive

- `UI-NAV-001` Pages in one navigation family share header geometry: inset,
  row height, title start and baseline, back and action slot sizes. Forward
  and back navigation, loading states and long titles must not shift the title.
  A different header variant needs a declared reason in `DESIGN.md`.
- `UI-RESP-001` On web, every affected destination and essential action has a
  usable entry on both desktop and mobile widths. Adapt placement; never let
  an entry disappear at a breakpoint without an equivalent route. Record the
  desktop and mobile entry map in the proposal.

## Honesty

- `CR-TRUTH-001` A mockup is a proposal preview, never product truth. Do not
  present Gate 3 HTML or a Figma frame as shippable code or as a finished
  product.
- `CR-TRUTH-002` Missing tools are evidence gaps, recorded in the artifact.
  Never invent a research finding, an image source or a precedent.

## How gates use this file

- Gate 3 loads it in Step 2.5 and checks every rule in the final QA checklist.
  Report the count of rules checked and any exceptions the user approved.
- Gate 4 inherits the same rules and adds state-level checks (every state of a
  pill, every header variant, every breakpoint entry).
- An exception is allowed only when the user asks for it in words. Write it in
  `docs/decisions.md` with the rule id.
