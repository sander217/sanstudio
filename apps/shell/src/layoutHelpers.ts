// Shared utilities used by both ChildLayoutControls (operates on children
// of a selected container) and SelfPositionControls (operates on the
// selected element itself). Kept in one place so DOM-reading and
// constraint-detection logic doesn't drift between the two.

export interface ParentConstraint {
  /** Reason text shown in the warning banner. */
  reason: string;
  /** True when the constraint truly limits free positioning. */
  blocking: boolean;
}

export function readNumericStyle(el: Element, prop: string): number {
  const view = el.ownerDocument?.defaultView ?? window;
  const raw = view.getComputedStyle(el).getPropertyValue(prop);
  const m = raw.match(/-?\d+(?:\.\d+)?/);
  return m ? Math.round(Number(m[0])) : 0;
}

/** Parse the translate(X, Y) values out of getComputedStyle's matrix form. */
export function readTranslateFromMatrix(el: Element): { x: number; y: number } {
  const view = el.ownerDocument?.defaultView ?? window;
  const transform = view.getComputedStyle(el).transform;
  if (!transform || transform === 'none') return { x: 0, y: 0 };
  // `matrix(a, b, c, d, tx, ty)` — tx/ty are last two of 6
  const m2d = transform.match(/^matrix\(([^)]+)\)$/);
  if (m2d) {
    const parts = m2d[1].split(',').map((s) => Number(s.trim()));
    if (parts.length === 6) {
      return { x: Math.round(parts[4]), y: Math.round(parts[5]) };
    }
  }
  // `matrix3d(...)` — tx/ty/tz are at index 12, 13, 14
  const m3d = transform.match(/^matrix3d\(([^)]+)\)$/);
  if (m3d) {
    const parts = m3d[1].split(',').map((s) => Number(s.trim()));
    if (parts.length === 16) {
      return { x: Math.round(parts[12]), y: Math.round(parts[13]) };
    }
  }
  return { x: 0, y: 0 };
}

export function shortSnippet(el: Element): string {
  const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ');
  if (text) return text.length > 40 ? text.slice(0, 37) + '…' : text;
  if (el.tagName === 'IMG') return `<img src="${(el as HTMLImageElement).getAttribute('src') ?? ''}">`;
  const cls = (el as HTMLElement).className;
  if (typeof cls === 'string' && cls) return `.${cls.split(/\s+/).slice(0, 2).join('.')}`;
  return '(empty)';
}

export function isContainerCandidate(tag: string): boolean {
  const containerTags = new Set([
    'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'NAV',
    'UL', 'OL', 'FORM', 'FIELDSET', 'FIGURE', 'PICTURE',
  ]);
  return containerTags.has(tag.toUpperCase());
}

/** CSS shorthand: omit the second value when V === H so the diff is concise. */
export function paddingShorthand(y: number, x: number): string {
  return y === x ? `${y}px` : `${y}px ${x}px`;
}

export function clampInput(raw: string, min: number, max: number): number | null {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '-') return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** Detect parent CSS that may limit free positioning of the element. */
export function detectParentConstraints(parent: Element): ParentConstraint | null {
  const view = parent.ownerDocument?.defaultView ?? window;
  const cs = view.getComputedStyle(parent);
  const reasons: string[] = [];
  let blocking = false;

  if (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflowY === 'hidden') {
    reasons.push('overflow: hidden — translated children get clipped at the parent edge');
    blocking = true;
  }
  if (cs.display === 'grid' || cs.display === 'inline-grid') {
    reasons.push('display: grid — children sit in fixed grid slots; translate offsets visually but slot anchor stays put');
  }
  if (cs.display === 'flex' || cs.display === 'inline-flex') {
    const justify = cs.justifyContent;
    if (justify && justify !== 'flex-start' && justify !== 'normal') {
      reasons.push(`flex with justify-content: ${justify} — siblings may rebalance around translated child`);
    }
  }
  if (cs.contain === 'strict' || cs.contain === 'layout' || cs.contain === 'size') {
    reasons.push(`contain: ${cs.contain} — layout effects don't propagate; visual shifts may look isolated`);
    blocking = true;
  }
  if (reasons.length === 0) return null;
  return { reason: reasons.join(' · '), blocking };
}

export function buildAiRestructurePrompt(
  containerLabel: string,
  containerSelector: string,
  artifactPath: string | null,
  reason: string,
): string {
  const file = artifactPath ?? '<artifact path>';
  return [
    `Refactor \`${containerSelector}\` (${containerLabel}) so each child can be repositioned`,
    `independently of its siblings — Figma-style free-form positioning.`,
    ``,
    `Current constraint: ${reason}`,
    ``,
    `Apply one of these strategies, whichever preserves the visual intent best:`,
    `  1. Give the container \`position: relative\` and convert children to`,
    `     \`position: absolute\` with explicit top/left in px, anchored to`,
    `     their current visual positions.`,
    `  2. If the layout truly needs flow, replace tight constraints (overflow:`,
    `     hidden, strict justify-content) with looser rules that allow per-`,
    `     child margin/transform tweaks.`,
    ``,
    `Apply to: ${file}`,
    `Keep all other styling (typography, colors, hierarchy) intact.`,
  ].join('\n');
}
