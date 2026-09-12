import { describe, it, expect } from 'vitest';
// importing from the physics subpath registers the optics-ray asset (side effect)
import { opticsDoc, refract, criticalAngle, thinOptic } from '../dist/physics/index.mjs';
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
      id: 'ray',
      kind: 'asset',
      def: {
        op: 'asset',
        asset: 'optics-ray',
        params: { maxBounces: 8, targetR: 0.6, far: 60 },
        bind: { source: { ref: 'S' }, aim: { ref: 'aim' }, target: { ref: 'T' }, m0: { ref: 'm1' } },
      },
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
    const miss: SceneDoc = {
      ...doc,
      elements: doc.elements.filter((e) => !['Ma', 'Mb', 'm1'].includes(e.id)),
    };
    const r = resolve(miss);
    const g = r.values.get('ray');
    if (!isAssetGeom(g)) throw new Error('no geom');
    expect(g.meta?.hit).toBe(false);
  });
});

describe('optics kernel (Snell + thin optic)', () => {
  it('refracts toward the normal into a denser medium', () => {
    expect(refract(30, 1, 1.5)!).toBeCloseTo(19.47, 1); // air → glass, bends toward normal
    expect(refract(30, 1.5, 1)!).toBeCloseTo(48.59, 1); // glass → air, bends away
  });
  it('gives the critical angle and total internal reflection', () => {
    expect(criticalAngle(1.5, 1)!).toBeCloseTo(41.81, 1);
    expect(criticalAngle(1, 1.5)).toBeNull(); // no TIR into a denser medium
    expect(refract(50, 1.5, 1)).toBeNull(); // past the critical angle → TIR
  });
  it('is stable at the critical boundary and rejects invalid inputs', () => {
    const c = criticalAngle(1.5, 1)!;
    expect(refract(c, 1.5, 1)).toBeCloseTo(90, 6);
    expect(() => refract(30, 0, 1)).toThrow(RangeError);
    expect(() => criticalAngle(Number.NaN, 1)).toThrow(RangeError);
  });
  it('forms real inverted and virtual upright images', () => {
    const real = thinOptic(10, 15); // object beyond f
    expect(real.v).toBeCloseTo(30, 5);
    expect(real.m).toBeCloseTo(2, 5);
    expect(real.real).toBe(true);
    expect(real.upright).toBe(false);
    const virt = thinOptic(10, 5); // object inside f (magnifier)
    expect(virt.v).toBeCloseTo(-10, 5);
    expect(virt.real).toBe(false);
    expect(virt.upright).toBe(true);
    const div = thinOptic(-10, 15); // diverging lens
    expect(div.real).toBe(false);
    expect(div.m).toBeLessThan(1);
  });
});
