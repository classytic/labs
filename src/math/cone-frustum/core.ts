/**
 * A frustum is what is left when a cone has a smaller cone cut off the top, parallel to the base.
 *
 * Every exam question about one is really a question about similarity. The small cone removed from
 * the top is SIMILAR to the whole cone, so one ratio k describes it completely: its radius is kR,
 * its height is kH, its slant is kL, and its volume is k³ of the whole. The frustum is then the
 * subtraction, and there is no frustum formula to remember.
 *
 * The numbers live here, away from the drawing, because the surprising one is arithmetic rather
 * than visual: cutting halfway up by height removes only an eighth of the volume.
 */

export interface ConeDims {
  /** Base radius of the whole cone. */
  radius: number;
  /** Vertical height of the whole cone, apex above the centre of the base. */
  height: number;
}

export interface FrustumParts {
  /** The similarity ratio of the removed top cone: its radius over the whole cone's radius. */
  k: number;
  /** Height of the cut above the base. */
  cut: number;
  topRadius: number;
  topHeight: number;
  fullVolume: number;
  topVolume: number;
  frustumVolume: number;
  fullSlant: number;
  topSlant: number;
  /** The sloping edge of the frustum itself, which is the difference of the two slants. */
  frustumSlant: number;
  /** Share of the whole cone's volume carried away in the top piece. This is k³. */
  removedShare: number;
}

const coneVolume = (r: number, h: number): number => (Math.PI * r * r * h) / 3;

/**
 * Describe the two pieces for a cut made `cut` above the base.
 *
 * The ratio is derived from the cut rather than taken as input, because the cut is the thing a
 * learner can point at on the drawing. Everything else follows from similar triangles.
 */
export function frustumParts({ radius, height }: ConeDims, cut: number): FrustumParts {
  const c = Math.min(Math.max(cut, 0), height);
  const topHeight = height - c;
  const k = height === 0 ? 0 : topHeight / height;
  const topRadius = radius * k;
  const fullVolume = coneVolume(radius, height);
  const topVolume = coneVolume(topRadius, topHeight);
  const fullSlant = Math.hypot(radius, height);
  const topSlant = fullSlant * k;
  return {
    k,
    cut: c,
    topRadius,
    topHeight,
    fullVolume,
    topVolume,
    frustumVolume: fullVolume - topVolume,
    fullSlant,
    topSlant,
    frustumSlant: fullSlant - topSlant,
    removedShare: k * k * k,
  };
}

/**
 * Where to cut so that a given share of the volume is carried away in the top piece.
 *
 * Share = k³, so the cut is the cube root and NOT the share itself. Removing half the volume means
 * cutting at about four fifths of the height, which is the whole point of the exercise.
 */
export function cutForRemovedShare({ height }: ConeDims, share: number): number {
  const s = Math.min(Math.max(share, 0), 1);
  return height * (1 - Math.cbrt(s));
}
