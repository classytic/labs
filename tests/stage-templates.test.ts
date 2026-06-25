import { describe, it, expect } from 'vitest';
import { areaModelDoc, growingPatternDoc } from '../dist/math/index.mjs';
import { leverBalanceDoc } from '../dist/physics/index.mjs';
import { circuitDoc } from '../dist/circuits/index.mjs';
import { resolve, applyCommand, isAssetGeom } from '@classytic/stage';

const circMeta = (doc: ReturnType<typeof circuitDoc>) => {
  const g = resolve(doc).values.get('circuit');
  if (!isAssetGeom(g)) throw new Error('circuit not an asset geom');
  return g.meta as unknown as { solved: boolean; Itotal: number; comps: { type: string; brightness: number }[] };
};

// The labs templates register their assets into the SHARED @classytic/stage
// registry on import, and resolve() (from stage) reads that registry — proving
// the labs-on-stage wiring end to end.

describe('labs templates on the stage engine', () => {
  it('area-model resolves the partitioned rectangle', () => {
    const g = resolve(areaModelDoc({ a: 3, b: 2 })).values.get('area');
    expect(isAssetGeom(g)).toBe(true);
    if (isAssetGeom(g)) expect((g.meta as { expanded: unknown }).expanded).toEqual({ sq: 1, lin: 5, con: 6 });
  });

  it('growing-pattern figures count a·n + b', () => {
    const r = resolve(growingPatternDoc({ a: 2, b: 3, steps: 4 }));
    const f4 = r.values.get('fig4');
    expect(isAssetGeom(f4)).toBe(true);
    if (isAssetGeom(f4)) expect((f4.meta as { count: number }).count).toBe(11);
    expect(Number(r.values.get('guess5'))).toBe(5); // guess(n)=aGuess·n+bGuess = 1·5+0
  });

  it('balance-lever balances when torques match (4·3 = x·2 ⇒ x=6)', () => {
    const doc = leverBalanceDoc({ items: [{ side: 'L', dist: 3, weight: 4 }, { side: 'R', dist: 2, weight: 'unknown' }], start: 1 });
    expect(resolve(doc).values.get('balanced')).toBe(false);
    const solved = resolve(applyCommand(doc, { op: 'mutate', id: 'w', patch: { free: { value: 6 } } }));
    expect(solved.values.get('balanced')).toBe(true);
  });

  it('circuit: open switch ⇒ dark bulb, no current; close it ⇒ bulb lights', () => {
    const doc = circuitDoc({ emf: 6, branches: [[{ type: 'switch', closed: false }, { type: 'bulb', ohms: 6 }]], goal: { kind: 'lightBulb' } });
    const open = circMeta(doc);
    expect(open.Itotal).toBeCloseTo(0);
    expect(open.solved).toBe(false);

    const closed = circMeta(applyCommand(doc, { op: 'mutate', id: 'sw0', patch: { free: { value: 1 } } }));
    expect(closed.Itotal).toBeCloseTo(1); // 6V / 6Ω
    expect(closed.comps.find((c) => c.type === 'bulb')!.brightness).toBeGreaterThan(0.9);
    expect(closed.solved).toBe(true);
  });

  it('circuit: two parallel bulbs both light (series-parallel reduction)', () => {
    const doc = circuitDoc({ emf: 6, branches: [[{ type: 'bulb', ohms: 6 }], [{ type: 'bulb', ohms: 6 }]], goal: { kind: 'allLit' } });
    const m = circMeta(doc);
    expect(m.comps.filter((c) => c.type === 'bulb').every((c) => c.brightness > 0.9)).toBe(true);
    expect(m.solved).toBe(true);
    expect(m.Itotal).toBeCloseTo(2); // two 1A branches in parallel
  });
});
