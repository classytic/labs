/**
 * answer-check — the "is the student right?" layer of the interactive-problem
 * engine. Pure, built on @classytic/stage's expr engine. Two real modes (the ones
 * exams need): a NUMBER (value within tolerance, parsed so `pi/2` or `2*sqrt(5)`
 * count) and an EXPRESSION (any algebraically-EQUIVALENT form accepted, checked
 * BOTH symbolically — simplify(student − answer) → 0 — AND numerically by sampling,
 * so `(x+1)(x+2)` ≡ `x^2+3x+2`). No hand-marking, no "exact-string" brittleness.
 */

import { compileExpr, parseExpr, simplify, type Node, type CompiledExpr } from '@classytic/stage';

/** Compile, returning the usable form or null (never the error union). */
function tryCompile(src: string): CompiledExpr | null {
  const c = compileExpr(src);
  if (c.error !== undefined) return null;
  return c;
}

/** Evaluate a numeric answer string (`3.14`, `pi/2`, `2*sqrt(5)`) → number (NaN if invalid). */
export function parseValue(raw: string): number {
  const c = tryCompile(raw);
  return c ? c.fn({}) : NaN;
}

/** Numeric match with a relative-ish tolerance (default ~1% of scale). */
export function checkNumber(student: number, value: number, tol = 1e-2): boolean {
  if (!Number.isFinite(student) || !Number.isFinite(value)) return false;
  return Math.abs(student - value) <= tol * Math.max(1, Math.abs(value));
}

const isZeroNode = (n: Node, eps = 1e-9): boolean => n.type === 'num' && Math.abs(n.value) < eps;

export interface ExprCheckOpts {
  /** Variables to sample (defaults to the union of both sides' free vars). */
  vars?: string[];
  /** Sampling domain for the numeric pass. */
  domain?: [number, number];
  tol?: number;
  samples?: number;
}

/** True if `student` is algebraically equivalent to `answer` (symbolic OR numeric). */
export function checkExpression(student: string, answer: string, opts: ExprCheckOpts = {}): boolean {
  const a = tryCompile(student);
  const b = tryCompile(answer);
  if (!a || !b) return false;

  // 1) symbolic: simplify( (student) − (answer) ) collapses to 0
  try {
    if (isZeroNode(simplify(parseExpr(`(${student}) - (${answer})`)), opts.tol ?? 1e-9)) return true;
  } catch { /* fall through to numeric */ }

  // 2) numeric: agree at many varied sample points (skip poles / non-finite)
  const vars = opts.vars ?? [...new Set([...a.vars, ...b.vars])];
  const [lo, hi] = opts.domain ?? [-3.3, 3.7];   // irrational-ish window dodges common poles
  const tol = opts.tol ?? 1e-6;
  const samples = opts.samples ?? 32;
  const PHI = 0.6180339887498949;
  const R2 = 0.4142135623730951;
  let finite = 0;
  for (let i = 0; i < samples; i++) {
    const scope: Record<string, number> = {};
    vars.forEach((v, j) => { scope[v] = lo + (hi - lo) * (((i + 1) * PHI + (j + 1) * R2) % 1); });
    const ya = a.fn(scope);
    const yb = b.fn(scope);
    if (!Number.isFinite(ya) || !Number.isFinite(yb)) continue;
    finite++;
    if (Math.abs(ya - yb) > tol * Math.max(1, Math.abs(ya), Math.abs(yb))) return false;
  }
  return finite >= 5;   // enough agreeing finite points, none disagreed
}

export type AnswerSpec =
  | { kind: 'number'; value: number; tol?: number }
  | { kind: 'expression'; value: string; vars?: string[]; domain?: [number, number]; tol?: number };

/** Check a raw student string against an authored answer spec. */
export function checkAnswer(spec: AnswerSpec, raw: string): boolean {
  if (!raw || !raw.trim()) return false;
  if (spec.kind === 'number') return checkNumber(parseValue(raw), spec.value, spec.tol);
  return checkExpression(raw, spec.value, spec);
}
