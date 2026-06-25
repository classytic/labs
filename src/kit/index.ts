// @classytic/labs/kit — the lesson-authoring toolkit. The learner-facing pieces a
// host composes into a guided lesson around the lab widgets: predict-first
// challenges, checkpoints that report into the step/learner seam, progressive
// hints, objectives, the reveal escape-hatch, the in-lab stepper, and the shared
// frame/callout chrome. (Stage owns the cross-block StepProgress runtime; this is
// the pedagogy layer over it.)

export {
  useCheckpoint, useHints, Objectives, HintLadder, useChallenge, ChallengeCard, Feedback, RevealSolution,
  type CheckpointArgs, type Hints, type ChallengeChoice, type ChallengeQuestion, type ChallengeState, type RevealSolutionProps,
} from './pedagogy.js';
export { useSteps, StepNav, type Steps } from './steps.js';
export { LabFrame, ControlBar, Field, Callout, type ControlConfig } from './frame.js';
export { usePlayGate, PlayWrap, type PlayGate } from './play.js';
