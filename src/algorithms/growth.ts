/**
 * Growth rates, as numbers a learner can read at a chosen input size.
 *
 * Big-O is usually taught as a table to memorise, which is why students can recite that bubble
 * sort is O(n²) and still not expect it to be slow. The fix is arithmetic: at n = 10 every class
 * here looks similar, and at n = 1000 they are separated by hundreds of orders of magnitude.
 *
 * Each class names an algorithm the library already teaches, so the abstraction points back at
 * something the learner has actually stepped through.
 */

export type GrowthClass = 'constant' | 'log' | 'linear' | 'linearithmic' | 'quadratic' | 'exponential';

export const GROWTH_CLASSES: GrowthClass[] = [
  'constant',
  'log',
  'linear',
  'linearithmic',
  'quadratic',
  'exponential',
];

export const GROWTH_NOTATION: Record<GrowthClass, string> = {
  constant: 'O(1)',
  log: 'O(log n)',
  linear: 'O(n)',
  linearithmic: 'O(n log n)',
  quadratic: 'O(n²)',
  exponential: 'O(2ⁿ)',
};

/** An algorithm from this library, so the class is not an abstraction on its own. */
export const GROWTH_EXAMPLE: Record<GrowthClass, string> = {
  constant: 'Reading one position of an array',
  log: 'Binary search on sorted data',
  linear: 'Scanning every value once',
  linearithmic: 'Merge sort',
  quadratic: 'Bubble sort',
  exponential: 'Trying every subset',
};

/** Work done at input size n. Steps, not seconds: hardware is not the variable being taught. */
export function operations(kind: GrowthClass, n: number): number {
  const size = Math.max(1, Math.floor(n));
  const log = Math.max(1, Math.ceil(Math.log2(size)));
  switch (kind) {
    case 'constant':
      return 1;
    case 'log':
      return log;
    case 'linear':
      return size;
    case 'linearithmic':
      return size * log;
    case 'quadratic':
      return size * size;
    case 'exponential':
      return 2 ** size;
  }
}

/**
 * Readable at any magnitude. Past a million the exact digits stop meaning anything, and past
 * what a double can hold the honest answer is that the number has no useful size.
 */
export function formatOperations(value: number): string {
  if (!Number.isFinite(value)) return 'more than a computer can represent';
  if (value < 1_000_000) return Math.round(value).toLocaleString('en-US');
  return value.toExponential(2).replace('e+', ' × 10^');
}

export interface GrowthRow {
  kind: GrowthClass;
  operations: number;
  /** 0 to 1, on a log scale, for drawing a bar that stays readable across many magnitudes. */
  share: number;
}

/**
 * The classes a bar chart can usefully compare. O(2ⁿ) is deliberately absent.
 *
 * Including it destroys the chart, and this was only obvious once rendered: at n = 1000 the
 * exponential count is about 10³⁰¹, so scaling against it puts every practical class between 0
 * and 0.02 of the width. The reader learns that exponential is enormous, which they already knew,
 * and learns NOTHING about n log n against n², which is the comparison that decides real work.
 * O(2ⁿ) belongs beside the chart as a number, not inside it as a bar.
 */
export const PRACTICAL_CLASSES: GrowthClass[] = ['constant', 'log', 'linear', 'linearithmic', 'quadratic'];

/**
 * The practical classes at one input size, cheapest first, with a LOG-scaled share.
 *
 * Log rather than linear because at n = 1000 a linear scale would leave everything below
 * quadratic invisible. Scaled against the slowest PRACTICAL class, for the reason above.
 */
export function growthAt(n: number): GrowthRow[] {
  const rows = PRACTICAL_CLASSES.map((kind) => ({ kind, operations: operations(kind, n) }));
  const logs = rows.map((row) => Math.log10(Math.max(1, row.operations)));
  const ceiling = Math.max(1, ...logs);
  return rows
    .map((row, index) => ({ ...row, share: Math.min(1, logs[index]! / ceiling) }))
    .sort((a, b) => a.operations - b.operations);
}

/** O(2ⁿ) on its own, because it does not share a scale with anything above. */
export function intractableAt(n: number): { operations: number; notation: string; example: string } {
  return {
    operations: operations('exponential', n),
    notation: GROWTH_NOTATION.exponential,
    example: GROWTH_EXAMPLE.exponential,
  };
}

/** How many times more work the slower class does. Infinity is reported as such, not hidden. */
export function timesSlower(slower: GrowthClass, faster: GrowthClass, n: number): number {
  const top = operations(slower, n);
  const bottom = operations(faster, n);
  return bottom === 0 ? Infinity : top / bottom;
}
