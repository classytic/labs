'use client';

/** A small, serializable learning arc for authored labs. The scene stays
 * domain-specific; this contract standardizes the learner loop and its gates. */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActionButton } from './controls.js';

export type LearningPhase = 'predict' | 'act' | 'observe' | 'explain' | 'transfer';

export interface LearningGate {
  /** The host decides what completes the gate and reports it through complete(). */
  kind: 'answer' | 'action' | 'state' | 'reflection';
  id: string;
  pendingLabel?: string;
}

export interface LearningBranch {
  /** Map an authored outcome to the next step id. */
  byOutcome: Record<string, string>;
  fallback?: string;
}

export interface LearningSequenceStep {
  id: string;
  phase: LearningPhase;
  title?: string;
  lead?: string;
  reveal?: string[];
  controls?: boolean;
  gate?: LearningGate;
  /** Omit for the next authored step; use a string or outcome branch when needed. */
  next?: string | LearningBranch;
}

export interface LearningSequence {
  current: LearningSequenceStep;
  index: number;
  total: number;
  history: string[];
  canAdvance: boolean;
  complete: (gateId: string, outcome?: string) => void;
  next: () => void;
  back: () => void;
  reset: () => void;
  shows: (layer: string) => boolean;
  showControls: boolean;
}

export interface LearningSequenceOptions {
  initialStepId?: string;
  onStepChange?: (step: LearningSequenceStep, index: number) => void;
}

export function useLearningSequence(
  steps: readonly LearningSequenceStep[],
  options: LearningSequenceOptions = {},
): LearningSequence {
  if (steps.length === 0) throw new Error('useLearningSequence requires at least one step');
  const byId = useMemo(() => new Map(steps.map((step) => [step.id, step])), [steps]);
  const firstId =
    options.initialStepId && byId.has(options.initialStepId) ? options.initialStepId : steps[0]!.id;
  const [history, setHistory] = useState<string[]>([firstId]);
  const [completed, setCompleted] = useState<Record<string, string | true>>({});
  const currentId = history[history.length - 1] ?? steps[0]!.id;
  const current = byId.get(currentId) ?? steps[0]!;
  const index = Math.max(
    0,
    steps.findIndex((step) => step.id === current.id),
  );
  const canAdvance = current.gate == null || completed[current.gate.id] != null;

  useEffect(() => {
    options.onStepChange?.(current, index);
  }, [current, index, options.onStepChange]);

  const nextId = (): string | undefined => {
    if (typeof current.next === 'string') return current.next;
    if (current.next) {
      const outcome = current.gate ? completed[current.gate.id] : undefined;
      return typeof outcome === 'string'
        ? (current.next.byOutcome[outcome] ?? current.next.fallback)
        : current.next.fallback;
    }
    return steps[index + 1]?.id;
  };

  const visited = history
    .map((id) => byId.get(id))
    .filter((step): step is LearningSequenceStep => step != null);
  const layers = new Set(visited.flatMap((step) => step.reveal ?? []));

  return {
    current,
    index,
    total: steps.length,
    history,
    canAdvance,
    complete: (gateId, outcome) => setCompleted((state) => ({ ...state, [gateId]: outcome ?? true })),
    next: () => {
      if (!canAdvance) return;
      const target = nextId();
      if (target && byId.has(target)) setHistory((items) => [...items, target]);
    },
    back: () => setHistory((items) => (items.length > 1 ? items.slice(0, -1) : items)),
    reset: () => {
      setHistory([firstId]);
      setCompleted({});
    },
    shows: (layer) => layers.has(layer),
    showControls: visited.some((step) => step.controls),
  };
}

export function LearningSequenceNav({ sequence }: { sequence: LearningSequence }): ReactNode {
  const { current } = sequence;
  const pending = current.gate?.pendingLabel ?? `Complete the ${current.gate?.kind ?? 'step'} to continue`;
  return (
    <nav className="lab-sequence" aria-label="Learning activity steps">
      <div className="lab-sequence-actions">
        <ActionButton
          className="lab-btn-ghost"
          onClick={sequence.back}
          disabled={sequence.history.length <= 1}
          aria-label="Back"
        >
          ← Back
        </ActionButton>
        <span className="lab-sequence-count" aria-live="polite">
          {sequence.index + 1} / {sequence.total}
        </span>
        <ActionButton
          onClick={sequence.next}
          disabled={!sequence.canAdvance || sequence.index >= sequence.total - 1}
        >
          {sequence.index >= sequence.total - 1 ? 'Complete' : 'Continue'}
        </ActionButton>
      </div>
      {!sequence.canAdvance && (
        <p className="lab-sequence-gate" role="status">
          {pending}
        </p>
      )}
    </nav>
  );
}
