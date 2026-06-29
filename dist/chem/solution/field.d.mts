import { ReactNode } from "react";

//#region src/chem/solution/field.d.ts
interface SolutionFieldProps {
  /** Solute particle count (the amount). Capped internally for perf. */
  dots: number;
  /** Liquid's share of the box width, 0..1 (represents volume). */
  fill: number;
  /** Density tint 0..1 (e.g. molarity / maxMolarity), deepens the colour. */
  tint: number;
  /** Solute hue in degrees (HSL), encodes the species; default teal. */
  hue?: number;
  height?: number;
  /** Drag a fixed-size probe to count dots in a sub-region. */
  showProbe?: boolean;
  animate?: boolean;
  ariaLabel?: string;
}
declare function SolutionField({
  dots,
  fill,
  tint,
  hue,
  height,
  showProbe,
  animate,
  ariaLabel
}: SolutionFieldProps): ReactNode;
//#endregion
export { SolutionField, SolutionFieldProps };