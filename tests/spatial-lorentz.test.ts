import { describe, expect, it } from 'vitest';
import { lorentzForce3D, traceLorentz } from '../src/physics/fields/spatial-core.js';
describe('spatial Lorentz engine', () => {
  it('computes q(E+v cross B)', () => {
    expect(lorentzForce3D(2, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 3 })).toEqual({
      x: 0,
      y: -4,
      z: 0,
    });
  });
  it('magnetic field preserves speed numerically', () => {
    const path = traceLorentz(
      1,
      1,
      { x: 1, y: 0, z: 0.5 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      240,
      0.01,
    );
    const steps = path
      .slice(1)
      .map((p, i) => Math.hypot(p.x - path[i]!.x, p.y - path[i]!.y, p.z - path[i]!.z));
    expect(Math.max(...steps) - Math.min(...steps)).toBeLessThan(1e-4);
  });
});
