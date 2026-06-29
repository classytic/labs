//#region src/discrete/core/pigeonhole.ts
/**
* Pigeonhole kernel, the certainty math behind "guarantee ≠ likely". With more
* pigeons than holes some hole holds ≥ ⌈n/k⌉. The lab's adversary deals the
* worst case; these functions say exactly when a collision is FORCED.
*/
/** The guaranteed max occupancy: ⌈pigeons / holes⌉. */
function guaranteedOccupancy(pigeons, holes) {
	if (holes <= 0) return Infinity;
	return Math.ceil(pigeons / holes);
}
/** Fewest draws that FORCE a repeat across `holes` categories (k+1). */
function minToGuaranteePair(holes) {
	return holes + 1;
}
/** Fewest pigeons that force some hole to reach `occupancy`:
*  holes·(occupancy−1) + 1 (the adversary fills every hole to occupancy−1 first). */
function minForOccupancy(holes, occupancy) {
	if (holes <= 0 || occupancy <= 0) return NaN;
	return holes * (occupancy - 1) + 1;
}

//#endregion
export { guaranteedOccupancy, minForOccupancy, minToGuaranteePair };