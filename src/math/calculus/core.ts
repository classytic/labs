/** Pure numerical models shared by calculus visualizations. No React or Stage dependency. */

export type RealFunction = (x: number) => number;
export type RiemannMode = 'left' | 'mid' | 'right';

export interface FunctionViewport {
  yMin: number;
  yMax: number;
}

export interface RiemannSlice {
  x0: number;
  x1: number;
  sampleX: number;
  height: number;
}

/** Normalize untrusted author/runtime graph bounds to a finite ascending interval. */
export function normalizeRange(
  range: readonly [number, number],
  fallback: readonly [number, number] = [-5, 5],
): [number, number] {
  const fallbackMin = Number.isFinite(fallback[0]) ? fallback[0] : -5;
  const fallbackMax =
    Number.isFinite(fallback[1]) && fallback[1] > fallbackMin ? fallback[1] : fallbackMin + 10;
  const minimum = Number.isFinite(range[0]) ? range[0] : fallbackMin;
  const maximum = Number.isFinite(range[1]) ? range[1] : fallbackMax;
  if (maximum - minimum >= 1e-6) return [minimum, maximum];
  if (minimum - maximum >= 1e-6) return [maximum, minimum];
  const center = Number.isFinite(minimum) ? minimum : (fallbackMin + fallbackMax) / 2;
  return [center - 1, center + 1];
}

export function valueInRange(value: number, range: readonly [number, number], fallback: number): number {
  const candidate = Number.isFinite(value) ? value : fallback;
  return Math.min(range[1], Math.max(range[0], candidate));
}

/** Composite Simpson accumulation from a fixed anchor to x; orientation is preserved. */
export function accumulationAt(fn: RealFunction, anchor: number, x: number, intervals = 240): number {
  if (anchor === x) return 0;
  const count = Math.max(2, Math.ceil(intervals / 2) * 2);
  const step = (x - anchor) / count;
  let sum = fn(anchor) + fn(x);
  if (!Number.isFinite(sum)) return Number.NaN;
  for (let index = 1; index < count; index++) {
    const value = fn(anchor + index * step);
    if (!Number.isFinite(value)) return Number.NaN;
    sum += (index % 2 === 1 ? 4 : 2) * value;
  }
  return (sum * step) / 3;
}

/** Robust graph bounds: trim isolated asymptotes, retain zero, and add breathing room. */
export function functionViewport(
  fn: RealFunction,
  range: readonly [number, number],
  samples = 240,
): FunctionViewport {
  const [xMin, xMax] = range;
  const values: number[] = [];
  const count = Math.max(16, Math.floor(samples));
  for (let i = 0; i <= count; i++) {
    const value = fn(xMin + ((xMax - xMin) * i) / count);
    if (Number.isFinite(value)) values.push(value);
  }
  if (!values.length) return { yMin: -1, yMax: 1 };
  values.sort((a, b) => a - b);
  let yMin = Math.min(values[Math.floor(values.length * 0.02)] ?? -1, 0);
  let yMax = Math.max(values[Math.floor(values.length * 0.98)] ?? 1, 0);
  if (Math.abs(yMax - yMin) < 1e-12) {
    const center = (yMin + yMax) / 2;
    yMin = center - 1;
    yMax = center + 1;
  }
  const pad = (yMax - yMin) * 0.14;
  // Snap the bounds to a stable precision. The samples come from the user's function (e.g. x^3 via
  // Math.pow), which isn't bit-identical across the SSR (Node) and browser JS engines — a 1-ULP
  // difference here would cascade into every grid/axis pixel coordinate and trip React hydration.
  // 10 significant figures is far below any visible change but well above the ~15th-figure drift.
  const snap = (v: number): number => Number(v.toPrecision(10));
  return { yMin: snap(yMin - pad), yMax: snap(yMax + pad) };
}

/** Five-point central difference, O(h^4), with a scale-aware default step. */
export function derivativeAt(
  fn: RealFunction,
  x: number,
  h = Math.cbrt(Number.EPSILON) * Math.max(1, Math.abs(x)),
): number {
  const step = Math.max(Math.abs(h), 1e-7);
  return (-fn(x + 2 * step) + 8 * fn(x + step) - 8 * fn(x - step) + fn(x - 2 * step)) / (12 * step);
}

export function secantSlope(fn: RealFunction, x: number, h: number): number {
  if (h === 0) return derivativeAt(fn, x);
  return (fn(x + h) - fn(x)) / h;
}

/** Rectangles are geometrically ordered left-to-right; orientation is carried by the estimate. */
export function riemannSlices(
  fn: RealFunction,
  a: number,
  b: number,
  n: number,
  mode: RiemannMode,
): RiemannSlice[] {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const count = Math.max(1, Math.floor(n));
  const width = (hi - lo) / count;
  return Array.from({ length: count }, (_, index) => {
    const x0 = lo + index * width;
    const x1 = x0 + width;
    const sampleX = mode === 'left' ? x0 : mode === 'right' ? x1 : (x0 + x1) / 2;
    return { x0, x1, sampleX, height: fn(sampleX) };
  }).filter((slice) => Number.isFinite(slice.height));
}

/** Signed Riemann estimate: swapping bounds negates the integral. */
export function riemannEstimate(
  fn: RealFunction,
  a: number,
  b: number,
  n: number,
  mode: RiemannMode,
): number {
  const count = Math.max(1, Math.floor(n));
  const width = (b - a) / count;
  let total = 0;
  for (let index = 0; index < count; index++) {
    const x0 = a + index * width;
    const sampleX = mode === 'left' ? x0 : mode === 'right' ? x0 + width : x0 + width / 2;
    const value = fn(sampleX);
    if (!Number.isFinite(value)) return Number.NaN;
    total += value;
  }
  return total * width;
}
