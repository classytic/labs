import { ReactNode } from "react";

//#region src/math/trig-explorer.d.ts
/** The two projections this widget visualizes. */
type TrigFn = 'sin' | 'cos';
declare const TRIG_FNS: readonly TrigFn[];
interface TrigExplorerProps {
  /** Which projections to show. Default `['sin','cos']`. */
  functions?: TrigFn[] | string;
  /** Initial angle in degrees. Default 30. */
  startDeg?: number;
}
declare function TrigExplorer({
  functions,
  startDeg
}?: TrigExplorerProps): ReactNode;
//#endregion
export { TRIG_FNS, TrigExplorer, TrigFn };