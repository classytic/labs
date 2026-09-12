/**
 * Cut-and-rearrange: where every area formula actually comes from.
 *
 * A learner is told that a triangle is half its rectangle, that a parallelogram
 * "is really a rectangle", and that a circle's area is πr². Each of those is a
 * REARRANGEMENT: cut the shape up, move the pieces without stretching them, and
 * a shape whose area you already know appears. Nothing is created or destroyed,
 * which is the whole argument, and it is the one thing a static diagram cannot
 * show because the motion IS the proof.
 *
 * Pure geometry, no React: every mode returns the same thing, a list of pieces at
 * a parameter t from 0 (original shape) to 1 (rearranged), so the component only
 * has to draw polygons.
 */

export type RearrangeMode = 'triangle' | 'parallelogram' | 'trapezium' | 'circle';

export type Pt = readonly [number, number];

export interface Piece {
  points: Pt[];
  /** 'whole' is the shape being cut up; 'moved' is a piece that travels. */
  tone: 'whole' | 'moved';
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Rotate a point about a centre by `rad`. SVG y runs down, which only mirrors
 *  the visual direction of the turn and never the area, so no sign correction. */
function rotate(p: Pt, c: Pt, rad: number): Pt {
  const s = Math.sin(rad);
  const cs = Math.cos(rad);
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * cs - dy * s, c[1] + dx * s + dy * cs];
}

const shift = (p: Pt, dx: number, dy: number): Pt => [p[0] + dx, p[1] + dy];

export interface RearrangeOpts {
  /** Base of the triangle/parallelogram/trapezium, or the diameter box for a circle. */
  base: number;
  height: number;
  /** Triangle apex offset, or parallelogram/trapezium lean. */
  lean: number;
  /** Top parallel side, trapezium only. */
  top: number;
  /** Sectors a circle is cut into. Even, so the row alternates cleanly. */
  sectors: number;
}

export const DEFAULTS: RearrangeOpts = { base: 8, height: 5, lean: 2, top: 4, sectors: 12 };

/**
 * A triangle is half the rectangle that contains it.
 *
 * The two leftover corners each rotate a half turn about the midpoint of the
 * triangle's own slanted side, and land exactly on top of the triangle. Two
 * copies of the leftover fill the triangle, so the triangle is half the box.
 */
function triangle(t: number, o: RearrangeOpts): Piece[] {
  const { base: b, height: h, lean } = o;
  const apex: Pt = [Math.max(0, Math.min(b, lean)), 0];
  const tri: Pt[] = [[0, h], apex, [b, h]];

  const leftPivot: Pt = [(0 + apex[0]) / 2, (h + 0) / 2];
  const rightPivot: Pt = [(apex[0] + b) / 2, (0 + h) / 2];
  const left: Pt[] = [[0, 0], apex, [0, h]];
  const right: Pt[] = [apex, [b, 0], [b, h]];

  const turn = Math.PI * t;
  return [
    { points: tri, tone: 'whole' },
    { points: left.map((p) => rotate(p, leftPivot, turn)), tone: 'moved' },
    { points: right.map((p) => rotate(p, rightPivot, -turn)), tone: 'moved' },
  ];
}

/**
 * A parallelogram is a rectangle with one triangle moved from end to end.
 *
 * Cut straight down at the lean, carry that triangle across to the far side, and
 * the base and the height never changed, so the area is base times height.
 */
function parallelogram(t: number, o: RearrangeOpts): Piece[] {
  const { base: b, height: h, lean } = o;
  const s = Math.max(0, Math.min(b - 1, lean));
  const body: Pt[] = [
    [s, 0],
    [s + b, 0],
    [b, h],
    [s, h],
  ];
  const cut: Pt[] = [
    [s, 0],
    [s, h],
    [0, h],
  ];
  // The cut-off triangle travels exactly one base length to close the rectangle.
  return [
    { points: body, tone: 'whole' },
    { points: cut.map((p) => shift(p, lerp(0, b, t), 0)), tone: 'moved' },
  ];
}

