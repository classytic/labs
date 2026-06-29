//#region src/commerce/economics/core.ts
const demandP = (d, q) => d.intercept - d.slope * q;
const supplyP = (s, q) => s.intercept + s.slope * q;
const demandQ = (d, p) => Math.max(0, (d.intercept - p) / d.slope);
const supplyQ = (s, p) => Math.max(0, (p - s.intercept) / s.slope);
/** Where Qd = Qs, the market-clearing price + quantity. */
function equilibrium(d, s) {
	const q = (d.intercept - s.intercept) / (d.slope + s.slope);
	return {
		q,
		p: s.intercept + s.slope * q
	};
}
/**
* Point price-elasticity of demand at price `p` on a linear demand curve,
* returned as a magnitude. |E| = (P/Q)·(1/b) since dQ/dP = −1/b. Elastic > 1,
* unit = 1, inelastic < 1.
*/
function pointElasticity(d, p) {
	const q = demandQ(d, p);
	if (q <= 1e-9) return Infinity;
	return p / q * (1 / d.slope);
}

//#endregion
export { demandP, demandQ, equilibrium, pointElasticity, supplyP, supplyQ };