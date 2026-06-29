import { GeoElement } from "./board/preset.mjs";
import { ReactNode } from "react";

//#region src/geometry/builder.d.ts
interface GeometryBuilderProps {
  scene?: GeoElement[];
  onChange?: (scene: GeoElement[]) => void;
  title?: string;
  height?: number;
}
declare function GeometryBuilder({
  scene,
  onChange,
  title,
  height
}?: GeometryBuilderProps): ReactNode;
//#endregion
export { GeometryBuilder, GeometryBuilderProps };