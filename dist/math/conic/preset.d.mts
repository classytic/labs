import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";

//#region src/math/conic/preset.d.ts
type ConicKind = 'parabola' | 'ellipse' | 'hyperbola' | 'rectangular';
interface ConicProps {
  kind?: ConicKind;
  /** parabola: y² = 4a·x. ellipse/hyperbola: a, b are the semi-axes. */
  a?: number;
  b?: number;
  /** rectangular: x·y = c. */
  c?: number;
  showFocusDirectrix?: boolean;
  showAsymptotes?: boolean;
  view?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  height?: number;
  snap?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}
declare function ConicLab(props?: ConicProps): ReactNode;
//#endregion
export { ConicKind, ConicLab, ConicProps };