import { describe, it, expect } from 'vitest';
import { listLabTemplates, instantiateTemplate, getLabTemplate } from '../dist/catalog/index.mjs';
import { resolve, isAssetGeom } from '@classytic/stage';

describe('lab-template registry (marketplace)', () => {
  it('registers the built-in families', () => {
    const ids = listLabTemplates().map((t) => t.id);
    for (const id of ['balance-algebra', 'area-model', 'growing-pattern', 'balance-lever', 'optics', 'circuit']) {
      expect(ids).toContain(id);
    }
  });

  it('instantiate(balance-algebra) → ok + a resolvable SceneDoc with the asset geom', () => {
    const r = instantiateTemplate('balance-algebra', { coef: 3, addend: 1, rhs: 10, answer: 3 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(isAssetGeom(resolve(r.doc).values.get('scale'))).toBe(true);
  });

  it('defaults + param override flow through the factory', () => {
    expect(getLabTemplate('area-model')?.defaultParams.a).toBe(3);
    const r = instantiateTemplate('area-model'); // defaults
    expect(r.ok).toBe(true);
    if (r.ok) expect(isAssetGeom(resolve(r.doc).values.get('area'))).toBe(true);
  });

  it('validates params against paramsSchema — bad input → typed error, no scene', () => {
    const r = instantiateTemplate('balance-algebra', { coef: 'two' as unknown as number });
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.error).toMatch(/Invalid params/); expect(r.issues?.length).toBeGreaterThan(0); }
  });

  it('unknown id → typed error', () => {
    const r = instantiateTemplate('nope');
    expect(r.ok).toBe(false);
  });
});
