import { ReactNode } from "react";

//#region src/math/parabola/preset.d.ts
interface ParabolaProps {
  a?: number;
  height?: number;
}
declare function VertexParabolaLab({
  a,
  height
}: ParabolaProps): ReactNode;
//#endregion
export { ParabolaProps, VertexParabolaLab };