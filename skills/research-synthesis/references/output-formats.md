# Output formats

Choose the smallest format that answers the research question. Use the user's language for headings and prose; preserve original wording in quotes. The structures below are optional scaffolds, not a checklist to fill. Omit empty or irrelevant sections, combine modes when useful, and move detailed source registers into an appendix for larger corpora.

Start with the decision implication. Let readers follow each consequential claim to evidence without requiring them to read an entire appendix first. Write recommendations as an experience or research activity someone can understand; include implementation details only when needed to assess feasibility or a trade-off.

Jump to: [evidence conventions](#shared-evidence-conventions), [Synthesize](#synthesize), [Explore](#explore), [Evaluate](#evaluate), [Refresh](#refresh), [decision record](#decision-record-entry), [small input](#small-input-or-limited-access).

## Shared evidence conventions

Use stable identifiers where useful: `S1` for a source, `E1` for an evidence item, `C1` for a claim, and `D1` for a decision. Small inputs can use existing ticket IDs or transcript timestamps directly. Link identifiers to a local report anchor or supplied source; never fabricate URLs, missing timestamps, or source metadata.

The trace should be legible: **claim → specific evidence → source location**. A bibliography without claim-level attribution is insufficient. For an external page, include a descriptive link at the supported claim; for a supplied file, use its name and a page, section, row, or line marker that actually exists.

For consequential findings, distinguish:

- **Fact or observation:** what was reported, observed, or measured, with attribution. A source's causal explanation remains that person's explanation.
- **Interpretation:** the researcher's reading of those observations.
- **Hypothesis:** a possible explanation or expected effect, plus what could test it.
- **Confidence:** separately assess the problem, cause, and solution where relevant. Use plain judgments with reasons, such as “problem: supported for these two interviewees; cause: plausible; solution: untested.” Do not invent numeric confidence scores.

For a large corpus, a compact source register can carry shared metadata:

| Source | Type / originator / relay | Event or collection time | Published or recorded | Reviewed | Product version / context | Access and limits |
|---|---|---|---|---|---|---|
| S1: [source + location] | [interview, person or role; any relay] | [known date/range or unknown] | [date or unknown] | [actual review date] | [known context or unknown] | [full text, excerpt, partial; relevant limitations] |

Do not repeat this entire table for a single short item. A sentence can establish the same limits. Separate the report's preparation date from the date a past decision is being assessed. Unknown time or version information is a limitation, not an invitation to infer it.

## Synthesize

```markdown
# [Research question or decision]
Scope: [material, population, counting unit, known event dates and version]
Limits: [sampling, missing dates, unread material, secondhand evidence as relevant]

[One to three sentences: what this changes for the decision and what remains uncertain.]

## Findings
### C1. [Specific goal, friction, or positive outcome]
- Human context: [goal, situation, expectations, observed outcome, workaround and cost; unknowns stay unknown]
- Evidence: [exact quote or clearly attributed observation/metric] [source location]
- Interpretation: [what it suggests for this decision]
- Hypothesis / challenge: [alternative explanation, contradictory evidence, or testable assumption]
- Reach and confidence: [independent events and distinct people when countable; problem/cause/solution separately where relevant]

## Next step
- [Act, test, investigate, or monitor]: [concrete proposal and evidence it rests on]
- Assumption: [what must be true]
- Learn from: [observation or measure that would change the decision]

## Unanswered questions
[Decision-relevant gap → evidence that would help → who or where could provide it]

[Optional: existing work and what remains unverified; exclusions and reasons; evidence appendix]
```

Rank only when the decision requires prioritization and the evidence supports a comparison. State the basis and missing impact information. A single severe event can deserve attention without claims about prevalence. In-flight or completed tickets may still belong in findings if the user outcome remains uncertain.

## Explore

```markdown
# [Decision or problem to explore]
Scope: [people, context, constraints, decision date, current evidence limits]

[What appears worth investigating; do not imply that a solution has been validated.]

## What people are trying to do
[Goals, expectations, situation, behavior, workarounds and costs, each traced to evidence]

## What we know and need to learn
| Claim / question | Evidence | Interpretation and limits | What could change the assessment |
|---|---|---|---|
| C1: [...] | [E1 / source location] | [...] | [...] |

## Related research and precedents
| Finding or precedent | Source and evidence type | Relevance here | Limits or differences |
|---|---|---|---|
| [...] | [primary source link; study / descriptive metric / product precedent] | [...] | [...] |

## Directions to explore
| Direction | Human need and supporting evidence | Assumptions / trade-offs | Smallest useful learning step |
|---|---|---|---|
| [candidate, not a commitment] | [C1] | [...] | [...] |

## Next research question
[Highest-value uncertainty and how answering it changes the design choice]

[Search coverage and unresolved access gaps; source details if not already shown]
```

Directions can be design principles or opportunity areas when there is insufficient evidence for specific interfaces. Include a baseline or simpler alternative when it is a meaningful comparison; do not manufacture a fixed number of options. Failure to find applicable evidence is a valid result when the search scope and remaining gap are explicit.

## Evaluate

```markdown
# Evaluate: [proposed solution]
Decision: [what is being chosen, for whom, under which constraints and date/version]

[Assessment: supported in part / promising but untested / needs revision / insufficient evidence, with the decisive reason.]

## Assumptions and evidence
| Assumption | Supporting evidence | Challenging evidence / alternatives | Unknowns and applicability | Judgment |
|---|---|---|---|---|
| [required for this solution to work] | [claim-specific sources] | [sources or explicitly untested alternatives] | [...] | [reasoned, not a numeric score] |

Confidence: problem [judgment + why]; cause [judgment + why]; solution effectiveness [judgment + why].

## Options and trade-offs
[Compare the proposal with a relevant baseline or simpler alternative; distinguish observed outcomes from predictions.]

## Recommendation and validation
- Proposal: [concrete experience or experiment, with claim links]
- Assumption to test: [...]
- Method and participants/context: [proposed unless already conducted]
- Observe: [metric definition or qualitative behavior]
- Baseline: [measured value + source/date, or unknown]
- Decision criterion: [agreed criterion or explicitly proposed criterion; rationale]
- Reconsider if: [counter-result, burden, or failed assumption]

[Search coverage, source limits, and unresolved questions as needed]
```

Do not turn an external effect size into an expected lift for this product. A numeric success target without a measured baseline must be labeled **proposed**, with its rationale and need for calibration. An outcome already measured needs a source, population or denominator, method, and collection period. Qualitative validation may be more appropriate than an invented numeric threshold.

## Refresh

```markdown
# Research update: [question]
Previous record: [report/decision ID and date]
This assessment: [current or explicitly historical decision date; known version/context]
New material: [sources, event times and review coverage]

[What changed in the decision, including when the previous recommendation still stands.]

| Prior claim / decision | Previous assessment and evidence | New evidence or context | Applicability now | Decision implication |
|---|---|---|---|---|
| [C1 / D1] | [preserve original judgment and date] | [specific sources, or missing verification] | [still applicable / challenged / needs recheck / superseded; reason] | [...] |

## What to do next
[Updated action or research need, its assumptions, and the evidence that would settle it]

## Decision record update
[Append the update format below, or link to the new entry.]
```

A later publication can inform today's assessment without becoming evidence that the team possessed at an earlier decision date. Label retrospective support explicitly. A newer ticket does not establish a regression unless the sequence, version, and event evidence support that interpretation. Preserve unresolved contradictions instead of replacing the older claim merely because a newer document exists.

## Decision record entry

Use a compact entry for a consequential decision or change. Link to existing evidence rather than duplicating the report. If the prior record is unavailable, say so; do not reconstruct an invented history.

```markdown
### D1. [decision] ([decision date or unknown])
- Status: [proposed / decided / deferred / revisited; identify who decided only if known]
- Context: [people, task, constraints, product version, relevant date]
- Evidence considered: [claim IDs and source locations; what was available at the time]
- Judgment: [choice and rationale; problem/cause/solution confidence where relevant]
- Assumptions and unresolved challenges: [...]
- Validation: [measured result, or clearly proposed method and criterion]
- Revisit when: [new evidence, release, outcome, or explicit date; not an automatically scheduled task]

#### Update, [actual review date]
- Previous entry: [link or ID; retained]
- New evidence/context: [sources and dates; label later retrospective evidence]
- Change: [what judgment or action changed, or why it remains]
- Still unknown / next check: [...]
```

Append an update or create a linked successor; do not silently overwrite the old assessment. “Superseded” describes a changed applicability or decision, not deletion of the original evidence.

## Small input or limited access

For one short item, return the finding, its source, what it does not establish, and the next useful question or action. If the input contains only a feature request or team opinion, attribute it and identify what human context is missing.

If external research was requested but tools or sources are unavailable, report the supplied evidence separately, state that the search or full-text review was not completed, and give specific research questions and search concepts. Do not label a plan as research conducted or fill a source table with unverified citations.
