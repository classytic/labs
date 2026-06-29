import { ReactNode } from "react";

//#region src/physics/stopping-distance/preset.d.ts
interface StoppingDistanceProps {
  speed?: number;
  reactionTime?: number;
  deceleration?: number;
  maxSpeed?: number;
  predict?: boolean;
  showGraphs?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
}
declare function StoppingDistanceLab({
  speed,
  reactionTime,
  deceleration,
  maxSpeed,
  predict,
  showGraphs,
  title,
  prompt,
  objectives,
  hints
}: StoppingDistanceProps): ReactNode;
//#endregion
export { StoppingDistanceLab, StoppingDistanceProps };