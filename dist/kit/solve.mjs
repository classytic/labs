import { toStr } from "../math/complex/core.mjs";
import { fromAst, trim } from "../math/poly/core.mjs";

//#region src/kit/solve.ts
const cleanNum = (n) => {
	const r = Math.round(n * 1e9) / 1e9;
	return Object.is(r, -0) ? 0 : r;
};
/** Coefficients [a0, a1, …] of `node` as a polynomial in `x` (the canonical poly
*  engine does the extraction). null if it isn't polynomial in x. */
const polyCoeffs = fromAst;
/** Solve `node` = 0 for x exactly (degree 1 or 2). null if not a usable polynomial. */
function solvePoly(node, x = "x", params = {}) {
	const raw = polyCoeffs(node, x, params);
	if (!raw) return null;
	const coeffs = trim(raw);
	const degree = coeffs.length - 1;
	if (degree === 1) {
		const a0 = coeffs[0], a1 = coeffs[1];
		const r = cleanNum(-a0 / a1);
		return {
			coeffs,
			degree,
			roots: [{
				re: r,
				im: 0
			}],
			realRoots: [r]
		};
	}
	if (degree === 2) {
		const c0 = coeffs[0], c1 = coeffs[1], c2 = coeffs[2];
		const disc = c1 * c1 - 4 * c2 * c0;
		const twoA = 2 * c2;
		if (disc >= 0) {
			const s = Math.sqrt(disc);
			const real = [cleanNum((-c1 - s) / twoA), cleanNum((-c1 + s) / twoA)].sort((u, v) => u - v);
			return {
				coeffs,
				degree,
				discriminant: disc,
				roots: real.map((r) => ({
					re: r,
					im: 0
				})),
				realRoots: real
			};
		}
		const s = Math.sqrt(-disc), re = cleanNum(-c1 / twoA), im = cleanNum(s / twoA);
		return {
			coeffs,
			degree,
			discriminant: disc,
			roots: [{
				re,
				im: -im
			}, {
				re,
				im
			}],
			realRoots: []
		};
	}
	return null;
}
/** "x = 2 or x = −2" (complex when needed), or "no real solutions" framing. */
function solutionTex(sol, x = "x") {
	if (sol.roots.length === 1) return `${x} = ${toStr(sol.roots[0])}`;
	const [r1, r2] = sol.roots;
	if (r1 && r2 && r1.re === r2.re && r1.im === r2.im) return `${x} = ${toStr(r1)} \\text{ (repeated)}`;
	return `${x} = ${toStr(r1)} \\text{ or } ${x} = ${toStr(r2)}`;
}

//#endregion
export { polyCoeffs, solutionTex, solvePoly };