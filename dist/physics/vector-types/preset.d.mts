import { ReactNode } from "react";
import { Vec2 } from "@classytic/stage";

//#region src/physics/vector-types/preset.d.ts
interface PanelVec {
  tail?: Vec2;
  comp: Vec2;
  color?: string;
  label?: string;
}
interface TypePanel {
  name: string;
  caption: string;
  vectors?: PanelVec[];
  /** Show a dot at the origin (null vector / position origin O). */
  origin?: boolean;
}
interface VectorTypesProps {
  types?: TypePanel[];
  title?: string;
}
declare function VectorTypesLab({
  types,
  title
}: VectorTypesProps): ReactNode;
//#endregion
export { TypePanel, VectorTypesLab, VectorTypesProps };