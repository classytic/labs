/**
 * Wave kernel — v = fλ, standing-wave nodes/antinodes, beats. The labs render
 * these, so pin the relationships.
 */
import { describe, it, expect } from 'vitest';
import { speed, period, waveY, standingY, harmonicWavelength, nodes, antinodes, beatFreq } from '../src/physics/waves/core.js';

describe('wave kernel', () => {
  it('v = fλ and T = 1/f', () => {
    expect(speed({ amp: 1, wavelength: 4, freq: 2 })).toBe(8);
    expect(period(2)).toBe(0.5);
  });
  it('a travelling wave moves: a crest at x shifts right over time', () => {
    const w = { amp: 1, wavelength: 4, freq: 1 };
    expect(waveY(w, 1, 0)).toBeCloseTo(Math.sin(Math.PI / 2), 6); // crest at x=1, t=0
    // a moment later the same phase is found a little further right
    expect(waveY(w, 1 + speed(w) * 0.01, 0.01)).toBeCloseTo(1, 6);
  });
  it('standing wave: nodes stay 0 for all t, antinodes swing fully', () => {
    const A = 1, Ln = 10, n = 3;
    for (const t of [0, 0.1, 0.25, 0.5]) for (const xn of nodes(Ln, n)) expect(standingY(A, Ln, n, 1, xn, t)).toBeCloseTo(0, 6);
    // an antinode reaches ±2A at t=0 (cos=1)
    expect(Math.abs(standingY(A, Ln, n, 1, antinodes(Ln, n)[0]!, 0))).toBeCloseTo(2 * A, 6);
  });
  it('harmonic wavelength λ = 2L/n; n+1 nodes, n antinodes', () => {
    expect(harmonicWavelength(10, 2)).toBe(10);
    expect(nodes(10, 4)).toHaveLength(5);
    expect(antinodes(10, 4)).toHaveLength(4);
  });
  it('beats at the frequency difference', () => {
    expect(beatFreq(5, 5.3)).toBeCloseTo(0.3, 6);
  });
});
