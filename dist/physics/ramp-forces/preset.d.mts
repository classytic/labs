import { ControlConfig } from "../../kit/frame.mjs";
import { ReactNode } from "react";

//#region src/physics/ramp-forces/preset.d.ts
interface RampForcesProps {
  angleDeg?: number;
  mass?: number;
  /** Static coefficient μs (the grip that must be broken to start moving). */
  friction?: number;
  /** Kinetic coefficient μk (while sliding; clamped ≤ μs). */
  frictionKinetic?: number;
  /** Applied force along the slope, N. Positive = push up-slope, negative = pull/push down. */
  appliedN?: number;
  g?: number;
  showComponents?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Creator's per-knob hide/lock policy. Names: angle, push, mass, frictionStatic, frictionKinetic, components, release. */
  controlConfig?: ControlConfig;
}
declare function RampForcesLab({
  angleDeg,
  mass,
  friction,
  frictionKinetic,
  appliedN,
  g,
  showComponents,
  title,
  prompt,
  objectives,
  controlConfig
}: RampForcesProps): ReactNode;
//#endregion
export { RampForcesLab, RampForcesProps };