import { describe, expect, it } from 'vitest';
import { hashKey, hashTrace, lookupCost } from '../src/algorithms/hashing.js';

const FRUIT = ['mango', 'guava', 'lychee', 'jackfruit', 'papaya', 'banana'];

describe('the hash function', () => {
  it('is deterministic, which server and browser rendering both depend on', () => {
    expect(hashKey('mango')).toBe(hashKey('mango'));
    expect(hashKey('')).toBe(hashKey(''));
  });

  it('separates keys that differ by one character', () => {
    expect(hashKey('mango')).not.toBe(hashKey('mangp'));
    expect(hashKey('ab')).not.toBe(hashKey('ba'));
  });

  it('stays a non-negative 32-bit integer, so the modulo is never negative', () => {
    for (const key of [...FRUIT, '', 'z'.repeat(200)]) {
      const hash = hashKey(key);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe('chaining', () => {
  it('stores every key, however full the table gets', () => {
    const trace = hashTrace(FRUIT, 3, 'chaining');
    expect(trace.buckets.flat().sort()).toEqual([...FRUIT].sort());
    expect(trace.dropped).toEqual([]);
  });

  it('puts each key in the bucket its hash chose', () => {
    const trace = hashTrace(FRUIT, 8, 'chaining');
    for (const step of trace.steps) {
      expect(step.slot).toBe(step.home);
      expect(trace.buckets[step.home]).toContain(step.key);
    }
  });

  it('reports a load factor above one once there are more keys than buckets', () => {
    const trace = hashTrace(FRUIT, 3, 'chaining');
    expect(trace.loadFactor).toBeCloseTo(FRUIT.length / 3);
    expect(trace.longestChain).toBeGreaterThan(1);
  });

  it('costs more to look up as the chains grow', () => {
    const roomy = hashTrace(FRUIT, 16, 'chaining');
    const cramped = hashTrace(FRUIT, 2, 'chaining');
    const worst = (trace: ReturnType<typeof hashTrace>) =>
      Math.max(...FRUIT.map((key) => lookupCost(trace, key)));
    expect(worst(cramped)).toBeGreaterThan(worst(roomy));
  });
});

describe('linear probing', () => {
  it('stores every key while there is room', () => {
    const trace = hashTrace(FRUIT, 16, 'linear-probing');
    expect(trace.buckets.flat().sort()).toEqual([...FRUIT].sort());
    expect(trace.dropped).toEqual([]);
  });

  it('never puts two keys in one slot', () => {
    const trace = hashTrace(FRUIT, 8, 'linear-probing');
    for (const bucket of trace.buckets) expect(bucket.length).toBeLessThanOrEqual(1);
  });

  it('drops keys once the table is full, which chaining never does', () => {
    const trace = hashTrace(FRUIT, 3, 'linear-probing');
    expect(trace.dropped.length).toBe(FRUIT.length - 3);
    expect(trace.buckets.flat()).toHaveLength(3);
    expect(hashTrace(FRUIT, 3, 'chaining').dropped).toEqual([]);
  });

  it('needs more probes as the table fills, which is the cost of the empty-slot rule', () => {
    const roomy = hashTrace(FRUIT, 32, 'linear-probing');
    const tight = hashTrace(FRUIT, 7, 'linear-probing');
    expect(tight.averageProbes).toBeGreaterThan(roomy.averageProbes);
  });

  it('records a probe count of one when a key lands straight in its home bucket', () => {
    const trace = hashTrace(FRUIT, 64, 'linear-probing');
    const clean = trace.steps.filter((step) => !step.collided);
    expect(clean.length).toBeGreaterThan(0);
    for (const step of clean) expect(step.probes).toBe(1);
  });
});

describe('the trace itself', () => {
  it('records one step per key and never loses a snapshot', () => {
    const trace = hashTrace(FRUIT, 8, 'chaining');
    expect(trace.steps).toHaveLength(FRUIT.length);
    trace.steps.forEach((step, index) => {
      expect(step.buckets.flat()).toHaveLength(index + 1);
    });
  });

  it('handles an empty key list and a single bucket', () => {
    expect(hashTrace([], 8).steps).toEqual([]);
    expect(hashTrace([], 8).averageProbes).toBe(0);
    const single = hashTrace(FRUIT, 1, 'chaining');
    expect(single.buckets[0]).toHaveLength(FRUIT.length);
    expect(single.longestChain).toBe(FRUIT.length);
  });

  it('counts a collision only when a key does not land in an empty home bucket', () => {
    const trace = hashTrace(FRUIT, 64, 'chaining');
    expect(trace.collisions).toBe(trace.steps.filter((step) => step.collided).length);
  });
});