/**
 * Two trapezia make a parallelogram of base (a + b).
 *
 * The second copy turns a half turn about the midpoint of the sloping side, so
 * the pair has base a + b and height h, and one trapezium is half of that.
 */
function trapezium(t: number, o: RearrangeOpts): Piece[] {
  const { base: b, height: h, lean, top } = o;
  const a = Math.max(1, Math.min(b, top));
  const c = Math.max(0, Math.min(b - a, lean));
  const shape: Pt[] = [
    [c, 0],
    [c + a, 0],
    [b, h],
    [0, h],
  ];
  const pivot: Pt = [(c + a + b) / 2, h / 2];
  return [
    { points: shape, tone: 'whole' },
    { points: shape.map((p) => rotate(p, pivot, Math.PI * t)), tone: 'moved' },
  ];
}

/**
 * A circle cut into sectors closes into a rectangle.
 *
 * Every sector keeps its radius, so the rearranged height is r. Half the arcs lie
 * along the top and half along the bottom, so the width is half the circumference,
 * πr. Area = πr × r = πr². The more sectors, the straighter the edges get, which
 * is the first limit argument most learners ever meet.
 */
function circle(t: number, o: RearrangeOpts): Piece[] {
  const n = Math.max(4, Math.round(o.sectors / 2) * 2);
  const r = o.height / 2;
  const step = (Math.PI * 2) / n;
  const cx = o.base / 2;
  const cy = o.height / 2;
  const rowWidth = Math.PI * r;
  const out: Piece[] = [];

  for (let i = 0; i < n; i++) {
    // Local wedge: apex at the origin, bisector pointing up the -y axis.
    const local: Pt[] = [[0, 0]];
    const arcSteps = 6;
    for (let k = 0; k <= arcSteps; k++) {
      const ang = -Math.PI / 2 + (-step / 2 + (step * k) / arcSteps);
      local.push([r * Math.cos(ang), r * Math.sin(ang)]);
    }

    // Where the wedge sits in the circle, and where it sits in the row.
    const circleTurn = step * i + step / 2 + Math.PI / 2;
    const up = i % 2 === 0;
    const rowTurn = up ? 0 : Math.PI;
    const pairIndex = Math.floor(i / 2);
    const slot = (rowWidth / (n / 2)) * (pairIndex + (up ? 0.5 : 1));
    const rowX = cx - rowWidth / 2 + slot;
    const rowY = up ? cy + r / 2 : cy - r / 2;

    const turn = lerp(circleTurn, rowTurn, t);
    const px = lerp(cx, rowX, t);
    const py = lerp(cy, rowY, t);
    out.push({
      points: local.map((p) => shift(rotate(p, [0, 0], turn), px, py)),
      tone: i % 2 === 0 ? 'whole' : 'moved',
    });
  }
  return out;
}

/** The pieces of `mode` at rearrangement parameter `t`, from 0 to 1. */
export function rearrange(mode: RearrangeMode, t: number, opts: RearrangeOpts = DEFAULTS): Piece[] {
  const clamped = Math.max(0, Math.min(1, t));
  switch (mode) {
    case 'triangle':
      return triangle(clamped, opts);
    case 'parallelogram':
      return parallelogram(clamped, opts);
    case 'trapezium':
      return trapezium(clamped, opts);
    case 'circle':
      return circle(clamped, opts);
  }
}

/** The area the rearrangement is proving, and the formula it lands on. */
export function areaOf(mode: RearrangeMode, o: RearrangeOpts = DEFAULTS): { value: number; formula: string } {
  const r = o.height / 2;
  switch (mode) {
    case 'triangle':
      return { value: (o.base * o.height) / 2, formula: 'half of base times height' };
    case 'parallelogram':
      return { value: o.base * o.height, formula: 'base times height' };
    case 'trapezium':
      return {
        value: ((Math.min(o.base, o.top) + o.base) * o.height) / 2,
        formula: 'half of the two parallel sides, times height',
      };
    case 'circle':
      return { value: Math.PI * r * r, formula: 'pi times radius squared' };
  }
}
