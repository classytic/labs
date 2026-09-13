/**
 * The radian, defined by laying the radius along the rim.
 *
 * A radian is normally introduced as a conversion factor: multiply by pi over 180.
 * That teaches the arithmetic and hides the idea, which is that an angle can be
 * measured in radii of arc rather than in degrees. So this models the physical act:
 * take a piece of string as long as the radius, lay it round the circumference, and
 * count. The count IS the angle, and the answer 6.28 stops being a number to recall.
 *
 * Everything here is pure, so the interesting claims (six whole radii fit with 0.28
 * left over; the count does not depend on the radius) are testable without a DOM.
 */

export interface Pt {
  x: number;
  y: number;
}

/** One laid-down radius: the arc it covers, and whether it is a whole one. */
export interface Band {
  /** Where this band starts and ends, in radians from the positive x axis. */
  from: number;
  to: number;
  /** 1 for a complete radius, less for the part-radius at the end. */
  fraction: number;
  /** 1-based index, for labelling. */
  index: number;
}

export const TAU = Math.PI * 2;

/** Degrees in one radian, to the precision a learner will see. */
export const DEG_PER_RAD = 180 / Math.PI;

/**
 * Split an angle into the whole radii laid so far plus the remainder.
 *
 * The bands are what makes the count visible: six full ones and a short stub is a
 * picture a learner can hold, where "6.283185" is not.
 */
export function bands(laid: number): Band[] {
  const out: Band[] = [];
  const total = Math.max(0, laid);
  let placed = 0;
  let index = 1;
  while (placed < total - 1e-9) {
    const span = Math.min(1, total - placed);
    out.push({ from: placed, to: placed + span, fraction: span, index });
    placed += span;
    index += 1;
  }
  return out;
}

/** How many WHOLE radii have been laid. The headline count. */
export const wholeRadii = (laid: number): number => Math.floor(laid + 1e-9);

/** A point on the circle at `angle`, in figure coordinates (y already flipped). */
export function onCircle(centre: Pt, r: number, angle: number): Pt {
  return { x: centre.x + r * Math.cos(angle), y: centre.y - r * Math.sin(angle) };
}

/** Sample an arc so it can be drawn as a polyline. */
export function arcPoints(centre: Pt, r: number, from: number, to: number, steps = 48): Pt[] {
  const pts: Pt[] = [];
  const n = Math.max(2, Math.ceil((Math.abs(to - from) / TAU) * steps) + 1);
  for (let i = 0; i <= n; i++) pts.push(onCircle(centre, r, from + ((to - from) * i) / n));
  return pts;
}

export interface Readout {
  /** The angle laid so far, in radians. Equals arc length divided by radius. */
  radians: number;
  degrees: number;
  /** Arc length in the same units as the radius. */
  arc: number;
  /** Whole radii laid, and the leftover fraction of one. */
  whole: number;
  remainder: number;
  /** True once the rim is closed, within a hair. */
  closed: boolean;
}

export function readout(laid: number, radius: number): Readout {
  const radians = Math.max(0, laid);
  return {
    radians,
    degrees: radians * DEG_PER_RAD,
    // The whole point: arc = angle x radius, so angle = arc / radius.
    arc: radians * radius,
    whole: wholeRadii(radians),
    remainder: radians - wholeRadii(radians),
    closed: Math.abs(radians - TAU) < 1e-6,
  };
}
