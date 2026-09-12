import { describe, expect, it } from 'vitest';
import {
  aimMinDrift,
  aimStraightAcross,
  crossing,
  minDrift,
  regime,
  strategies,
} from '../src/physics/river-crossing.js';

describe('river crossing, the two optimisations', () => {
  it('crosses fastest straight across, whatever the current does', () => {
    // Time depends only on the across-component, so the current cannot change it at theta = 0.
    const still = crossing(4, 0, 0, 8);
    const flowing = crossing(4, 3, 0, 8);
    expect(flowing.time).toBeCloseTo(still.time, 10);
    expect(flowing.time).toBeCloseTo(2, 10);
    // What the current does change is where you land.
    expect(still.drift).toBeCloseTo(0, 10);
    expect(flowing.drift).toBeCloseTo(6, 10);
  });

  it('lands directly opposite at sin θ = u/v, and that costs time', () => {
    const heading = aimStraightAcross(4, 2)!;
    expect(Math.sin((heading * Math.PI) / 180)).toBeCloseTo(0.5, 10);
    const aimed = crossing(4, 2, heading, 8);
    expect(aimed.drift).toBeCloseTo(0, 10);
    // t = W/sqrt(v^2 - u^2), slower than the straight-across W/v.
    expect(aimed.time).toBeCloseTo(8 / Math.sqrt(16 - 4), 10);
    expect(aimed.time).toBeGreaterThan(crossing(4, 2, 0, 8).time);
  });

  it('has no straight-across heading once the current outruns the boat', () => {
    expect(aimStraightAcross(2, 4)).toBeNull();
    // And says so rather than hiding the option.
    const unavailable = strategies(2, 4).find((s) => s.id === 'straight')!;
    expect(unavailable.headingDeg).toBeNull();
    expect(unavailable.unavailable).toMatch(/current is faster/);
  });
});

describe('minimum drift, checked against brute force', () => {
  // The closed form sin θ = v/u came off paper, so it is checked against a sweep rather than
  // trusted. A wrong derivation here would teach a wrong exam result to every learner.
  const sweepBest = (boat: number, current: number, width: number) => {
    let best = { heading: 0, drift: Infinity };
    for (let deg = 0; deg <= 89.99; deg += 0.001) {
      const { drift, lands } = crossing(boat, current, deg, width);
      if (lands && drift < best.drift) best = { heading: deg, drift };
    }
    return best;
  };

  for (const [boat, current, width] of [
    [2, 4, 8],
    [3, 5, 10],
    [1.5, 6, 12],
  ] as const) {
    it(`matches the sweep for v=${boat}, u=${current}`, () => {
      const closed = aimMinDrift(boat, current)!;
      const swept = sweepBest(boat, current, width);
      expect(closed).toBeCloseTo(swept.heading, 2);
      expect(minDrift(boat, current, width)).toBeCloseTo(swept.drift, 3);
      // And the closed form is the mirror of the other condition: sin θ = v/u.
      expect(Math.sin((closed * Math.PI) / 180)).toBeCloseTo(boat / current, 10);
    });
  }

  it('is zero when the boat can already land opposite, and offers no heading', () => {
    expect(minDrift(4, 2, 8)).toBe(0);
    expect(aimMinDrift(4, 2)).toBeNull();
  });
});

describe('the regime boundary', () => {
  it('names which side of v = u you are on', () => {
    expect(regime(4, 2)).toBe('boat-wins');
    expect(regime(2, 4)).toBe('current-wins');
    expect(regime(3, 3)).toBe('balanced');
  });

  it('collapses both optimal headings onto 90 degrees exactly at the boundary', () => {
    // Where the two conditions sin θ = u/v and sin θ = v/u meet, both give a boat pointing
    // straight upstream, which never crosses at all. That is the boundary made visible.
    expect(aimStraightAcross(3, 3)).toBeCloseTo(90, 10);
    expect(aimMinDrift(3, 3)).toBeCloseTo(90, 10);
    expect(crossing(3, 3, 90, 8).lands).toBe(false);
  });

  it('always offers all three strategies, with a reason on the one that cannot apply', () => {
    for (const [boat, current] of [
      [4, 2],
      [2, 4],
    ] as const) {
      const all = strategies(boat, current);
      expect(all).toHaveLength(3);
      const dead = all.filter((s) => s.headingDeg === null);
      expect(dead).toHaveLength(1);
      expect(dead[0]!.unavailable).toBeTruthy();
    }
  });
});
