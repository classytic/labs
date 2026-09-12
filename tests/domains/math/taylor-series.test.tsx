import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  evaluateTaylor,
  factorial,
  maxApproximationError,
  taylorCoefficients,
} from '../../../src/math/taylor/core.js';
import manifest from '../../../src/domains/math/taylor-series/manifest.js';
import Runtime from '../../../src/domains/math/taylor-series/runtime.js';
import Authoring from '../../../src/domains/math/taylor-series/authoring.js';

describe('Taylor approximation engine', () => {
  it('computes factorial and derivative-scaled coefficients', () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(8)).toBe(40320);
    const derivatives = [
      (x: number) => Math.sin(x),
      (x: number) => Math.cos(x),
      (x: number) => -Math.sin(x),
      (x: number) => -Math.cos(x),
    ];
    expect(taylorCoefficients(derivatives, 0)).toEqual([0, 1, -0, -1 / 6]);
  });

  it('evaluates with Horner form and improves near the center', () => {
    const coefficients = [0, 1, 0, -1 / 6, 0, 1 / 120];
    const low = evaluateTaylor(coefficients, 0, 1, 1);
    const high = evaluateTaylor(coefficients, 0, 1, 5);
    expect(Math.abs(high - Math.sin(1))).toBeLessThan(Math.abs(low - Math.sin(1)));
    expect(high).toBeCloseTo(Math.sin(1), 3);
  });

  it('measures finite approximation error over a window', () => {
    const approximation = (x: number): number => evaluateTaylor([1, 1, 0.5, 1 / 6], 0, x);
    expect(maxApproximationError(Math.exp, approximation, [-0.25, 0.25])).toBeLessThan(0.001);
  });

  it('registers a lazy runtime and focused authoring panel', () => {
    expect(manifest.loadAuthoring).toBeTypeOf('function');
    expect(manifest.schema.safeParse({ order: 20 }).success).toBe(false);
    const runtime = render(<div>{Runtime({ equation: 'sin(x)', order: 5 })}</div>);
    expect(runtime.container.querySelector('svg')).toBeTruthy();
    expect(runtime.getByText(/Error at x/)).toBeTruthy();
    runtime.unmount();
    const authoring = render(<Authoring value={{}} onChange={vi.fn()} />);
    expect(authoring.getByText('Center a')).toBeTruthy();
    expect(authoring.getByText('Error probe')).toBeTruthy();
  });
});
