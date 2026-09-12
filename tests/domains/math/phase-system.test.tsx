import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { phaseStep, solvePhaseSystem } from '../../../src/math/ode/system.js';
import manifest from '../../../src/domains/math/phase-portrait/manifest.js';
import Runtime from '../../../src/domains/math/phase-portrait/runtime.js';
import Authoring from '../../../src/domains/math/phase-portrait/authoring.js';

describe('phase-system engine', () => {
  const oscillator = (x: number, y: number) => ({ dx: y, dy: -x });

  it('preserves a harmonic orbit accurately with RK4', () => {
    const result = solvePhaseSystem(oscillator, { x: 1, y: 0 }, 2 * Math.PI, 0.05, 'rk4');
    const end = result.points.at(-1)!;
    expect(result.state).toBe('complete');
    expect(end.x).toBeCloseTo(1, 5);
    expect(end.y).toBeCloseTo(0, 5);
  });

  it('traces backward and forward around the initial state', () => {
    const result = solvePhaseSystem(() => ({ dx: 1, dy: -2 }), { x: 0, y: 0 }, 1, 0.25, 'euler');
    expect(result.points[0]).toMatchObject({ x: -1, y: 2, t: -1 });
    expect(result.points.at(-1)).toMatchObject({ x: 1, y: -2, t: 1 });
  });

  it('rejects non-finite vector fields', () => {
    expect(phaseStep(() => ({ dx: Number.NaN, dy: 1 }), { x: 0, y: 0, t: 0 }, 0.1, 'rk4')).toBeNull();
    expect(
      solvePhaseSystem(() => ({ dx: Number.POSITIVE_INFINITY, dy: 0 }), { x: 0, y: 0 }, 1, 0.1).state,
    ).toBe('diverged');
  });

  it('registers lazy authoring and renders the state-space activity', () => {
    expect(manifest.schema.safeParse({ duration: 100 }).success).toBe(false);
    const runtime = render(<div>{Runtime({ dx: 'y', dy: '-x' })}</div>);
    expect(runtime.container.querySelector('svg')).toBeTruthy();
    expect(runtime.getByText('Forward-endpoint error')).toBeTruthy();
    runtime.unmount();
    const authoring = render(<Authoring value={{}} onChange={vi.fn()} />);
    expect(authoring.getByText('dx/dt')).toBeTruthy();
    expect(authoring.getByText('Initial state')).toBeTruthy();
  });
});
