/**
 * Lines in space: the vector algebra behind Cambridge 9709 Pure Mathematics 3, topic 3.7.
 *
 * Everything a learner meets in two dimensions has a trap waiting in three. Two lines in a plane
 * that are not parallel must meet; two lines in space usually do not. A drawing on paper cannot
 * show the difference, because the projection of two skew lines crosses exactly as two meeting
 * lines do. The lab exists to make that difference visible, and this file is the arithmetic that
 * decides it, kept free of React so every claim a lesson makes about it can be tested.
 *
 * Conventions follow the syllabus: z is up, a line is r = a + t b with a a position vector on the
 * line and b its direction, and angles are in degrees.
 */

export type V3 = readonly [number, number, number];

export interface Line3 {
  /** A position vector of one point on the line (the syllabus's a). */
  point: V3;
  /** The direction vector (the syllabus's b). Must not be the zero vector. */
  direction: V3;
}

export const add = (u: V3, v: V3): V3 => [u[0] + v[0], u[1] + v[1], u[2] + v[2]];
export const sub = (u: V3, v: V3): V3 => [u[0] - v[0], u[1] - v[1], u[2] - v[2]];
export const scale = (u: V3, k: number): V3 => [u[0] * k, u[1] * k, u[2] * k];
export const dot = (u: V3, v: V3): number => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
export const cross = (u: V3, v: V3): V3 => [
  u[1] * v[2] - u[2] * v[1],
  u[2] * v[0] - u[0] * v[2],
  u[0] * v[1] - u[1] * v[0],
];
export const norm = (u: V3): number => Math.hypot(u[0], u[1], u[2]);
export const unit = (u: V3): V3 => {
  const n = norm(u);
  return n === 0 ? [0, 0, 0] : scale(u, 1 / n);
};

/** The point on the line at parameter t. */
export const pointAt = (line: Line3, t: number): V3 => add(line.point, scale(line.direction, t));

/**
 * The angle between two directions, from a · b = |a| |b| cos θ.
 *
 * `acute` gives the angle between two LINES, which the syllabus always wants acute: reversing a
 * direction vector describes the same line but turns θ into 180° − θ, so a line has no preferred
 * sense and the smaller angle is the answer.
 */
export function angleBetween(u: V3, v: V3, acute = false): number {
  const d = norm(u) * norm(v);
  if (d === 0) return Number.NaN;
  const c = Math.max(-1, Math.min(1, dot(u, v) / d));
  const deg = (Math.acos(c) * 180) / Math.PI;
  return acute && deg > 90 ? 180 - deg : deg;
}

export type Relation = 'intersect' | 'skew' | 'parallel' | 'same';

export interface LinePair {
  relation: Relation;
  /** The acute angle between the two directions, in degrees. 0 for parallel lines. */
  angle: number;
  /** The shortest distance between the lines. 0 when they meet or coincide. */
  distance: number;
  /** The parameters of the closest points: l1 at s, l2 at t. For parallel lines, s = 0. */
  s: number;
  t: number;
  /** The closest pair of points, one on each line. They coincide when the lines meet. */
  closest: [V3, V3];
  /** The point of intersection, only when the lines meet at a single point. */
  point: V3 | null;
}

/**
 * How two lines stand relative to each other.
 *
 * The exam method solves two of the three component equations for s and t and then tests the
 * third: if it holds, the lines meet, and if not, they are skew. That test is exact on exam
 * numbers and fragile on anything else, so the classification here uses the closest approach
 * instead, which gives the same verdict and also says HOW FAR apart skew lines are, the quantity
 * the lab draws. With w = a₁ − a₂, the closest points solve the two conditions that the joining
 * segment is perpendicular to both directions.
 */
export function relate(l1: Line3, l2: Line3): LinePair {
  const u = l1.direction,
    v = l2.direction,
    w = sub(l1.point, l2.point);
  const A = dot(u, u),
    B = dot(u, v),
    C = dot(v, v),
    D = dot(u, w),
    E = dot(v, w);
  const size = Math.max(1, norm(l1.point), norm(l2.point));
  const across = norm(cross(u, v));
  // Parallel exactly when u × v = 0. Compare against the sizes involved, not an absolute 0, so a
  // direction like (1000, 0, 0) is judged by the same standard as (1, 0, 0).
  if (across <= 1e-9 * Math.sqrt(A * C)) {
    const gap = norm(cross(w, u)) / Math.sqrt(A);
    const t = E / C;
    return {
      relation: gap <= 1e-9 * size ? 'same' : 'parallel',
      angle: 0,
      distance: gap,
      s: 0,
      t,
      closest: [l1.point, pointAt(l2, t)],
      point: null,
    };
  }
  const denom = A * C - B * B;
  const s = (B * E - C * D) / denom;
  const t = (A * E - B * D) / denom;
  const p = pointAt(l1, s),
    q = pointAt(l2, t);
  const distance = norm(sub(p, q));
  const meets = distance <= 1e-9 * size;
  return {
    relation: meets ? 'intersect' : 'skew',
    angle: angleBetween(u, v, true),
    distance: meets ? 0 : distance,
    s,
    t,
    closest: [p, q],
    point: meets ? p : null,
  };
}

