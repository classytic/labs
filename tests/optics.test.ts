import { describe, it, expect } from 'vitest';
// importing from the physics subpath registers the optics-ray asset (side effect)
import { opticsDoc } from '../dist/physics/index.mjs';
import { resolve, isAssetGeom, type SceneDoc } from '@classytic/stage';

void opticsDoc; // ensure the module (and its registerAsset call) is loaded

const doc: SceneDoc = {
  schemaVersion: 2,
  type: 'stage-scene',
  bindings: [],
  elements: [
    { id: 'S', kind: 'point', free: { at: { x: 0, y: 0 } } },
    { id: 'aim', kind: 'point', free: { at: { x: 1, y: 0 } } },
    { id: 'T', kind: 'point', free: { at: { x: -2, y: 0 } } },
    { id: 'Ma', kind: 'point', free: { at: { x: 3, y: -2 } } },
    { id: 'Mb', kind: 'point', free: { at: { x: 3, y: 2 } } },
    { id: 'm1', kind: 'segment', def: { op: 'segment', from: { ref: 'Ma' }, to: { ref: 'Mb' } } },
    {
      id: 'ray', kind: 'asset',
      def: { op: 'asset', asset: 'optics-ray', params: { maxBounces: 8, targetR: 0.6, far: 60 }, bind: { source: { ref: 'S' }, aim: { ref: 'aim' }, target: { ref: 'T' }, m0: { ref: 'm1' } } },
    },
  ],
};

describe('optics ray tracer', () => {
  it('reflects off a mirror and lights the target', () => {
    const r = resolve(doc);
    const g = r.values.get('ray');
    expect(isAssetGeom(g)).toBe(true);
    if (!isAssetGeom(g)) return;
    expect(g.meta?.hit).toBe(true);
    const ray = g.parts.ray as { x: number; y: number }[];
    expect(ray.length).toBeGreaterThanOrEqual(3);
    expect(ray[1]?.x).toBeCloseTo(3, 5);
    expect(ray[1]?.y).toBeCloseTo(0, 5);
    expect(ray[ray.length - 1]?.x).toBeCloseTo(-2, 5);
  });

  it('misses when no mirror redirects the beam', () => {
    const miss: SceneDoc = { ...doc, elements: doc.elements.filter((e) => !['Ma', 'Mb', 'm1'].includes(e.id)) };
    const r = resolve(miss);
    const g = r.values.get('ray');
    if (!isAssetGeom(g)) throw new Error('no geom');
    expect(g.meta?.hit).toBe(false);
  });
});
