import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { interpolateSolution, odeStep, solveOde } from '../../../src/math/ode/core.js';
import manifest from '../../../src/domains/math/differential-equation/manifest.js';
import Runtime from '../../../src/domains/math/differential-equation/runtime.js';
import Authoring from '../../../src/domains/math/differential-equation/authoring.js';

describe('first-order ODE engine', () => {
  it('makes RK4 substantially more accurate than Euler at the same step size', () => {
    const slope = (_x: number, y: number): number => y;
    const euler = solveOde(slope, { x: 0, y: 1 }, [0, 1], 0.1, 'euler');
    const rk4 = solveOde(slope, { x: 0, y: 1 }, [0, 1], 0.1, 'rk4');
    const eulerError = Math.abs(interpolateSolution(euler.points, 1) - Math.E);
    const rk4Error = Math.abs(interpolateSolution(rk4.points, 1) - Math.E);
    expect(euler.state).toBe('complete');
    expect(rk4Error).toBeLessThan(0.00001);
    expect(rk4Error).toBeLessThan(eulerError / 1000);
  });

  it('marches in both directions and keeps points sorted', () => {
    const result = solveOde(() => 2, { x: 0, y: 1 }, [-1, 1], 0.25, 'rk4');
    expect(result.points[0]).toEqual({ x: -1, y: -1 });
    expect(result.points.at(-1)).toEqual({ x: 1, y: 3 });
    expect(result.points.every((point, index) => index === 0 || point.x > result.points[index - 1]!.x)).toBe(
      true,
    );
  });

  it('guards invalid slopes and steps', () => {
    expect(odeStep(() => Number.NaN, { x: 0, y: 1 }, 0.1, 'euler')).toBeNull();
    expect(solveOde(() => Number.POSITIVE_INFINITY, { x: 0, y: 1 }, [0, 1], 0.1, 'rk4').state).toBe(
      'diverged',
    );
  });

  it('registers a lazy runtime and author-facing initial-value controls', () => {
    expect(manifest.loadRuntime).toBeTypeOf('function');
    expect(manifest.schema.safeParse({ stepSize: 0 }).success).toBe(false);
    const runtime = render(<div>{Runtime({ equation: 'x-y', initial: [0, 1] })}</div>);
    expect(runtime.container.querySelector('svg')).toBeTruthy();
    expect(runtime.getByText(/Error at x/)).toBeTruthy();
    runtime.unmount();
    const authoring = render(<Authoring value={{}} onChange={vi.fn()} />);
    expect(authoring.getByText('Slope f(x,y)')).toBeTruthy();
    expect(authoring.getByText('Initial condition')).toBeTruthy();
  });
});
