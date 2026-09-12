import { describe, expect, it } from 'vitest';
import { firstLinearMeeting, linearPositionAt } from '../src/physics/linear-pursuit/core.js';

describe('one-dimensional pursuit engine', () => {
  it('finds a constant-speed catch-up event', () => {
    const state = {
      leader: { position: 100, speed: 10 },
      chaser: { position: 0, speed: 20 },
    };
    const time = firstLinearMeeting(state);

    expect(time).not.toBeNull();
    expect(time!).toBeCloseTo(10, 6);
    expect(linearPositionAt(state.leader, time!)).toBeCloseTo(200, 6);
    expect(linearPositionAt(state.chaser, time!)).toBeCloseTo(200, 6);
  });

  it('includes a delayed accelerating start', () => {
    const state = {
      leader: { position: 120, speed: 12 },
      chaser: { position: 0, speed: 8, acceleration: 1.8, startTime: 4 },
    };
    const time = firstLinearMeeting(state);

    expect(time).not.toBeNull();
    expect(time!).toBeGreaterThan(4);
    expect(linearPositionAt(state.leader, time!)).toBeCloseTo(linearPositionAt(state.chaser, time!), 6);
  });

  it('reports when a slower chaser never meets the leader', () => {
    expect(
      firstLinearMeeting(
        {
          leader: { position: 100, speed: 15 },
          chaser: { position: 0, speed: 10 },
        },
        120,
      ),
    ).toBeNull();
  });
});
