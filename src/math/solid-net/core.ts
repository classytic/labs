/**
 * Solids, without pretending a flat screen is three-dimensional.
 *
 * The four ideas this covers are all taught badly by a drawing of a box in
 * perspective, because the faces you most need to count are the ones hidden round
 * the back. Each mode here is a FLAT view that shows every part at once:
 *
 *   layers   a front elevation of the stack, so volume is "one layer, h times"
 *            and the cubed unit is something you count rather than memorise
 *   net      the solid opened out, so every face is visible and addable
 *   sphere   a side view with r marked, the only honest flat view of a ball
 *   compound two solids joined, with the faces that vanish at the join marked
 *
 * Pure geometry, no React: each mode returns rectangles, circles and labels in
 * one coordinate space, and the component scales them to fit.
 */

export type SolidMode = 'layers' | 'net' | 'sphere' | 'compound';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  /** 'face' is a surface you count, 'body' is the solid, 'lost' vanishes at a join. */
  tone: 'face' | 'body' | 'lost';
  label?: string;
  /** Matching-face family in an opened cuboid net. */
  pair?: 0 | 1 | 2;
}

export interface Dims {
  length: number;
  width: number;
  height: number;
  /** Second solid's height, compound mode. */
  topHeight: number;
  radius: number;
}

export const DEFAULTS: Dims = { length: 5, width: 3, height: 4, topHeight: 2, radius: 3 };

/**
 * Volume as repeated layers.
 *
 * One layer is length × width cubes, one cube deep. Stack `height` of them and
 * the count is l × w × h. Every edge contributed one factor of the unit, which is
 * the whole reason the unit is cubed, and it is countable rather than asserted.
 */
function layers(d: Dims): Box[] {
  const out: Box[] = [];
  for (let i = 0; i < Math.max(1, Math.round(d.height)); i++) {
    out.push({
      x: 0,
      y: i,
      w: d.length,
      h: 1,
      tone: i === 0 ? 'face' : 'body',
      label: i === 0 ? `${d.length} by ${d.width}` : undefined,
    });
  }
  return out;
}

/**
 * The net of a cuboid: six faces, in three matching pairs.
 *
 * Opened out in a cross, every face is visible and its area is readable, so the
 * surface area is an addition rather than an act of imagination. The pairing is
 * the part worth seeing: opposite faces are always equal, so there are only three
 * different rectangles to work out.
 */
function net(d: Dims): Box[] {
  const { length: l, width: w, height: h } = d;
  return [
    { x: w, y: 0, w: l, h: w, tone: 'face', label: 'l × w', pair: 0 },
    { x: 0, y: w, w: w, h: h, tone: 'face', label: 'w × h', pair: 1 },
    { x: w, y: w, w: l, h: h, tone: 'face', label: 'l × h', pair: 2 },
    { x: w + l, y: w, w: w, h: h, tone: 'face', label: 'w × h', pair: 1 },
    { x: w + l + w, y: w, w: l, h: h, tone: 'face', label: 'l × h', pair: 2 },
    { x: w, y: w + h, w: l, h: w, tone: 'face', label: 'l × w', pair: 0 },
  ];
}

/**
 * Two cuboids stacked.
 *
 * The join is what the question is really about: the top face of the lower solid
 * and the base of the upper one are both still there, but neither is on the
 * OUTSIDE any more, so the surface area loses two of them while the volume simply
 * adds. Marking them is the difference between a right answer and a common one.
 */
function compound(d: Dims): Box[] {
  const { length: l, width: w, height: h, topHeight: th } = d;
  const upper = Math.max(1, Math.min(l, Math.round(l * 0.6)));
  return [
    { x: 0, y: th, w: l, h, tone: 'body', label: 'lower' },
    { x: (l - upper) / 2, y: 0, w: upper, h: th, tone: 'body', label: 'upper' },
    // The shared face, drawn as a thin band along the join.
    { x: (l - upper) / 2, y: th - 0.06, w: upper, h: 0.12, tone: 'lost', label: 'joined' },
  ];
}

export interface SolidReadout {
  volume: number;
  surface: number;
  /** What the mode is asking the learner to notice. */
  note: string;
}

export function readout(mode: SolidMode, d: Dims): SolidReadout {
  const { length: l, width: w, height: h, topHeight: th, radius: r } = d;
  switch (mode) {
    case 'layers':
      return {
        volume: l * w * h,
        surface: 2 * (l * w + l * h + w * h),
        note: `${l} by ${w} in one layer, ${h} layers`,
      };
    case 'net':
      return {
        volume: l * w * h,
        surface: 2 * (l * w + l * h + w * h),
        note: 'three different faces, each one twice',
      };
    case 'sphere':
      return {
        volume: (4 / 3) * Math.PI * r ** 3,
        surface: 4 * Math.PI * r ** 2,
        note: 'one radius decides both',
      };
    case 'compound': {
      const upper = Math.max(1, Math.min(l, Math.round(l * 0.6)));
      const lowerV = l * w * h;
      const upperV = upper * w * th;
      const lowerS = 2 * (l * w + l * h + w * h);
      const upperS = 2 * (upper * w + upper * th + w * th);
      // Both joined faces stop being outside surfaces, so each is removed once.
      const hidden = 2 * (upper * w);
      return {
        volume: lowerV + upperV,
        surface: lowerS + upperS - hidden,
        note: `${hidden} of surface disappears at the join`,
      };
    }
  }
}

/** The pieces to draw for `mode`. Sphere is drawn by the component as a circle. */
export function solidPieces(mode: SolidMode, d: Dims = DEFAULTS): Box[] {
  switch (mode) {
    case 'layers':
      return layers(d);
    case 'net':
      return net(d);
    case 'compound':
      return compound(d);
    case 'sphere':
      return [];
  }
}
