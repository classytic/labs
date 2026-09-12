/**
 * Slide-rule core: the arithmetic of a logarithmic scale.
 *
 * A slide rule multiplies by ADDING LENGTHS. Each value sits at a distance
 * proportional to its logarithm, so laying the length of `a` end to end with the
 * length of `b` lands at the length of `a × b`. That is log(ab) = log a + log b
 * made physical, and it is the whole reason logarithms were invented: before
 * calculators, turning a multiplication into an addition was the difference
 * between minutes and seconds of work.
 *
 * Pure functions only, no React, so the geometry can be tested as numbers.
 */

/** A single decade, 1 to 10, which is all one slide-rule scale carries. */
export const SCALE_MIN = 1;
export const SCALE_MAX = 10;

/** Hold a value inside the one decade the scale can show. */
export function clampValue(value: number): number {
  if (!Number.isFinite(value)) return SCALE_MIN;
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, value));
}

/**
 * Distance from the scale's 1 to `value`, along a scale whose full decade spans
 * `span` units. This IS the logarithm, drawn as a length.
 */
export function logOffset(value: number, span: number): number {
  return span * Math.log10(clampValue(value));
}

/** The value standing `offset` units along the scale. The inverse of `logOffset`. */
export function valueAt(offset: number, span: number): number {
  return 10 ** (offset / span);
}

/** The labelled values on one decade. Every real slide rule numbers these. */
export function majorTicks(): number[] {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
}

/**
 * Unlabelled subdivisions. They crowd towards the right because the scale is
 * logarithmic, which is the visual fact the lab wants a learner to notice.
 */
export function minorTicks(): number[] {
  const out: number[] = [];
  for (let v = 1.1; v < 2; v += 0.1) out.push(round2(v));
  for (let v = 2.2; v < 5; v += 0.2) out.push(round2(v));
  for (let v = 5.5; v < 10; v += 0.5) out.push(round2(v));
  return out;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** How far the sliding scale must travel so its 1 sits directly over `a`. */
export function alignFor(a: number, span: number): number {
  return logOffset(a, span);
}

/**
 * The value on the fixed scale underneath the sliding scale's `b`, when the
 * slide has travelled `slide` units. With the slide set by `alignFor(a)` this
 * returns a × b, because the two lengths have been added.
 */
export function readingAt(slide: number, b: number, span: number): number {
  return valueAt(slide + logOffset(b, span), span);
}

export interface Product {
  /** The true product, which may be larger than the scale can show. */
  product: number;
  /** The digits the rule reads off, always inside one decade. */
  mantissa: number;
  /** Powers of ten the reader supplies themselves. */
  decades: number;
  /** True when a × b ran past the end of the fixed scale. */
  offScale: boolean;
}

/**
 * A slide rule gives you the DIGITS and leaves the decimal point to you: the
 * scale only spans one decade, so 4 × 5 runs off the end and is read as 2.0 with
 * one decade added. That split is exactly "a logarithm is a whole part plus a
 * fraction", which is why log tables print only the fractional part.
 */
export function productOf(a: number, b: number): Product {
  const product = clampValue(a) * clampValue(b);
  const decades = product >= SCALE_MAX ? Math.floor(Math.log10(product)) : 0;
  return {
    product,
    mantissa: product / 10 ** decades,
    decades,
    offScale: product > SCALE_MAX,
  };
}

/** Snap a dragged offset to the nearest tick, so a learner can land exactly on a value. */
export function snapOffset(offset: number, span: number): number {
  const value = valueAt(offset, span);
  const ticks = [...majorTicks(), ...minorTicks()];
  let best: number = SCALE_MIN;
  for (const tick of ticks) {
    if (Math.abs(tick - value) < Math.abs(best - value)) best = tick;
  }
  return logOffset(best, span);
}

/** True when the slide is close enough to `a` to count as lined up. */
export function isAligned(slide: number, a: number, span: number, tolerance = 4): boolean {
  return Math.abs(slide - alignFor(a, span)) <= tolerance;
}
