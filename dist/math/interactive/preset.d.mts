import { AnswerSpec } from "../../kit/answer-check.mjs";
import { ReactNode } from "react";

//#region src/math/interactive/preset.d.ts
interface ProblemParam {
  name: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  label?: string;
}
interface ProblemEquation {
  expr: string;
  color?: string;
}
/** A quantity the engine computes live from the equations + params. */
type Derived = {
  kind: 'intersections';
  of: [number, number];
  label?: string;
} | {
  kind: 'roots';
  of: number;
  label?: string;
} | {
  kind: 'tangent';
  of: number;
  at: number | string;
} | {
  kind: 'normal';
  of: number;
  at: number | string;
} | {
  kind: 'area';
  between: [number, number];
  from: number | string;
  to: number | string;
  label?: string;
};
interface ProblemAsk {
  prompt: string;
  answer: AnswerSpec;
  placeholder?: string;
}
interface InteractiveProblemProps {
  equations: (string | ProblemEquation)[];
  params?: ProblemParam[];
  xRange?: [number, number];
  yRange?: [number, number] | 'auto';
  derive?: Derived[];
  ask?: ProblemAsk;
  title?: string;
  prompt?: string;
  height?: number;
  /** Reporting id for useCheckpoint (defaults to 'interactive-problem'). */
  activity?: string;
}
declare function InteractiveProblem({
  equations,
  params,
  xRange,
  yRange,
  derive,
  ask,
  title,
  prompt,
  height,
  activity
}: InteractiveProblemProps): ReactNode;
//#endregion
export { Derived, InteractiveProblem, InteractiveProblemProps, ProblemAsk, ProblemEquation, ProblemParam };