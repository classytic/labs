/**
 * Partial fractions: splitting one algebraic fraction into the sum of simpler ones.
 *
 * Missing from our curriculum entirely, and it is load-bearing: Pure 3 integration cannot do
 * 1/((x-1)(x+2)) without it, and neither can a binomial expansion of a rational function. It is
 * also the topic where the marks are lost before any arithmetic happens.
 *
 * THE ERROR THIS MODULE IS BUILT AROUND is choosing the wrong FORM. A learner who writes
 *
 *     (…)/((x-1)(x+2)^2)  =  A/(x-1) + B/(x+2)^2          ← wrong, and it looks reasonable
 *
 * has already lost the question: the B/(x+2) term is missing, the system is over-determined, and
 * no amount of careful substitution recovers it. The form is a decision made in the first line, so
 * `formOf` is a first-class function here and the constants are solved separately.
 *
 * The other silent failure is an IMPROPER fraction. If the numerator's degree is not smaller than
 * the denominator's, no decomposition of this shape exists and the expression must be divided out
 * first. `partialFractionProblems` refuses those rather than returning plausible nonsense.
 *
 * Constants are found by equating coefficients, which is exact. The cover-up rule taught alongside
 * it is a shortcut that only reaches the constants over distinct linear factors, so it cannot be
 * the engine here even though it is the thing a learner should do by hand.
 */

import { add, degree, evalPoly, mul, trim, type Poly } from '../poly/core.js';

/**
 * One factor of the denominator.
 *
 * `power` on a linear factor is what produces the repeated case, and a quadratic is assumed
 * irreducible (checked in `partialFractionProblems`, because a quadratic that DOES factorise
 * belongs in the linear case and would otherwise give an under-determined system).
 */
export type Factor =
  | { kind: 'linear'; a: number; b: number; power?: number }
  | { kind: 'quadratic'; a: number; b: number; c: number };

/** One term of the decomposition, and its solved numerator once known. */
export interface Term {
  /** The denominator, as LaTeX, e.g. "(x + 2)^2". */
  denomTex: string;
  /** How many unknowns this term's numerator carries: 1 for A, 2 for Bx + C. */
  unknowns: 1 | 2;
  /** Solved numerator coefficients, ascending, once `solveParts` has run. */
  value?: number[];
}

const factorPoly = (f: Factor): Poly => (f.kind === 'linear' ? trim([f.b, f.a]) : trim([f.c, f.b, f.a]));

const powPoly = (p: Poly, n: number): Poly => {
  let out: Poly = [1];
  for (let i = 0; i < n; i++) out = mul(out, p);
  return out;
};

const linearTex = (a: number, b: number): string => {
  const lead = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
  if (b === 0) return lead;
  return `${lead} ${b < 0 ? '-' : '+'} ${Math.abs(b)}`;
};

