/**
 * Sorting traces on the shared sequence event model.
 *
 * Every algorithm here reports the SAME two costs: comparisons and writes. That is the point.
 * A learner watching bubble sort has no reason to believe it is slow until the counter for the
 * same input sits beside merge sort's, so the counts are part of the trace rather than a claim
 * made in prose afterwards.
 *
 * Merge sort writes into the array rather than swapping, which is why `sequence-write` exists in
 * the contract. Reporting a write for both kinds keeps the cost of the two families comparable.
 */

import { snapshotItems, type SequenceEvent, type SequenceItem } from './sequence-contract.js';

export type SortAlgorithm = 'bubble' | 'insertion' | 'selection' | 'merge' | 'quick';

export const SORT_ALGORITHMS: SortAlgorithm[] = ['bubble', 'insertion', 'selection', 'merge', 'quick'];

export const SORT_LABEL: Record<SortAlgorithm, string> = {
  bubble: 'Bubble sort',
  insertion: 'Insertion sort',
  selection: 'Selection sort',
  merge: 'Merge sort',
  quick: 'Quicksort',
};

/** Average-case growth, for the panel that compares the measured counts against theory. */
export const SORT_COMPLEXITY: Record<SortAlgorithm, string> = {
  bubble: 'O(n²)',
  insertion: 'O(n²)',
  selection: 'O(n²)',
  merge: 'O(n log n)',
  quick: 'O(n log n)',
};

export interface SortTrace {
  algorithm: SortAlgorithm;
  events: SequenceEvent[];
  comparisons: number;
  writes: number;
  sorted: number[];
}

const toItems = (values: readonly number[]): SequenceItem[] =>
  values.map((value, index) => ({ id: `s${index}`, value, seq: index }));

/** Collects events and costs while an algorithm runs over a live array of items. */
function recorder(values: readonly number[], algorithm: SortAlgorithm) {
  const items = toItems(values);
  const events: SequenceEvent[] = [
    {
      type: 'sequence-start',
      items: snapshotItems(items),
      // Kept short: the transport bar shows this beside its controls, and a long line is clipped.
      message: `${SORT_LABEL[algorithm]} on ${items.length} values.`,
    },
  ];
  let comparisons = 0;
  let writes = 0;

  return {
    items,
    /** A comparison always costs one, whichever way it goes. */
    compare(i: number, j: number, willAct: boolean, message: string) {
      comparisons++;
      events.push({
        type: 'sequence-compare',
        items: snapshotItems(items),
        indices: [i, j],
        decision: willAct ? 'swap' : 'keep',
        reason: 'algorithm',
        message,
      });
    },
    swap(i: number, j: number, message: string) {
      const ids: [string, string] = [items[i]!.id, items[j]!.id];
      const left = items[i]!;
      items[i] = items[j]!;
      items[j] = left;
      writes += 2;
      events.push({
        type: 'sequence-swap',
        items: snapshotItems(items),
        indices: [i, j],
        itemIds: ids,
        message,
      });
    },
    write(index: number, item: SequenceItem, message: string) {
      items[index] = item;
      writes++;
      events.push({ type: 'sequence-write', items: snapshotItems(items), index, itemId: item.id, message });
    },
    finish(): SortTrace {
      events.push({
        type: 'sequence-complete',
        items: snapshotItems(items),
        message: `Sorted. ${comparisons} comparisons and ${writes} writes.`,
      });
      return { algorithm, events, comparisons, writes, sorted: items.map((item) => item.value) };
    },
  };
}

type Recorder = ReturnType<typeof recorder>;

function bubble(run: Recorder): void {
  const { items } = run;
  for (let end = items.length - 1; end > 0; end--) {
    let swapped = false;
    for (let i = 0; i < end; i++) {
      const out = items[i]!.value > items[i + 1]!.value;
      run.compare(i, i + 1, out, `Is ${items[i]!.value} greater than ${items[i + 1]!.value}?`);
      if (out) {
        run.swap(i, i + 1, `Swap, so the larger value moves right.`);
        swapped = true;
      }
    }
    // The early exit is the one thing that makes bubble sort defensible on nearly sorted data.
    if (!swapped) return;
  }
}

