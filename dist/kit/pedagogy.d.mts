import { ReactNode } from "react";

//#region src/kit/pedagogy.d.ts
interface CheckpointArgs {
  /** The lab's correctness predicate over its resolved state. */
  solved: boolean;
  activity: string;
  /** Full-credit score; defaults to {raw:1,max:1}. Penalised by hints. */
  score?: {
    raw: number;
    max: number;
  };
  /** Hints revealed so far (from useHints().count). */
  hintsUsed?: number;
  /** Score multiplier docked per hint (default 0.1, floored at 0.1). */
  hintPenalty?: number;
  /** The learner's answer to pass through to the report (e.g. the value they entered). */
  response?: string;
}
/** Report completion once, the first time `solved` becomes true. */
declare function useCheckpoint({
  solved,
  activity,
  score,
  hintsUsed,
  hintPenalty,
  response
}: CheckpointArgs): {
  solved: boolean;
  reported: boolean;
};
interface Hints {
  revealed: string[];
  count: number;
  hasMore: boolean;
  reveal: () => void;
  reset: () => void;
}
/** Progressive hint state, reveal one at a time. */
declare function useHints(hints?: string[]): Hints;
/** Learner-visible goal banner ("You'll be able to …"). */
declare function Objectives({
  items
}: {
  items?: string[];
}): ReactNode;
/** The hint ladder, revealed hints + a "need a hint?" button while more remain. */
declare function HintLadder({
  hints
}: {
  hints: Hints;
}): ReactNode;
interface ChallengeChoice {
  value: string;
  label: ReactNode;
}
interface ChallengeQuestion {
  id: string;
  /** predict / classify / explain prompt. */
  prompt: ReactNode;
  choices: ChallengeChoice[];
  /** the `value` of the correct choice. */
  answer: string;
  /** the "why", revealed once this question is answered correctly. */
  explain?: ReactNode;
}
interface ChallengeState {
  picks: Record<string, string | undefined>;
  pick: (id: string, value: string) => void;
  /** all questions answered correctly → the lab is solved. */
  allCorrect: boolean;
  /** every question has a pick (right or wrong). */
  answeredAll: boolean;
  solvedCount: number;
  total: number;
  reset: () => void;
}
/** State for a small set of predict/classify questions. */
declare function useChallenge(questions: ChallengeQuestion[]): ChallengeState;
/** Renders the challenge questions as choice chips with per-question feedback. */
declare function ChallengeCard({
  questions,
  state,
  title
}: {
  questions: ChallengeQuestion[];
  state: ChallengeState;
  title?: ReactNode;
}): ReactNode;
/** Unified success / misconception / try-again feedback. */
declare function Feedback({
  ok,
  misconception,
  okText,
  tryText
}: {
  ok: boolean;
  misconception?: string;
  okText?: string;
  tryText?: string;
}): ReactNode;
interface RevealSolutionProps {
  /** The answer to show when revealed (text or rich content). */
  solution: ReactNode;
  /** Gate the button (e.g. only after a wrong attempt). Default: always shown. */
  available?: boolean;
  /** Fired ONCE when the learner reveals, let the lab dock the score (peek ≠ solve). */
  onReveal?: () => void;
  buttonLabel?: string;
  /** The warning shown with the solution. */
  note?: string;
}
/**
 * The shared "Show answer" escape hatch, so no lab is a dead-end "wrong/right".
 * Manages its own shown/hidden; `key` it (e.g. per step/event) to reset between
 * questions. Revealing is a deliberate peek: it warns and reports via `onReveal`.
 */
declare function RevealSolution({
  solution,
  available,
  onReveal,
  buttonLabel,
  note
}: RevealSolutionProps): ReactNode;
//#endregion
export { ChallengeCard, ChallengeChoice, ChallengeQuestion, ChallengeState, CheckpointArgs, Feedback, HintLadder, Hints, Objectives, RevealSolution, RevealSolutionProps, useChallenge, useCheckpoint, useHints };