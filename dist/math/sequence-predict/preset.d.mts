import { ReactNode } from "react";

//#region src/math/sequence-predict/preset.d.ts
type SequenceRule = 'geometric' | 'arithmetic';
interface SequencePredictProps {
  /** First term (index 0). */
  start?: number;
  rule?: SequenceRule;
  /** ×ratio (geometric) or +difference (arithmetic). */
  factor?: number;
  /** How many leading terms show their value. */
  shown?: number;
  /** How many following terms the learner predicts. */
  predict?: number;
  /** Caption for each dish, e.g. "Day". */
  stepLabel?: string;
  /** Extra wrong-answer tiles in the tray. */
  distractors?: number[];
  /** Light up the items added at each step (the "it doubled" cue). */
  highlightNew?: boolean;
  /** Which COUNT scene represents each term: 'cluster' | 'grid' | 'coins' | 'blocks' | … */
  scene?: string;
  /** Tint for the items (default accent). */
  color?: string;
  /** Round dish values (keep integers for counts). */
  integer?: boolean;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}
declare function SequencePredict(props?: SequencePredictProps): ReactNode;
//#endregion
export { SequencePredict, SequencePredictProps, SequenceRule };