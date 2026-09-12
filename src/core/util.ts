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

// Keep this small compatibility kit inside Labs while the published Stage 0.2
// contract exposes only `lerp`. The Stage workspace contains the wider kit,
// but importing it here would make linked-workspace builds pass and published
// consumers fail. These pure helpers also remain available through Labs' public
// core entry point without forcing authors to coordinate package upgrades.
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const round = (n: number, dp = 2): number => Math.round(n * 10 ** dp) / 10 ** dp;

export const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
};

const DEG = Math.PI / 180;

export const toRad = (deg: number): number => deg * DEG;

export const toDeg = (rad: number): number => rad / DEG;

export const approxEq = (a: number, b: number, eps = 1e-6): boolean => Math.abs(a - b) <= eps;

export function remap(
  x: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  doClamp = false,
): number {
  const t = inMax === inMin ? 0 : (x - inMin) / (inMax - inMin);
  const value = outMin + (outMax - outMin) * t;
  return doClamp ? clamp(value, Math.min(outMin, outMax), Math.max(outMin, outMax)) : value;
}

export const snapTo = (v: number, step: number): number => (step > 0 ? Math.round(v / step) * step : v);
