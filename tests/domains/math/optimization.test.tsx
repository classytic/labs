import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { descentTrace, gradientStep } from '../../../src/math/optimization/core.js';
import manifest from '../../../src/domains/math/gradient-descent/manifest.js';
import Authoring from '../../../src/domains/math/gradient-descent/authoring.js';

const bowl = { fx: (x: number) => 2 * x, fy: (_x: number, y: number) => 4 * y };

describe('optimization engine', () => {
  it('converges monotonically on a convex quadratic with a stable rate', () => {
    const trace = descentTrace(bowl, [2.4, 1.8], 0.1);
    expect(trace.state).toBe('converged');
    expect(Math.hypot(...trace.path.at(-1)!)).toBeLessThan(0.001);
    for (let index = 1; index < trace.path.length; index++) {
      const previous = trace.path[index - 1]!;
      const current = trace.path[index]!;
      expect(current[0] ** 2 + 2 * current[1] ** 2).toBeLessThan(previous[0] ** 2 + 2 * previous[1] ** 2);
    }
  });

  it('rejects non-finite gradients without appending a poisoned point', () => {
    const result = gradientStep({ fx: () => Number.NaN, fy: () => 1 }, [2, 3], 0.1);
    expect(result.state).toBe('diverged');
    expect(result.point).toEqual([2, 3]);
  });

  it('caps runaway updates', () => {
    const result = gradientStep({ fx: () => 1e9, fy: () => -1e9 }, [0, 0], 0.6);
    expect(result.state).toBe('diverged');
    expect(result.point).toEqual([0, 0]);
  });

  it('publishes a focused lazy authoring surface', () => {
    expect(manifest.loadAuthoring).toBeTypeOf('function');
    expect(manifest.schema.safeParse({ learningRate: 5 }).success).toBe(false);
    const { getByText } = render(<Authoring value={{}} onChange={vi.fn()} />);
    expect(getByText('Loss f(x,y)')).toBeTruthy();
    expect(getByText('Start (x, y)')).toBeTruthy();
  });
});
