import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DEFAULTS, readout, solidPieces, type SolidMode } from '../../../../src/math/solid-net/core.js';
import manifest from '../../../../src/domains/math/solid-net/manifest.js';
import Runtime from '../../../../src/domains/math/solid-net/runtime.js';

const MODES: SolidMode[] = ['layers', 'net', 'sphere', 'compound'];

describe('solid-net geometry', () => {
  it('builds one layer per unit of height', () => {
    for (const h of [1, 3, 6]) {
      expect(solidPieces('layers', { ...DEFAULTS, height: h })).toHaveLength(h);
    }
  });

  it('opens a cuboid into exactly six faces, in three matching pairs', () => {
    const faces = solidPieces('net', DEFAULTS);
    expect(faces).toHaveLength(6);
    const areas = faces.map((f) => f.w * f.h).sort((a, b) => a - b);
    // Six faces, three distinct areas, each appearing twice.
    expect(areas[0]).toBeCloseTo(areas[1], 6);
    expect(areas[2]).toBeCloseTo(areas[3], 6);
    expect(areas[4]).toBeCloseTo(areas[5], 6);
  });

  it('agrees with the cuboid formulas', () => {
    const { length: l, width: w, height: h } = DEFAULTS;
    const r = readout('net', DEFAULTS);
    expect(r.volume).toBeCloseTo(l * w * h, 6);
    expect(r.surface).toBeCloseTo(2 * (l * w + l * h + w * h), 6);
    // The net's own faces must add to the surface area it reports.
    const drawn = solidPieces('net', DEFAULTS).reduce((acc, f) => acc + f.w * f.h, 0);
    expect(drawn).toBeCloseTo(r.surface, 6);
  });

  it('uses the real sphere formulas, and squares versus cubes correctly', () => {
    const one = readout('sphere', { ...DEFAULTS, radius: 2 });
    const two = readout('sphere', { ...DEFAULTS, radius: 4 });
    expect(one.volume).toBeCloseTo((4 / 3) * Math.PI * 8, 6);
    expect(one.surface).toBeCloseTo(4 * Math.PI * 4, 6);
    // Doubling r: surface x4, volume x8. That is the lab's whole question.
    expect(two.surface / one.surface).toBeCloseTo(4, 6);
    expect(two.volume / one.volume).toBeCloseTo(8, 6);
  });

  it('adds volumes but REMOVES two faces when two solids are joined', () => {
    const joined = readout('compound', DEFAULTS);
    const { length: l, width: w, height: h, topHeight: th } = DEFAULTS;
    const upper = Math.round(l * 0.6);
    expect(joined.volume).toBeCloseTo(l * w * h + upper * w * th, 6);
    const apart =
      2 * (l * w + l * h + w * h) + 2 * (upper * w + upper * th + w * th);
    expect(joined.surface).toBeLessThan(apart);
    expect(apart - joined.surface).toBeCloseTo(2 * upper * w, 6);
  });

  it('marks the join so it can be drawn as lost surface', () => {
    expect(solidPieces('compound', DEFAULTS).some((b) => b.tone === 'lost')).toBe(true);
  });

  it('accepts a blank insert and rejects an out-of-range dimension', () => {
    expect(manifest.schema.safeParse({}).success).toBe(true);
    expect(manifest.schema.safeParse({ mode: 'net', length: 6 }).success).toBe(true);
    expect(manifest.schema.safeParse({ radius: 99 }).success).toBe(false);
    expect(manifest.schema.safeParse({ mode: 'pyramid' }).success).toBe(false);
  });

  it('renders every mode through the runtime seam', () => {
    for (const mode of MODES) {
      const result = render(<div>{Runtime({ mode })}</div>);
      expect(result.container.textContent).toContain('volume');
      result.unmount();
    }
  });
});
