/**
 * The authoring catalog and block set are both derived from manifests. This pins
 * the one-registry invariant and prevents a parallel legacy catalog returning.
 *
 * Imports the BUILT dist (what ships); run `npm run build` first.
 */
import { describe, it, expect } from 'vitest';
import { labManifests } from '../dist/domains/manifests.mjs';
import { labCatalog } from '../dist/blocks/catalog.mjs';
import { lazyLabBlocks } from '../dist/blocks/lazy.mjs';

describe('lab metadata catalog', () => {
  it('has one entry per manifest (no parallel registry drift)', () => {
    expect(labCatalog.length).toBe(labManifests.length);
    const realKeys = new Set(labManifests.map((manifest) => manifest.id));
    const catKeys = new Set(labCatalog.map((e) => e.key));
    // Symmetric difference must be empty.
    const missing = [...realKeys].filter((k) => !catKeys.has(k));
    const extra = [...catKeys].filter((k) => !realKeys.has(k));
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
  });

  it('mirrors each block key → tag / void / group faithfully', () => {
    const byKey = new Map(labManifests.map((manifest) => [manifest.id, manifest]));
    for (const e of labCatalog) {
      const real = byKey.get(e.key)!;
      expect(real, `catalog key ${e.key} exists in real blocks`).toBeTruthy();
      // tag is omitted from the catalog when it equals the defineBlock default;
      // when present it must match the real spec's tag.
      if (e.tag) expect(e.tag, `${e.key} tag`).toBe(real.tag);
      expect(e.void, `${e.key} void`).toBe(true);
      expect(e.group, `${e.key} group`).toBe(real.group);
    }
  });

  it('registers a lazy block for every catalog entry, all void + hidden from slash', () => {
    const lazyKeys = new Set(lazyLabBlocks.map((b) => b.key));
    for (const e of labCatalog) expect(lazyKeys.has(e.key), `lazy block ${e.key}`).toBe(true);
    expect(lazyLabBlocks.length).toBe(labCatalog.length);
    for (const b of lazyLabBlocks) {
      expect(b.void).toBe(true);
      expect(b.slash).toBe(false);
      expect(b.Component).toBeTypeOf('function');
    }
  });
});
