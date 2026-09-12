import { describe, expect, it } from 'vitest';
import { buildHeap, extractHeap, insertHeap, isHeap } from '../src/algorithms/heap/index.js';

describe('heap traces', () => {
  it.each(['min', 'max'] as const)('builds a valid %s heap deterministically', (kind) => {
    const result = buildHeap([7, 2, 9, 1, 5, 8, 3], kind);
    expect(isHeap(result.result, kind)).toBe(true);
    expect(result.events.some((event) => event.type === 'sequence-swap')).toBe(true);
  });
  it('inserts with stable identity and bubbles upward', () => {
    const result = insertHeap([3, 7, 5, 12], 1, 'min');
    expect(result.result[0]).toMatchObject({ id: 'inserted-1', value: 1 });
    expect(isHeap(result.result, 'min')).toBe(true);
  });
  it('extracts the priority root and sifts down', () => {
    const result = extractHeap([9, 4, 7, 1, 3, 6], 'max');
    expect(result.removed?.value).toBe(9);
    expect(result.result).toHaveLength(5);
    expect(isHeap(result.result, 'max')).toBe(true);
  });
  it('keeps duplicate values as distinct visual items', () => {
    const result = buildHeap([2, 2, 1], 'min');
    expect(new Set(result.result.map((item) => item.id)).size).toBe(3);
  });
});
