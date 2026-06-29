import { GuessTone } from "./vessel.mjs";
import { ReactNode } from "react";
import { Vec2 } from "@classytic/stage";

//#region src/kit/predict.d.ts
interface PredictPlotProps {
  /** Given data points, already plotted (the pattern to extend). */
  data: Vec2[];
  /** The controlled ghost point the learner drags. */
  guess: Vec2;
  onGuess: (p: Vec2, phase: 'move' | 'commit') => void;
  /** Colour the ghost by correctness (parent decides). */
  tone?: GuessTone;
  /** First-quadrant window; axes sit at the corner. */
  xMax: number;
  yMax: number;
  xStep?: number;
  yStep?: number;
  xLabel?: string;
  yLabel?: string;
  height?: number;
  /** Lock the ghost to its x (vertical drag only). Default true , predict the y. */
  lockX?: boolean;
  /** Snap the ghost to the grid on drag. Default true. */
  snap?: boolean;
  /** Draw the underlying rule line y = slope·x + intercept (e.g. once solved). */
  rule?: {
    slope: number;
    intercept: number;
  } | null;
  /** Faint guide column at x = guess.x so the learner sees which input they're on. */
  showColumn?: boolean;
  /** Readout the guess coordinate as a label by the ghost. */
  readout?: boolean;
}
declare function PredictPlot({
  data,
  guess,
  onGuess,
  tone,
  xMax,
  yMax,
  xStep,
  yStep,
  xLabel,
  yLabel,
  height,
  lockX,
  snap,
  rule,
  showColumn,
  readout
}: PredictPlotProps): ReactNode;
//#endregion
export { PredictPlot, PredictPlotProps };