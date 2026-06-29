//#region src/core/easing.d.ts
/**
 * Easing / rate functions, pure `(t in [0,1]) => number`. Ported from manim's
 * `rate_functions` + the standard web set. Shape `alpha` before interpolation.
 */
type Easing = (t: number) => number;
declare const linear: Easing;
/** Smootherstep (manim's default `smooth`): zero velocity AND accel at the ends. */
declare const smooth: Easing;
declare const easeInCubic: Easing;
declare const easeOutCubic: Easing;
declare const easeInOut: Easing;
/** Accelerate from rest (manim `rush_into`). */
declare const rushInto: Easing;
/** Decelerate to rest (manim `rush_from`). */
declare const rushFrom: Easing;
/** Go to 1 then back to 0 (manim `there_and_back`), great for pulses. */
declare const thereAndBack: Easing;
/** Overshoot then settle. */
declare const elastic: Easing;
/** Standard CSS-style cubic-bezier easing factory. */
declare function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing;
/** Squash an easing into the sub-window [a,b] of [0,1] (manim `squish_rate_func`). */
declare function squish(fn: Easing, a?: number, b?: number): Easing;
/** Built-in registry, extend with `registerEasing` (see ./registry). */
declare const EASINGS: Record<string, Easing>;
//#endregion
export { EASINGS, Easing, cubicBezier, easeInCubic, easeInOut, easeOutCubic, elastic, linear, rushFrom, rushInto, smooth, squish, thereAndBack };