function insertion(run: Recorder): void {
  const { items } = run;
  for (let i = 1; i < items.length; i++) {
    let j = i;
    while (j > 0) {
      const out = items[j - 1]!.value > items[j]!.value;
      run.compare(j - 1, j, out, `Does ${items[j]!.value} belong before ${items[j - 1]!.value}?`);
      if (!out) break;
      run.swap(j - 1, j, `Shift ${items[j - 1]!.value} left into place.`);
      j--;
    }
  }
}

function selection(run: Recorder): void {
  const { items } = run;
  for (let start = 0; start < items.length - 1; start++) {
    let best = start;
    for (let i = start + 1; i < items.length; i++) {
      const out = items[i]!.value < items[best]!.value;
      run.compare(best, i, out, `Is ${items[i]!.value} smaller than the best so far, ${items[best]!.value}?`);
      if (out) best = i;
    }
    if (best !== start) run.swap(start, best, `Move the smallest remaining value into position ${start}.`);
  }
}

function merge(run: Recorder): void {
  const { items } = run;
  const sortRange = (lo: number, hi: number): void => {
    if (hi - lo < 2) return;
    const mid = Math.floor((lo + hi) / 2);
    sortRange(lo, mid);
    sortRange(mid, hi);
    // Merge the two sorted halves through a buffer, then write the result back in order.
    //
    // While that write-back runs, the visible array can hold a value TWICE: once in its new
    // position and once where it has not been overwritten yet. That is not a defect to hide. It
    // is the O(n) extra space merge sort pays for its better comparison count, and it is the
    // honest difference between this family and the in-place sorts above.
    const buffer: SequenceItem[] = [];
    let left = lo;
    let right = mid;
    while (left < mid && right < hi) {
      const takeLeft = items[left]!.value <= items[right]!.value;
      run.compare(
        left,
        right,
        takeLeft,
        `Merging: which is smaller, ${items[left]!.value} or ${items[right]!.value}?`,
      );
      buffer.push(takeLeft ? items[left++]! : items[right++]!);
    }
    while (left < mid) buffer.push(items[left++]!);
    while (right < hi) buffer.push(items[right++]!);
    buffer.forEach((item, offset) =>
      run.write(lo + offset, item, `Write ${item.value} back into position ${lo + offset}.`),
    );
  };
  sortRange(0, items.length);
}

function quick(run: Recorder): void {
  const { items } = run;
  const sortRange = (lo: number, hi: number): void => {
    if (lo >= hi) return;
    const pivot = items[hi]!.value;
    let boundary = lo;
    for (let i = lo; i < hi; i++) {
      const smaller = items[i]!.value < pivot;
      run.compare(i, hi, smaller, `Is ${items[i]!.value} below the pivot ${pivot}?`);
      if (smaller) {
        if (i !== boundary) run.swap(boundary, i, `Move ${items[i]!.value} into the low partition.`);
        boundary++;
      }
    }
    if (boundary !== hi) run.swap(boundary, hi, `Place the pivot ${pivot} between the two partitions.`);
    sortRange(lo, boundary - 1);
    sortRange(boundary + 1, hi);
  };
  sortRange(0, items.length - 1);
}

const RUNNERS: Record<SortAlgorithm, (run: Recorder) => void> = {
  bubble,
  insertion,
  selection,
  merge,
  quick,
};

/** Trace one algorithm over one input. */
export function sortTrace(values: readonly number[], algorithm: SortAlgorithm): SortTrace {
  const run = recorder(values, algorithm);
  RUNNERS[algorithm](run);
  return run.finish();
}

/**
 * Every algorithm's cost on the SAME input, cheapest comparisons first.
 *
 * This is what turns a sorting animation into a complexity lesson: the learner is not told that
 * merge sort scales better, they read both counts for the array in front of them.
 */
export function sortCosts(values: readonly number[]): {
  algorithm: SortAlgorithm;
  comparisons: number;
  writes: number;
}[] {
  return SORT_ALGORITHMS.map((algorithm) => {
    const trace = sortTrace(values, algorithm);
    return { algorithm, comparisons: trace.comparisons, writes: trace.writes };
  }).sort((a, b) => a.comparisons - b.comparisons);
}
