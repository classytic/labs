'use client';

/**
 * LabAsk, the one authorable "question attached to a lab". A creator picks the
 * FORM: a typed answer (graded numerically or as an algebraically-equivalent
 * expression) OR multiple choice. Both report through the same `useCheckpoint`
 * seam, so a lab's `ask` prop covers either without the lab caring which.
 *
 * Typed answers go through `checkAnswer` (so `2x-3`, `y = 2x − 3`, `x^2`, `(x+1)(x+2)`
 * all work, see normalizeMathInput). MCQ reuses the shared ChallengeCard. This is
 * the single home for "how does a lab ask a question", reused by every preset.
 */

import { type ReactNode } from 'react';
import { AskBox, ChallengeCard, useChallenge, useCheckpoint, type ChallengeChoice } from './pedagogy.js';
import { checkAnswer, type AnswerSpec } from './answer-check.js';

/** A serializable question spec an author attaches to a lab. */
export interface LabAskSpec {
  prompt: ReactNode;
  placeholder?: string;
  /** Typed mode: grade the typed answer (a number, or an algebraic expression). */
  answer?: AnswerSpec;
  /** Multiple-choice mode: the options (set `correct` to one option's value). */
  choices?: ChallengeChoice[];
  correct?: string;
  /** Shown when the right choice is picked. */
  explain?: ReactNode;
}

function McqAsk({ prompt, choices, answer, explain, activity }: { prompt: ReactNode; choices: ChallengeChoice[]; answer: string; explain?: ReactNode; activity: string }): ReactNode {
  const qs = [{ id: 'q', prompt, choices, answer, explain }];
  const state = useChallenge(qs);
  useCheckpoint({ solved: state.allCorrect, activity });
  return <ChallengeCard questions={qs} state={state} title="" />;
}

/** Render a lab's question, MCQ when `choices` is given, otherwise a typed box. */
export function LabAsk({ ask, activity }: { ask: LabAskSpec; activity: string }): ReactNode {
  if (ask.choices && ask.choices.length) {
    return <McqAsk prompt={ask.prompt} choices={ask.choices} answer={ask.correct ?? ''} explain={ask.explain} activity={activity} />;
  }
  if (ask.answer) {
    return <AskBox prompt={ask.prompt} placeholder={ask.placeholder} check={(r) => checkAnswer(ask.answer!, r)} activity={activity} />;
  }
  return null;
}
