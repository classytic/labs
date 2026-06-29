import { ReactNode } from "react";

//#region src/ict/number-systems/wheel.d.ts
/** 0-9 then A-F… for bases up to 16. */
declare function digitChar(d: number): string;
/** The `width` digits of `value` in `base`, most-significant first, zero-padded. */
declare function toDigits(value: number, base: number, width: number): number[];
/** Largest value representable in `width` digits of `base`. */
declare function maxValue(base: number, width: number): number;
interface DigitWheelProps {
  base: number;
  digit: number;
  /** 0 (settled) → 1 (just changed); slides the digit stack while it decays. */
  roll?: number;
  /** +1 counted up, −1 counted down, direction the wheel rolls. */
  dir?: number;
  /** Non-zero digits read as "active" (accent); a zero is muted. */
  active?: boolean;
  onTap?: () => void;
  ariaLabel?: string;
}
/**
 * One odometer wheel: the current digit large + the next/previous digits peeking
 * (clipped) at the top/bottom edges, so it unmistakably reads as a wheel mid-roll.
 */
declare function DigitWheel({
  base,
  digit,
  roll,
  dir,
  active,
  onTap,
  ariaLabel
}: DigitWheelProps): ReactNode;
/** A binary ON/OFF cell, the "lightbulb worth 2^n" picture for base-2 mode. */
declare function BitCell({
  on,
  onTap,
  ariaLabel
}: {
  on: boolean;
  onTap?: () => void;
  ariaLabel?: string;
}): ReactNode;
interface WheelRowProps {
  value: number;
  base: number;
  width: number;
  /** base-2 ON/OFF cells instead of rolling wheels (the "lightbulb" picture). */
  cells?: boolean;
  /** show the power-of-base weight column under each wheel (glows when non-zero). */
  showWeights?: boolean;
  /** tap a wheel/cell to cycle that one place. */
  onTapDigit?: (index: number) => void;
  ariaPrefix?: string;
}
/**
 * A row of odometer wheels (or bit cells) for `value` in `base`, with the
 * carry-ripple roll animation OWNED here, the single reusable place-value
 * primitive both PlaceValueDial and BaseOdometer compose, so the animation +
 * weight rendering live in exactly one spot.
 */
declare function WheelRow({
  value,
  base,
  width,
  cells,
  showWeights,
  onTapDigit,
  ariaPrefix
}: WheelRowProps): ReactNode;
//#endregion
export { BitCell, DigitWheel, WheelRow, WheelRowProps, digitChar, maxValue, toDigits };