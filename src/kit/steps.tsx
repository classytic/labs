'use client';

/**
 * In-lab stepper, teach ONE idea at a time (Brilliant-style), instead of dumping
 * a dense screen. A lab declares N steps and reveals layers/captions as the learner
 * hits Continue. Pure UI state; pair with `<StepNav>` (Back / dots / Continue).
 * (Distinct from stage's cross-block StepProgress, this is within a single lab.)
 */

import { useState, type ReactNode } from 'react';

export interface Steps {
  step: number;
  total: number;
  atStart: boolean;
  atEnd: boolean;
  next: () => void;
  prev: () => void;
  setStep: (n: number) => void;
}

export function useSteps(total: number): Steps {
  const [step, setStep] = useState(0);
  const clamp = (n: number): number => Math.max(0, Math.min(total - 1, n));
  return {
    step: clamp(step),
    total,
    atStart: step <= 0,
    atEnd: step >= total - 1,
    next: () => setStep((s) => clamp(s + 1)),
    prev: () => setStep((s) => clamp(s - 1)),
    setStep: (n) => setStep(clamp(n)),
  };
}

export function StepNav({ steps, nextLabel = 'Continue', doneLabel = 'Done' }: { steps: Steps; nextLabel?: string; doneLabel?: string }): ReactNode {
  return (
    <div className="lab-stepnav">
      <button type="button" className="lab-btn lab-btn-ghost" onClick={steps.prev} disabled={steps.atStart}>← Back</button>
      <span className="lab-dots" aria-hidden>
        {Array.from({ length: steps.total }, (_, i) => <span key={i} className="lab-dot" data-on={i <= steps.step} />)}
      </span>
      <button type="button" className="lab-btn" onClick={steps.next} disabled={steps.atEnd}>{steps.atEnd ? doneLabel : nextLabel}</button>
    </div>
  );
}
