//#region src/discrete/core/sets.ts
const dedupe = (xs) => [...new Set(xs)];
function union(a, b) {
	return dedupe([...a, ...b]);
}
function intersection(a, b) {
	const bs = new Set(b);
	return dedupe(a.filter((x) => bs.has(x)));
}
function difference(a, b) {
	const bs = new Set(b);
	return dedupe(a.filter((x) => !bs.has(x)));
}
function symmetricDifference(a, b) {
	return union(difference(a, b), difference(b, a));
}
/** Aᶜ within a universe. */
function complement(a, universe) {
	return difference(universe, a);
}
function isSubset(a, b) {
	const bs = new Set(b);
	return dedupe(a).every((x) => bs.has(x));
}
function setEqual(a, b) {
	return isSubset(a, b) && isSubset(b, a);
}
/** All 2^|a| subsets. */
function powerset(a) {
	const s = dedupe(a);
	const out = [[]];
	for (const x of s) {
		const len = out.length;
		for (let i = 0; i < len; i++) out.push([...out[i], x]);
	}
	return out;
}
function cartesian(a, b) {
	const out = [];
	for (const x of a) for (const y of b) out.push([x, y]);
	return out;
}

//#endregion
export { cartesian, complement, difference, intersection, isSubset, powerset, setEqual, symmetricDifference, union };