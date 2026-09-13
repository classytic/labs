import { describe, expect, it } from 'vitest';
import { dragTo } from '../../../../src/physics/vector-board/preset.js';

const ORIGIN = { x: 0, y: 0 };
const len = (v: { x: number; y: number }): number => Math.hypot(v.x, v.y);

describe('vector-board drag', () => {
  it('normally follows the pointer, snapped to the grid', () => {
    const snap = (n: number): number => Math.round(n);
    expect(dragTo({ x: 2.4, y: -0.7 }, ORIGIN, { x: 3, y: 0 }, { snap })).toEqual({ x: 2, y: -1 });
  });

  it('keeps the authored LENGTH when locked, whatever the pointer does', () => {
    const authored = { x: 3, y: 0 }; // 3.0 m/s
    // The drag that broke the circular-motion lesson: a head pulled out to a longer
    // arrow, which silently turned "steady 3.0" into 3.2 and stopped the difference
    // arrow pointing at the centre.
    for (const pointer of [
      { x: 9, y: 9 },
      { x: 0.2, y: -0.1 },
      { x: -40, y: 3 },
      { x: 0, y: 5 },
    ]) {
      const out = dragTo(pointer, ORIGIN, authored, { lock: true });
      expect(len(out)).toBeCloseTo(3, 9);
    }
  });

  it('takes the DIRECTION from the pointer when locked', () => {
    const out = dragTo({ x: 0, y: 7 }, ORIGIN, { x: 3, y: 0 }, { lock: true });
    // Straight up, at the authored length.
    expect(out.x).toBeCloseTo(0, 9);
    expect(out.y).toBeCloseTo(3, 9);
  });

  it('ignores snapping while locked, because snapping would change the length', () => {
    // 45 degrees at length 3 lands on (2.12, 2.12), which no integer grid contains.
    const snap = (n: number): number => Math.round(n);
    const out = dragTo({ x: 5, y: 5 }, ORIGIN, { x: 3, y: 0 }, { lock: true, snap });
    expect(len(out)).toBeCloseTo(3, 9);
    expect(out.x).toBeCloseTo(3 / Math.SQRT2, 6);
  });

  it('respects the tail when locked', () => {
    const tail = { x: 1, y: 1 };
    const out = dragTo({ x: 1, y: 6 }, tail, { x: 2, y: 0 }, { lock: true });
    expect(out).toEqual({ x: 0, y: 2 });
  });

  it('holds still rather than collapsing on a degenerate drag', () => {
    const authored = { x: 3, y: 0 };
    // Dragged exactly onto the tail: no direction to read.
    expect(dragTo(ORIGIN, ORIGIN, authored, { lock: true })).toEqual(authored);
    // A zero-length authored vector has no length to preserve.
    expect(dragTo({ x: 5, y: 5 }, ORIGIN, ORIGIN, { lock: true })).toEqual(ORIGIN);
  });

  it('keeps the two velocities equal, which is what the lesson claims', () => {
    // v_later and v_now both 3.0, a quarter turn apart. Whatever the learner drags,
    // the speeds stay equal and the difference keeps pointing at the centre.
    const vLater = { x: 0, y: 3 };
    const dragged = dragTo({ x: 11, y: -4 }, ORIGIN, { x: 3, y: 0 }, { lock: true });
    expect(len(dragged)).toBeCloseTo(len(vLater), 9);
    const diff = { x: vLater.x - dragged.x, y: vLater.y - dragged.y };
    // Equal speeds mean the change in velocity is perpendicular to neither, but its
    // length follows the chord formula 2*v*sin(theta/2), which is the real check.
    const theta = Math.acos((vLater.x * dragged.x + vLater.y * dragged.y) / (3 * 3));
    expect(len(diff)).toBeCloseTo(2 * 3 * Math.sin(theta / 2), 6);
  });
});
