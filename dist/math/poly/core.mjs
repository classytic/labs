import { __exportAll } from "../../_virtual/_rolldown/runtime.mjs";
import { ONE, ZERO, abs, add as add$1, cx, div, fromPolar, isFiniteC, mul as mul$1, sub } from "../complex/core.mjs";
import { evaluate } from "@classytic/stage";

//#region src/math/poly/core.ts
/**
* Polynomial core, the canonical single-variable polynomial engine. The clean,
* focused alternative to bolting on a heavy general CAS (Algebrite / nerdamer):
* for the polynomial algebra school actually needs — expand, evaluate,
* differentiate, FACTOR, and SOLVE any degree — a normalised coefficient form
* makes everything fall out.
*
*   • a Poly is just `number[]` ascending: [a0, a1, …, an] = a0 + a1 x + … + an xⁿ.
*   • roots of ANY degree via DURAND–KERNER (Weierstrass) simultaneous iteration,
*     reusing the complex kernel — all n complex roots at once, then snapped to
*     exact rationals where they're clearly nice (so 2, ½, −3 print exact, not
*     1.9999999).
*   • factored form is read straight off the cleaned roots (real → (x−r);
*     complex pair → an irreducible real quadratic).
*
* Numerically safe: Durand–Kerner is capped at MAX_ITER and falls back gracefully;
* coefficient arrays are trimmed; no overflow paths (the complex kernel guards div).
*/
var core_exports = /* @__PURE__ */ __exportAll({
	add: () => add,
	allRoots: () => allRoots,
	deflate: () => deflate,
	degree: () => degree,
	deriv: () => deriv,
	evalC: () => evalC,
	evalPoly: () => evalPoly,
	factorTex: () => factorTex,
	fromAst: () => fromAst,
	mul: () => mul,
	polyTex: () => polyTex,
	solve: () => solve,
	solveEquation: () => solveEquation,
	trim: () => trim
});
const EPS = 1e-9;
const MAX_ITER = 300;
const MAX_DEG = 8;
const trim = (p) => {
	let n = p.length;
	while (n > 1 && Math.abs(p[n - 1]) < 1e-12) n--;
	return p.slice(0, n);
};
const degree = (p) => trim(p).length - 1;
/** Horner evaluation (real). */
function evalPoly(p, x) {
	let s = 0;
	for (let i = p.length - 1; i >= 0; i--) s = s * x + (p[i] ?? 0);
	return s;
}
/** Horner evaluation (complex). */
function evalC(p, z) {
	let s = ZERO;
	for (let i = p.length - 1; i >= 0; i--) s = add$1(mul$1(s, z), cx(p[i] ?? 0));
	return s;
}
/** Derivative polynomial. */
const deriv = (p) => trim(p.slice(1).map((c, i) => c * (i + 1)));
function add(a, b) {
	const n = Math.max(a.length, b.length), o = [];
	for (let i = 0; i < n; i++) o.push((a[i] ?? 0) + (b[i] ?? 0));
	return trim(o);
}
function mul(a, b) {
	const o = new Array(a.length + b.length - 1).fill(0);
	for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) o[i + j] += a[i] * b[j];
	return trim(o);
}
/** Synthetic division of p by (x − r); returns the quotient (assumes r is a root,
*  i.e. drops the remainder). The "divide out a found factor" step. */
function deflate(p, r) {
	const n = p.length - 1;
	if (n < 1) return [0];
	const q = new Array(n).fill(0);
	q[n - 1] = p[n];
	for (let k = n - 2; k >= 0; k--) q[k] = p[k + 1] + r * q[k + 1];
	return trim(q);
}
const tnum = (n) => {
	const r = Math.round(n * 1e6) / 1e6;
	return (Object.is(r, -0) ? 0 : r).toString();
};
/** LaTeX of a polynomial in descending order, e.g. [−6,11,−6,1] → "x^{3} - 6x^{2} + 11x - 6". */
function polyTex(p0, x = "x") {
	const p = trim(p0);
	let out = "";
	for (let d = p.length - 1; d >= 0; d--) {
		const c = p[d];
		if (c === 0) continue;
		const mag = Math.abs(c);
		const t = `${d === 0 ? tnum(mag) : mag === 1 ? "" : tnum(mag)}${d === 0 ? "" : d === 1 ? x : `${x}^{${d}}`}`;
		out += out === "" ? c < 0 ? `-${t}` : t : c < 0 ? ` - ${t}` : ` + ${t}`;
	}
	return out || "0";
}
function hasVar(node, x) {
	switch (node.type) {
		case "var": return node.name === x;
		case "neg": return hasVar(node.arg, x);
		case "binary": return hasVar(node.left, x) || hasVar(node.right, x);
		case "call": return node.args.some((a) => hasVar(a, x));
		default: return false;
	}
}
/** Coefficients of `node` as a polynomial in `x` (other vars from `params`), or
*  null if it isn't a polynomial in x (sin(x), 1/x, fractional power, …). */
function fromAst(node, x = "x", params = {}) {
	if (!hasVar(node, x)) {
		const v = evaluate(node, params);
		return Number.isFinite(v) ? [v] : null;
	}
	switch (node.type) {
		case "var": return [0, 1];
		case "neg": {
			const c = fromAst(node.arg, x, params);
			return c && c.map((k) => -k);
		}
		case "binary": {
			const { op, left, right } = node;
			const L = fromAst(left, x, params);
			if (!L) return null;
			if (op === "+") {
				const R = fromAst(right, x, params);
				return R && add(L, R);
			}
			if (op === "-") {
				const R = fromAst(right, x, params);
				return R && add(L, R.map((k) => -k));
			}
			if (op === "*") {
				const R = fromAst(right, x, params);
				return R && mul(L, R);
			}
			if (op === "/") {
				if (hasVar(right, x)) return null;
				const d = evaluate(right, params);
				return Number.isFinite(d) && d !== 0 ? L.map((k) => k / d) : null;
			}
			if (op === "^") {
				if (hasVar(right, x)) return null;
				const n = evaluate(right, params);
				if (!Number.isInteger(n) || n < 0 || n > MAX_DEG) return null;
				let acc = [1];
				for (let i = 0; i < n; i++) acc = mul(acc, L);
				return acc;
			}
			return null;
		}
		default: return null;
	}
}
/** Snap a near-rational real to its exact value (denominators 1..12), else itself. */
function snapReal(r) {
	for (const d of [
		1,
		2,
		3,
		4,
		5,
		6,
		8,
		10,
		12
	]) {
		const n = Math.round(r * d);
		if (Math.abs(r * d - n) < 1e-7) {
			const v = n / d;
			return Object.is(v, -0) ? 0 : v;
		}
	}
	return Math.round(r * 1e9) / 1e9;
}
const snap = (z) => Math.abs(z.im) < 1e-7 ? {
	re: snapReal(z.re),
	im: 0
} : {
	re: snapReal(z.re),
	im: snapReal(z.im)
};
/**
* All complex roots of `p` via Durand–Kerner simultaneous iteration (then snapped).
* For a degree-n polynomial returns n roots; real roots come back with im = 0.
*/
function allRoots(p0) {
	const p = trim(p0);
	const n = p.length - 1;
	if (n <= 0) return [];
	const lead = p[n];
	const m = p.map((c) => c / lead);
	let z = Array.from({ length: n }, (_, k) => fromPolar(1 + .1 * k / n, 2 * Math.PI * k / n + .6));
	for (let it = 0; it < MAX_ITER; it++) {
		let maxDelta = 0;
		z = z.map((zi, i) => {
			let denom = ONE;
			for (let j = 0; j < n; j++) if (j !== i) denom = mul$1(denom, sub(zi, z[j]));
			const corr = div(evalC(m, zi), denom);
			if (!isFiniteC(corr)) return zi;
			maxDelta = Math.max(maxDelta, abs(corr));
			return sub(zi, corr);
		});
		if (maxDelta < EPS) break;
	}
	const roots = z.map(snap);
	roots.sort((a, b) => a.im === 0 && b.im === 0 ? a.re - b.re : a.im === 0 ? -1 : b.im === 0 ? 1 : a.re - b.re || a.im - b.im);
	return roots;
}
/** Solve p = 0 for ALL roots (any degree up to MAX_DEG). null if degenerate. */
function solve(p0) {
	const p = trim(p0);
	const d = p.length - 1;
	if (d < 1) return null;
	const roots = allRoots(p);
	return {
		poly: p,
		degree: d,
		roots,
		realRoots: roots.filter((r) => r.im === 0).map((r) => r.re)
	};
}
/** Solve an expression-AST equation `expr = 0` for x, any degree. null if not a
*  polynomial in x. (Linear/quadratic also flow through here, exactly.) */
function solveEquation(node, x = "x", params = {}) {
	const p = fromAst(node, x, params);
	return p ? solve(p) : null;
}
const fnum = (n) => {
	const r = Math.round(n * 1e6) / 1e6;
	return (Object.is(r, -0) ? 0 : r).toString().replace(/^-/, "−");
};
/** "(x − r)" with the sign tucked in, and "(x − 0)" → "x". */
const linTex = (r, x) => r === 0 ? x : `(${x} ${r < 0 ? "+" : "−"} ${fnum(Math.abs(r))})`;
/**
* Factored form of the polynomial over the reals: leading coefficient × linear
* factors (real roots, with multiplicity) × irreducible quadratics (complex
* conjugate pairs). e.g. x³−6x²+11x−6 → "(x − 1)(x − 2)(x − 3)".
*/
function factorTex(p0, x = "x") {
	const p = trim(p0);
	const lead = p[p.length - 1] ?? 1;
	const sol = solve(p);
	if (!sol) return fnum(p[0] ?? 0);
	const used = new Array(sol.roots.length).fill(false);
	const parts = [];
	for (let i = 0; i < sol.roots.length; i++) {
		if (used[i]) continue;
		const z = sol.roots[i];
		if (z.im === 0) {
			used[i] = true;
			parts.push(linTex(z.re, x));
			continue;
		}
		used[i] = true;
		const j = sol.roots.findIndex((w, k) => !used[k] && Math.abs(w.re - z.re) < 1e-6 && Math.abs(w.im + z.im) < 1e-6);
		if (j >= 0) used[j] = true;
		const b2 = z.re * z.re + z.im * z.im, two = 2 * z.re;
		const mid = Math.abs(two) < 1e-9 ? "" : ` ${two < 0 ? "+" : "−"} ${fnum(Math.abs(two))}${x}`;
		parts.push(`(${x}^2${mid} ${b2 < 0 ? "−" : "+"} ${fnum(Math.abs(b2))})`);
	}
	const lc = Math.abs(lead - 1) < 1e-9 ? "" : `${fnum(lead)}\\,`;
	return parts.length ? `${lc}${parts.join("")}` : fnum(lead);
}

//#endregion
export { core_exports, deflate, degree, evalPoly, factorTex, fromAst, polyTex, solve, solveEquation, trim };