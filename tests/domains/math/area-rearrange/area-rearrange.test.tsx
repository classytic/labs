import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { rearrange, areaOf, DEFAULTS, type RearrangeMode } from '../../../../src/math/area-rearrange/core.js';
import manifest from '../../../../src/domains/math/area-rearrange/manifest.js';
import Runtime from '../../../../src/domains/math/area-rearrange/runtime.js';

const MODES: RearrangeMode[] = ['triangle', 'parallelogram', 'trapezium', 'circle'];

/** Shoelace. The whole teaching claim is that rearranging cannot change the area,
 *  so the test that matters is that the total area is invariant in t. */
function area(points: readonly (readonly [number, number])[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]!;
    const [x2, y2] = points[(i + 1) % points.length]!;
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

const totalArea = (mode: RearrangeMode, t: number): number =>
  rearrange(mode, t, DEFAULTS).reduce((acc, p) => acc + area(p.points), 0);

describe('area rearrangement', () => {
  it('conserves total area all the way across, for every mode', () => {
    // If this ever fails the lab is lying: a piece has been stretched, not moved.
    for (const mode of MODES) {
      const start = totalArea(mode, 0);
      for (const t of [0.25, 0.5, 0.75, 1]) {
        expect(totalArea(mode, t)).toBeCloseTo(start, 6);
      }
    }
  });

  it('keeps the same number of pieces throughout the move', () => {
    for (const mode of MODES) {
      const n = rearrange(mode, 0, DEFAULTS).length;
      expect(rearrange(mode, 1, DEFAULTS)).toHaveLength(n);
    }
  });

  it('lands the triangle on exactly half of its bounding rectangle', () => {
    const { base, height } = DEFAULTS;
    const [tri] = rearrange('triangle', 0, DEFAULTS);
    expect(area(tri!.points)).toBeCloseTo((base * height) / 2, 6);
    // The two leftover corners together equal the triangle, which is the proof.
    const leftovers = rearrange('triangle', 0, DEFAULTS).slice(1);
    const sum = leftovers.reduce((acc, p) => acc + area(p.points), 0);
    expect(sum).toBeCloseTo(area(tri!.points), 6);
  });

  it('approaches pi r squared as the circle is cut into more sectors', () => {
    const r = DEFAULTS.height / 2;
    const exact = Math.PI * r * r;
    const coarse = totalArea('circle', 0);
    const fine = rearrange('circle', 0, { ...DEFAULTS, sectors: 24 }).reduce(
      (acc, p) => acc + area(p.points),
      0,
    );
    // More sectors means less is lost to the straight chords, so it closes on pi r².
    expect(fine).toBeGreaterThan(coarse);
    expect(fine).toBeLessThanOrEqual(exact + 1e-9);
    expect(exact - fine).toBeLessThan(exact - coarse);
  });

  it('reports the formula each mode is proving', () => {
    expect(areaOf('parallelogram', DEFAULTS).value).toBeCloseTo(DEFAULTS.base * DEFAULTS.height, 6);
    expect(areaOf('circle', DEFAULTS).value).toBeCloseTo(Math.PI * (DEFAULTS.height / 2) ** 2, 6);
    expect(areaOf('triangle', DEFAULTS).formula).toContain('half');
  });

  it('clamps t outside 0 to 1 rather than flying apart', () => {
    expect(totalArea('triangle', -5)).toBeCloseTo(totalArea('triangle', 0), 6);
    expect(totalArea('triangle', 9)).toBeCloseTo(totalArea('triangle', 1), 6);
  });

  it('accepts a blank insert and rejects an out-of-range shape', () => {
    expect(manifest.schema.safeParse({}).success).toBe(true);
    expect(manifest.schema.safeParse({ mode: 'triangle', base: 8 }).success).toBe(true);
    expect(manifest.schema.safeParse({ sectors: 99 }).success).toBe(false);
    expect(manifest.schema.safeParse({ mode: 'hexagon' }).success).toBe(false);
  });

  it('renders through the runtime seam', () => {
    const result = render(<div>{Runtime({ mode: 'circle', sectors: 12 })}</div>);
    expect(result.container.textContent).toContain('rearranged');
  });
});
