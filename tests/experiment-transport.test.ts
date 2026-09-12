import { describe, expect, it } from 'vitest';
import { clampProgress, nextTimelineStop } from '../src/physics/modern/shared/experiment-transport.js';

describe('experiment timeline helpers', () => {
  it('clamps invalid and out-of-range progress', () => {
    expect(clampProgress(-2)).toBe(0);
    expect(clampProgress(2)).toBe(1);
    expect(clampProgress(Number.NaN)).toBe(0);
  });

  it('steps to exact authored events', () => {
    const stops = [0, 0.25, 0.5, 1];
    expect(nextTimelineStop(0, stops)).toBe(0.25);
    expect(nextTimelineStop(0.25, stops)).toBe(0.5);
    expect(nextTimelineStop(0.9, stops)).toBe(1);
  });
});
