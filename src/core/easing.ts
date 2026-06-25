/**
 * Easing / rate functions — pure `(t in [0,1]) => number`. Ported from manim's
 * `rate_functions` + the standard web set. Shape `alpha` before interpolation.
 */

export type Easing = (t: number) => number;

export const linear: Easing = (t) => t;

/** Smootherstep (manim's default `smooth`): zero velocity AND accel at the ends. */
export const smooth: Easing = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export const easeInCubic: Easing = (t) => t * t * t;
export const easeOutCubic: Easing = (t) => 1 - (1 - t) ** 3;
export const easeInOut: Easing = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Accelerate from rest (manim `rush_into`). */
export const rushInto: Easing = (t) => 2 * smooth(t / 2);
/** Decelerate to rest (manim `rush_from`). */
export const rushFrom: Easing = (t) => 2 * smooth(t / 2 + 0.5) - 1;

/** Go to 1 then back to 0 (manim `there_and_back`) — great for pulses. */
export const thereAndBack: Easing = (t) => smooth(t < 0.5 ? 2 * t : 2 * (1 - t));

/** Overshoot then settle. */
export const elastic: Easing = (t) => {
  if (t === 0 || t === 1) return t;
  const p = 0.3;
  return 2 ** (-10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
};

/** Standard CSS-style cubic-bezier easing factory. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const fx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const fy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dfx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = fx(t) - x;
      if (Math.abs(e) < 1e-4) break;
      const d = dfx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return fy(Math.min(1, Math.max(0, t)));
  };
}

/** Squash an easing into the sub-window [a,b] of [0,1] (manim `squish_rate_func`). */
export function squish(fn: Easing, a = 0.2, b = 0.8): Easing {
  return (t) => (t < a ? 0 : t > b ? 1 : fn((t - a) / (b - a)));
}

/** Built-in registry — extend with `registerEasing` (see ./registry). */
export const EASINGS: Record<string, Easing> = {
  linear,
  smooth,
  easeInCubic,
  easeOutCubic,
  easeInOut,
  rushInto,
  rushFrom,
  thereAndBack,
  elastic,
};
