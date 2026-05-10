// Arrow-key nudge: when an element is selected, the user can fine-tune its
// position via ↑↓→← (Shift = 10× step). Replaces the SelfPositionControls
// sliders — keyboard is more direct for designers and frees the panel.
//
// Applies inline `transform: translate(x, y)` on the selected iframe element
// (visual move only — siblings don't yield space, no reflow). Each nudge
// updates an upsert in the cart so the iterate prompt carries the final
// translate(...) value.

import { useEffect, useRef } from 'react';

import type { PendingSelection, SelectedTarget, StyleChangeDiff } from './refineProtocol';
import type { SavedRefinement } from './RefinementToPrompt';
import { readTranslateFromMatrix } from './layoutHelpers';

interface Args {
  pending: PendingSelection | null;
  iframe: HTMLIFrameElement | null;
  upsertSaved: (item: SavedRefinement) => void;
  /** Bumped externally to force a re-read of the selected element's
   * current translate (e.g. after the user switched selections, or
   * after Reset reverted the inline transform). */
  resetSignal: number;
}

const STEP_SMALL = 1;
const STEP_LARGE = 10;

export function useKeyboardNudge({ pending, iframe, upsertSaved, resetSignal }: Args) {
  // Live (x, y) for the selected element, kept in a ref so the keydown
  // handler reads the latest values without re-binding on every nudge.
  const stateRef = useRef<{
    selector: string;
    originalX: number;
    originalY: number;
    x: number;
    y: number;
    originalTransformInline: string;
  } | null>(null);

  // Snapshot the original on selection / reset.
  useEffect(() => {
    if (!pending || !iframe?.contentDocument) {
      stateRef.current = null;
      return;
    }
    let el: Element | null = null;
    try {
      el = iframe.contentDocument.querySelector(pending.target.selector);
    } catch {
      stateRef.current = null;
      return;
    }
    if (!el) {
      stateRef.current = null;
      return;
    }
    const t = readTranslateFromMatrix(el);
    stateRef.current = {
      selector: pending.target.selector,
      originalX: t.x,
      originalY: t.y,
      x: t.x,
      y: t.y,
      originalTransformInline: (el as HTMLElement).style.transform,
    };
  }, [pending?.target.selector, iframe, resetSignal]);

  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      const state = stateRef.current;
      if (!state || !pending || !iframe?.contentDocument) return;

      // Don't fight a real form input or text editor focus.
      const target = ev.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'input' || target?.isContentEditable) return;

      const isArrow =
        ev.key === 'ArrowUp' ||
        ev.key === 'ArrowDown' ||
        ev.key === 'ArrowLeft' ||
        ev.key === 'ArrowRight';
      if (!isArrow) return;

      ev.preventDefault();
      const step = ev.shiftKey ? STEP_LARGE : STEP_SMALL;
      let nx = state.x;
      let ny = state.y;
      if (ev.key === 'ArrowUp') ny -= step;
      else if (ev.key === 'ArrowDown') ny += step;
      else if (ev.key === 'ArrowLeft') nx -= step;
      else if (ev.key === 'ArrowRight') nx += step;
      state.x = nx;
      state.y = ny;

      let el: Element | null = null;
      try {
        el = iframe.contentDocument.querySelector(state.selector);
      } catch {
        return;
      }
      if (!el) return;
      (el as HTMLElement).style.transform = `translate(${nx}px, ${ny}px)`;

      // Push to cart (upsert by stable id so repeated nudges replace,
      // not accumulate, in the saved list).
      const id = `keyboard-translate:${state.selector}`;
      const region: SelectedTarget = pending.target;
      const diff: StyleChangeDiff = {
        id,
        selector: state.selector,
        target: pending.target.label,
        createdAt: new Date().toISOString(),
        type: 'style_change',
        property: 'translate',
        before: `translate(${state.originalX}px, ${state.originalY}px)`,
        after: `translate(${nx}px, ${ny}px)`,
      };
      upsertSaved({
        id,
        region,
        note: `Reposition via keyboard (visual translate, no flow change)`,
        diffs: [diff],
        createdAt: diff.createdAt,
      });
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pending, iframe, upsertSaved]);
}

/** Reset the selected element's translate back to its original inline value
 * AND clear the keyboard-nudge cart entry. Returns true if anything was
 * reset, false if there was nothing to reset. */
export function resetKeyboardNudge(
  pending: PendingSelection | null,
  iframe: HTMLIFrameElement | null,
  removeFromSaved: (id: string) => void,
): boolean {
  if (!pending || !iframe?.contentDocument) return false;
  let el: Element | null = null;
  try {
    el = iframe.contentDocument.querySelector(pending.target.selector);
  } catch {
    return false;
  }
  if (!el) return false;
  // Strip the inline transform — let any stylesheet rule take over again.
  (el as HTMLElement).style.transform = '';
  removeFromSaved(`keyboard-translate:${pending.target.selector}`);
  return true;
}
