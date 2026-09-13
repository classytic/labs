/**
 * Where a running time comes from, not just what it is.
 *
 * A learner can be taught to RECOGNISE O(n log n) and still be unable to produce it,
 * and producing it is what an exam and an interview ask for. Three derivations cover
 * nearly every cost in an introductory course, and each is short once it is drawn:
 *
 *   nested     two loops -> (n-1) + (n-2) + ... + 1, paired into n(n-1)/2
 *   halving    n -> n/2 -> n/4 -> ... -> 1, so 2^k = n and k = log2 n
 *   recursion  T(n) = 2T(n/2) + n, drawn as log2 n levels of n work each
 *
 * Everything here is exact and pure, so the closed forms can be checked against the
 * thing they are a shortcut for: if `total` ever disagrees with the summed rows, the
 * lab is teaching a formula the picture does not support.
 */

/** The three ways a cost is counted in this course. */
export type CostMode = 'nested' | 'halving' | 'recursion';

// ── nested loops: the triangle ──────────────────────────────────────────────

/**
 * Comparisons per pass of a selection-style sort over `n` items: n-1, n-2, ... 1.
 *
 * Drawn as rows, this is a triangle, and the triangle is the argument: two copies of
 * it make an (n-1) by n rectangle, so one copy is n(n-1)/2.
 */
export function triangleRows(n: number): number[] {
  const rows: number[] = [];
  for (let i = n - 1; i >= 1; i--) rows.push(i);
  return rows;
}

/** The closed form for those rows. MUST equal their sum; the test asserts exactly that. */
export const triangleTotal = (n: number): number => (n < 2 ? 0 : (n * (n - 1)) / 2);

/**
 * The pairing that proves it: first with last, second with second-last. Every pair
 * sums to n, and there are (n-1)/2 of them.
 */
export function trianglePairs(n: number): { a: number; b: number; sum: number }[] {
  const rows = triangleRows(n);
  const out: { a: number; b: number; sum: number }[] = [];
  for (let i = 0, j = rows.length - 1; i < j; i++, j--) {
    out.push({ a: rows[i]!, b: rows[j]!, sum: rows[i]! + rows[j]! });
  }
  return out;
}

// ── halving: where log2 actually comes from ─────────────────────────────────

/**
 * The sizes left after each halving: n, n/2, n/4, ... down to 1.
 *
 * The course used to assert "a thousand need at most ten probes" and never show why.
 * The chain IS the why: count its steps, and the count is the logarithm.
 */
export function halvingChain(n: number): number[] {
  const out: number[] = [];
  let size = Math.max(1, Math.floor(n));
  out.push(size);
  while (size > 1) {
    size = Math.floor(size / 2);
    out.push(size);
  }
  return out;
}

/** Halvings needed to reach 1: the exact answer the chain shows, as ceil(log2 n). */
export const halvingSteps = (n: number): number => (n < 2 ? 0 : Math.ceil(Math.log2(n)));

// ── divide and conquer: the recursion tree ──────────────────────────────────

export interface TreeLevel {
  /** 0 is the original call. */
  depth: number;
  /** How many calls sit at this depth: 2^depth. */
  calls: number;
  /** Items each call handles: n / 2^depth. */
  sizeEach: number;
  /** Merging cost across the whole level, which stays about n at every depth. */
  workHere: number;
}

/**
 * T(n) = 2T(n/2) + n, drawn level by level.
 *
 * The point the picture makes and the formula hides: the work per LEVEL barely
 * changes, because twice as many calls each handle half as much. So the total is
 * "work on one level" times "number of levels", and the number of levels is the
 * halving count above. That is the whole of n log n.
 */
export function recursionLevels(n: number): TreeLevel[] {
  const out: TreeLevel[] = [];
  const depth = halvingSteps(n);
  for (let d = 0; d <= depth; d++) {
    const calls = 2 ** d;
    const sizeEach = n / calls;
    out.push({ depth: d, calls, sizeEach, workHere: calls * sizeEach });
  }
  return out;
}

/** Total comparisons for the merge-sort recurrence: n per level, over log2 n levels. */
export const recursionTotal = (n: number): number => n * halvingSteps(n);

// ── the shared readout ──────────────────────────────────────────────────────

export interface CostReadout {
  /** Exact operation count for this n. */
  steps: number;
  /** The closed form, written the way a learner should reproduce it. */
  formula: string;
  /** The growth class, once constants and smaller terms are dropped. */
  bigO: string;
}

export function readout(mode: CostMode, n: number): CostReadout {
  switch (mode) {
    case 'nested':
      return { steps: triangleTotal(n), formula: 'n(n − 1) / 2', bigO: 'O(n²)' };
    case 'halving':
      return { steps: halvingSteps(n), formula: 'log₂ n', bigO: 'O(log n)' };
    case 'recursion':
      return { steps: recursionTotal(n), formula: 'n × log₂ n', bigO: 'O(n log n)' };
  }
}
