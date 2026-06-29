import { ReactNode } from "react";

//#region src/math/grapher/preset.d.ts
interface GraphEquation {
  /** Formula in `x` and any params, e.g. `a*sin(b*x + c)`. */
  expr: string;
  color?: string;
}
interface GraphParam {
  name: string;
  min: number;
  max: number;
  step?: number;
  value: number;
}
interface GrapherProps {
  equations?: (GraphEquation | string)[] | string;
  params?: GraphParam[];
  xRange?: [number, number];
  yRange?: [number, number] | 'auto';
  /** `log` plots log₁₀(y) with decade ticks, for exponentials/rates. */
  yScale?: 'linear' | 'log';
  title?: string;
  subtitle?: string;
  height?: number;
  grid?: boolean;
}
declare function Grapher({
  equations,
  params,
  xRange,
  yRange,
  yScale,
  title,
  subtitle,
  height,
  grid
}?: GrapherProps): ReactNode;
//#endregion
export { GraphEquation, GraphParam, Grapher, GrapherProps };