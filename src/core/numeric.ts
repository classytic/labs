/**
 * numeric — small numerical-calculus helpers, used when an exact symbolic result
 * isn't available (e.g. a function the differentiator doesn't handle) or when a
 * widget just needs a number. Pure, dependency-free.
 */

export type RealFn = (x: number) => number;

/** Numerical derivative via the symmetric difference quotient. */
export function derivativeAt(fn: RealFn, x: number, h = 1e-5): number {
  return (fn(x + h) - fn(x - h)) / (2 * h);
}

/** Slope of the secant line through (a, f(a)) and (b, f(b)). */
export function secantSlope(fn: RealFn, a: number, b: number): number {
  return (fn(b) - fn(a)) / (b - a);
}

/** Sample a function across a range into `{x, y}` points (skips non-finite y is the caller's job). */
export function sampleFunction(fn: RealFn, range: [number, number], samples = 200): { x: number; y: number }[] {
  const [min, max] = range;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = min + ((max - min) * i) / samples;
    out.push({ x, y: fn(x) });
  }
  return out;
}

/** Riemann sum of `fn` over `[a, b]` with `n` subintervals. A teaching estimate. */
export function riemannSum(fn: RealFn, range: [number, number], n: number, mode: 'left' | 'right' | 'mid' = 'mid'): number {
  const [a, b] = range;
  const dx = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = mode === 'left' ? a + i * dx : mode === 'right' ? a + (i + 1) * dx : a + (i + 0.5) * dx;
    sum += fn(x);
  }
  return sum * dx;
}

/**
 * Composite Simpson's rule — a high-accuracy definite-integral estimate (error
 * O(h⁴), vs O(h) for a Riemann sum). Used as the "reference" a Riemann sum
 * converges toward. `n` is forced even. Not exact, but accurate to ~machine
 * precision for smooth integrands at n≈1000.
 */
export function integrate(fn: RealFn, range: [number, number], n = 1000): number {
  const [a, b] = range;
  const m = Math.max(2, Math.ceil(n / 2) * 2);
  const h = (b - a) / m;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < m; i++) sum += (i % 2 === 1 ? 4 : 2) * fn(a + i * h);
  return (sum * h) / 3;
}

/**
 * Estimate a one-sided limit of `fn` as x → c from `side` (+1 right, −1 left) by
 * sampling a shrinking sequence of offsets. Returns the closest-in value and
 * whether the sequence is *converging* (consecutive samples agree) — so callers
 * can honestly report "estimated limit" + confidence rather than a hard claim.
 */
export function estimateOneSidedLimit(fn: RealFn, c: number, side: 1 | -1): { value: number; converging: boolean } {
  const offsets = [0.1, 0.01, 1e-3, 1e-4, 1e-5];
  const vals = offsets.map((h) => fn(c + side * h)).filter((v) => Number.isFinite(v));
  if (vals.length < 2) return { value: Number.NaN, converging: false };
  const last = vals[vals.length - 1] as number;
  const prev = vals[vals.length - 2] as number;
  const converging = Math.abs(last - prev) < 1e-2 * (1 + Math.abs(last));
  return { value: last, converging };
}
