import { describe, expect, it } from 'vitest';
import { SORT_ALGORITHMS, sortCosts, sortTrace, type SortAlgorithm } from '../src/algorithms/sorting.js';

const SAMPLE = [7, 2, 9, 1, 5, 8, 3];
const ascending = (values: readonly number[]) => [...values].sort((a, b) => a - b);

describe.each(SORT_ALGORITHMS)('%s', (algorithm: SortAlgorithm) => {
  it('sorts the sample', () => {
    expect(sortTrace(SAMPLE, algorithm).sorted).toEqual(ascending(SAMPLE));
  });

  it('sorts a reversed array, a single value and an array with duplicates', () => {
    for (const input of [[5, 4, 3, 2, 1], [42], [3, 1, 3, 1, 3], []]) {
      expect(sortTrace(input, algorithm).sorted).toEqual(ascending(input));
    }
  });

  it('ends on the sorted state it reports', () => {
    const trace = sortTrace(SAMPLE, algorithm);
    const last = trace.events[trace.events.length - 1]!;
    expect(last.type).toBe('sequence-complete');
    expect(last.items.map((item) => item.value)).toEqual(trace.sorted);
  });

  it('holds every value it started with whenever it is comparing', () => {
    // A swap or a write that drops an element would still finish sorted-looking on some inputs,
    // so check the multiset mid-flight rather than only at the end. Compare points are the
    // moments every algorithm here is between operations, so the check is fair to all of them.
    const trace = sortTrace(SAMPLE, algorithm);
    for (const event of trace.events) {
      if (event.type === 'sequence-swap' || event.type === 'sequence-write') continue;
      expect(ascending(event.items.map((item) => item.value))).toEqual(ascending(SAMPLE));
    }
  });

  it('counts every comparison it makes', () => {
    const trace = sortTrace(SAMPLE, algorithm);
    const compares = trace.events.filter((event) => event.type === 'sequence-compare').length;
    expect(trace.comparisons).toBe(compares);
  });
});

describe('the difference between sorting in place and sorting through a buffer', () => {
  const inPlace: SortAlgorithm[] = ['bubble', 'insertion', 'selection', 'quick'];

  it.each(inPlace)('%s never holds a duplicate, because it only ever swaps', (algorithm) => {
    for (const event of sortTrace(SAMPLE, algorithm).events) {
      expect(ascending(event.items.map((item) => item.value))).toEqual(ascending(SAMPLE));
      expect(new Set(event.items.map((item) => item.id)).size).toBe(SAMPLE.length);
    }
  });

  it('merge sort DOES hold a duplicate mid write-back, and that is its extra space', () => {
    // Not a defect. The merged run lives in a buffer, so while it is copied back a value can
    // appear both in its new position and in its old one. That transient copy is the O(n) extra
    // space merge sort pays for its better comparison count, and the lab should show it rather
    // than hide it. If this ever stops being true, the merge implementation changed.
    const duplicated = sortTrace(SAMPLE, 'merge').events.some(
      (event) => new Set(event.items.map((item) => item.id)).size < SAMPLE.length,
    );
    expect(duplicated).toBe(true);
  });

  it('still ends with exactly the values it started with', () => {
    for (const algorithm of SORT_ALGORITHMS) {
      const trace = sortTrace(SAMPLE, algorithm);
      expect(ascending(trace.sorted)).toEqual(ascending(SAMPLE));
    }
  });
});

describe('cost, which is the teaching point', () => {
  it('shows merge sort beating the quadratic sorts on a reversed array', () => {
    const reversed = [9, 8, 7, 6, 5, 4, 3, 2, 1];
    const merge = sortTrace(reversed, 'merge').comparisons;
    expect(merge).toBeLessThan(sortTrace(reversed, 'bubble').comparisons);
    expect(merge).toBeLessThan(sortTrace(reversed, 'insertion').comparisons);
    expect(merge).toBeLessThan(sortTrace(reversed, 'selection').comparisons);
  });

  it('lets insertion sort win on already sorted data, which is why the exception is worth teaching', () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(sortTrace(sorted, 'insertion').comparisons).toBeLessThan(sortTrace(sorted, 'merge').comparisons);
  });

  it('early-exits bubble sort on sorted input after one clean pass', () => {
    const sorted = [1, 2, 3, 4, 5];
    expect(sortTrace(sorted, 'bubble').comparisons).toBe(sorted.length - 1);
    expect(sortTrace(sorted, 'bubble').writes).toBe(0);
  });

  it('reports selection sort making the fewest writes, which is its real advantage', () => {
    const costs = sortCosts(SAMPLE);
    const selection = costs.find((cost) => cost.algorithm === 'selection')!;
    const bubble = costs.find((cost) => cost.algorithm === 'bubble')!;
    expect(selection.writes).toBeLessThan(bubble.writes);
  });

  it('ranks every algorithm on one input, cheapest comparisons first', () => {
    const costs = sortCosts(SAMPLE);
    expect(costs).toHaveLength(SORT_ALGORITHMS.length);
    expect(costs.map((cost) => cost.comparisons)).toEqual(
      [...costs.map((cost) => cost.comparisons)].sort((a, b) => a - b),
    );
  });
});
