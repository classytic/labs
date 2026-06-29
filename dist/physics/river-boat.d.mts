import { ReactNode } from "react";

//#region src/physics/river-boat.d.ts
interface RiverBoatProps {
  boatSpeed?: number | string;
  current?: number | string;
  riverWidth?: number | string;
  title?: string;
  height?: number;
  /** Register an agent-control surface under this id (see `useControlSurface`). */
  controlId?: string;
}
declare function RiverBoat({
  boatSpeed,
  current,
  riverWidth,
  title,
  height,
  controlId
}?: RiverBoatProps): ReactNode;
//#endregion
export { RiverBoat, RiverBoatProps };