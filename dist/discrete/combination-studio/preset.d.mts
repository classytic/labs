import { CharSlot } from "./figure.mjs";
import { ReactNode } from "react";

//#region src/discrete/combination-studio/preset.d.ts
interface ComboOption {
  id: string;
  label: string;
  emoji?: string;
  color?: string;
}
interface ComboCategory {
  id: string;
  label: string;
  slot?: CharSlot;
  options: ComboOption[];
}
interface CombinationStudioProps {
  /** The thing being built, e.g. "outfit", "sundae" (used in the headline + question). */
  scenario?: string;
  categories?: ComboCategory[];
  /** 'character' assembles a person; 'card' stacks the chosen emoji (non-clothing). */
  figure?: 'character' | 'card';
  /** How many categories are in play at the start (rest revealed via + variable). */
  startActive?: number;
  /** Cap outcomes drawn on the wall. */
  maxWall?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
}
declare function CombinationStudioLab({
  scenario,
  categories,
  figure,
  startActive,
  maxWall,
  title,
  prompt,
  objectives,
  hints: hintList
}?: CombinationStudioProps): ReactNode;
//#endregion
export { CombinationStudioLab, CombinationStudioProps, ComboCategory, ComboOption };