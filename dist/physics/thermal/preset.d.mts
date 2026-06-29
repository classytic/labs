import { ReactNode } from "react";

//#region src/physics/thermal/preset.d.ts
interface HeatingCurveProps {
  /** Preset to start from (custom fields below override it). */
  substance?: 'water' | 'ethanol';
  /** Declare a custom substance by overriding any of the preset's constants. */
  substanceName?: string;
  /** Specific heats J/(g·°C). */
  cSolid?: number;
  cLiquid?: number;
  cGas?: number;
  /** Latent heats J/g. */
  lFusion?: number;
  lVapor?: number;
  /** Transition temperatures °C. */
  tMelt?: number;
  tBoil?: number;
  /** Initial sample mass, g (default 50). */
  mass?: number;
  /** Initial heating power, W (default 120; negative cools). */
  power?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function HeatingCurveLab({
  substance: sub0,
  title,
  prompt,
  objectives,
  substanceName,
  cSolid,
  cLiquid,
  cGas,
  lFusion,
  lVapor,
  tMelt,
  tBoil,
  mass: mass0,
  power: power0
}?: HeatingCurveProps): ReactNode;
//#endregion
export { HeatingCurveLab, HeatingCurveProps };