const quadTex = (a: number, b: number, c: number): string => {
  const parts = [a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${a}x^2`];
  if (b !== 0) parts.push(`${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`);
  if (c !== 0) parts.push(`${c < 0 ? '-' : '+'} ${Math.abs(c)}`);
  return parts.join(' ');
};

/** The full denominator, multiplied out. */
export const denominator = (factors: readonly Factor[]): Poly =>
  factors.reduce<Poly>(
    (acc, f) => mul(acc, powPoly(factorPoly(f), f.kind === 'linear' ? (f.power ?? 1) : 1)),
    [1],
  );

/**
 * The SHAPE of the decomposition, before any constant is known.
 *
 * This is the whole first line of the answer, and the part that is graded even when the arithmetic
 * afterwards goes wrong. Two rules generate it:
 *
 *   a linear factor raised to power n contributes n terms, over the first power, the second, and
 *   so on up to n. Not one term over the highest power, which is the classic mistake;
 *
 *   an irreducible quadratic contributes ONE term whose numerator is linear, Bx + C, because a
 *   constant numerator would not be general enough to match every possible remainder.
 */
export function formOf(factors: readonly Factor[]): Term[] {
  const terms: Term[] = [];
  for (const f of factors) {
    if (f.kind === 'linear') {
      const power = f.power ?? 1;
      for (let k = 1; k <= power; k++) {
        const base = `(${linearTex(f.a, f.b)})`;
        terms.push({ denomTex: k === 1 ? base : `${base}^${k}`, unknowns: 1 });
      }
    } else {
      terms.push({ denomTex: `(${quadTex(f.a, f.b, f.c)})`, unknowns: 2 });
    }
  }
  return terms;
}

/**
 * The polynomial each unknown gets multiplied by once the identity is cleared of fractions.
 *
 * Multiplying N/D = Σ Uᵢ/dᵢ through by D leaves N = Σ Uᵢ · (D / dᵢ). Rather than dividing
 * polynomials, each cofactor is built by multiplying the OTHER factors back together, which is
 * exact and cannot accumulate rounding.
 */
function cofactors(factors: readonly Factor[]): Poly[] {
  const out: Poly[] = [];
  for (const [i, f] of factors.entries()) {
    const others = factors.reduce<Poly>(
      (acc, g, j) =>
        i === j ? acc : mul(acc, powPoly(factorPoly(g), g.kind === 'linear' ? (g.power ?? 1) : 1)),
      [1],
    );
    if (f.kind === 'linear') {
      const power = f.power ?? 1;
      // The term over (ax+b)^k keeps (ax+b)^(power−k) of its own factor.
      for (let k = 1; k <= power; k++) out.push(mul(others, powPoly(factorPoly(f), power - k)));
    } else {
      // A linear numerator Bx + C is two unknowns, so it contributes two columns: x·cofactor
      // and cofactor. Pushed in ascending order so the solved pair reads [C, B].
      out.push(others);
      out.push(mul(others, [0, 1]));
    }
  }
  return out;
}

/** Solve a small dense system by Gaussian elimination with partial pivoting. */
function solveLinear(matrix: number[][], rhs: number[]): number[] | null {
  const n = rhs.length;
  const m = matrix.map((row, i) => [...row, rhs[i]!]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r;
    if (Math.abs(m[pivot]![col]!) < 1e-12) return null; // singular: the form does not fit
    [m[col], m[pivot]] = [m[pivot]!, m[col]!];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = m[r]![col]! / m[col]![col]!;
      for (let c = col; c <= n; c++) m[r]![c]! -= factor * m[col]![c]!;
    }
  }
  return Array.from({ length: n }, (_, i) => m[i]![n]! / m[i]![i]!);
}

/**
 * The decomposition with its constants filled in, or null if the data does not admit one.
 *
 * Found by equating coefficients of the cleared identity, which is exact for every case including
 * repeated factors and irreducible quadratics. Returns null rather than a near-miss when the
 * system is singular, because a singular system means the FORM is wrong and a plausible set of
 * constants would hide that.
 */
export function solveParts(numerator: Poly, factors: readonly Factor[]): Term[] | null {
  const terms = formOf(factors);
  const columns = cofactors(factors);
  const unknowns = columns.length;
  const size = Math.max(unknowns, degree(denominator(factors)));

  // Row i is the coefficient of x^i, so the system says "these two polynomials agree term by term".
  const matrix = Array.from({ length: size }, (_, row) => columns.map((column) => column[row] ?? 0));
  const rhs = Array.from({ length: size }, (_, row) => numerator[row] ?? 0);

  const solved = solveLinear(matrix.slice(0, unknowns), rhs.slice(0, unknowns));
  if (!solved) return null;

  // Extra rows beyond the number of unknowns must still agree, or the identity is false.
  for (let row = unknowns; row < size; row++) {
    const lhs = columns.reduce((sum, column, j) => sum + (column[row] ?? 0) * solved[j]!, 0);
    if (Math.abs(lhs - (numerator[row] ?? 0)) > 1e-9) return null;
  }

  let at = 0;
  return terms.map((term) => ({
    ...term,
    value: solved.slice(at, (at += term.unknowns)).map((v) => (Math.abs(v) < 1e-12 ? 0 : v)),
  }));
}

/**
 * The largest disagreement between the original fraction and the decomposition, over sample x.
 *
 * This is the check a textbook cannot print. A learner who has just been told the two expressions
 * are "the same thing" can watch them agree at twenty different values, which is what "identity"
 * means. Sample points near a root are skipped, since both sides blow up there and the comparison
 * would be dominated by floating point rather than by algebra.
 */
export function maxDisagreement(
  numerator: Poly,
  factors: readonly Factor[],
  parts: readonly Term[],
  samples = 40,
): number {
  const den = denominator(factors);
  let worst = 0;
  for (let i = 0; i < samples; i++) {
    const x = -6 + (12 * i) / (samples - 1);
    const d = evalPoly(den, x);
    if (Math.abs(d) < 0.35) continue;
    const original = evalPoly(numerator, x) / d;
    let sum = 0;
    let at = 0;
    for (const [j, f] of factors.entries()) {
      void j;
      if (f.kind === 'linear') {
        const power = f.power ?? 1;
        for (let k = 1; k <= power; k++) {
          const value = parts[at]?.value?.[0] ?? 0;
          sum += value / Math.pow(evalPoly(factorPoly(f), x), k);
          at++;
        }
      } else {
        const [c = 0, b = 0] = parts[at]?.value ?? [];
        sum += (b * x + c) / evalPoly(factorPoly(f), x);
        at++;
      }
    }
    worst = Math.max(worst, Math.abs(original - sum));
  }
  return worst;
}

/**
 * A constant written the way an answer is written: as an exact fraction where one exists.
 *
 * Solving by elimination produces 1.3333333333333333, and an exam answer is 4/3. Printing the
 * decimal is not merely ugly, it loses the exactness the method exists to deliver, and a learner
 * copying it down would write a rounded answer where an exact one was available. Denominators are
 * searched only up to 64: past that a "fraction" is noise rather than a recovered exact value.
 */
export function rationalText(value: number): string {
  if (Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value));
  for (let q = 2; q <= 64; q++) {
    const p = value * q;
    // Tested against the UNROUNDED value, and at 1e-7 rather than 1e-9. Rounding first put exactly
    // 1e-9 of error into 3 × 0.333333333, so 1/3 missed a strictly-less-than 1e-9 threshold and
    // came out as a decimal. The looser bound cannot invent a fraction either: the closest rational
    // to √2 with q ≤ 64 is 41/29, which misses by 0.012.
    if (Math.abs(p - Math.round(p)) < 1e-7) {
      const num = Math.round(p);
      return `${num < 0 ? '-' : ''}${Math.abs(num)}/${q}`;
    }
  }
  return String(Math.round(value * 1e6) / 1e6);
}

/** One decomposed term rendered as LaTeX, e.g. "\frac{4/3}{(x - 1)}". */
export function termTex(term: Term): string {
  const [c = 0, b] = term.value ?? [];
  if (term.unknowns === 1) return `\\frac{${rationalText(c)}}{${term.denomTex}}`;
  const xPart = b === 0 ? '' : `${b === 1 ? '' : b === -1 ? '-' : rationalText(b!)}x`;
  const constPart = c === 0 ? '' : `${c < 0 ? ' - ' : ' + '}${rationalText(Math.abs(c))}`;
  const numerator = `${xPart}${constPart}`.replace(/^ \+ /, '') || '0';
  return `\\frac{${numerator}}{${term.denomTex}}`;
}

/** Authoring mistakes that would ship a decomposition which does not exist. */
export function partialFractionProblems(numerator: Poly, factors: readonly Factor[]): string[] {
  const problems: string[] = [];
  if (!factors.length) problems.push('a decomposition needs at least one denominator factor');

  const den = denominator(factors);
  // The whole method assumes a PROPER fraction. Improper ones need dividing out first, and the
  // system would otherwise be over-determined and silently return null.
  if (degree(trim(numerator)) >= degree(den))
    problems.push(
      `the fraction is improper: the numerator has degree ${degree(trim(numerator))} and the denominator ${degree(den)}, so divide first`,
    );

  for (const [i, f] of factors.entries()) {
    if (f.kind === 'linear' && f.a === 0) problems.push(`factor ${i + 1} is a constant, not linear`);
    if (f.kind === 'quadratic') {
      // A quadratic that factorises is really two linear factors. Left as a quadratic it gives an
      // under-determined system, and the solver would return an arbitrary member of a family.
      const disc = f.b * f.b - 4 * f.a * f.c;
      if (disc >= 0)
        problems.push(
          `factor ${i + 1} has discriminant ${disc}, so it factorises and belongs as two linear factors`,
        );
    }
  }

  if (!problems.length && solveParts(numerator, factors) === null)
    problems.push('these factors admit no decomposition of this form');

  return problems;
}
