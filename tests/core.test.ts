import { describe, it, expect, vi } from 'vitest';
import { smooth, linear, easeInOut, cubicBezier, thereAndBack } from '../src/core/easing.js';
import { keyframes } from '../src/core/timeline.js';
import { value, derive } from '../src/core/reactive.js';
import { remap, clamp, lerp } from '../src/core/util.js';

describe('easing', () => {
  it('all map endpoints 0→0 and 1→1', () => {
    for (const fn of [linear, smooth, easeInOut, thereAndBack === thereAndBack ? smooth : smooth]) {
      expect(fn(0)).toBeCloseTo(0, 6);
      expect(fn(1)).toBeCloseTo(1, 6);
    }
  });
  it('thereAndBack returns to 0 at t=1', () => {
    expect(thereAndBack(0)).toBeCloseTo(0, 6);
    expect(thereAndBack(1)).toBeCloseTo(0, 6);
    expect(thereAndBack(0.5)).toBeCloseTo(1, 6);
  });
  it('cubicBezier(linear control points) ≈ linear', () => {
    const lin = cubicBezier(0.33, 0.33, 0.66, 0.66);
    expect(lin(0.5)).toBeCloseTo(0.5, 2);
  });
});

describe('keyframes', () => {
  const k = keyframes([
    { at: 0, value: 0 },
    { at: 0.5, value: 10 },
    { at: 1, value: 0 },
  ]);
  it('hits the keyframe values', () => {
    expect(k(0)).toBeCloseTo(0, 6);
    expect(k(0.5)).toBeCloseTo(10, 6);
    expect(k(1)).toBeCloseTo(0, 6);
  });
  it('interpolates between frames', () => {
    expect(k(0.25)).toBeGreaterThan(0);
    expect(k(0.25)).toBeLessThan(10);
  });
});

describe('reactive', () => {
  it('value get/set/subscribe + dedupe', () => {
    const v = value(1);
    const spy = vi.fn();
    const off = v.subscribe(spy);
    v.set(2);
    v.set(2); // no-op (same value)
    v.update((p) => p + 1);
    off();
    v.set(99); // after unsubscribe
    expect(v.get()).toBe(99);
    expect(spy).toHaveBeenCalledTimes(2); // 2 and 3 only
  });

  it('derive recomputes from deps', () => {
    const a = value(2);
    const b = value(3);
    const sum = derive([a, b], () => a.get() + b.get());
    expect(sum.get()).toBe(5);
    a.set(10);
    expect(sum.get()).toBe(13);
  });
});

describe('util', () => {
  it('remap + clamp + lerp', () => {
    expect(remap(5, 0, 10, 0, 100)).toBe(50);
    expect(remap(15, 0, 10, 0, 100, true)).toBe(100);
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });
});
