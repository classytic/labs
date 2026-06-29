import { intersection } from "./sets.mjs";

//#region src/discrete/core/inclusionExclusion.ts
function inclusionExclusion(sets) {
	const n = sets.length;
	if (n > 16) throw new Error("inclusionExclusion: too many sets (max 16)");
	const terms = [];
	let unionSize = 0;
	for (let mask = 1; mask < 1 << n; mask++) {
		const indices = [];
		for (let i = 0; i < n; i++) if (mask & 1 << i) indices.push(i);
		let acc = sets[indices[0]];
		for (let j = 1; j < indices.length; j++) acc = intersection(acc, sets[indices[j]]);
		const sign = indices.length % 2 === 1 ? 1 : -1;
		terms.push({
			indices,
			size: acc.length,
			sign
		});
		unionSize += sign * acc.length;
	}
	terms.sort((a, b) => a.indices.length - b.indices.length);
	return {
		unionSize,
		terms
	};
}

//#endregion
export { inclusionExclusion };