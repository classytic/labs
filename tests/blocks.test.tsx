/**
 * Block-registry integrity — the authorability contract. Every lab a creator can
 * drop is a `defineBlock` spec; the aggregate `labsBlocks` feeds the editor slash
 * menu and `labsComponents` (tag→component) feeds the MDX player. The invariant
 * that breaks silently: a DUPLICATE tag or key across domains (it did — biology's
 * Sequence vs statistics'). So pin: unique tags + keys, well-formed specs, and that
 * the new discrete/statistics domains are actually wired into the aggregate.
 *
 * Imports the BUILT dist (what ships); run `npm run build` first.
 */
import { describe, it, expect } from 'vitest';
import { labsBlocks } from '../dist/blocks/index.mjs';
import { discreteBlocks, discreteComponents } from '../dist/blocks/discrete.mjs';
import { statisticsBlocks, statisticsComponents } from '../dist/blocks/statistics.mjs';

describe('block registry', () => {
  it('the new domains are wired into the aggregate', () => {
    expect(discreteBlocks.length).toBe(20); // + RuleCard (concept engine) + CombinationStudio (rule of product, felt)
    expect(statisticsBlocks.length).toBe(7);
    const keys = new Set(labsBlocks.map((b) => b.key));
    for (const b of [...discreteBlocks, ...statisticsBlocks]) expect(keys.has(b.key)).toBe(true);
  });

  it('every block KEY is unique across all domains (the collision guard)', () => {
    const keys = labsBlocks.map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('each new lab has a render component', () => {
    expect(Object.values(discreteComponents).every((c) => typeof c === 'function')).toBe(true);
    expect(Object.values(statisticsComponents).every((c) => typeof c === 'function')).toBe(true);
    expect(Object.keys(discreteComponents).length).toBe(20); // + RuleCard + CombinationStudio
    expect(Object.keys(statisticsComponents).length).toBe(7);
  });

  it('every spec is well-formed (string key, schema, Component fn)', () => {
    for (const b of labsBlocks) {
      expect(typeof b.key).toBe('string');
      expect(b.schema).toBeTruthy();
      expect(typeof b.Component).toBe('function');
    }
  });
});
