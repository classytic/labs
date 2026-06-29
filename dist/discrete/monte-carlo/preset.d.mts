import { Rng } from "../../core/rng.mjs";
import { ReactNode } from "react";

//#region src/discrete/monte-carlo/preset.d.ts
interface MCSeries {
  label: string;
  color?: string;
  /** One trial → did the event happen? (run-chart series) */
  run?: (rng: Rng) => boolean;
  /** One trial → a 2-D dart + whether it hit the region (scatter series, e.g. π) */
  point?: (rng: Rng) => {
    x: number;
    y: number;
    hit: boolean;
  };
  /** Map the hit-fraction to the reported quantity (default: the fraction itself). */
  estimate?: (frac: number) => number;
  /** The value the estimate should converge to, drawn as a dashed guide. */
  theoretical?: number;
}
type ExperimentSpec = {
  kind: 'montyHall';
  doors?: number;
} | {
  kind: 'piDarts';
} | {
  kind: 'diceSum';
  dice?: number;
  target: number;
} | {
  kind: 'bernoulli';
  p: number;
  label?: string;
};
interface MonteCarloProps {
  series?: MCSeries[];
  experiment?: ExperimentSpec;
  viz?: 'runchart' | 'scatter';
  seed?: number;
  batch?: number;
  maxTrials?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}
declare function MonteCarloLab({
  series: seriesIn,
  experiment,
  viz: vizIn,
  seed,
  batch,
  maxTrials,
  title,
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height
}: MonteCarloProps): ReactNode;
//#endregion
export { ExperimentSpec, MCSeries, MonteCarloLab, MonteCarloProps };