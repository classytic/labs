import { LabAskSpec } from "../../kit/ask.mjs";
import { ReactNode } from "react";

//#region src/math/domain-range/preset.d.ts
interface DomainRangeProps {
  /** The function f(x): e.g. 'x^2', 'sqrt(x)', '1/(x-2)', 'sqrt(9 - x^2)', 'log(x)'. */
  equation?: string;
  xRange?: [number, number];
  yRange?: [number, number] | 'auto';
  /** Optional author-set domain restriction [a, b], inputs outside are "undefined". */
  restrict?: [number, number];
  /** Initial probe position on the input axis. */
  probe?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  height?: number;
  activity?: string;
}
declare function DomainRangeLab({
  equation,
  xRange,
  yRange,
  restrict,
  probe,
  title,
  prompt,
  ask,
  height,
  activity
}?: DomainRangeProps): ReactNode;
//#endregion
export { DomainRangeLab, DomainRangeProps };