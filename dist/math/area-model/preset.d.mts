import { AREA_MODEL_ASSET } from "./asset.mjs";
import { ReactNode } from "react";
import { SceneDoc } from "@classytic/stage";

//#region src/math/area-model/preset.d.ts
interface AreaModelProps {
  a?: number;
  b?: number;
  mode?: 'expand' | 'factor';
  unit?: number;
  controlId?: string;
  height?: number;
}
declare function areaModelDoc({
  a,
  b,
  mode,
  unit
}: AreaModelProps): SceneDoc;
declare function AreaModelLab({
  a,
  b,
  mode,
  unit,
  controlId,
  height
}: AreaModelProps): ReactNode;
//#endregion
export { AreaModelLab, AreaModelProps, areaModelDoc };