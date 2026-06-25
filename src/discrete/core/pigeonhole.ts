/**
 * Pigeonhole kernel — the certainty math behind "guarantee ≠ likely". With more
 * pigeons than holes some hole holds ≥ ⌈n/k⌉. The lab's adversary deals the
 * worst case; these functions say exactly when a collision is FORCED.
 */

/** The guaranteed max occupancy: ⌈pigeons / holes⌉. */
export function guaranteedOccupancy(pigeons: number, holes: number): number {
  if (holes <= 0) return Infinity;
  return Math.ceil(pigeons / holes);
}

/** Fewest draws that FORCE a repeat across `holes` categories (k+1). */
export function minToGuaranteePair(holes: number): number {
  return holes + 1;
}

/** Fewest pigeons that force some hole to reach `occupancy`:
 *  holes·(occupancy−1) + 1 (the adversary fills every hole to occupancy−1 first). */
export function minForOccupancy(holes: number, occupancy: number): number {
  if (holes <= 0 || occupancy <= 0) return NaN;
  return holes * (occupancy - 1) + 1;
}
