import { describe, expect, it } from 'vitest';
import {
  G,
  PIPE,
  headAt,
  pressureDrop,
  radiusAt,
  speedAt,
  throat,
  type VenturiFlow,
} from '../src/physics/venturi/core.js';

const FLOW: VenturiFlow = { inletSpeed: 1, throatRatio: 0.5, inletHead: 0.9 };
const MID = (PIPE.converge[1] + PIPE.diverge[0]) / 2;

describe('continuity', () => {
  it('keeps the flow rate A v the same at every section', () => {
    for (const x of [0.2, 1.0, 1.5, 2.0, 2.8]) {
      const r = radiusAt(x, FLOW.throatRatio);
      expect(r * r * speedAt(FLOW, x)).toBeCloseTo(FLOW.inletSpeed, 12);
    }
  });

  it('quadruples the speed when the radius halves', () => {
    expect(speedAt(FLOW, MID)).toBeCloseTo(4, 12);
  });
});

describe("Bernoulli's equation", () => {
  it('keeps P + ½ρv² the same along the pipe', () => {
    const total = (x: number): number => -pressureDrop(FLOW, x) + 0.5 * 1000 * speedAt(FLOW, x) ** 2;
    for (const x of [0.2, 1.1, 1.5, 2.6]) expect(total(x)).toBeCloseTo(total(0), 8);
  });

  it('lowers the water column where the pipe is narrow', () => {
    // Δh = (4² − 1²) ÷ 2g = 15 ÷ 19.6.
    expect(throat(FLOW).headDrop).toBeCloseTo(15 / (2 * G), 12);
    expect(headAt(FLOW, MID)).toBeLessThan(headAt(FLOW, 0.2));
  });

  it('gets the full head back in the wide pipe after the throat, with no friction', () => {
    expect(headAt(FLOW, 2.8)).toBeCloseTo(headAt(FLOW, 0.2), 12);
  });

  it('changes nothing when the pipe does not narrow', () => {
    expect(throat({ ...FLOW, throatRatio: 1 }).headDrop).toBeCloseTo(0, 12);
  });

  it('drops below atmospheric pressure at a tight enough throat, which is how a spray works', () => {
    expect(headAt({ ...FLOW, throatRatio: 0.4 }, MID)).toBeLessThan(0);
  });
});
