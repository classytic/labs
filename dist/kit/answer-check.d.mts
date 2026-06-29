//#region src/kit/answer-check.d.ts
/**
 * answer-check, the "is the student right?" layer of the interactive-problem
 * engine. Pure, built on @classytic/stage's expr engine. Two real modes (the ones
 * exams need): a NUMBER (value within tolerance, parsed so `pi/2` or `2*sqrt(5)`
 * count) and an EXPRESSION (any algebraically-EQUIVALENT form accepted, checked
 * BOTH symbolically, simplify(student − answer) → 0, AND numerically by sampling,
 * so `(x+1)(x+2)` ≡ `x^2+3x+2`). No hand-marking, no "exact-string" brittleness.
 */
/** Evaluate a numeric answer string (`3.14`, `pi/2`, `2*sqrt(5)`) → number (NaN if invalid). */
declare function parseValue(raw: string): number;
/** Numeric match with a relative-ish tolerance (default ~1% of scale). */
declare function checkNumber(student: number, value: number, tol?: number): boolean;
interface ExprCheckOpts {
  /** Variables to sample (defaults to the union of both sides' free vars). */
  vars?: string[];
  /** Sampling domain for the numeric pass. */
  domain?: [number, number];
  tol?: number;
  samples?: number;
}
/** True if `student` is algebraically equivalent to `answer` (symbolic OR numeric). */
declare function checkExpression(student: string, answer: string, opts?: ExprCheckOpts): boolean;
type AnswerSpec = {
  kind: 'number';
  value: number;
  tol?: number;
} | {
  kind: 'expression';
  value: string;
  vars?: string[];
  domain?: [number, number];
  tol?: number;
};
/** Check a raw student string against an authored answer spec. */
declare function checkAnswer(spec: AnswerSpec, raw: string): boolean;
//#endregion
export { AnswerSpec, ExprCheckOpts, checkAnswer, checkExpression, checkNumber, parseValue };