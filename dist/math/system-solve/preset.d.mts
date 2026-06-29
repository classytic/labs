import { Clue, Unknown } from "../../kit/clue-scene.mjs";
import { ReactNode } from "react";

//#region src/math/system-solve/preset.d.ts
interface SystemSolveProps {
  unknowns?: Unknown[];
  clues?: Clue[];
  /** Clue representation (registry name): 'receipt' | 'balance' | 'tiles' | 'bar' | 'coins' | … */
  scene?: string;
  currency?: string;
  unit?: string;
  store?: string;
  /** Extra wrong tiles for the answer tray. */
  distractors?: number[];
  title?: string;
  prompt?: string;
  activity?: string;
}
declare function SystemSolveLab(props?: SystemSolveProps): ReactNode;
//#endregion
export { SystemSolveLab, SystemSolveProps };