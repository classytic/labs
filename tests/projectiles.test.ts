import { describe, expect, it } from 'vitest';
import {
  aimAngle,
  ballPosition,
  cartLanding,
  cartPosition,
  dropAndThrow,
  minimumSpeed,
  resolveShot,
  shotBall,
  shotTarget,
  timeToGround,
  type Shot,
} from '../src/physics/projectiles/core.js';

const g = 9.8;

describe('the moving launcher', () => {
  it('catches its own ball when the cart keeps a steady speed', () => {
    // Fired up at 9.8 m/s, the ball is in the air for 2 s. The cart covers 8 m, and so does the ball.
    const c = { cartSpeed: 4, launchSpeed: 9.8, cartAccel: 0, g };
    const l = cartLanding(c);
    expect(l.time).toBeCloseTo(2, 10);
    expect(l.ballX).toBeCloseTo(8, 10);
    expect(l.offset).toBeCloseTo(0, 10);
    expect(l.height).toBeCloseTo(4.9, 10);
  });

  it('keeps the ball directly above the cart the whole time', () => {
    const c = { cartSpeed: 4, launchSpeed: 9.8, cartAccel: 0, g };
    for (const t of [0.3, 1, 1.7]) expect(ballPosition(c, t).x).toBeCloseTo(cartPosition(c, t), 10);
  });

  it('drops it behind a cart that speeds up, by exactly ½ a t²', () => {
    const c = { cartSpeed: 4, launchSpeed: 9.8, cartAccel: 1.5, g };
    const l = cartLanding(c);
    expect(l.offset).toBeCloseTo(-0.5 * 1.5 * 4, 10);
  });

  it('lands it in front of a cart that brakes', () => {
    expect(cartLanding({ cartSpeed: 4, launchSpeed: 9.8, cartAccel: -1, g }).offset).toBeGreaterThan(0);
  });
});

describe('dropped and thrown', () => {
  it('keeps the two balls at the same height at every instant', () => {
    for (const t of [0.2, 0.9, 1.4]) {
      const { dropped, thrown } = dropAndThrow(10, 6, g, t);
      expect(thrown.y).toBeCloseTo(dropped.y, 12);
      expect(dropped.x).toBe(0);
      expect(thrown.x).toBeCloseTo(6 * t, 12);
    }
  });

  it('lands them together, whatever the throwing speed', () => {
    expect(timeToGround(10, 0, g)).toBeCloseTo(Math.sqrt(20 / 9.8), 12);
  });
});

describe('the falling target', () => {
  const base = (over: Partial<Shot>): Shot => ({
    angle: 0,
    speed: 30,
    origin: { x: 0, y: 0 },
    target: { x: 30, y: 15 },
    g,
    drops: true,
    radius: 0.6,
    ...over,
  });

  it('hits when aimed straight at the target, however hard it is thrown', () => {
    const aim = aimAngle({ x: 0, y: 0 }, { x: 30, y: 15 });
    for (const speed of [20, 30, 60]) {
      const out = resolveShot(base({ angle: aim, speed }));
      expect(out.kind).toBe('hit');
      expect(out.distance).toBeLessThan(1e-9);
    }
  });

  it('has both fall the same ½ g t² below their no-gravity paths', () => {
    const s = base({ angle: aimAngle({ x: 0, y: 0 }, { x: 30, y: 15 }), speed: 30 });
    const t = 0.8;
    const noGravityBall = {
      x: 30 * Math.cos((s.angle * Math.PI) / 180) * t,
      y: 30 * Math.sin((s.angle * Math.PI) / 180) * t,
    };
    expect(noGravityBall.y - shotBall(s, t).y).toBeCloseTo(0.5 * g * t * t, 10);
    expect(15 - shotTarget(s, t).y).toBeCloseTo(0.5 * g * t * t, 10);
  });

  it('misses when the thrower aims above to allow for the drop', () => {
    // The instinct to "aim high" is exactly wrong: the target is falling too.
    const out = resolveShot(base({ angle: aimAngle({ x: 0, y: 0 }, { x: 30, y: 15 }) + 5, speed: 30 }));
    expect(out.kind).not.toBe('hit');
  });

  it('is too slow below the minimum speed: the ball reaches the ground first', () => {
    const vmin = minimumSpeed({ x: 0, y: 0 }, { x: 30, y: 15 }, g);
    // Distance √1125 ≈ 33.5 m, fall time √(30/9.8) ≈ 1.75 s, so about 19.2 m/s.
    expect(vmin).toBeCloseTo(Math.sqrt(1125) / Math.sqrt(30 / 9.8), 10);
    const aim = aimAngle({ x: 0, y: 0 }, { x: 30, y: 15 });
    // Both fall equally, and a slow ball's no-gravity point is still below the target's start,
    // so the BALL is the one that runs out of height: it lands before the target does.
    expect(resolveShot(base({ angle: aim, speed: vmin * 0.9 })).kind).toBe('ball-landed');
    expect(resolveShot(base({ angle: aim, speed: vmin * 1.05 })).kind).toBe('hit');
  });

  it('misses a target that does not fall, if aimed straight at it', () => {
    // Without the drop, aiming straight at a parked target undershoots: the ball alone falls.
    const out = resolveShot(
      base({ angle: aimAngle({ x: 0, y: 0 }, { x: 30, y: 15 }), speed: 30, drops: false }),
    );
    expect(out.kind).not.toBe('hit');
  });

  it('hits straight on in a world without gravity, where nothing falls', () => {
    const out = resolveShot(base({ angle: aimAngle({ x: 0, y: 0 }, { x: 30, y: 15 }), speed: 30, g: 0 }));
    expect(out.kind).toBe('hit');
  });
});
