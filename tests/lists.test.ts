import { describe, expect, it } from 'vitest';
import {
  LIST_OPERATIONS,
  compareStructures,
  runOperation,
  type ListOperation,
} from '../src/algorithms/lists.js';

const VALUES = [4, 8, 15, 16, 23, 42];

describe('both structures agree on the result', () => {
  it.each(LIST_OPERATIONS)('%s leaves the same contents either way', (operation: ListOperation) => {
    const array = runOperation(VALUES, 'array', operation, 2);
    const linked = runOperation(VALUES, 'linked', operation, 2);
    expect(array.values).toEqual(linked.values);
  });

  it('never mutates the caller’s array', () => {
    const input = [...VALUES];
    for (const operation of LIST_OPERATIONS) {
      runOperation(input, 'array', operation, 3);
      runOperation(input, 'linked', operation, 3);
    }
    expect(input).toEqual(VALUES);
  });

  it('records a cost equal to the steps it took', () => {
    for (const operation of LIST_OPERATIONS) {
      for (const kind of ['array', 'linked'] as const) {
        const run = runOperation(VALUES, kind, operation, 4);
        expect(run.cost).toBe(run.steps.length);
      }
    }
  });
});

describe('the trade, which is the whole lesson', () => {
  it('gives the array a constant read and charges the list for every hop', () => {
    expect(runOperation(VALUES, 'array', 'get', 5).cost).toBe(1);
    expect(runOperation(VALUES, 'linked', 'get', 5).cost).toBe(6);
    // And the array's advantage does not depend on how far in you reach.
    expect(runOperation(VALUES, 'array', 'get', 0).cost).toBe(1);
  });

  it('reverses the winner for an insert at the front', () => {
    const comparison = compareStructures(VALUES, 'insert-front', 99);
    expect(comparison.linked.cost).toBe(1);
    expect(comparison.array.cost).toBe(VALUES.length + 1);
    expect(comparison.winner).toBe('linked');
  });

  it('reverses it again for an insert at the end, because there is no tail pointer', () => {
    const comparison = compareStructures(VALUES, 'insert-end', 99);
    expect(comparison.array.cost).toBe(1);
    expect(comparison.linked.cost).toBe(VALUES.length + 1);
    expect(comparison.winner).toBe('array');
  });

  it('ties on search, which is the result students least expect', () => {
    const comparison = compareStructures(VALUES, 'search', 23);
    expect(comparison.array.cost).toBe(comparison.linked.cost);
    expect(comparison.winner).toBeNull();
  });

  it('lets the list remove the front in one touch however long it is', () => {
    const long = Array.from({ length: 500 }, (_, index) => index);
    expect(runOperation(long, 'linked', 'delete-front').cost).toBe(1);
    expect(runOperation(long, 'array', 'delete-front').cost).toBe(long.length - 1);
  });

  it('shows neither structure winning overall, across the whole operation set', () => {
    const winners = LIST_OPERATIONS.map((operation) => compareStructures(VALUES, operation, 2).winner);
    expect(winners).toContain('array');
    expect(winners).toContain('linked');
    expect(winners).toContain(null);
  });
});

describe('every step carries the state at that moment', () => {
  it('starts an array insert from the ORIGINAL contents, not the finished ones', () => {
    // The bug this pins: drawing run.values put 99 on screen at step 1 of 7, while the caption
    // still described the first shift. The picture has to agree with the narration.
    const run = runOperation(VALUES, 'array', 'insert-front', 99);
    expect(run.steps[0]!.values).not.toContain(99);
    expect(run.steps.at(-1)!.values).toEqual([99, ...VALUES]);
  });

  it('shifts one cell per step, copying forward and leaving the old copy until it is overwritten', () => {
    const run = runOperation([4, 8, 15], 'array', 'insert-front', 99);
    expect(run.steps.map((step) => step.values)).toEqual([
      [4, 8, 15, 15],
      [4, 8, 8, 15],
      [4, 4, 8, 15],
      [99, 4, 8, 15],
    ]);
  });

  it('closes the hole on a delete rather than leaving a stale copy at the end', () => {
    const run = runOperation([4, 8, 15], 'array', 'delete-front');
    expect(run.steps.at(-1)!.values).toEqual([8, 15]);
    expect(run.steps.at(-1)!.values).toEqual(run.values);
  });

  it('changes a linked insert in one step and leaves reads untouched', () => {
    expect(runOperation(VALUES, 'linked', 'insert-front', 99).steps[0]!.values).toEqual([99, ...VALUES]);
    for (const step of runOperation(VALUES, 'linked', 'get', 4).steps) {
      expect(step.values).toEqual(VALUES);
    }
  });

  it('ends every run on the contents it reports', () => {
    for (const operation of LIST_OPERATIONS) {
      for (const kind of ['array', 'linked'] as const) {
        const run = runOperation(VALUES, kind, operation, 3);
        expect(run.steps.at(-1)!.values).toEqual(run.values);
      }
    }
  });
});

describe('edge cases', () => {
  it('handles an empty structure', () => {
    for (const operation of LIST_OPERATIONS) {
      for (const kind of ['array', 'linked'] as const) {
        expect(() => runOperation([], kind, operation, 0)).not.toThrow();
      }
    }
    expect(runOperation([], 'array', 'insert-front', 7).values).toEqual([7]);
    expect(runOperation([], 'linked', 'insert-end', 7).values).toEqual([7]);
  });

  it('clamps a position past the end rather than walking off it', () => {
    const run = runOperation(VALUES, 'linked', 'get', 999);
    expect(run.cost).toBe(VALUES.length);
    expect(run.steps.at(-1)?.index).toBe(VALUES.length - 1);
  });

  it('reports a search that finds nothing as a full pass', () => {
    expect(compareStructures(VALUES, 'search', -1).array.cost).toBe(VALUES.length);
  });
});
