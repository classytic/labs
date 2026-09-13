import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { TAU, bands, onCircle, readout, wholeRadii } from '../../../../src/math/radian-wrap/core.js';
import manifest from '../../../../src/domains/math/radian-wrap/manifest.js';
import Runtime from '../../../../src/domains/math/radian-wrap/runtime.js';

describe('radian-wrap', () => {
  it('fits six whole radii in a full turn, with a stub left over', () => {
    // The entire lesson in one assertion.
    expect(wholeRadii(TAU)).toBe(6);
    const r = readout(TAU, 1);
    expect(r.whole).toBe(6);
    expect(r.remainder).toBeCloseTo(0.283185, 5);
    expect(r.degrees).toBeCloseTo(360, 9);
  });

  it('makes one radian about 57.3 degrees', () => {
    expect(readout(1, 1).degrees).toBeCloseTo(57.2957795, 6);
  });

  it('gives a count that does NOT depend on the radius', () => {
    // If this ever fails the lab is teaching that a bigger circle has more radians in
    // it, which is the exact misconception it exists to remove.
    for (const radius of [0.5, 1, 7, 1000]) {
      const r = readout(TAU, radius);
      expect(r.radians).toBeCloseTo(TAU, 9);
      expect(r.whole).toBe(6);
      // Arc grows with the circle, the ANGLE does not.
      expect(r.arc).toBeCloseTo(TAU * radius, 6);
      expect(r.arc / radius).toBeCloseTo(r.radians, 9);
    }
  });

  it('splits the arc into whole bands plus a part band', () => {
    const b = bands(TAU);
    expect(b).toHaveLength(7);
    expect(b.slice(0, 6).every((x) => Math.abs(x.fraction - 1) < 1e-9)).toBe(true);
    expect(b[6]!.fraction).toBeCloseTo(0.283185, 5);
    // Bands tile the arc with no gap and no overlap.
    expect(b[0]!.from).toBe(0);
    for (let i = 1; i < b.length; i++) expect(b[i]!.from).toBeCloseTo(b[i - 1]!.to, 9);
    expect(b.at(-1)!.to).toBeCloseTo(TAU, 9);
  });

  it('lays no band at all before the first radius is placed', () => {
    expect(bands(0)).toHaveLength(0);
    expect(bands(-5)).toHaveLength(0);
    expect(readout(0, 1).whole).toBe(0);
  });

  it('places a point one radian round at the angle whose arc equals the radius', () => {
    const p = onCircle({ x: 0, y: 0 }, 10, 1);
    expect(p.x).toBeCloseTo(10 * Math.cos(1), 9);
    // y is flipped for figure coordinates, which is what the drawing relies on.
    expect(p.y).toBeCloseTo(-10 * Math.sin(1), 9);
  });

  it('accepts a blank insert and rejects an out-of-range radius', () => {
    expect(manifest.schema.safeParse({}).success).toBe(true);
    expect(manifest.schema.safeParse({ startRadians: 1 }).success).toBe(true);
    expect(manifest.schema.safeParse({ radius: 5 }).success).toBe(false);
    expect(manifest.schema.safeParse({ startRadians: 99 }).success).toBe(false);
  });

  it('renders through the runtime seam and states the angle', () => {
    const result = render(<div>{Runtime({ startRadians: 1 })}</div>);
    expect(result.container.textContent).toContain('1.00 rad');
    result.unmount();
  });
});