export interface Foot {
  /** The parameter of the foot of the perpendicular. */
  t: number;
  foot: V3;
  /** The perpendicular distance from the point to the line. */
  distance: number;
}

/**
 * The foot of the perpendicular from a point P to a line, and the distance to it.
 *
 * The foot F is the point on the line where PF is perpendicular to the direction, so
 * (a + t b − p) · b = 0, which gives t = (p − a) · b ÷ (b · b). That one scalar-product condition
 * is the whole method; the lab lets a learner slide along the line and watch PF · b pass through
 * zero exactly where |PF| is smallest.
 */
export function footOfPerpendicular(p: V3, line: Line3): Foot {
  const b = line.direction;
  const t = dot(sub(p, line.point), b) / dot(b, b);
  const foot = pointAt(line, t);
  return { t, foot, distance: norm(sub(p, foot)) };
}

/**
 * The parameter range for which the line lies inside a sphere of radius R about the origin.
 *
 * The drawing shows a line as a finite segment, and a sphere keeps its reach the same from every
 * viewing angle, so the picture does not change size as it is turned. Returns null when the line
 * passes entirely outside the sphere.
 */
export function clipToSphere(line: Line3, R: number): [number, number] | null {
  const a = line.point,
    b = line.direction;
  const A = dot(b, b),
    B = 2 * dot(a, b),
    C = dot(a, a) - R * R;
  const disc = B * B - 4 * A * C;
  if (A === 0 || disc <= 0) return null;
  const root = Math.sqrt(disc);
  return [(-B - root) / (2 * A), (-B + root) / (2 * A)];
}

export interface Projected {
  /** Screen right, in world units. */
  x: number;
  /** Screen up, in world units. */
  y: number;
  /** Distance into the screen: larger is further from the viewer. */
  depth: number;
}

/**
 * An orthographic view with z up.
 *
 * `yaw` turns the scene about the vertical axis and `pitch` tilts the viewer up above the ground,
 * both in degrees. At yaw 0 and pitch 0 the viewer looks along +y, so x runs to the right and z up;
 * a positive pitch looks down from above, which is what makes the ground plane visible at all.
 */
export function project(p: V3, yawDeg: number, pitchDeg: number): Projected {
  const yaw = (yawDeg * Math.PI) / 180,
    pitch = (pitchDeg * Math.PI) / 180;
  const x1 = p[0] * Math.cos(yaw) - p[1] * Math.sin(yaw);
  const y1 = p[0] * Math.sin(yaw) + p[1] * Math.cos(yaw);
  const z1 = p[2];
  return {
    x: x1,
    y: y1 * Math.sin(pitch) + z1 * Math.cos(pitch),
    depth: y1 * Math.cos(pitch) - z1 * Math.sin(pitch),
  };
}

/**
 * Where two drawn segments cross ON SCREEN, with the parameter along each. Null if they do not.
 *
 * This is not a 3D intersection: skew lines cross on screen all the time. It is what the picture
 * needs in order to draw the nearer line over the further one at that crossing, which is how a
 * flat drawing shows that two lines pass one another without meeting.
 */
export function screenCrossing(
  p1: readonly [number, number],
  p2: readonly [number, number],
  q1: readonly [number, number],
  q2: readonly [number, number],
): { u: number; v: number; at: [number, number] } | null {
  const rx = p2[0] - p1[0],
    ry = p2[1] - p1[1],
    sx = q2[0] - q1[0],
    sy = q2[1] - q1[1];
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-12) return null;
  const u = ((q1[0] - p1[0]) * sy - (q1[1] - p1[1]) * sx) / den;
  const v = ((q1[0] - p1[0]) * ry - (q1[1] - p1[1]) * rx) / den;
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  return { u, v, at: [p1[0] + u * rx, p1[1] + u * ry] };
}

/** Round for display, dropping a spurious −0 and trailing zeros. */
export function fmt(n: number, digits = 2): string {
  const r = Number(n.toFixed(digits));
  return (Object.is(r, -0) ? 0 : r).toString();
}

export const fmtVec = (u: V3, digits = 2): string => `(${u.map((c) => fmt(c, digits)).join(', ')})`;

/**
 * What an author can get wrong that would leave the lab drawing nonsense.
 *
 * A zero direction vector is not a line at all, and a line that never enters the drawing sphere
 * would leave the learner staring at an empty frame while the readout describes something unseen.
 */
export function lineProblems(lines: readonly Line3[], R: number): string[] {
  const out: string[] = [];
  lines.forEach((line, i) => {
    const name = `line ${i + 1}`;
    if (norm(line.direction) === 0) out.push(`${name} has a zero direction vector`);
    else if (!clipToSphere(line, R)) out.push(`${name} does not pass within ${R} of the origin`);
  });
  return out;
}
