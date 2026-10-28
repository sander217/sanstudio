# Craft rules

Binding on every Gate 3 and Gate 4 run, for every brand. These are checkable
rules, not taste. The user's `TASTE.md` sits on top of them and may be stricter,
never looser. Each rule has an id so QA and the decision record can cite it.

Two kinds of line live here. A **ban** holds no matter what the brief says. A
**default-refusal** names a habit models fall into when nobody decided; the
session `DESIGN.md`, the visual contract or the user's words can earn it back,
and then `docs/decisions.md` records the rule id and the reason. Lines are bans
unless marked `(default)`.

Sources: sanstudio's own manifesto, the five Design Harness UI rules, and the
floors of impeccable (pbakaus) and hallmark (Together AI), distilled to what a
reviewer can verify on a render.

## Content

- `CR-CONTENT-001` Real content only. Every amount, name, date and label is
  plausible real data. `$0.00`, "User Name", "Lorem" or an empty grey block in
  hi-fi is a failure.
- `CR-CONTENT-002` No grey placeholder rectangles (`#E5E5E5`, `#D1D1D1` or
  similar) standing in for images or text. Use a real image or remove the slot.
- `CR-CONTENT-003` Icons are SVG (Iconify or equivalent), one visual family and
  one stroke weight per screen. Emoji or Unicode glyphs as UI icons is an
  immediate reject.
- `CR-CONTENT-004` No em or en dashes in copy. No trailing punctuation in titles
  or headings. Curly quotes, a true ellipsis, a non-breaking space inside unit
  pairs.
