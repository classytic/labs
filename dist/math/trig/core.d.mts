import { toDeg, toRad } from "../../core/util.mjs";

//#region src/math/trig/core.d.ts
declare namespace core_d_exports {
  export { TRIG_FNS, TrigFn, castLetter, castPositive, evalTrig, exactTex, isSpecial, normDeg, quadrant, radTex, referenceAngleDeg, sign, toDeg, toRad };
}
type TrigFn = 'sin' | 'cos' | 'tan';
declare const TRIG_FNS: readonly TrigFn[];
/** Coterminal angle folded into [0, 360). */
declare const normDeg: (deg: number) => number;
/** Numeric value (degrees in). tan where cos = 0 → NaN (undefined), not ±∞. */
declare function evalTrig(fn: TrigFn, deg: number): number;
/** Quadrant 1..4 of the terminal ray; 0 when it lies ON an axis (0/90/180/270). */
declare function quadrant(deg: number): 0 | 1 | 2 | 3 | 4;
/** Reference angle: the acute angle (0..90°) between the terminal ray and the
 *  x-axis — the angle whose exact value you actually look up. */
declare function referenceAngleDeg(deg: number): number;
/** Sign of a trig function at an angle: 1, −1, 0, or NaN (undefined). The CAST
 *  rule made literal (it is just the sign of x = cos, y = sin in each quadrant). */
declare function sign(fn: TrigFn, deg: number): number;
/** The CAST mnemonic: which of sin/cos/tan are POSITIVE in this quadrant.
 *  Q1 All · Q2 Sin · Q3 Tan · Q4 Cos. (On an axis, falls back to actual signs.) */
declare function castPositive(deg: number): TrigFn[];
/** The CAST letter shown in a quadrant: A (all), S (sin), T (tan), C (cos). */
declare const castLetter: (deg: number) => string;
/** Is `deg` one of the standard special angles (a multiple of 30° or 45°)? */
declare const isSpecial: (deg: number) => boolean;
/**
 * Exact value of a trig function at a SPECIAL angle, as a LaTeX string (with the
 * correct quadrant sign), or null if the angle isn't special. e.g.
 * exactTex('cos', 150) → "-\tfrac{\sqrt3}{2}".
 */
declare function exactTex(fn: TrigFn, deg: number): string | null;
/** A degree angle as an exact radian (LaTeX multiple of π), e.g. 30 → "\tfrac{\pi}{6}". */
declare function radTex(deg: number): string;
//#endregion
export { core_d_exports };