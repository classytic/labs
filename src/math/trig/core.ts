/**
 * Trig TEACHING kernel. Stage's expr engine already EVALUATES sin/cos/tan
 * numerically (and plots / differentiates / LaTeX-renders them) — so this layer
 * adds only the things that engine has no notion of, the parts a learner actually
 * struggles with:
 *   • exact special-angle values (sin30 = ½, not 0.4999…),
 *   • the QUADRANT + CAST sign rule (where sin/cos/tan are + / −),
 *   • the reference angle (the acute angle to the x-axis),
 *   • a degree → exact-radian multiple of π.
 *
 * Pure, reuses core/util's toRad/toDeg/gcd/approxEq. Numerically safe: tan at 90°
 * / 270° is reported as "undefined", never ±∞.
 */

import { toRad, toDeg, gcd, approxEq } from '../../core/util.js';

export type TrigFn = 'sin' | 'cos' | 'tan';
export const TRIG_FNS: readonly TrigFn[] = ['sin', 'cos', 'tan'];

export { toRad, toDeg };

/** Coterminal angle folded into [0, 360). */
export const normDeg = (deg: number): number => ((deg % 360) + 360) % 360;

/** Numeric value (degrees in). tan where cos = 0 → NaN (undefined), not ±∞. */
export function evalTrig(fn: TrigFn, deg: number): number {
  const r = toRad(normDeg(deg));
  if (fn === 'sin') return Math.sin(r);
  if (fn === 'cos') return Math.cos(r);
  return approxEq(Math.cos(r), 0) ? NaN : Math.tan(r); // tan undefined at 90°, 270°
}

/** Quadrant 1..4 of the terminal ray; 0 when it lies ON an axis (0/90/180/270). */
export function quadrant(deg: number): 0 | 1 | 2 | 3 | 4 {
  const a = normDeg(deg);
  if (a === 0 || a === 90 || a === 180 || a === 270) return 0;
  if (a < 90) return 1;
  if (a < 180) return 2;
  if (a < 270) return 3;
  return 4;
}

/** Reference angle: the acute angle (0..90°) between the terminal ray and the
 *  x-axis — the angle whose exact value you actually look up. */
export function referenceAngleDeg(deg: number): number {
  const a = normDeg(deg);
  if (a <= 90) return a;
  if (a <= 180) return 180 - a;
  if (a <= 270) return a - 180;
  return 360 - a;
}

/** Sign of a trig function at an angle: 1, −1, 0, or NaN (undefined). The CAST
 *  rule made literal (it is just the sign of x = cos, y = sin in each quadrant). */
export function sign(fn: TrigFn, deg: number): number {
  const v = evalTrig(fn, deg);
  if (!Number.isFinite(v)) return NaN;
  return approxEq(v, 0) ? 0 : Math.sign(v);
}

/** The CAST mnemonic: which of sin/cos/tan are POSITIVE in this quadrant.
 *  Q1 All · Q2 Sin · Q3 Tan · Q4 Cos. (On an axis, falls back to actual signs.) */
export function castPositive(deg: number): TrigFn[] {
  const q = quadrant(deg);
  if (q === 1) return ['sin', 'cos', 'tan'];
  if (q === 2) return ['sin'];
  if (q === 3) return ['tan'];
  if (q === 4) return ['cos'];
  return TRIG_FNS.filter((fn) => sign(fn, deg) > 0);
}

/** The CAST letter shown in a quadrant: A (all), S (sin), T (tan), C (cos). */
export const castLetter = (deg: number): string => ({ 1: 'A', 2: 'S', 3: 'T', 4: 'C', 0: '·' } as const)[quadrant(deg)];

// ── exact special-angle values (reference angle + CAST sign) ───────────────────

interface ExactRow { sin: string; cos: string; tan: string }
/** Magnitudes at the base reference angles; sign is applied per quadrant. */
const BASE: Record<number, ExactRow> = {
  0: { sin: '0', cos: '1', tan: '0' },
  30: { sin: '\\tfrac12', cos: '\\tfrac{\\sqrt3}{2}', tan: '\\tfrac{1}{\\sqrt3}' },
  45: { sin: '\\tfrac{\\sqrt2}{2}', cos: '\\tfrac{\\sqrt2}{2}', tan: '1' },
  60: { sin: '\\tfrac{\\sqrt3}{2}', cos: '\\tfrac12', tan: '\\sqrt3' },
  90: { sin: '1', cos: '0', tan: '\\text{undefined}' },
};

/** Is `deg` one of the standard special angles (a multiple of 30° or 45°)? */
export const isSpecial = (deg: number): boolean => referenceAngleDeg(deg) in BASE;

/**
 * Exact value of a trig function at a SPECIAL angle, as a LaTeX string (with the
 * correct quadrant sign), or null if the angle isn't special. e.g.
 * exactTex('cos', 150) → "-\tfrac{\sqrt3}{2}".
 */
export function exactTex(fn: TrigFn, deg: number): string | null {
  const ref = referenceAngleDeg(deg);
  const row = BASE[ref];
  if (!row) return null;
  const base = row[fn];
  if (base === '\\text{undefined}') return base;
  const s = sign(fn, deg);
  if (Number.isNaN(s)) return '\\text{undefined}';
  if (s === 0) return '0';
  return s < 0 && base !== '0' ? `-${base}` : base;
}

// ── degree → exact radian multiple of π ────────────────────────────────────────

/** A degree angle as an exact radian (LaTeX multiple of π), e.g. 30 → "\tfrac{\pi}{6}". */
export function radTex(deg: number): string {
  const a = normDeg(deg);
  if (a === 0) return '0';
  const g = gcd(a, 180);
  const p = a / g, q = 180 / g;
  const top = p === 1 ? '\\pi' : `${p}\\pi`;
  return q === 1 ? top : `\\tfrac{${top}}{${q}}`;
}
