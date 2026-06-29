import { ControlConfig } from "../../kit/frame.mjs";
import { ReactNode } from "react";

//#region src/physics/kepler/preset.d.ts
interface KeplerProps {
  /** Semi-major axis (drawn units). */
  semiMajor?: number;
  eccentricity?: number;
  /** Show the equal-time / equal-area wedges. */
  wedges?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ hide: ['equal-area wedges'] }`. */
  controlConfig?: ControlConfig;
}
declare function KeplerLab({
  semiMajor,
  eccentricity,
  wedges,
  title,
  prompt,
  objectives,
  controlConfig
}: KeplerProps): ReactNode;
//#endregion
export { KeplerLab, KeplerProps };