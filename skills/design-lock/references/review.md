# Fresh-eyes review

The agent that built a mockup is the worst judge of it: it remembers what it
meant, not what it made. Gate 3 ends with a review done from the rendered
result by a context that did not build it. The same protocol runs for a
CRITIQUE request on an existing design and for `REVIEW` on demand.

## When

- Gate 3, after the Anti-Slop Pass and Hi-Fi Fill, before the user sees the
  mockup. Every lane.
- Gate 1, when the entry type is CRITIQUE: the review is the critique.
- On demand: the user replies `REVIEW` at any gate that has a rendered artifact.

## 1. Render and capture

Open the HTML in whatever browser tool the agent has and capture the surface
at the sizes it ships at:

- Web: 1440 wide full page, and 390 wide full page.
- Mobile app: the declared device at its point size (390 x 844 by default),
  each key screen.
- The user's own viewport, when the host reports it.
- Every interactive state the brief names (open menu, error, empty), driven,
  not imagined.

Settle or disable entrance motion before capturing; an element hidden by
animation timing reads as missing. Then open each capture once and confirm it
shows what its name claims: no blank or black region, the right screen, fonts
loaded, images loaded. An invalid capture is recaptured, never reviewed.

No browser tool: review from source, record `evidence gap: no render`, and say
so in the report header.

## 2. Keep it independent

When the agent has a subagent tool, spawn the reviewer with only:

- the request, the CONTEXT-LOCK summary and the direction contract;
- the paths to `craft-rules.md`, the taste file and any `.sanstudio/` contract;
- the HTML path and the capture paths;
- the output contract below.

Do not pass your reasoning, your self-assessment or the QA results; they anchor
judgment. Without a subagent tool, finish the build first, then run the review
as a separate pass and lead the report with:

```
DEGRADED: single-context review (<reason>)
```

A silent single-context review is a failed review.

## 3. What the reviewer returns

**Specificity verdict.** Does it feel authored for this product, or could an
unrelated product use it unchanged? Cover the name and say what remains. Name
the `CR-WORLD-001` cluster if it landed in one.

**Promise check.** Each direction-contract block: kept, partly kept or broken,
with the evidence on the capture. Skip on `extend` scope.

**Mode check.** The first-viewport duty and self-check for the visitor mode
(`skills/design-chain/references/modes.md`). For Persuade, the memory test:
what would someone describe an hour after seeing one viewport?

**Heuristics.** Score Nielsen's ten heuristics 0 to 4 (0 absent, 2 workable
with friction, 4 genuinely excellent). On Persuade and Experience surfaces,
"flexibility and efficiency" and "help and documentation" may be `n/a` with a
one-line reason; total over the applicable maximum (`/32` when two are n/a,
never `/40` over a partial set). Be honest: most real interfaces land between
20 and 32 of 40.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | | |
| 2 | Match with the real world | | |
| 3 | User control and freedom | | |
| 4 | Consistency and standards | | |
| 5 | Error prevention | | |
| 6 | Recognition over recall | | |
| 7 | Flexibility and efficiency | | |
| 8 | Aesthetic and minimal design | | |
| 9 | Error recognition and recovery | | |
| 10 | Help and documentation | | |

**Cognitive load.** Decision points with more than four visible options;
anything the user must remember from another screen; jargon; visual noise
competing with the task.

**Personas.** Pick two or three by surface and walk the primary action as each.
List what broke for them by element name, not a description of the persona.

| Persona | Who | Picks up |
|---|---|---|
| Mina | expert on a deadline, keyboard first | missing shortcuts, extra clicks, forced tours |
| Theo | first visit, no context | jargon, icon-only controls, unclear next step |
| Ana | screen reader and keyboard only | focus order, labels, contrast, motion |
| Kai | breaks things on purpose | long input, empty and error states, double submit |
| Lu | one thumb, on a train, interrupted | touch targets, reachability, lost progress |

| Surface | Personas |
|---|---|
| Landing, marketing | Theo, Kai, Lu |
| Dashboard, admin, tools | Mina, Ana |
| Checkout, booking | Lu, Kai, Theo |
| Onboarding | Theo, Lu |
| Forms, wizards | Theo, Ana, Lu |
| Docs, reading | Theo, Ana |

When `.sanstudio/PRODUCT.md` or a contract names real audiences, add one
project persona built from them.

**Priority issues.** Three to five, most impactful first, each tagged:

| Tag | Meaning | Action |
|---|---|---|
| P0 | blocks the task | fix before the user sees it |
| P1 | significant difficulty; a user would contact support | fix before the user sees it |
| P2 | annoyance with a workaround | backlog |
| P3 | polish | backlog |

Each issue: what, why it matters, the concrete fix, and the refine verb that
addresses it (`skills/design-chain/references/refine.md`).

**Craft.** Rule ids from `craft-rules.md` that fail, and `.sanstudio/qa-policy.yml`
gates that fail.

**Disposition.** Exactly one: `ship`, `fix`, `rebuild` or `recapture`.

## 4. Act on the disposition

- `recapture`: the evidence failed, not the design. Recapture and review again
  in full.
- `rebuild`: fidelity failed wholesale. Regenerate the named regions and review
  again in full, not as a verdict on a fix list.
- `fix`: apply every P0 and P1 fix, then run a verdict pass that scores only
  those fixes.
- `ship`: show the user.

At most two fix rounds inside the gate. Whatever remains goes to the user in
the gate summary and stays in `docs/review.md` as the backlog for
`ITERATE polish`. Report at the scope actually reviewed: a verdict pass that
scored three fixes supports "the three fixes are resolved", not "no issues
remain".

## 5. Write `docs/review.md`

```markdown
# Review, <surface>, <date>
Method: independent subagent | DEGRADED: single-context (<reason>)
Captures: <paths>   Evidence gaps: <list or none>
Mode: <mode>   Scope: <scope>   Disposition: <ship|fix|rebuild|recapture>

## Specificity
## Promise check
## Heuristics  (<total>/<max>)
## Personas
## Priority issues
- [P1] <what> | why | fix | verb | status: open|fixed (<date>)
## Craft and contract failures
```

`ITERATE polish` reads the open items here and marks them fixed. A later
review appends a new dated section rather than overwriting the old one.

Sources: the two-assessment independence, heuristic scoring with mode
applicability, severity scale and persona walk are adapted from impeccable by
Paul Bakaus (Apache 2.0); the persona set and wording are original. Nielsen's
heuristics are by Jakob Nielsen.
