import { ReactNode } from "react";

//#region src/math/fraction-bar/preset.d.ts
interface FractionBarProps {
  /** Number of equal parts the whole is cut into. Default 4. */
  denom?: number;
  /** Starting shaded parts. Default 0. */
  num?: number;
  /** Goal numerator; solved when that many parts are shaded. Omit to explore. */
  target?: number;
  /** If set, also show the fraction OF this quantity (k/n × whole). */
  whole?: number;
  unit?: string;
  /** Second strip cut into this many parts, to show the equivalent fraction. */
  compareDenom?: number;
  /** Show the decimal + percent equivalents. Default true. */
  showEquiv?: boolean;
  /** Optional concrete twin (any level scene): the part-whole as a pie / jar / etc. */
  scene?: string;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}
declare function FractionBarLab(props?: FractionBarProps): ReactNode;
//#endregion
export { FractionBarLab, FractionBarProps };