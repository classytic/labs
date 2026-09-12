/**
 * Three-figure bearings, and the journey that turns them into a triangle.
 *
 * Bearings are on every O Level and IGCSE paper and appear nowhere in our courses. They are also
 * the topic where a learner who is fluent in trigonometry still loses marks, for a reason that has
 * nothing to do with trigonometry: a bearing is measured CLOCKWISE FROM NORTH, and every other
 * angle they have ever met is measured anticlockwise from the x-axis. Those two conventions differ
 * by a reflection as well as a rotation, so intuition transfers backwards. Making the conversion
 * explicit, in one place, is most of what this file is for.
 *
 *   maths angle t (anticlockwise from East)  <->  bearing b (clockwise from North)
 *   b = 90 - t   and   t = 90 - b            (mod 360, and the sign flip is the reflection)
 *
 * The other half is that a two-leg journey is a triangle whose third side is the direct distance
 * home. That is the cosine rule (see math/oblique-triangle), which is why bearings questions are
 * usually where the cosine rule is actually examined rather than in a bare triangle.
 */

export interface Point {
  east: number;
  north: number;
}

/** One leg of a journey: go this far, on this bearing. */
export interface Leg {
  bearing: number;
  distance: number;
}

/** Fold any angle into [0, 360). */
export const norm360 = (deg: number): number => ((deg % 360) + 360) % 360;

/**
 * A bearing printed the way an examiner requires it: always three figures, always with the degree
 * sign. "45°" is marked wrong where "045°" is right, which is a mark lost to formatting alone, so
 * the lab shows the correct form everywhere rather than leaving it to a footnote.
 */
export function formatBearing(deg: number): string {
  const shown = Math.round(norm360(deg) * 10) / 10;
  // Pad the WHOLE-degree part to three figures, then re-attach any decimal. Padding the finished
  // decimal string instead would turn 45.5 into "45.5" and then "045.5" only by luck of length.
  const whole = Math.trunc(shown);
  const decimals = shown === whole ? '' : `.${Math.round((shown - whole) * 10)}`;
  return `${String(whole).padStart(3, '0')}${decimals}°`;
}

/** Where you arrive after travelling `distance` on `bearing`. */
export function legEnd(start: Point, bearing: number, distance: number): Point {
  const rad = (norm360(bearing) * Math.PI) / 180;
  // Sine against East and cosine against North, which is the swap that catches people: on a bearing
  // the angle is measured from the NORTH axis, so the roles of sin and cos are exchanged.
  return {
    east: start.east + distance * Math.sin(rad),
    north: start.north + distance * Math.cos(rad),
  };
}

/** The bearing you would steer to get from one point to another. */
export function bearingBetween(from: Point, to: Point): number {
  const dEast = to.east - from.east;
  const dNorth = to.north - from.north;
  if (dEast === 0 && dNorth === 0) return 0;
  // atan2(east, north), not the usual atan2(y, x): the arguments are swapped for the same reason
  // sin and cos are swapped above.
  return norm360((Math.atan2(dEast, dNorth) * 180) / Math.PI);
}

/**
 * The bearing back the way you came.
 *
 * Add 180 if the bearing is less than 180, subtract 180 otherwise, which `norm360` does in one
 * step. Worth its own function because "the bearing of A from B" and "the bearing of B from A" are
 * routinely swapped in a question's wording, and a candidate who does not notice answers a
 * different question correctly.
 */
export const backBearing = (bearing: number): number => norm360(bearing + 180);

/** Every point visited, starting point included, so a route can be drawn as a polyline. */
export function journey(start: Point, legs: readonly Leg[]): Point[] {
  const points = [start];
  for (const leg of legs) points.push(legEnd(points.at(-1)!, leg.bearing, leg.distance));
  return points;
}

export interface Resultant {
  distance: number;
  bearing: number;
  /** The bearing to steer to get back to the start, which is what a rescue question asks for. */
  homeBearing: number;
}

/**
 * The single leg equivalent to the whole journey: how far, and on what bearing.
 *
 * This is the answer to "how far is the ship from the port, and on what bearing", the standard
 * closing part of a bearings question. Computed from the end points rather than by the cosine rule,
 * because that keeps it correct for any number of legs, but the two agree for two legs and the lab
 * shows the cosine-rule form alongside so the learner sees the method they must write down.
 */
export function resultant(start: Point, legs: readonly Leg[]): Resultant {
  const end = journey(start, legs).at(-1)!;
  return {
    distance: Math.hypot(end.east - start.east, end.north - start.north),
    bearing: bearingBetween(start, end),
    homeBearing: bearingBetween(end, start),
  };
}

/**
 * The angle INSIDE the triangle at the turning point of a two-leg journey.
 *
 * This is the number a candidate must find before the cosine rule is any use, and finding it is the
 * actual difficulty of the question: it is not either bearing, and it is not their difference in
 * general. It is the angle between the incoming leg reversed and the outgoing leg, which is why the
 * back bearing has to be worked out first.
 */
export function turnAngle(first: Leg, second: Leg): number {
  const incoming = backBearing(first.bearing);
  const between = norm360(incoming - second.bearing);
  // An interior angle is at most a straight line, so take whichever way round is the smaller.
  return between > 180 ? 360 - between : between;
}

/** Authoring mistakes worth catching before a learner meets them. */
export function bearingProblems(legs: readonly Leg[]): string[] {
  const problems: string[] = [];
  if (legs.length < 1) problems.push('a journey needs at least one leg');
  for (const [i, leg] of legs.entries()) {
    if (leg.distance <= 0) problems.push(`leg ${i + 1} has a distance that is zero or negative`);
    if (!Number.isFinite(leg.bearing)) problems.push(`leg ${i + 1} has no bearing`);
  }
  return problems;
}
