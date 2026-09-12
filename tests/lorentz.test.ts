import { describe, expect, it } from 'vitest';
import { cyclotronRadius, cyclotronSense, lorentzForce2D } from '../src/physics/lorentz/core.js';

describe('Lorentz force model', () => {
  it('follows q(v × B) for the displayed out-of-page convention', () => {
    expect(lorentzForce2D({ x: 1, y: 0 }, 1, 1)).toEqual({ x: 0, y: -1 });
    expect(cyclotronSense(1, 1)).toBe(-1);
  });

  it('reverses when either charge or field reverses, but not both', () => {
    const base = lorentzForce2D({ x: 2, y: 3 }, 1, 4);
    expect(lorentzForce2D({ x: 2, y: 3 }, -1, 4)).toEqual({ x: -base.x, y: -base.y });
    expect(lorentzForce2D({ x: 2, y: 3 }, 1, -4)).toEqual({ x: -base.x, y: -base.y });
    expect(lorentzForce2D({ x: 2, y: 3 }, -1, -4)).toEqual(base);
  });

  it('is perpendicular to velocity and uses magnitude in the radius', () => {
    const v = { x: 2, y: -5 };
    const force = lorentzForce2D(v, -2, 3);
    expect(v.x * force.x + v.y * force.y).toBeCloseTo(0, 12);
    expect(cyclotronRadius(2, 6, -3, 4)).toBeCloseTo(1);
  });
});
