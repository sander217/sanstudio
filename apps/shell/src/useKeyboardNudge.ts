// Keyboard interactions on the selected iframe element:
//
//   ↑ ↓ ← →           — nudge position by 1px (Shift = 10px) via inline
//                       transform: translate(...). Visual only, no flow
//                       change. Cart entry upserts so the iterate prompt
//                       carries the final translate(x, y).
//
//   Delete / Backspace — mark the element for removal. Hides it locally via
//                       display:none and adds a RemoveDiff to the cart so
//                       Claude rewrites the artifact without that element.
//                       (Borrowed from open-design v0.8.0's "remove-element
//                       patch" — keyboard delete is the universal idiom for
//                       "get this off my canvas".)
//
// Both interactions guard against firing inside text inputs / textareas /
// contenteditable so the user can still type in the cart and modals.

import { useEffect, useRef } from 'react';

import type { PendingSelection, RemoveDiff, SelectedTarget, StyleChangeDiff } from './refineProtocol';
import type { SavedRefinement } from './RefinementToPrompt';
import { readTranslateFromMatrix } from './layoutHelpers';

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

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
  // originalDisplay is captured here too so Delete can restore it on reset.
  const stateRef = useRef<{
    selector: string;
    originalX: number;
    originalY: number;
    x: number;
    y: number;
    originalTransformInline: string;
    originalDisplayInline: string;
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
      originalDisplayInline: (el as HTMLElement).style.display,
    };
  }, [pending?.target.selector, iframe, resetSignal]);

  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      const state = stateRef.current;
      if (!state || !pending || !iframe?.contentDocument) return;

      // Don't fight a real form input or text editor focus — but only check
      // when the event came from inside this document. Cross-document
      // checks (e.g. ev.target from the iframe doc) wouldn't reliably
      // identify shell-side inputs anyway.
      const target = ev.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'input' || target?.isContentEditable) return;

      // --- Delete / Backspace → remove element -----------------------
      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        ev.preventDefault();
        let el: Element | null = null;
        try {
          el = iframe.contentDocument.querySelector(state.selector);
        } catch {
          return;
        }
        if (!el) return;
        (el as HTMLElement).style.display = 'none';
        const id = `keyboard-remove:${state.selector}`;
        const region: SelectedTarget = pending.target;
        const diff: RemoveDiff = {
          id,
          selector: state.selector,
          target: pending.target.label,
          createdAt: new Date().toISOString(),
          type: 'remove',
          preview: truncate(pending.target.snippet, 80),
          originalDisplay: state.originalDisplayInline || undefined,
        };
        upsertSaved({
          id,
          region,
          note: 'Remove this element from the artifact (deleted via keyboard).',
          diffs: [diff],
          createdAt: diff.createdAt,
        });
        return;
      }

      // --- Arrow keys → nudge translate -----------------------------
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

    // Critical: when the user clicks an element inside the iframe to select
    // it, focus moves into the iframe document. Subsequent keydowns then
    // fire on iframe.contentDocument, NOT on window — the shell never sees
    // them unless we listen on both. Use capture phase so we beat any
    // page-level handlers (e.g. carousel keyboard nav).
    window.addEventListener('keydown', onKeyDown, true);
    const doc = iframe?.contentDocument;
    doc?.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      doc?.removeEventListener('keydown', onKeyDown, true);
    };
  }, [pending, iframe, upsertSaved]);
}

/** Reset the selected element's translate AND display back to their
 * original inline values AND clear both cart entries (nudge + remove).
 * Returns true if anything was reset. */
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
  // Strip the inline transform + display — let any stylesheet rule take over again.
  (el as HTMLElement).style.transform = '';
  (el as HTMLElement).style.display = '';
  removeFromSaved(`keyboard-translate:${pending.target.selector}`);
  removeFromSaved(`keyboard-remove:${pending.target.selector}`);
  return true;
}
