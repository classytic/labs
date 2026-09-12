/**
 * Projectiles seen from more than one place: the arithmetic behind the moving launcher and the
 * falling target.
 *
 * Both labs rest on one fact, the one Galileo argued and every projectile question quietly uses:
 * gravity acts only downwards, so it changes the vertical motion and leaves the horizontal motion
 * alone. A ball fired straight up from a cart keeps the cart's horizontal speed, so it comes back
 * down into the cart. A stone aimed straight at a coconut that drops at the moment of firing hits
 * it, because both fall the same ½gt² below the paths they would have taken without gravity.
 *
 * Kept free of React so every claim a lesson makes about it can be tested. Units are SI throughout,
 * with y measured upwards from the ground.
 */

export const G_EARTH = 9.8;

export interface Vec {
  x: number;
  y: number;
}

/** Position at time t of a body launched from p0 with velocity v0 under gravity g. */
export function ballistic(p0: Vec, v0: Vec, g: number, t: number): Vec {
  return { x: p0.x + v0.x * t, y: p0.y + v0.y * t - 0.5 * g * t * t };
}

/**
 * The time at which a body launched from height h0 with upward speed vy reaches the ground, the
 * positive root of h0 + vy t − ½ g t² = 0. Returns Infinity when there is no gravity to bring it
 * down and it is moving upwards or level.
 */