- `CR-CONTENT-005` Claims come from supplied truth. A number, testimonial, logo
  wall or award the brief did not give is never invented. A missing fact the
  page cannot do without becomes a visible labelled slot ("Venue to be
  announced", muted, dashed outline), at most two per page. Sample data inside
  a product UI reads as a sample (round amounts, `example.com`), never as a
  claim about the client.
- `CR-CONTENT-006` No div-built fake screenshots. A product preview is a real
  screenshot, a real mini component or photography, never styled rectangles
  pretending to be a dashboard, a task list or a terminal.
- `CR-CONTENT-007` Illustration is real or absent. No sketch-style SVG scenes,
  no `feTurbulence` grain as art, no geometric mask faking a photo cut-out.
  Crisp vector geometry (diagrams, shapes, linework) stays first class.

## Copy voice

- `CR-COPY-001` The swap test: a headline that would work on a competitor's
  page is rewritten with a noun only this product has. Section heads say what
  the reader gets, never a category label ("Features", "Our story", "Why us").
- `CR-COPY-002` Banned phrases: "Reimagine", "Whether you're X or Y", "It's not
  just X, it's Y", "Say goodbye to", "game-changer", "journey", "Seamless",
  "Elevate", "Quietly trusted by", "Oops", a colon title ("Focus: the app
  for"), "Click here", "Enter your email below". Fake-perfect numbers
  (`99.99%`) and startup-slop names (`Acme`, `Nexus`) count as copy slop.
- `CR-COPY-003` Buttons name the verb of the action ("Book a fitting").
  Errors say what happened and what to do. Empty states say what is empty,
  why it matters and one action.
- `CR-COPY-004` Budget: headlines seven words or fewer, section heads six or
  fewer, paragraphs two short sentences, no triads of adjectives ("fast,
  simple, powerful").

## Type

- `CR-TYPE-001` At least three type sizes on a screen. Hierarchy is built with
  size and weight before color.
- `CR-TYPE-002` The face is chosen from the brief, never defaulted. Read the
  prompt, the reference and the overall style, then pick the family that fits
  them and write one line in `DESIGN.md` saying why. Inter, Roboto, Helvetica
  or the system face are fine answers when the style calls for them (a product
  UI, an operate surface, a brand that already uses them); they fail only when
  they appear because nobody decided. The tell is a face with no reason in
  `DESIGN.md`, or the same face across unrelated briefs. The register follows
  the visitor mode (`skills/design-chain/references/modes.md`): on Operate and
  Read surfaces workhorse UI faces and system stacks are well-chosen answers;
  on Persuade and Experience surfaces the faces models reach for first (Inter
  as display, Fraunces, Playfair Display, Space Grotesk, DM Sans, Instrument
  Serif, Outfit, Plus Jakarta Sans) need a reason specific to this brief, and a
  subject association is not one. Native mobile app shells keep SF Pro and
  Roboto for system chrome regardless.
- `CR-TYPE-003` At most two families: a display face and a body face, or one
  family for both. A third face carries exactly one role (wordmark, headline
  figure or code). At most three weights across the page, picked as extremes
  (300 beside 700, 400 beside 800), never 500 beside 600.
- `CR-TYPE-004` Display: tracking between -0.02em and -0.04em on a
  regular-width face, never tighter than -0.04em; line-height 1.0 to 1.15. A
  heading is one weight, one style, one color: no single word set apart by
  italic, color, weight or highlight. Body: 16px minimum, line-height 1.5 to
  1.65, measure 45 to 75ch, never justified, never all caps. `text-wrap:
  balance` on heads, `pretty` on body. `tabular-nums` on figures that compare.
- `CR-TYPE-005` No eyebrow. The small tracked-uppercase label above a heading
  ("WHY US", "HOW IT WORKS", "01 · Capabilities") is the single most reliable
  machine tell. The heading carries its own weight. Legal because they name
  something present: a `<figcaption>`, a `<th>`, a `<label>`, a tab, a byline,
  a unit after a figure. Labels, chips, nav links and table heads are sentence
  case and untracked.
- `CR-TYPE-006` Monospace only for code, figures or measurement, never as a
  costume for "technical" `(default)`.

## Color

- `CR-COLOR-001` At most three colors per screen: surface, primary, one accent.
  Semantic colors (success, danger, warning) do not count but stay restrained.
- `CR-COLOR-002` Body text contrast is WCAG AA or better (4.5:1; large text,
  icons, focus rings and field edges 3:1). Low-contrast grey body text is a
  failure. Grey text never sits on a colored surface; tint secondary text from
  the surface or foreground hue.
- `CR-COLOR-003` No pure `#000` or `#fff` as surface or text. Neutrals are
  tinted toward the brand's anchor hue (OKLCH chroma 0.005 to 0.018), not
  flat grey.
- `CR-COLOR-004` The accent is a signal, not a fill `(default)`. Under about 5%
  of any viewport: the primary control, an active nav item, a focus ring, a
  link on hover, the one series a chart argues from. A declared posture in
  `DESIGN.md` (committed field, drenched surface) is the only way to spend
  more, and a declared surface color is not accent footprint.
- `CR-COLOR-005` Gradient policy. Gradients are allowed only as a declared
  surface or control treatment with a recipe in `DESIGN.md` or `TASTE.md`:
  one hue family (hue drift under 15 degrees), at most three stops, the stops
  differ mainly in lightness, and text on top passes contrast at the lightest
  point. Banned outright: gradient text; purple-blue, purple-pink or
  cyan-on-dark gradients; the centered hero over a dark purple mesh; a
  gradient behind running body copy; a gradient inside a chip, pill or small
  control. Without a recipe, no gradient.
- `CR-COLOR-006` No glow. No zero-offset colored halo shadows, chromatic
  "spotlights", neon bloom or frosted glass as decoration. A shadow carries an
  offset and a soft blur, one per page at most, and an elevated surface is
  never darker than its canvas.
- `CR-COLOR-008` Light or dark is chosen from the use scene (who, where,
  under what light), never from the category ("developer tool, so dark").
  Write the one-line reason in `DESIGN.md`.
- `CR-COLOR-007` Dark mode is composed, never the light theme inverted. Surface
  steps are lightness steps in the ground's own hue.

## Hierarchy and layout

- `CR-LAYOUT-001` One focal point per screen. Remove before adding.
- `CR-LAYOUT-002` Surface fit: no hero section, 80 to 120px section gaps or
  50/50 splits inside a phone frame. No phone shell or bottom tab bar on a
  marketing site.
- `CR-LAYOUT-003` Bento grids only when requested `(default)`. Default to single
  column, asymmetric or editorial composition. A web page has a primary axis
  (left-biased, right-biased, top-heavy or bottom-weighted); centre-biased
  everywhere is an unmade decision.
- `CR-LAYOUT-004` The surface ladder: whitespace, then a hairline, then a
  tinted well (no border), then a card (a border or a shadow, never both). Use
  the lowest rung that works. Never a card inside a card, never white cards on
  a tinted page, never a bordered box inside a well, never a colored left
  border thicker than 1px on a card, list item or callout. Card radii 12 to
  16px, concentric inside (inner = outer minus padding); pills are for small
  controls only.
- `CR-LAYOUT-005` Page scaffolds that read as templates `(default)`: same-size
  icon-heading-text cards as the page structure; three identical feature cards
  in a row; the hero-metric template (big number, small label, supporting
  stats); section numbers (01 / 02 / 03) when the sequence carries no
  information. Across a scrolling page each layout family appears at most
  once, and no more than two image-and-text splits run consecutively.
- `CR-LAYOUT-006` Spacing is a scale (2, 4, 8, 12, 16, 24, 40, 64, 96, 144),
  tight inside a group, generous between groups, more space above a heading
  than below it. At most three optical nudges off the scale per page.

## Space

- `CR-SPACE-001` Generous whitespace is the default. Screen gutters at least
  16px on a phone, 24px on a tablet, 64px on a desktop container; sections on
  a web page part by 120 to 176px; a card or well carries 32 to 40px of
  padding on web and 16 to 20px in an app. Space is earned by mass: an empty
  looking page wants a bigger heading, a fuller section or a larger visual,
  never a smaller gap. Rhythm comes from contrast between tight and generous
  intervals, not one value repeated until everything weighs the same.
- `CR-SPACE-002` Nothing touches an edge. Text inside any filled, tinted,
  bordered or hoverable box sits at least 8px from the box's left and right
  edges and at least 4px from its top and bottom, before any optical nudge.
  Measure the painted box, not the element's margin. A label flush to its
  container's edge is a failure even when the container has no visible fill,
  because its hover or focus state will paint one.
- `UI-TAB-001` Tab, segment and nav labels keep 8px of padding in every
  state. The label text is inset at least 8px from its item's left and right
  edges and 8px from top and bottom (12px horizontal on web nav). The hover
  background, active fill, focus ring and selected underline all span the
  padded item box, never the text's own width. The first and last item's text
  is never flush with the tab bar or screen edge: the bar carries its own
  gutter (the screen gutter, at least 16px). Hit target is 44px tall even
  when the painted item is shorter; expand it with a transparent inset, not by
  stretching the label. Changing padding between states (hover, pressed,
  selected) is a failure; only color, weight and the indicator change.
- `CR-FLOW-001` A sub-flow, modal or sheet returns to the screen it was opened
  from, with scroll position and state preserved. Redirecting elsewhere needs
  an explicit requirement and a note in the decision record. A modal is for a
  task that needs interruption or protected focus, nothing else.

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
- `UI-CTRL-001` One filled primary control per screen (a dialog counts as its
  own screen). Secondaries are outlined or typographic and never louder than
  the primary. Hover is one signal that raises contrast; the focus ring is an
  outline, never a border change, and never animates. Disabled is opacity plus
  the native attribute. Two button sizes at most; an input matches the button
  beside it.

## World and mode

- `CR-WORLD-001` AI aesthetic clusters `(default)`. Where the brief leaves the
  aesthetic free, do not land in one of the looks AI interfaces converge on
  regardless of subject: warm cream ground with a high-contrast serif and a
  terracotta or signal-red accent; near-black with one neon accent and glowing
  edges; broadsheet hairlines with an italic display serif and small tracked
  mono labels; flat saturated ink with black boxes, hard offset shadows and
  heavy condensed type. Each is legitimate when the brief, `TASTE.md` or a
  contract calls for it. If someone could guess the aesthetic from the
  category alone, the direction was not decided.
- `CR-MODE-001` On an Operate surface the chosen world lends type, palette,
  density and one signature move, and nothing else. Navigation, layout model
  and controls stay the standard ones for the platform (web components on the
  web, native controls in an app). A terminal's function-key bar, an
  instrument bezel or ruled ledger paper standing in for a table is a costume.
  On a Read surface the world owns the frame and never the reading column.
- `CR-MODE-002` The first viewport is a thesis, not a header. It does the job
  `modes.md` gives its visitor mode, and passes the memory test: someone who
  saw only that viewport could describe something specific an hour later.

## Motion

- `CR-MOTION-001` Motion is motivated or cut. One authored reveal per page,
  0.4 to 0.8s in all including stagger, from an already visible default; the
  same entrance on every section is the tell. Content is visible without it.
- `CR-MOTION-002` Animate `transform` and `opacity`; blur, clip-path, mask and
  shadow only when smooth on the element alone. Never `transition: all`, never
  animate width, height, top or left. Exponential ease-out for arrivals, no
  bounce or overshoot on UI state. Every animation has a
  `prefers-reduced-motion` fallback that shows the end state at once.
- `CR-MOTION-003` Never: parallax, mouse parallax, custom cursors or cursor
  followers, auto-rotating carousels, a marquee that will not pause, a pulsing
  dot, a starfield, an infinite loop other than a loader.

## Navigation and responsive

- `UI-NAV-001` Pages in one navigation family share header geometry: inset,
  row height, title start and baseline, back and action slot sizes. Forward
  and back navigation, loading states and long titles must not shift the title.
  A different header variant needs a declared reason in `DESIGN.md`.
- `UI-RESP-001` On web, every affected destination and essential action has a
  usable entry on both desktop and mobile widths. Adapt placement; never let
  an entry disappear at a breakpoint without an equivalent route. Record the
  desktop and mobile entry map in the proposal.

## Finish

- `CR-FINISH-001` Browser surfaces carry the design: text selection, caret,
  focus ring, scrollbar, underline offset and tabular numerals are themed from
  the palette, not left at browser defaults. This is the cheapest signal that
  a page was designed rather than assembled.
- `CR-FINISH-002` Hero chrome slop: no version label ("V0.6", "BETA", "EARLY
  ACCESS") unless the brief is a launch page; no decoration text strips
  ("BRAND. MOTION. SPATIAL."); no fake locale or weather strip; no tagline,
  trust strip, pricing teaser and avatar row crammed under the hero CTA.
- `CR-FINISH-003` Affordances trace to the brief, not the reference. Borrow a
  reference's layout grammar, never its default action set. "TikTok-style"
  does not authorize follow, duet or stitch. When the brief names a verb,
  implement that verb. Every button maps to a requirement or it is cut.

## Honesty

- `CR-TRUTH-001` A mockup is a proposal preview, never product truth. Do not
  present Gate 3 HTML or a Figma frame as shippable code or as a finished
  product.
- `CR-TRUTH-002` Missing tools are evidence gaps, recorded in the artifact.
  Never invent a research finding, an image source or a precedent.

## How gates use this file

- Gate 3 loads it in Step 2.5, runs the Anti-Slop Pass (Step 8.5) against the
  `CR-COPY`, `CR-TYPE-005`, `CR-COLOR-005`, `CR-LAYOUT-005`, `CR-SPACE-002`,
  `UI-TAB-001` and `CR-FINISH` lines, and checks every id in the final QA
  checklist. Report the count of
  rules checked and any exceptions the user approved.
- Gate 4 inherits the same rules and adds state-level checks (every state of a
  pill, every header variant, every breakpoint entry).
- A `(default)` line is earned back only by the brief, `DESIGN.md`, `TASTE.md`
  or the user's words, never by the model's own preference. A ban is never
  earned back. Either way the exception is written in `docs/decisions.md`
  with the rule id.
