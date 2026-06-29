import { ReactNode } from "react";

//#region src/physics/gravity-drop.d.ts
interface GravityDropProps {
  height?: number | string;
}
declare function GravityDrop(props: GravityDropProps): ReactNode;
//#endregion
export { GravityDrop, GravityDropProps };