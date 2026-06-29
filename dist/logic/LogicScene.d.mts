import { LogicDoc } from "./contract.mjs";
import { ReactNode } from "react";

//#region src/logic/LogicScene.d.ts
interface LogicSceneProps {
  doc: LogicDoc;
  /** tap an input switch to toggle it. */
  onToggleInput?: (id: string) => void;
  /** tap an output LED (e.g. to cycle a predicted value in a challenge). */
  onOutputClick?: (id: string) => void;
  /** what to show on each output (default its actual 0/1); a challenge can return '?' or a guess. */
  outputText?: (id: string, actual: boolean) => string;
  /** mark each output correct/incorrect/neutral (a challenge ring). */
  outputState?: (id: string, actual: boolean) => 'ok' | 'no' | undefined;
  /** light the signal only through this many propagation levels (step-by-step). Default: all. */
  reveal?: number;
  /** print 0/1 beside inputs and gates. */
  showValues?: boolean;
  ariaLabel?: string;
}
declare function LogicScene({
  doc,
  onToggleInput,
  onOutputClick,
  outputText,
  outputState,
  reveal,
  showValues,
  ariaLabel
}: LogicSceneProps): ReactNode;
//#endregion
export { LogicScene, LogicSceneProps };