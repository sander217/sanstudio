# Refine verbs

`ITERATE <note>` takes free text. When the note is one of these verbs, the
gate follows the matching recipe instead of interpreting the note. Verbs give
the user a shared vocabulary and keep each pass scoped.

```
ITERATE <verb> [target][: note]

ITERATE bolder hero
ITERATE quieter
ITERATE distill settings screen: keep export
改 精簡 設定頁
```

They apply at Gate 3 (and at Gate 4 for `harden`). At Gate 1 or 2 a verb is
read as a steer for the next round.

## Rules for every verb

1. **Scope is sovereign.** Touch only the named target, or the whole screen
   when no target is named. Do not restyle neighbors or migrate the page to a
   new idea.
2. **No new primitives without asking.** A verb never adds a color, font,
   radius, shadow or component the surface does not already own. If the
   system cannot express the change, name the exact addition and the job it
   would do, and wait.
3. **Content stays true.** Existing claims, names and numbers are part of the
   scope. Ask before changing a factual line.
4. **Refinement preserves.** If the concept itself is wrong, say so and offer
   `BACK G2` instead of smuggling in a redesign.
5. **Show the diff.** Every verb ends with Step 9's before and after, then the
   Anti-Slop Pass and the review on the changed area.
6. Record the verb, target and note verbatim in `docs/decisions.md`.

## Verbs

| Verb | 中文 | Use when |
|---|---|---|
| `polish` | 打磨 | the direction is right and the finish is not |
| `bolder` | 更大膽 | one part reads flat against the rest |
| `quieter` | 收斂 | the screen is loud, busy or tiring |
| `distill` | 精簡 | there is too much on the screen |
| `harden` | 補強 | it only works with perfect data |
| `clarify` | 文案 | the words are unclear |
| `typeset` | 字體 | hierarchy or reading comfort is off |
| `layout` | 版面 | grouping, rhythm or spacing is off |
| `colorize` | 上色 | color is absent or doing no work |
| `motion` | 動態 | movement is missing, noisy or unexplained |
| `adapt` | 適配 | another viewport, device or context |
| `onboard` | 首次體驗 | first run, empty states, time to first value |

### polish

Refinement, never a concealed redesign. Read `docs/review.md` first and take
its open P0 and P1 issues as the backlog. Classify each drift before fixing
it: a missing token, a one-off that should use an existing component, a
conceptual mismatch with neighboring screens, or a local defect. Fix at the
narrowest correct level, in this order: broken or misleading states; missing
loading, empty, error, success and disabled states; flow, hierarchy,
responsive and system drift; visual and motion inconsistencies; cleanup.
Do not perfect one corner while the rest stays below the bar. Close the
backlog items you cleared in `docs/review.md`.

### bolder

Raise one target to the conviction its neighbors already imply. A section
usually reads flat because it opts out of the system's own strongest moves:
the display type at full strength, the signature move, the density shift. Use
those, not new effects; reaching for more effects is the opposite of bold.
Make one decisive move completely, then quiet everything around it so the move
reads. Skeleton test: strip the copy; does the structure alone still say what
the section is and why it matters? The result looks more like the same brand,
not less.

### quieter

Find the intensity sources: saturation, contrast extremes, competing weights,
motion, decoration, everything at large scale. On Persuade and Experience
surfaces quieter means more air and restraint with the point of view intact.
On Operate and Read surfaces it means less noise: fewer background accents,
flatter surfaces, less color and motion, so the tool disappears into the task.
Quiet is not generic: grey text on white, one weight and a grid of identical
cards is a failure, not restraint.

### distill

Name the one primary goal. Mark each element essential, hide-until-needed,
combine or remove. Use progressive disclosure for the second tier. Simplicity
removes obstacles, not features: ask before removing functionality the user
can reach today.

### harden

Feed the design the inputs real users bring: very long and very short names,
zero, one and many items, large numbers and currencies, CJK and RTL text and
40% expansion, slow and failed network, offline, missing permissions, partial
data. Every failure says what happened and what to do; no state is a blank
screen. On the major lane this moves to Gate 4's state matrix.

### clarify

Read the whole interaction path, not isolated strings. Rewrite so the user
knows what happened, what matters and what to do next. Keep facts, product
terms and voice. Apply `CR-COPY-001` to `004`.

### typeset

Name the roles the screen needs (display, heading, body, label, data), the
contrast between them, the reading measure and which faces are authoritative.
Use the fewest roles and families that make hierarchy unmistakable, in the
mode's register (`modes.md`). Fix adjacent roles whose sizes or weights are too
close to carry different jobs.

### layout

Squint test: with detail blurred, can you still find the primary element, the
secondary one and the groups, in order? Group by proximity before adding
containers. Build rhythm from tight and generous intervals, not one value
repeated. Match density to how often the screen is used. Apply `CR-SPACE-001`,
`CR-SPACE-002` and `CR-LAYOUT-004`.

### colorize

Choose the posture first (Restrained, Committed, Full palette, Drenched), then
roles, not swatches: canvas and surfaces, text, action and focus, selection,
state, data. Let the strongest color own a region instead of scattering
accents. Check contrast in every state.

### motion

Motion explains state, relationship or hierarchy, or makes one authored moment
the surface has earned. One orchestrated moment beats scattered hover effects.
Apply `CR-MOTION-001` to `003`.

### adapt

Rethink for the new context instead of scaling. Keep every destination and
essential action reachable (`UI-RESP-001`), resize touch targets for the new
input, and move content priority to what the new context needs first.

### onboard

Name the moment that proves the product is worth the user's time and shorten
the path to it. Empty states teach by doing: say what is empty, why it matters
and the one action that fills it. No tour that blocks the product.

Sources: the verb set and several recipes are adapted from impeccable by Paul
Bakaus (Apache 2.0), rewritten for the gate model.
