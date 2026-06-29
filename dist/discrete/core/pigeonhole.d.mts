//#region src/discrete/core/pigeonhole.d.ts
/**
 * Pigeonhole kernel, the certainty math behind "guarantee ≠ likely". With more
 * pigeons than holes some hole holds ≥ ⌈n/k⌉. The lab's adversary deals the
 * worst case; these functions say exactly when a collision is FORCED.
 */
/** The guaranteed max occupancy: ⌈pigeons / holes⌉. */
declare function guaranteedOccupancy(pigeons: number, holes: number): number;
/** Fewest draws that FORCE a repeat across `holes` categories (k+1). */
declare function minToGuaranteePair(holes: number): number;
/** Fewest pigeons that force some hole to reach `occupancy`:
 *  holes·(occupancy−1) + 1 (the adversary fills every hole to occupancy−1 first). */
declare function minForOccupancy(holes: number, occupancy: number): number;
//#endregion
export { guaranteedOccupancy, minForOccupancy, minToGuaranteePair };