/**
 * Production manifest registry — proves the migrated labs are wired into production the
 * canonical way: derived catalog (with taxonomy), real schemas (no z.any), per-lab loaders,
 * a learner render-map entry each, and NO duplication against the legacy generated catalog
 * (the manifest entry shadows its legacy twin).
 */
import { describe, it, expect } from 'vitest';
import { labManifests } from '../../src/domains/manifests.js';
import { manifestCatalog, manifestKeys } from '../../src/domains/catalog.js';
import { manifestBlocks, manifestComponents } from '../../src/domains/blocks.js';
import { labCatalog } from '../../src/blocks/lazy.js';
import { labRuntimeLoaders, labTags } from '../../src/domains/render-map.js';
import { labTag } from '../../src/lab-def/define-lab.js';

type WithSchema = {
  key: string;
  void: boolean;
  slash: boolean;
  schema: { safeParse: (v: unknown) => { success: boolean } };
};

describe('production manifest registry', () => {
  it('composes the migrated manifests (unique ids, includes the pioneers)', () => {
    const ids = labManifests.map((m) => m.id);
    expect(new Set(ids).size, 'ids are unique').toBe(ids.length);
    for (const id of ['projectile-lab', 'venn', 'logic-circuit']) expect(ids, `includes ${id}`).toContain(id);
  });

  it('generates blocks with REAL schemas (not z.any) that accept a blank insert', () => {
    for (const b of manifestBlocks as unknown as WithSchema[]) {
      expect(b.void).toBe(true);
      expect(b.slash).toBe(false);
      expect(typeof b.schema.safeParse).toBe('function');
      expect(b.schema.safeParse({}).success, `${b.key} blank insert`).toBe(true);
    }
    const projectile = (manifestBlocks as unknown as WithSchema[]).find((b) => b.key === 'projectile-lab')!;
    expect(projectile.schema.safeParse({ g: 'gravity' }).success, 'z.any would accept this').toBe(false);
  });

  it('derives catalog rows carrying taxonomy for gallery facets', () => {
    for (const e of manifestCatalog) {
      expect(e.taxonomy, `${e.key} taxonomy`).toBeTruthy();
      expect(typeof e.taxonomy.interaction).toBe('string');
    }
  });

  // Dynamically imports all 275 lab runtimes, so it is bounded by module loading rather than by
  // anything it asserts: on a cold cache (a release run, straight after a build) 20s was not enough
  // and it failed as a timeout, which reads as a broken lab and is not one. Every lab added makes
  // it slower, so the budget is generous on purpose.
  it('gives every migrated lab a per-lab runtime loader resolving to a component', async () => {
    for (const m of labManifests) {
      const mod = await m.loadRuntime();
      expect(typeof mod.default, `${m.id} runtime default`).toBe('function');
    }
  }, 180_000);

  it('exposes one learner render-map entry per migrated lab', () => {
    expect(Object.keys(manifestComponents).length).toBe(labManifests.length);
    for (const tag of ['ProjectileLab', 'VennSetBoard', 'BooleanCircuit', 'WaveLab', 'Doppler']) {
      expect(manifestComponents[tag], `render entry for ${tag}`).toBeTypeOf('function');
    }
  });

  it('the generated render-map covers every manifest with the right tag (no drift)', () => {
    // The learner render map is a PURE loader map (no schemas) generated from the manifests;
    // it must stay in lockstep. Regenerate with: node scripts/gen-render-map.mjs
    expect(Object.keys(labRuntimeLoaders).sort()).toEqual(labManifests.map((m) => m.id).sort());
    for (const m of labManifests) expect(labTags[m.id], `tag for ${m.id}`).toBe(m.tag ?? labTag(m.id));
  });

  it('every tag is a usable JSX identifier, because a lesson writes it as one', () => {
    /**
     * `linear-pursuit` shipped with `tag: 'Catch-up motion'`, its human label. Nothing rejected
     * it: the generator copied it into the render map, the sync copied it into the curriculum's
     * lab-keys snapshot, and both looked consistent. But a lesson has to write `<Catch-up motion />`,
     * which is not parseable, so the lab was unusable from the day it was added and no count of
     * "labs in the catalogue" revealed it.
     */
    const bad = labManifests
      .map((m) => [m.id, m.tag ?? labTag(m.id)] as const)
      .filter(([, tag]) => !/^[A-Z][A-Za-z0-9]*$/.test(tag));
    expect(bad, `tags must be PascalCase identifiers: ${JSON.stringify(bad)}`).toEqual([]);
  });

  it('the PUBLIC catalog derives each migrated lab exactly once (no legacy duplicate)', () => {
    for (const key of manifestKeys) {
      const rows = labCatalog.filter((e) => e.key === key);
      expect(rows.length, `${key} appears exactly once`).toBe(1);
      expect(
        (rows[0] as { taxonomy?: unknown }).taxonomy,
        `${key} surviving row is the derived one`,
      ).toBeTruthy();
    }
  });
});
