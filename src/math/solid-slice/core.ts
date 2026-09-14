/**
 * The geometry behind SolidSlice: which right triangle a 3D question is actually about.
 *
 * Students do not fail 3D trigonometry because the trigonometry is hard. They fail it because the
 * triangle is not drawn on the page, and they cannot tell which three of the eight corners to use.
 * Every 4024 question of this kind reduces to one right triangle hiding inside the solid, so that
 * triangle is what this file names, measures and hands back.
 */

export type V3 = readonly [number, number, number];

export type SolidKind = 'cuboid' | 'pyramid';
export type Target = 'face-diagonal' | 'space-diagonal' | 'line-plane-angle';

export interface Dims {
  length: number;
  width: number;
  height: number;
}

/** One right triangle lifted out of a solid, with its sides already named and measured. */
export interface Slice {
  /** The three corners, right angle at `corner`. */
  from: V3;
  corner: V3;
  to: V3;
  /** The leg from `from` to `corner`, and its length. */
  legA: number;
  legALabel: string;
  /** The leg from `corner` to `to`. */
  legB: number;
  legBLabel: string;
  /** The hypotenuse, which is what most of these questions ask for. */
  hyp: number;
  hypLabel: string;
  /** The angle at `from`, in degrees: the one a line-and-plane question wants. */
  angleDeg: number;
  /** What the question is asking for, as a sentence. */
  asks: string;
  /** The value being asked for, so the status line and the checkpoint agree. */
  value: number;
  /** Whether that value is a length or an angle, which decides its unit. */
  valueKind: 'length' | 'angle';
}

/** The eight corners of a cuboid, or the five of a square-based pyramid, base first. */
export function corners(kind: SolidKind, d: Dims): V3[] {
  const { length: L, width: W, height: H } = d;
  const base: V3[] = [
    [0, 0, 0],
    [L, 0, 0],
    [L, W, 0],
    [0, W, 0],
  ];
  if (kind === 'pyramid') return [...base, [L / 2, W / 2, H]];
  return [
    ...base,
    [0, 0, H],
    [L, 0, H],
    [L, W, H],
    [0, W, H],
  ];
}

/** Index pairs to stroke, so the solid reads as a solid rather than a cloud of points. */
export function edges(kind: SolidKind): readonly (readonly [number, number])[] {
  const base = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ] as const;
  if (kind === 'pyramid') {
    return [...base, [0, 4], [1, 4], [2, 4], [3, 4]] as const;
  }
  return [
    ...base,
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ] as const;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * The right triangle a given question hides.
 *
 * All three targets share one chain, which is the point worth teaching: the face diagonal is found
 * first, and the space diagonal and the line-plane angle are both built ON it. A learner who sees
 * that the second triangle stands on the hypotenuse of the first has understood 3D trigonometry.
 */
export function sliceFor(kind: SolidKind, d: Dims, target: Target): Slice {
  const { length: L, width: W, height: H } = d;
  const apexH = kind === 'pyramid' ? H : H;

  // The base diagonal, shared by every target: right angle at the base corner (L, 0, 0).
  const faceDiag = Math.hypot(L, W);

  if (target === 'face-diagonal') {
    return {
      from: [0, 0, 0],
      corner: [L, 0, 0],
      to: [L, W, 0],
      legA: L,
      legALabel: 'length',
      legB: W,
      legBLabel: 'width',
      hyp: faceDiag,
      hypLabel: 'face diagonal',
      angleDeg: (Math.atan2(W, L) * 180) / Math.PI,
      asks: 'the diagonal across the base',
      value: round2(faceDiag),
      valueKind: 'length',
    };
  }

  /**
   * Both remaining targets stand the SAME triangle on the base diagonal: horizontal leg is that
   * diagonal, vertical leg is the height, and the right angle sits where the height meets the base.
   * For a pyramid the vertical rises from the centre, so the horizontal leg is half the diagonal.
   */
  const horizontal = kind === 'pyramid' ? faceDiag / 2 : faceDiag;
  const cornerPt: V3 = kind === 'pyramid' ? [L / 2, W / 2, 0] : [L, W, 0];
  const topPt: V3 = kind === 'pyramid' ? [L / 2, W / 2, apexH] : [L, W, apexH];
  const hyp = Math.hypot(horizontal, apexH);
  const angleDeg = (Math.atan2(apexH, horizontal) * 180) / Math.PI;

  if (target === 'space-diagonal') {
    return {
      from: [0, 0, 0],
      corner: cornerPt,
      to: topPt,
      legA: horizontal,
      legALabel: kind === 'pyramid' ? 'half the diagonal' : 'face diagonal',
      legB: apexH,
      legBLabel: 'height',
      hyp,
      hypLabel: kind === 'pyramid' ? 'slant edge' : 'space diagonal',
      angleDeg,
      asks: kind === 'pyramid' ? 'the slant edge to the apex' : 'the diagonal through the solid',
      value: round2(hyp),
      valueKind: 'length',
    };
  }

  return {
    from: [0, 0, 0],
    corner: cornerPt,
    to: topPt,
    legA: horizontal,
    legALabel: kind === 'pyramid' ? 'half the diagonal' : 'face diagonal',
    legB: apexH,
    legBLabel: 'height',
    hyp,
    hypLabel: kind === 'pyramid' ? 'slant edge' : 'space diagonal',
    angleDeg,
    asks: 'the angle between that line and the base',
    value: round2(angleDeg),
    valueKind: 'angle',
  };
}