export function timeToGround(h0: number, vy: number, g: number): number {
  if (g <= 0) return vy < 0 ? h0 / -vy : Number.POSITIVE_INFINITY;
  return (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g;
}

// ── the moving launcher ─────────────────────────────────────────────────────────

export interface CartLaunch {
  /** The cart's speed at the moment of launch, m/s. */
  cartSpeed: number;
  /** The ball's upward launch speed relative to the cart, m/s. */
  launchSpeed: number;
  /** The cart's acceleration AFTER launch, m/s². Zero is the classic demonstration. */
  cartAccel: number;
  g: number;
}

export interface CartLanding {
  /** Time until the ball is back at launch height. */
  time: number;
  /** Where the ball comes down, measured along the ground from the launch point. */
  ballX: number;
  /** Where the cart is at that moment. */
  cartX: number;
  /** ballX − cartX: positive means the ball lands in front of the cart, negative behind it. */
  offset: number;
  /** The highest point the ball reaches above the launcher. */
  height: number;
}

export const cartPosition = (c: CartLaunch, t: number): number => c.cartSpeed * t + 0.5 * c.cartAccel * t * t;

/** The ball in the GROUND frame: the cart's horizontal speed, plus its own vertical launch. */
export const ballPosition = (c: CartLaunch, t: number): Vec =>
  ballistic({ x: 0, y: 0 }, { x: c.cartSpeed, y: c.launchSpeed }, c.g, t);

/**
 * Where the ball comes down relative to the cart.
 *
 * The ball keeps the cart's speed at the instant of launch, and nothing after that. So a cart that
 * keeps a steady speed catches it, and a cart that speeds up after firing runs out from under it by
 * exactly ½ a t², the only part of the cart's motion the ball did not share.
 */
export function cartLanding(c: CartLaunch): CartLanding {
  const time = c.g > 0 ? (2 * c.launchSpeed) / c.g : Number.POSITIVE_INFINITY;
  const ballX = c.cartSpeed * time;
  const cartX = cartPosition(c, time);
  return {
    time,
    ballX,
    cartX,
    offset: ballX - cartX,
    height: c.g > 0 ? (c.launchSpeed * c.launchSpeed) / (2 * c.g) : Number.POSITIVE_INFINITY,
  };
}

// ── dropped and thrown ──────────────────────────────────────────────────────────

/**
 * One ball dropped and one thrown sideways from the same height at the same moment. Their heights
 * agree at every instant, because the sideways speed has no vertical part; so they land together.
 */
export function dropAndThrow(
  height: number,
  throwSpeed: number,
  g: number,
  t: number,
): { dropped: Vec; thrown: Vec } {
  return {
    dropped: ballistic({ x: 0, y: height }, { x: 0, y: 0 }, g, t),
    thrown: ballistic({ x: 0, y: height }, { x: throwSpeed, y: 0 }, g, t),
  };
}

// ── the falling target ──────────────────────────────────────────────────────────

export interface Shot {
  /** Launch angle above the horizontal, degrees. */
  angle: number;
  /** Launch speed, m/s. */
  speed: number;
  /** Where the launcher is. */
  origin: Vec;
  /** Where the target starts. */
  target: Vec;
  g: number;
  /** Whether the target is released at the moment of firing. */
  drops: boolean;
  /** How close counts as a hit, in metres. */
  radius: number;
}

export interface ShotOutcome {
  kind: 'hit' | 'miss' | 'target-landed' | 'ball-landed';
  /** The time of the closest approach, or of the hit. */
  time: number;
  /** The closest the ball came to the target. */
  distance: number;
  /** How far each had fallen below its no-gravity path at that time: ½ g t². */
  drop: number;
  /** The time the target reaches the ground, if it falls. */
  targetGroundTime: number;
}

export const launchVelocity = (s: Pick<Shot, 'angle' | 'speed'>): Vec => {
  const a = (s.angle * Math.PI) / 180;
  return { x: s.speed * Math.cos(a), y: s.speed * Math.sin(a) };
};

export const shotBall = (s: Shot, t: number): Vec => ballistic(s.origin, launchVelocity(s), s.g, t);

export const shotTarget = (s: Shot, t: number): Vec =>
  s.drops ? ballistic(s.target, { x: 0, y: 0 }, s.g, t) : { x: s.target.x, y: s.target.y };

/** The angle that points the launcher straight at the target's starting position. */
export function aimAngle(origin: Vec, target: Vec): number {
  return (Math.atan2(target.y - origin.y, target.x - origin.x) * 180) / Math.PI;
}

/**
 * Where the shot ends up.
 *
 * The trick that makes this exact: subtract the target's motion from the ball's. When the target
 * falls, both carry the same −½gt², so it cancels and the ball moves in a STRAIGHT line relative to
 * the target. The closest approach is then a straight line's nearest point, with no parabola to
 * search. That cancellation is also the physics: aimed straight at the target, the relative path
 * points straight at it, and gravity cannot spoil the aim.
 */
export function resolveShot(s: Shot): ShotOutcome {
  const v = launchVelocity(s);
  const targetGroundTime = s.drops ? timeToGround(s.target.y, 0, s.g) : Number.POSITIVE_INFINITY;
  const ballGroundTime = timeToGround(s.origin.y, v.y, s.g);
  const end = Math.min(targetGroundTime, ballGroundTime);
  // Relative position r(t) = r0 + w t (+ −½gt² in y when the target stays put).
  const r0 = { x: s.origin.x - s.target.x, y: s.origin.y - s.target.y };
  let time: number;
  if (s.drops) {
    const ww = v.x * v.x + v.y * v.y;
    time = ww === 0 ? 0 : Math.max(0, Math.min(end, -(r0.x * v.x + r0.y * v.y) / ww));
  } else {
    // A parked target: the relative path is the ball's own parabola, so sample it finely.
    time = 0;
    let best = Number.POSITIVE_INFINITY;
    const steps = 4000;
    const horizon = Number.isFinite(end) ? end : 20;
    for (let i = 0; i <= steps; i++) {
      const t = (horizon * i) / steps;
      const b = shotBall(s, t);
      const d = Math.hypot(b.x - s.target.x, b.y - s.target.y);
      if (d < best) {
        best = d;
        time = t;
      }
    }
  }
  const b = shotBall(s, time),
    tg = shotTarget(s, time);
  const distance = Math.hypot(b.x - tg.x, b.y - tg.y);
  const drop = 0.5 * s.g * time * time;
  let kind: ShotOutcome['kind'] = distance <= s.radius ? 'hit' : 'miss';
  // A near miss decided by the ground, not the aim: say which body got there first.
  if (kind === 'miss' && Math.abs(time - end) < 1e-9 && Number.isFinite(end)) {
    kind = targetGroundTime <= ballGroundTime ? 'target-landed' : 'ball-landed';
  }
  return { kind, time, distance, drop, targetGroundTime };
}

/**
 * The slowest launch that still reaches the target before it hits the ground, when aimed straight
 * at it. Along the line of sight the ball closes the gap at its full speed, so it needs to cover
 * the starting distance within the target's fall time.
 *
 * Below this speed it is the BALL that lands first, not the target. Both have fallen the same
 * ½gt² by any moment, and a slow ball's no-gravity point is still below the target's starting
 * height, so the ball runs out of height first. A lesson that says "the coconut lands first" is
 * wrong, and the test suite holds that line.
 */
export function minimumSpeed(origin: Vec, target: Vec, g: number): number {
  const distance = Math.hypot(target.x - origin.x, target.y - origin.y);
  return distance / timeToGround(target.y, 0, g);
}
