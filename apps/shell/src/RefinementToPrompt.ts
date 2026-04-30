// Converts a list of refinements (each = region + note + diffs) into a
// markdown prompt the user can paste into Claude Code as a Gate 3 ITERATE
// turn. Layer 0 is "copy + paste manual"; Layer 1 will hand this same
// string to the daemon for direct continuation.
//
// The prompt structure mirrors the CONTEXT-LOCK / DESIGN-LOCK shape Gate 3
// already understands: explicit instructions, scoped context, structured diff
// list. Gate 3 already has a Step 12 "Iteration" branch — this prompt feeds it.

import type { EditDiff, PendingSelection } from './refineProtocol';

export interface SavedRefinement {
  id: string;
  region: PendingSelection['target'];
  note: string;
  diffs: EditDiff[];
  createdAt: string;
}

export interface BuildPromptOptions {
  /** Current artifact's path on disk, e.g. "sessions/2026-04-30-fintech/html/index.html" */
  artifactPath?: string;
  /** Session slug — Gate 3 needs this to know which DESIGN.md to keep. */
  sessionSlug?: string;
}

const DIFF_TYPE_LABEL: Record<EditDiff['type'], string> = {
  text_change: 'Text change',
  hide: 'Hide',
  remove: 'Remove',
};

function describeDiff(diff: EditDiff): string {
  if (diff.type === 'text_change') {
    return `- **Text change** in \`${diff.target}\`:\n  - before: "${diff.before}"\n  - after:  "${diff.after}"`;
  }
  if (diff.type === 'hide') {
    return `- **Hide** \`${diff.target}\`${diff.preview ? ` — "${diff.preview}"` : ''}`;
  }
  if (diff.type === 'remove') {
    return `- **Remove** \`${diff.target}\`${diff.preview ? ` — "${diff.preview}"` : ''}`;
  }
  // Future-proof: anything we don't know, render generically.
  const generic = diff as unknown as { type: string; target: string };
  return `- **${DIFF_TYPE_LABEL[generic.type as EditDiff['type']] ?? generic.type}** in \`${generic.target}\``;
}

function describeRegion(r: PendingSelection['target']): string {
  const crumb = r.breadcrumb && r.breadcrumb.length > 0 ? r.breadcrumb.join(' › ') : r.label;
  return `\`${r.selector}\` — ${crumb} (${r.tag})`;
}

export function buildIteratePrompt(
  refinements: SavedRefinement[],
  opts: BuildPromptOptions = {},
): string {
  if (refinements.length === 0) {
    return '(no refinements yet — pick a region and write a note before generating an iterate prompt)';
  }

  const header = [
    '/design-lock ITERATE',
    '',
    "Apply the user's refinements below to the current Gate 3 artifact.",
    'Diffs marked **applied** were already executed in the live preview by the user — accept them as ground truth and merge into the next HTML.',
    'Notes describe the *intent*; use them to extend or polish beyond the literal diff (e.g. if the user said "more punchy" and only changed two words, propose a tighter version of the surrounding section in the same spirit).',
    '',
  ];

  if (opts.artifactPath) {
    header.push(`Current artifact path: \`${opts.artifactPath}\``);
  }
  if (opts.sessionSlug) {
    header.push(`Session slug: \`${opts.sessionSlug}\` — keep DESIGN.md and visual_contract intact, do not reset.`);
  }
  if (opts.artifactPath || opts.sessionSlug) header.push('');

  const sections: string[] = [];
  refinements.forEach((r, i) => {
    const lines: string[] = [];
    lines.push(`## Refinement ${i + 1}`);
    lines.push('');
    lines.push(`**Region:** ${describeRegion(r.region)}`);
    if (r.region.snippet) {
      lines.push('');
      lines.push(`**Region snippet:** \`${truncate(r.region.snippet, 160)}\``);
    }
    lines.push('');
    lines.push('**User note:**');
    lines.push('');
    lines.push('> ' + (r.note.trim() || '_(no note)_'));
    lines.push('');
    if (r.diffs.length > 0) {
      lines.push(`**User edits (already applied in preview, ${r.diffs.length}):**`);
      lines.push('');
      for (const d of r.diffs) lines.push(describeDiff(d));
    } else {
      lines.push('**User edits:** none — this is a pure annotation.');
    }
    sections.push(lines.join('\n'));
  });

  const footer = [
    '---',
    '',
    '## Output',
    '',
    'Regenerate the artifact HTML reflecting all refinements above. Honor existing DESIGN.md tokens and Gate 3 layout/QA rules. Surface the new file path; do not paste HTML into the chat.',
  ];

  return [header.join('\n'), sections.join('\n\n---\n\n'), footer.join('\n')].join('\n');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}
