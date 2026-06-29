import { ReactNode } from "react";

//#region src/geometry/intersecting-circles.d.ts
interface IntersectingCirclesProps {
  r1?: number | string;
  r2?: number | string;
  title?: string;
  height?: number;
}
declare function IntersectingCircles({
  r1: r1p,
  r2: r2p,
  title,
  height
}?: IntersectingCirclesProps): ReactNode;
//#endregion
export { IntersectingCircles, IntersectingCirclesProps };