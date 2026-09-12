import { describe, it, expect } from 'vitest';
import { balanceAlgebraDoc } from '../dist/math/index.mjs';
import { resolve, applyCommand, isAssetGeom, type Command } from '@classytic/stage';

describe('balance-algebra flagship', () => {
  it('solving 2x+1=7 balances at x=3 (tilt→0, balanced→true), asset geometry resolves', () => {
    const doc = balanceAlgebraDoc({ coef: 2, addend: 1, rhs: 7, answer: 3 });

    let r = resolve(doc);
    expect(r.values.get('balanced')).toBe(false);
    expect(Object.keys(r.errors)).toHaveLength(0);

    const setX: Command = { op: 'mutate', id: 'x', patch: { free: { value: 3 } } };
    r = resolve(applyCommand(doc, setX));

    expect(r.values.get('L')).toBe(7);
    expect(r.values.get('R')).toBe(7);
    expect(r.values.get('diff')).toBe(0);
    expect(r.values.get('tilt')).toBe(0);
    expect(r.values.get('balanced')).toBe(true);

    const geom = r.values.get('scale');
    expect(isAssetGeom(geom)).toBe(true);
    if (isAssetGeom(geom)) {
      expect(geom.parts.beamA).toBeDefined();
      expect(Array.isArray((geom.meta as { items: unknown[] }).items)).toBe(true);
    }
  });

  it('tilt reflects imbalance and clamps to ±14', () => {
    const doc = balanceAlgebraDoc({ coef: 2, addend: 1, rhs: 7, answer: 3 });
    const heavy = resolve(applyCommand(doc, { op: 'mutate', id: 'x', patch: { free: { value: 8 } } }));
    expect(heavy.values.get('diff')).toBe(10);
    expect(heavy.values.get('tilt')).toBe(14);
    expect(heavy.values.get('balanced')).toBe(false);
  });
});
