/**
 * Interception: where a chaser must run to catch something that is moving.
 *
 * A tiger that runs at a deer runs at where the deer WAS. By the time it arrives the deer has
 * gone. The catch comes from running to where the deer WILL be, and relative velocity is the
 * idea that finds that point: in the deer's own frame the deer stands still, and the tiger moves
 * with velocity v_tiger − v_deer. For a catch, that relative velocity must point straight at the
 * deer. Everything else follows from one quadratic.
 *
 * The other strategy, chasing (always turning to face the deer), also catches a slower deer, but
 * along a curve that is longer and slower. With a limited sprint, that difference decides it.
 *
 * Pure functions, so every claim a lesson makes can be tested. Metres and seconds, headings in
 * degrees anticlockwise from east.
 */

export interface Vec {
  x: number;
  y: number;
}

const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
const scale = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
const dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y;
const len = (a: Vec): number => Math.hypot(a.x, a.y);

/** A unit vector along a heading in degrees. */
export const headingVector = (deg: number): Vec => ({
  x: Math.cos((deg * Math.PI) / 180),
  y: Math.sin((deg * Math.PI) / 180),
});

export const headingOf = (v: Vec): number => (Math.atan2(v.y, v.x) * 180) / Math.PI;

export interface Chase {
  /** Where the chaser starts. */
  chaser: Vec;
  /** The chaser's running speed, m/s. */
  chaserSpeed: number;
  /** Where the quarry starts. */
  quarry: Vec;
  /** The quarry's velocity, which it keeps. */
  quarryVelocity: Vec;
  /** How close counts as a catch, m. */
  catchRadius: number;
  /** How long the chaser can sprint, s. */
  stamina: number;
}

export interface Intercept {
  time: number;
  point: Vec;
  heading: number;
}

/**
 * The straight run that meets the quarry, if one exists.
 *
 * Meeting at time t needs |r₀ + v_q t| = s t, where r₀ is the quarry's start relative to the
 * chaser. Squaring gives (v_q·v_q − s²) t² + 2 (r₀·v_q) t + r₀·r₀ = 0. The earliest positive root
 * is the catch; the heading points from the chaser to the quarry's position at that time.
 */
export function intercept(c: Chase): Intercept | null {
  const r0 = sub(c.quarry, c.chaser);
  const a = dot(c.quarryVelocity, c.quarryVelocity) - c.chaserSpeed * c.chaserSpeed;
  const b = 2 * dot(r0, c.quarryVelocity);
  const k = dot(r0, r0);
  let time: number | null = null;
  if (Math.abs(a) < 1e-12) {
    // Equal speeds: the quadratic is linear, and a catch needs the quarry to be coming closer.
    if (b < 0) time = -k / b;
  } else {
    const disc = b * b - 4 * a * k;
    if (disc >= 0) {
      const roots = [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)].filter((t) => t > 0);
      if (roots.length) time = Math.min(...roots);
    }
  }
  if (time === null) return null;
  const point = add(c.quarry, scale(c.quarryVelocity, time));
  return { time, point, heading: headingOf(sub(point, c.chaser)) };
}

export interface RunResult {
  caught: boolean;
  /** When the catch happened, or when the run ended. */
  time: number;
  /** The closest the two came. */
  closest: number;
  /** The chaser's path, sampled. */
  path: Vec[];
  /** The quarry's path over the same times. */
  quarryPath: Vec[];
  /** Why the run ended without a catch, if it did. */
  reason?: 'stamina' | 'passed';
}

/**
 * A straight run on a fixed heading. In the quarry's frame both move in straight lines, so the
 * relative motion is a straight line too and its nearest point has a formula: no search needed.
 */
export function straightRun(c: Chase, heading: number, samples = 60): RunResult {
  const vChaser = scale(headingVector(heading), c.chaserSpeed);
  const r0 = sub(c.quarry, c.chaser);
  const w = sub(c.quarryVelocity, vChaser); // the quarry's velocity relative to the chaser
  const ww = dot(w, w);
  const tStar = ww === 0 ? 0 : Math.max(0, Math.min(c.stamina, -dot(r0, w) / ww));
  const closest = len(add(r0, scale(w, tStar)));
  let time = tStar;
  let caught = closest <= c.catchRadius;
  if (caught) {
    // The first moment the gap closes to the catch radius, from |r₀ + w t| = R.
    const b = 2 * dot(r0, w),
      k = dot(r0, r0) - c.catchRadius * c.catchRadius;
    const disc = b * b - 4 * ww * k;
    time = disc >= 0 && ww > 0 ? Math.max(0, (-b - Math.sqrt(disc)) / (2 * ww)) : tStar;
    caught = time <= c.stamina;
  }
  const end = caught ? time : c.stamina;
  const path: Vec[] = [],
    quarryPath: Vec[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (end * i) / samples;
    path.push(add(c.chaser, scale(vChaser, t)));
    quarryPath.push(add(c.quarry, scale(c.quarryVelocity, t)));
  }
  return {
    caught,
    time: end,
    closest,
    path,
    quarryPath,
    reason: caught ? undefined : tStar < c.stamina ? 'passed' : 'stamina',
  };
}

/**
 * Pure pursuit: the chaser always runs straight at where the quarry is now. Integrated in small
 * steps, because the path is a curve with no simple formula in general.
 */
export function chaseRun(c: Chase, dt = 0.01): RunResult {
  let p = { ...c.chaser };
  const path: Vec[] = [p],
    quarryPath: Vec[] = [c.quarry];
  let closest = len(sub(c.quarry, p));
  const stride = Math.max(1, Math.round(0.1 / dt));
  let steps = 0;
  for (let t = dt; t <= c.stamina + 1e-9; t += dt) {
    const q = add(c.quarry, scale(c.quarryVelocity, t - dt));
    const gap = sub(q, p);
    const d = len(gap);
    if (d <= c.catchRadius) {
      path.push(p);
      quarryPath.push(q);
      return { caught: true, time: t - dt, closest: d, path, quarryPath };
    }
    p = add(p, scale(gap, (c.chaserSpeed * dt) / d));
    closest = Math.min(closest, d);
    if (++steps % stride === 0) {
      path.push(p);
      quarryPath.push(add(c.quarry, scale(c.quarryVelocity, t)));
    }
  }
  const qEnd = add(c.quarry, scale(c.quarryVelocity, c.stamina));
  path.push(p);
  quarryPath.push(qEnd);
  return {
    caught: false,
    time: c.stamina,
    closest: Math.min(closest, len(sub(qEnd, p))),
    path,
    quarryPath,
    reason: 'stamina',
  };
}

/** The chaser's velocity relative to the quarry: what the quarry sees coming at it. */
export const relativeVelocity = (c: Chase, heading: number): Vec =>
  sub(scale(headingVector(heading), c.chaserSpeed), c.quarryVelocity);

/**
 * How far, in degrees, the relative velocity points away from the line of sight to the quarry.
 * Zero is a collision course: seen from the quarry, the chaser is coming straight at it.
 */
export function offCourse(c: Chase, heading: number): number {
  const rel = relativeVelocity(c, heading);
  const sight = sub(c.quarry, c.chaser);
  let d = headingOf(rel) - headingOf(sight);
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}
