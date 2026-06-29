import { compileExpr, parseExpr, simplify } from "@classytic/stage";

//#region src/kit/answer-check.ts
/**
* answer-check, the "is the student right?" layer of the interactive-problem
* engine. Pure, built on @classytic/stage's expr engine. Two real modes (the ones
* exams need): a NUMBER (value within tolerance, parsed so `pi/2` or `2*sqrt(5)`
* count) and an EXPRESSION (any algebraically-EQUIVALENT form accepted, checked
* BOTH symbolically, simplify(student − answer) → 0, AND numerically by sampling,
* so `(x+1)(x+2)` ≡ `x^2+3x+2`). No hand-marking, no "exact-string" brittleness.
*/
/** Compile, returning the usable form or null (never the error union). */
function tryCompile(src) {
	const c = compileExpr(src);
	if (c.error !== void 0) return null;
	return c;
}
/** Evaluate a numeric answer string (`3.14`, `pi/2`, `2*sqrt(5)`) → number (NaN if invalid). */
function parseValue(raw) {
	const c = tryCompile(normalizeMathInput(raw));
	return c ? c.fn({}) : NaN;
}
/**
* Make exam-natural input parse: accept implicit multiplication (`2x` → `2*x`,
* `)(` → `)*(`) and a leading `y =` (`y = 2x − 3` → `2*x - 3`). Conservative , 
* never inserts `*` before `(` after a letter, so function calls like `sin(x)`
* survive. Unicode minus → ascii.
*/
const SUPERSCRIPT = {
	"⁰": "0",
	"¹": "1",
	"²": "2",
	"³": "3",
	"⁴": "4",
	"⁵": "5",
	"⁶": "6",
	"⁷": "7",
	"⁸": "8",
	"⁹": "9"
};
function normalizeMathInput(raw) {
	let s = raw.trim().replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/");
	s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => "^" + [...m].map((ch) => SUPERSCRIPT[ch]).join(""));
	s = s.replace(/\*\*/g, "^");
	s = s.replace(/\s+/g, "");
	s = s.replace(/^y=/i, "");
	s = s.replace(/(\d)([a-zA-Z(])/g, "$1*$2");
	s = s.replace(/\)([a-zA-Z0-9(])/g, ")*$1");
	return s;
}
/** Numeric match with a relative-ish tolerance (default ~1% of scale). */
function checkNumber(student, value, tol = .01) {
	if (!Number.isFinite(student) || !Number.isFinite(value)) return false;
	return Math.abs(student - value) <= tol * Math.max(1, Math.abs(value));
}
const isZeroNode = (n, eps = 1e-9) => n.type === "num" && Math.abs(n.value) < eps;
/** True if `student` is algebraically equivalent to `answer` (symbolic OR numeric). */
function checkExpression(student, answer, opts = {}) {
	const a = tryCompile(normalizeMathInput(student));
	const b = tryCompile(normalizeMathInput(answer));
	if (!a || !b) return false;
	try {
		if (isZeroNode(simplify(parseExpr(`(${normalizeMathInput(student)}) - (${normalizeMathInput(answer)})`)), opts.tol ?? 1e-9)) return true;
	} catch {}
	const vars = opts.vars ?? [...new Set([...a.vars, ...b.vars])];
	const [lo, hi] = opts.domain ?? [-3.3, 3.7];
	const tol = opts.tol ?? 1e-6;
	const samples = opts.samples ?? 32;
	const PHI = .6180339887498949;
	const R2 = .4142135623730951;
	let finite = 0;
	for (let i = 0; i < samples; i++) {
		const scope = {};
		vars.forEach((v, j) => {
			scope[v] = lo + (hi - lo) * (((i + 1) * PHI + (j + 1) * R2) % 1);
		});
		const ya = a.fn(scope);
		const yb = b.fn(scope);
		if (!Number.isFinite(ya) || !Number.isFinite(yb)) continue;
		finite++;
		if (Math.abs(ya - yb) > tol * Math.max(1, Math.abs(ya), Math.abs(yb))) return false;
	}
	return finite >= 5;
}
/** Check a raw student string against an authored answer spec. */
function checkAnswer(spec, raw) {
	if (!raw || !raw.trim()) return false;
	if (spec.kind === "number") return checkNumber(parseValue(raw), spec.value, spec.tol);
	return checkExpression(raw, spec.value, spec);
}

//#endregion
export { checkAnswer, checkExpression, checkNumber, parseValue };