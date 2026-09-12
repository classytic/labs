/**
 * The cumulative frequency curve, and reading quartiles off it.
 *
 * This is how the median and the quartiles are actually found from grouped data, in every O and A
 * Level paper: plot cumulative frequency against the UPPER class boundary, join the points into
 * the S, then go across at n/2 and read down. Our lesson on it had no such lab and used a generic
 * function plotter instead, which draws a curve but cannot be read off, so a learner met the
 * technique as an assertion.
 *
 * Two things here are the whole point and are easy to get wrong:
 *
 *   The plot goes against the UPPER boundary, not the midpoint. A class "10 to 20" contributes its
 *   whole frequency only once you have passed 20, so the point sits at 20. Plot at the midpoint and
 *   the curve is shifted half a class left and every reading is wrong by the same amount.
 *
 *   Readings use n/2, not (n+1)/2. The curve is a continuous model of grouped data, so the median
 *   is the value at half the total area. The (n+1)/2 rule belongs to an ordered LIST of discrete
 *   values, and mixing the two is the most common lost mark in this topic.
 */

/** One grouped class: everything above `from` and up to and including `to`. */
export interface Bin {
  from: number;
  to: number;
  frequency: number;
}

/** A point on the curve: the upper boundary, and how much has accumulated by it. */
export interface CumulativePoint {
  x: number;
  cumulative: number;
}

/** Running totals at each upper boundary, starting from zero at the first lower boundary. */
export function cumulativePoints(bins: readonly Bin[]): CumulativePoint[] {
  if (!bins.length) return [];
  const points: CumulativePoint[] = [{ x: bins[0]!.from, cumulative: 0 }];
  let running = 0;
  for (const bin of bins) {
    running += bin.frequency;
    points.push({ x: bin.to, cumulative: running });
  }
  return points;
}

export const totalFrequency = (bins: readonly Bin[]): number =>
  bins.reduce((sum, bin) => sum + bin.frequency, 0);

/**
 * Read a value off the curve at a given cumulative height, by linear interpolation.
 *
 * Interpolating is not a shortcut, it IS the method: the grouped data does not record where inside
 * a class each value fell, so the curve assumes they are spread evenly across it. That assumption
 * is what makes a reading possible and is also its only source of error.
 */
export function readAt(bins: readonly Bin[], cumulative: number): number | null {
  const points = cumulativePoints(bins);
  if (points.length < 2) return null;
  const total = totalFrequency(bins);
  if (cumulative <= 0) return points[0]!.x;
  if (cumulative >= total) return points.at(-1)!.x;
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1]!;
    const current = points[i]!;
    if (cumulative > current.cumulative) continue;
    const span = current.cumulative - previous.cumulative;
    if (span <= 0) return current.x;
    const fraction = (cumulative - previous.cumulative) / span;
    return previous.x + fraction * (current.x - previous.x);
  }
  return points.at(-1)!.x;
}

export interface Quartiles {
  q1: number;
  median: number;
  q3: number;
  iqr: number;
}

/** The three readings and the spread between the outer two. */
export function quartiles(bins: readonly Bin[]): Quartiles | null {
  const total = totalFrequency(bins);
  if (total <= 0) return null;
  const q1 = readAt(bins, total / 4);
  const median = readAt(bins, total / 2);
  const q3 = readAt(bins, (3 * total) / 4);
  if (q1 === null || median === null || q3 === null) return null;
  return { q1, median, q3, iqr: q3 - q1 };
}

/** Authoring mistakes worth catching before a learner meets them. */
export function ogiveProblems(bins: readonly Bin[]): string[] {
  const problems: string[] = [];
  if (bins.length < 2) problems.push('a curve needs at least two classes');
  for (const [i, bin] of bins.entries()) {
    if (bin.to <= bin.from) problems.push(`class ${i + 1} ends at or before it starts`);
    if (bin.frequency < 0) problems.push(`class ${i + 1} has a negative frequency`);
    // A gap or an overlap between classes breaks the curve: cumulative frequency assumes the
    // classes tile the range with nothing missing and nothing counted twice.
    const next = bins[i + 1];
    if (next && next.from !== bin.to)
      problems.push(`class ${i + 1} ends at ${bin.to} but class ${i + 2} starts at ${next.from}`);
  }
  return problems;
}
