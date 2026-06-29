import { ClassValue } from "clsx";

//#region src/core/util.d.ts
/** Tailwind-aware class merge (clsx + tailwind-merge). */
declare function cn(...inputs: ClassValue[]): string;
/** Coerce an unknown (e.g. an MDX string attribute) to a finite number, or a fallback. */
declare function num(v: unknown, fallback: number): number;
declare const clamp: (v: number, lo: number, hi: number) => number;
declare const lerp: (a: number, b: number, t: number) => number;
/** Degrees → radians. */
declare const toRad: (deg: number) => number;
/** Radians → degrees. */
declare const toDeg: (rad: number) => number;
/** Are two numbers equal within a tolerance (default 1e-6)? */
declare const approxEq: (a: number, b: number, eps?: number) => boolean;
/** Map x from [inMin,inMax] to [outMin,outMax], optionally clamped. */
declare function remap(x: number, inMin: number, inMax: number, outMin: number, outMax: number, doClamp?: boolean): number;
//#endregion
export { approxEq, clamp, cn, lerp, num, remap, toDeg, toRad };