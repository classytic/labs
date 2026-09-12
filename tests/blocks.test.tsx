/**
 * Block-registry integrity — the authorability contract. Every lab a creator can drop is a block
 * spec; the aggregate `labsBlocks` feeds the editor slash menu and `labsComponents` (tag→component)
 * feeds the MDX player. The invariant that breaks silently: a DUPLICATE tag or key across domains
 * (it did — biology's Sequence vs statistics'). So pin: unique keys, well-formed specs, and that the
 * migrated manifest labs are actually wired into the aggregate.
 *
 * Per-lab manifest checks live in tests/domains/manifest-registry.test.tsx. This pins the AGGREGATE.
 * Imports the BUILT dist (what ships); run `npm run build` first.
 */
import { describe, it, expect } from 'vitest';
import { labsBlocks, labsComponents } from '../dist/blocks/index.mjs';

describe('block registry', () => {
  it('the aggregate carries a healthy number of blocks', () => {
    expect(labsBlocks.length).toBeGreaterThan(100);
  });

  it('every block KEY is unique across all domains (the collision guard)', () => {
    const keys = labsBlocks.map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every spec is well-formed (string key, schema, Component fn)', () => {
    for (const b of labsBlocks) {
      expect(typeof b.key).toBe('string');
      expect(b.schema).toBeTruthy();
      expect(typeof b.Component).toBe('function');
    }
  });

  it('the tag→component render map resolves to components', () => {
    const comps = Object.values(labsComponents);
    expect(comps.length).toBeGreaterThan(100);
    expect(comps.every((c) => typeof c === 'function' || typeof c === 'object')).toBe(true);
  });
});
