import { ReactNode } from "react";

//#region src/math/gradient-descent.d.ts
interface GradientDescentProps {
  /** Loss surface f(x, y), e.g. `x^2 + 2*y^2` or `x^2 + y^2 - x*y`. */
  equation?: string;
  /** Visible square-ish region [min,max] for both axes. Default [-3, 3]. */
  range?: [number, number];
  start?: [number, number];
  learningRate?: number;
  title?: string;
  height?: number;
}
declare function GradientDescent({
  equation,
  range,
  start,
  learningRate,
  title,
  height
}?: GradientDescentProps): ReactNode;
//#endregion
export { GradientDescent, GradientDescentProps };