/**
 * Geometric-optics kernel — one source of truth for the optics labs (Snell
 * refraction + critical angle/TIR, and the thin lens/mirror equation). Pure
 * functions, unit-tested, so a lab never hand-rolls the physics.
 *
 * Sign convention for `thinOptic` is the teaching one used at O/A-level:
 * 1/f = 1/u + 1/v with distances as magnitudes; CONVERGING optic f > 0 (convex
 * lens / concave mirror), DIVERGING f < 0 (concave lens / convex mirror). A real
 * object sits at u > 0. A negative image distance v means a virtual image.
 */

const D2R = Math.PI / 180,
  R2D = 180 / Math.PI;

/** Refractive index of common media, so a lab can offer material presets. */
export const MEDIA: Record<string, number> = {
  vacuum: 1,
  air: 1.0003,
  water: 1.333,
  glass: 1.5,
  'dense glass': 1.62,
  diamond: 2.417,
};

/**
 * Snell's law: the angle (deg from the normal) a ray refracts to when crossing from
 * index n1 into n2 at `incidenceDeg`. Returns null on TOTAL INTERNAL REFLECTION
 * (n1 > n2 and the incidence exceeds the critical angle).
 */
export function refract(incidenceDeg: number, n1: number, n2: number): number | null {
  if (
    ![incidenceDeg, n1, n2].every(Number.isFinite) ||
    n1 <= 0 ||
    n2 <= 0 ||
    incidenceDeg < 0 ||
    incidenceDeg > 90
  ) {
    throw new RangeError('Refraction requires finite n₁,n₂ > 0 and an incidence angle from 0° to 90°');
  }
  const s = (n1 / n2) * Math.sin(incidenceDeg * D2R);
  if (Math.abs(s) > 1 + 1e-12) return null;
  return Math.asin(Math.max(-1, Math.min(1, s))) * R2D;
}

/** Critical angle (deg) for n1 → n2, or null when n1 ≤ n2 (no TIR possible). */
export function criticalAngle(n1: number, n2: number): number | null {
  if (![n1, n2].every(Number.isFinite) || n1 <= 0 || n2 <= 0)
    throw new RangeError('Refractive indices must be finite and positive');
  if (n1 <= n2) return null;
  return Math.asin(n2 / n1) * R2D;
}

export interface OpticImage {
  /** Image distance from the optic; negative ⇒ virtual (same side as the object). */
  v: number;
  /** Magnification (magnitude); >1 enlarged, <1 diminished. */
  m: number;
  real: boolean;
  upright: boolean;
  atInfinity: boolean;
}

/**
 * Thin lens / curved mirror: solve 1/f = 1/u + 1/v for the image of a real object
 * at distance `u` (u > 0). f > 0 converging, f < 0 diverging.
 */
export function thinOptic(f: number, u: number): OpticImage {
  if (Math.abs(u - f) < 1e-6)
    return { v: Infinity, m: Infinity, real: true, upright: false, atInfinity: true };
  const v = (f * u) / (u - f); // 1/v = 1/f − 1/u
  const real = v > 0;
  return { v, m: Math.abs(v / u), real, upright: !real, atInfinity: false };
}
