'use client';

/**
 * PredictGate, predict-first as ONE wrapper instead of per-lab hand-wiring.
 *
 * The audit found 79% of labs are pure "drag and see": the learner never
 * commits to a prediction, so the reveal teaches nothing (there's no prior to
 * contradict). The fix has existed as parts (`useChallenge` + `ChallengeCard`
 * + `useCheckpoint`) but wiring them was per-lab handiwork, so adoption
 * stalled at ~21%.
 *
 * `<PredictGate questions=... activity=...>` renders the challenge card and
 * holds the model behind an explicit preview state until the learner commits
 * an answer to every question. The model is not mounted while locked, so its
 * visual answer cannot leak through an obscuring effect. Committing (right OR
 * wrong) unlocks the
 * exploration, that's the pedagogy: commit → explore → see why. When all
 * answers are CORRECT it reports through `useCheckpoint` and celebrates.
 *
 * Authoring cost for an existing lab: wrap the figure, pass 1-3 questions.
 */

import { type ReactNode } from 'react';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from './pedagogy.js';

export interface PredictGateProps {
  questions: ChallengeQuestion[];
  /** xAPI activity id for the checkpoint report (e.g. 'ohms-law.predict'). */
  activity: string;
  title?: ReactNode;
  /** Shown on the lock overlay until the learner commits. */
  lockLabel?: string;
  /** Set false to show the questions WITHOUT locking the lab (survey mode). */
  lock?: boolean;
  children: ReactNode;
}

export function PredictGate({
  questions,
  activity,
  title = 'Predict first',
  lockLabel = 'Make your prediction first',
  lock = true,
  children,
}: PredictGateProps): ReactNode {
  const state = useChallenge(questions);
  useCheckpoint({ solved: state.allCorrect, activity });
  const locked = lock && !state.answeredAll;
  return (
    <div className="lab-predict-gate">
      <ChallengeCard questions={questions} state={state} title={title} />
      <div className="lab-predict-body" data-locked={locked || undefined}>
        {locked ? (
          <div className="lab-predict-lock" role="status" aria-live="polite">
            <span className="lab-predict-lock-mark" aria-hidden>
              ?
            </span>
            <strong>{lockLabel}</strong>
            <span>Choose an answer above, then explore the model.</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
