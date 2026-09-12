import { describe, expect, it } from 'vitest';
import {
  geometryFoundationState,
  type GeometryFoundationInput,
} from '../src/math/geometry-foundations/core.js';

const base: GeometryFoundationInput = {
  mode: 'pythagorean',
  sideA: 3,
  sideB: 4,
  centralAngle: 100,
  sides: 6,
};

describe('geometry foundations engine', () => {
  it('links the three square areas', () => {
    const state = geometryFoundationState(base);
    expect(state.values[0]?.value).toBe('9 + 16');
    expect(state.values[1]?.value).toBe('5.00');
  });
  it('halves the central angle at the circumference', () => {
    expect(geometryFoundationState({ ...base, mode: 'circle-theorem' }).values[1]?.value).toBe('50°');
  });
  it('decomposes an n-gon into n minus two triangles', () => {
    const state = geometryFoundationState({ ...base, mode: 'polygon-angles', sides: 6 });
    expect(state.values[0]?.value).toBe('4');
    expect(state.values[1]?.value).toBe('720°');
    expect(state.values[2]?.value).toBe('120.0°');
  });
});
