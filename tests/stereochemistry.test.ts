import { describe, expect, it } from 'vitest';
import {
  CHIRAL_MOLECULES,
  chiralVectors,
  mirrorEnantiomer,
  rotateChiralVector,
} from '../src/chem/stereochemistry/core.js';

const determinant = (vectors: ReturnType<typeof chiralVectors>): number => {
  const [a, b, c, d] = vectors,
    u = { x: a!.x - d!.x, y: a!.y - d!.y, z: a!.z - d!.z },
    v = { x: b!.x - d!.x, y: b!.y - d!.y, z: b!.z - d!.z },
    w = { x: c!.x - d!.x, y: c!.y - d!.y, z: c!.z - d!.z };
  return u.x * (v.y * w.z - v.z * w.y) - u.y * (v.x * w.z - v.z * w.x) + u.z * (v.x * w.y - v.y * w.x);
};

describe('stereochemistry model', () => {
  it('mirrors handedness while preserving tetrahedral distances', () => {
    const r = chiralVectors('R'),
      s = chiralVectors('S');
    expect(Math.sign(determinant(r))).toBe(-Math.sign(determinant(s)));
    expect(r.map(({ x, y, z }) => Math.hypot(x, y, z))).toEqual(s.map(({ x, y, z }) => Math.hypot(x, y, z)));
    expect(mirrorEnantiomer('R')).toBe('S');
  });
  it('keeps the configured CIP priorities unique through rotation', () => {
    expect(CHIRAL_MOLECULES.alanine.groups.map(({ priority }) => priority)).toEqual([1, 2, 3, 4]);
    const before = chiralVectors('R')[0]!,
      after = rotateChiralVector(before, 83, -31);
    expect(Math.hypot(after.x, after.y, after.z)).toBeCloseTo(Math.hypot(before.x, before.y, before.z));
  });
});
