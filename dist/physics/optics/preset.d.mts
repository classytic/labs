import { OPTICS_RAY_ASSET } from "./asset.mjs";
import { ReactNode } from "react";
import { SceneDoc } from "@classytic/stage";

//#region src/physics/optics/preset.d.ts
declare function opticsDoc(): SceneDoc;
interface OpticsProps {
  height?: number;
}
declare function OpticsLab({
  height
}: OpticsProps): ReactNode;
//#endregion
export { OpticsLab, OpticsProps, opticsDoc };