import { ReactNode } from "react";

//#region src/physics/collision-track/preset.d.ts
interface CollisionTrackProps {
  m1?: number;
  m2?: number;
  u1?: number;
  u2?: number;
  elasticity?: number;
  showCenterOfMass?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}
declare function CollisionTrackLab({
  m1,
  m2,
  u1,
  u2,
  elasticity,
  showCenterOfMass,
  title,
  prompt,
  objectives
}: CollisionTrackProps): ReactNode;
//#endregion
export { CollisionTrackLab, CollisionTrackProps };