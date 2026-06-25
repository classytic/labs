import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware class merge (clsx + tailwind-merge). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Coerce an unknown (e.g. an MDX string attribute) to a finite number, or a fallback. */
export function num(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number.parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const DEG = Math.PI / 180;
/** Degrees → radians. */
export const toRad = (deg: number): number => deg * DEG;
/** Radians → degrees. */
export const toDeg = (rad: number): number => rad / DEG;

/** Are two numbers equal within a tolerance (default 1e-6)? */
export const approxEq = (a: number, b: number, eps = 1e-6): boolean => Math.abs(a - b) <= eps;

/** Map x from [inMin,inMax] to [outMin,outMax], optionally clamped. */
export function remap(
  x: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  doClamp = false,
): number {
  const t = inMax === inMin ? 0 : (x - inMin) / (inMax - inMin);
  const v = outMin + (outMax - outMin) * t;
  return doClamp ? clamp(v, Math.min(outMin, outMax), Math.max(outMin, outMax)) : v;
}
