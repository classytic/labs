import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { newtonStep, newtonTrace } from '../../../src/math/root-finding/core.js';
import manifest from '../../../src/domains/math/newton-method/manifest.js';
import Runtime from '../../../src/domains/math/newton-method/runtime.js';
import Authoring from '../../../src/domains/math/newton-method/authoring.js';

describe('Newton root-finding engine', () => {
  it('converges quadratically to sqrt(2)', () => {
    const trace = newtonTrace(
      (x) => x * x - 2,
      (x) => 2 * x,
      1.5,
      12,
    );
    expect(trace.state).toBe('converged');
    expect(trace.root).toBeCloseTo(Math.SQRT2, 10);
    expect(trace.iterations.length).toBeLessThan(7);
  });

  it('detects a flat derivative before dividing', () => {
    const result = newtonStep(
      (x) => x * x + 1,
      (x) => 2 * x,
      0,
    );
    expect(result.state).toBe('flat-derivative');
    expect(result.nextX).toBe(0);
  });

  it('detects a repeating two-cycle', () => {
    const trace = newtonTrace(
      (x) => x ** 3 - 2 * x + 2,
      (x) => 3 * x * x - 2,
      0,
      10,
    );
    expect(trace.state).toBe('cycle');
    expect(trace.root).toBe(0);
  });

  it('registers independent runtime and authoring experiences', () => {
    expect(manifest.loadAuthoring).toBeTypeOf('function');
    expect(manifest.schema.safeParse({ xRange: [2, -2] }).success).toBe(false);
    const runtime = render(<div>{Runtime({ equation: 'x^2 - 2', startX: 1.5 })}</div>);
    expect(runtime.container.querySelector('svg')).toBeTruthy();
    expect(runtime.getByText('Current estimate')).toBeTruthy();
    runtime.unmount();
    const authoring = render(<Authoring value={{}} onChange={vi.fn()} />);
    expect(authoring.getByText('Initial guess')).toBeTruthy();
    expect(authoring.getByText('Iteration cap')).toBeTruthy();
  });
});
