// Mirrors the subset of refinetool/src/shared/types.ts that the shell needs to
// interact with the iframe companion. Keeping it small + local avoids pulling
// the whole refinetool repo in as a dependency just to talk to one .iife.js.
//
// If refinetool extends DirectEditAction or EditDiff, mirror the new variants
// here and add buttons in RefinePanel.tsx.

export const REFINE_NS = 'ifl/iframe' as const;

export type BoundingBox = { x: number; y: number; width: number; height: number };

export type SelectedTarget = {
  selector: string;
  label: string;
  boundingBox: BoundingBox;
  snippet: string;
  tag: string;
  hasImage: boolean;
  breadcrumb?: string[];
};

type EditDiffBase = { id: string; selector: string; target: string; createdAt: string };
export type TextChangeDiff = EditDiffBase & {
  type: 'text_change';
  before: string;
  after: string;
};
export type HideDiff = EditDiffBase & {
  type: 'hide';
  preview?: string;
  originalDisplay?: string;
};
export type RemoveDiff = EditDiffBase & {
  type: 'remove';
  preview?: string;
  originalDisplay?: string;
};

export type EditDiff = TextChangeDiff | HideDiff | RemoveDiff;

export type DirectEditAction =
  | { type: 'start_inline_text_edit' }
  | { type: 'stop_inline_text_edit' }
  | { type: 'hide_selected' }
  | { type: 'remove_selected' }
  | { type: 'reset_pending_selection'; revert?: boolean };

export type PendingSelection = {
  tabId: number;
  pageUrl: string;
  pageTitle: string;
  target: SelectedTarget;
  diffs: EditDiff[];
  capturedAt: string;
};

// ---- wire protocol ----

export type RefineRequest =
  | { ns: typeof REFINE_NS; id: string; type: 'SET_REFINE_MODE'; enabled: boolean }
  | { ns: typeof REFINE_NS; id: string; type: 'GET_REFINE_MODE' }
  | { ns: typeof REFINE_NS; id: string; type: 'APPLY_DIRECT_EDIT'; action: DirectEditAction }
  | { ns: typeof REFINE_NS; id: string; type: 'REVERT_DIFFS'; diffs: EditDiff[] };

export type RefineResponse = {
  ns: typeof REFINE_NS;
  id: string;
  ok: boolean;
  result?: unknown;
  error?: string;
};

export type RefineBroadcast =
  | { ns: typeof REFINE_NS; type: 'REFINE_MODE_CHANGED'; enabled: boolean }
  | { ns: typeof REFINE_NS; type: 'TARGET_SELECTED'; pending: PendingSelection };

// ---- typed RPC helper ----

export type RpcResult = { ok: boolean; pending?: PendingSelection | null; error?: string };

export class RefineRpc {
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private modeListeners = new Set<(enabled: boolean) => void>();
  private selectionListeners = new Set<(p: PendingSelection) => void>();
  private listener: ((ev: MessageEvent) => void) | null = null;

  constructor(private getTarget: () => Window | null) {}

  attach() {
    this.listener = (ev: MessageEvent) => this.handleIncoming(ev);
    window.addEventListener('message', this.listener);
  }

  detach() {
    if (this.listener) window.removeEventListener('message', this.listener);
    this.listener = null;
    this.pending.clear();
    this.modeListeners.clear();
    this.selectionListeners.clear();
  }

  onModeChange(handler: (enabled: boolean) => void): () => void {
    this.modeListeners.add(handler);
    return () => this.modeListeners.delete(handler);
  }

  onTargetSelected(handler: (p: PendingSelection) => void): () => void {
    this.selectionListeners.add(handler);
    return () => this.selectionListeners.delete(handler);
  }

  async setRefineMode(enabled: boolean): Promise<void> {
    await this.send({ type: 'SET_REFINE_MODE', enabled });
  }

  async getRefineMode(): Promise<boolean> {
    const r = (await this.send({ type: 'GET_REFINE_MODE' })) as { enabled: boolean };
    return r.enabled;
  }

  async applyDirectEdit(action: DirectEditAction): Promise<RpcResult> {
    return (await this.send({ type: 'APPLY_DIRECT_EDIT', action })) as RpcResult;
  }

  async revertDiffs(diffs: EditDiff[]): Promise<{ ok: boolean; error?: string }> {
    return (await this.send({ type: 'REVERT_DIFFS', diffs })) as { ok: boolean; error?: string };
  }

  private send(
    body:
      | { type: 'SET_REFINE_MODE'; enabled: boolean }
      | { type: 'GET_REFINE_MODE' }
      | { type: 'APPLY_DIRECT_EDIT'; action: DirectEditAction }
      | { type: 'REVERT_DIFFS'; diffs: EditDiff[] },
  ): Promise<unknown> {
    const target = this.getTarget();
    if (!target) return Promise.reject(new Error('iframe not ready'));
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const message: RefineRequest = { ns: REFINE_NS, id, ...body } as RefineRequest;
    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      target.postMessage(message, '*');
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`refine RPC timeout: ${body.type}`));
        }
      }, 8000);
    });
  }

  private handleIncoming(ev: MessageEvent) {
    const data = ev.data as RefineResponse | RefineBroadcast | undefined;
    if (!data || (data as { ns?: string }).ns !== REFINE_NS) return;
    if ('id' in data) {
      const slot = this.pending.get(data.id);
      if (!slot) return;
      this.pending.delete(data.id);
      if (data.ok) slot.resolve(data.result);
      else slot.reject(new Error(data.error ?? 'companion error'));
      return;
    }
    if (data.type === 'REFINE_MODE_CHANGED') {
      for (const fn of this.modeListeners) fn(data.enabled);
    } else if (data.type === 'TARGET_SELECTED') {
      for (const fn of this.selectionListeners) fn(data.pending);
    }
  }
}
