import { __exportAll } from "../../_virtual/_rolldown/runtime.mjs";
import { approxEq, gcd, toDeg, toRad } from "../../core/util.mjs";

//#region src/math/trig/core.ts
/**
* Trig TEACHING kernel. Stage's expr engine already EVALUATES sin/cos/tan
* numerically (and plots / differentiates / LaTeX-renders them) — so this layer
* adds only the things that engine has no notion of, the parts a learner actually
* struggles with:
*   • exact special-angle values (sin30 = ½, not 0.4999…),
*   • the QUADRANT + CAST sign rule (where sin/cos/tan are + / −),
*   • the reference angle (the acute angle to the x-axis),
*   • a degree → exact-radian multiple of π.
*
* Pure, reuses core/util's toRad/toDeg/gcd/approxEq. Numerically safe: tan at 90°
* / 270° is reported as "undefined", never ±∞.
*/
var core_exports = /* @__PURE__ */ __exportAll({
	TRIG_FNS: () => TRIG_FNS,
	castLetter: () => castLetter,
	castPositive: () => castPositive,
	evalTrig: () => evalTrig,
	exactTex: () => exactTex,
	isSpecial: () => isSpecial,
	normDeg: () => normDeg,
	quadrant: () => quadrant,
	radTex: () => radTex,
	referenceAngleDeg: () => referenceAngleDeg,
	sign: () => sign,
	toDeg: () => toDeg,
	toRad: () => toRad
});
const TRIG_FNS = [
	"sin",
	"cos",
	"tan"
];
/** Coterminal angle folded into [0, 360). */
const normDeg = (deg) => (deg % 360 + 360) % 360;
/** Numeric value (degrees in). tan where cos = 0 → NaN (undefined), not ±∞. */
function evalTrig(fn, deg) {
	const r = toRad(normDeg(deg));
	if (fn === "sin") return Math.sin(r);
	if (fn === "cos") return Math.cos(r);
	return approxEq(Math.cos(r), 0) ? NaN : Math.tan(r);
}
/** Quadrant 1..4 of the terminal ray; 0 when it lies ON an axis (0/90/180/270). */
function quadrant(deg) {
	const a = normDeg(deg);
	if (a === 0 || a === 90 || a === 180 || a === 270) return 0;
	if (a < 90) return 1;
	if (a < 180) return 2;
	if (a < 270) return 3;
	return 4;
}
/** Reference angle: the acute angle (0..90°) between the terminal ray and the
*  x-axis — the angle whose exact value you actually look up. */
function referenceAngleDeg(deg) {
	const a = normDeg(deg);
	if (a <= 90) return a;
	if (a <= 180) return 180 - a;
	if (a <= 270) return a - 180;
	return 360 - a;
}
/** Sign of a trig function at an angle: 1, −1, 0, or NaN (undefined). The CAST
*  rule made literal (it is just the sign of x = cos, y = sin in each quadrant). */
function sign(fn, deg) {
	const v = evalTrig(fn, deg);
	if (!Number.isFinite(v)) return NaN;
	return approxEq(v, 0) ? 0 : Math.sign(v);
}
/** The CAST mnemonic: which of sin/cos/tan are POSITIVE in this quadrant.
*  Q1 All · Q2 Sin · Q3 Tan · Q4 Cos. (On an axis, falls back to actual signs.) */
function castPositive(deg) {
	const q = quadrant(deg);
	if (q === 1) return [
		"sin",
		"cos",
		"tan"
	];
	if (q === 2) return ["sin"];
	if (q === 3) return ["tan"];
	if (q === 4) return ["cos"];
	return TRIG_FNS.filter((fn) => sign(fn, deg) > 0);
}
/** The CAST letter shown in a quadrant: A (all), S (sin), T (tan), C (cos). */
const castLetter = (deg) => ({
	1: "A",
	2: "S",
	3: "T",
	4: "C",
	0: "·"
})[quadrant(deg)];
/** Magnitudes at the base reference angles; sign is applied per quadrant. */
const BASE = {
	0: {
		sin: "0",
		cos: "1",
		tan: "0"
	},
	30: {
		sin: "\\tfrac12",
		cos: "\\tfrac{\\sqrt3}{2}",
		tan: "\\tfrac{1}{\\sqrt3}"
	},
	45: {
		sin: "\\tfrac{\\sqrt2}{2}",
		cos: "\\tfrac{\\sqrt2}{2}",
		tan: "1"
	},
	60: {
		sin: "\\tfrac{\\sqrt3}{2}",
		cos: "\\tfrac12",
		tan: "\\sqrt3"
	},
	90: {
		sin: "1",
		cos: "0",
		tan: "\\text{undefined}"
	}
};
/** Is `deg` one of the standard special angles (a multiple of 30° or 45°)? */
const isSpecial = (deg) => referenceAngleDeg(deg) in BASE;
/**
* Exact value of a trig function at a SPECIAL angle, as a LaTeX string (with the
* correct quadrant sign), or null if the angle isn't special. e.g.
* exactTex('cos', 150) → "-\tfrac{\sqrt3}{2}".
*/
function exactTex(fn, deg) {
	const row = BASE[referenceAngleDeg(deg)];
	if (!row) return null;
	const base = row[fn];
	if (base === "\\text{undefined}") return base;
	const s = sign(fn, deg);
	if (Number.isNaN(s)) return "\\text{undefined}";
	if (s === 0) return "0";
	return s < 0 && base !== "0" ? `-${base}` : base;
}
/** A degree angle as an exact radian (LaTeX multiple of π), e.g. 30 → "\tfrac{\pi}{6}". */
function radTex(deg) {
	const a = normDeg(deg);
	if (a === 0) return "0";
	const g = gcd(a, 180);
	const p = a / g, q = 180 / g;
	const top = p === 1 ? "\\pi" : `${p}\\pi`;
	return q === 1 ? top : `\\tfrac{${top}}{${q}}`;
}

//#endregion
export { castLetter, castPositive, core_exports, evalTrig, exactTex, isSpecial, normDeg, quadrant, radTex, referenceAngleDeg, sign };