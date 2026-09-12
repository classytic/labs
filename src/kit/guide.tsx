'use client';

/**
 * useGuide — the guided-lesson engine as a PRIMITIVE, so crafting the step-through is
 * the author's job (data), not baked into each lab. A lab declares its named reveal
 * LAYERS (e.g. 'reorder', 'buffer') and a default step script; an author overrides the
 * `steps` to craft their own arc — what to narrate, what to reveal when, which question
 * gates the step, and when the controls appear. Reveals + controls are CUMULATIVE (a
 * layer shown once stays shown as the learner advances).
 *
 * The lab reads `guide.shows('layer')` to gate figure elements, `guide.showControls`
 * for the control bar, `guide.activeAsk` to render the one question for this step, and
 * `<GuideNav>` for the narrator line + Back/Continue (or the "pick an answer" gate).
 * `enabled:false` collapses to the final state = the everything-at-once explorer.
 */

import type { ReactNode } from 'react';
import { useSteps, StepNav, type Steps } from './steps.js';
import { StatusPill } from './controls.js';

/** @deprecated Use serializable `LearningSequenceStep` data. */
export interface GuideStep {
  /** narrator one-liner shown above the Back/Continue nav. */
  lead?: string;
  /** layer names revealed from this step onward (cumulative). */
  reveal?: string[];
  /** id of the predict question to show at this step; blocks Continue until answered. */
  ask?: string;
  /** reveal the control bar at this step (cumulative). */
  controls?: boolean;
}

/** @deprecated Use `LearningSequence`. */
export interface Guide {
  enabled: boolean;
  step: number;
  total: number;
  lead?: string;
  /** the question id to render at the current step, if any. */
  activeAsk?: string;
  /** current step asks a question that isn't answered yet. */
  gated: boolean;
  /** is a named reveal layer visible now. */
  shows: (layer: string) => boolean;
  showControls: boolean;
  nav: Steps;
}

/** @deprecated Use `useLearningSequence`; retained for third-party compatibility. */
export function useGuide(
  steps: GuideStep[],
  opts: { enabled?: boolean; isAnswered?: (id: string) => boolean } = {},
): Guide {
  const enabled = opts.enabled !== false && steps.length > 0;
  const total = Math.max(1, steps.length);
  const nav = useSteps(total);
  const step = enabled ? nav.step : total - 1;

  // cumulative reveals + controls up to and including the current step
  const visible = new Set<string>();
  let showControls = !enabled; // disabled → the free explorer shows everything
  for (let i = 0; i <= step; i++) {
    (steps[i]?.reveal ?? []).forEach((l) => visible.add(l));
    if (steps[i]?.controls) showControls = true;
  }
  const cur = steps[step];
  const activeAsk = enabled ? cur?.ask : undefined;
  const gated = enabled && activeAsk != null && !(opts.isAnswered?.(activeAsk) ?? false);

  return {
    enabled,
    step,
    total,
    lead: enabled ? cur?.lead : undefined,
    activeAsk,
    gated,
    shows: (l) => !enabled || visible.has(l),
    showControls,
    nav,
  };
}

/** The narrator line + Back/Continue (or a "pick an answer" gate when the step asks a question). */
/** @deprecated Use `LearningSequenceNav` inside `Activity.Transport`. */
export function GuideNav({ guide }: { guide: Guide }): ReactNode {
  if (!guide.enabled) return null;
  return (
    <nav className="lab-guide-nav" aria-label="Guided lesson steps">
      {guide.lead && <p>{guide.lead}</p>}
      {guide.gated ? (
        <StatusPill ok={false}>pick an answer to continue</StatusPill>
      ) : (
        <StepNav steps={guide.nav} doneLabel="✓ Done" />
      )}
    </nav>
  );
}
