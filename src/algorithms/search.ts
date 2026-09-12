/**
 * Searching traces: binary search against linear search, on the same sorted array.
 *
 * The teaching point is not the algorithm, it is the COUNT. Halving sounds fast and stays
 * abstract until a learner sees 4 probes beside 100 scans on the same data, so every trace
 * carries both numbers.
 *
 * Binary search needs a window, which the shared sequence contract has no field for, so the
 * step type is defined here. It reuses `SequenceDecision`'s left and right, which exist in the
 * shared contract precisely because a search goes one way or the other.
 */

import type { SequenceDecision } from './sequence-contract.js';

/** Which half survives a probe, or the probe that ends the search. */
export type SearchDecision = Extract<SequenceDecision, 'left' | 'right'> | 'found';

export interface SearchStep {
  /** Inclusive window still being searched when this probe was made. */
  lo: number;
  hi: number;
  mid: number;
  decision: SearchDecision;
  /** How many candidates remain AFTER acting on this probe. */
  remaining: number;
  message: string;
}

export interface SearchTrace {
  /** Sorted ascending: binary search is only defined on ordered data. */
  values: number[];
  target: number;
  steps: SearchStep[];
  /** Index in the sorted array, or -1 when the target is absent. */
  foundIndex: number;
  /** Probes binary search made. */
  comparisons: number;
  /** Comparisons a left-to-right scan would have made on the same array. */
  linearComparisons: number;
  /** The ceiling binary search cannot exceed: one probe per halving. */
  worstCase: number;
}

export const sortedCopy = (values: readonly number[]): number[] => [...values].sort((a, b) => a - b);

/**
 * Count a scan from the left. Absent targets cost a full pass, which is the honest worst case
 * and the number that makes binary search look good.
 */
export function linearSearchComparisons(values: readonly number[], target: number): number {
  const index = values.findIndex((value) => value === target);
  return index === -1 ? values.length : index + 1;
}

/**
 * Probe the middle of the surviving window until the target is found or the window is empty.
 *
 * One comparison is counted per probe. A three-way comparison is what the pseudocode assumes,
 * and counting the equality test separately would double a number whose whole purpose is to be
 * compared against the linear count.
 */
export function binarySearchTrace(values: readonly number[], target: number): SearchTrace {
  const sorted = sortedCopy(values);
  const steps: SearchStep[] = [];
  let lo = 0;
  let hi = sorted.length - 1;
  let foundIndex = -1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const value = sorted[mid]!;
    if (value === target) {
      steps.push({
        lo,
        hi,
        mid,
        decision: 'found',
        remaining: 1,
        message: `Probe position ${mid}: it holds ${value}, which is the target.`,
      });
      foundIndex = mid;
      break;
    }
    const goRight = value < target;
    const nextLo = goRight ? mid + 1 : lo;
    const nextHi = goRight ? hi : mid - 1;
    steps.push({
      lo,
      hi,
      mid,
      decision: goRight ? 'right' : 'left',
      remaining: Math.max(0, nextHi - nextLo + 1),
      message: `Probe position ${mid}: ${value} is ${goRight ? 'below' : 'above'} ${target}, so discard the ${
        goRight ? 'left' : 'right'
      } half.`,
    });
    lo = nextLo;
    hi = nextHi;
  }

  return {
    values: sorted,
    target,
    steps,
    foundIndex,
    comparisons: steps.length,
    linearComparisons: linearSearchComparisons(sorted, target),
    worstCase: sorted.length === 0 ? 0 : Math.floor(Math.log2(sorted.length)) + 1,
  };
}
