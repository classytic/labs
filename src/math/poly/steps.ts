/**
 * Polynomial SOLVER steps, the engine side of a step-by-step solver. It emits a
 * {@link Worked} trace (the same data a RuleCard / lesson renders) using the
 * COMMON SCHOOL METHOD, not a raw CAS dump:
 *   • quadratics  → split the middle term (find the factor pair of a·c that adds
 *                   to b) and factor by grouping; fall back to the quadratic
 *                   formula + discriminant when it doesn't factor over ℤ.
 *   • higher deg  → the factor theorem: find a rational root, divide out (x − r)
 *                   by synthetic division, repeat down to a quadratic.
 *
 * Pure: builds on the canonical poly core + complex kernel. A creator drops the
 * solver lab; the learner sees the working. (For a curated LESSON, author the
 * steps by hand instead — this is the TOOL path.)
 */

import { calc, type Worked } from '../../kit/calc.js';
import { toStr } from '../complex/core.js';
import { trim, degree, deflate, solve, evalPoly, factorTex, polyTex, type Poly } from './core.js';

const n2 = (n: number): string => { const r = Math.round(n * 1e6) / 1e6; return (Object.is(r, -0) ? 0 : r).toString(); };
const lin = (r: number, x: string): string => (r === 0 ? x : `(${x} ${r < 0 ? '+' : '-'} ${n2(Math.abs(r))})`);
/** coefficient × x-power, dropping a leading 1 (so "x^2", not "1x^2"). */
const cx = (c: number, xp: string): string => (Math.abs(c) === 1 && xp ? (c < 0 ? `-${xp}` : xp) : `${n2(c)}${xp}`);

/** Integer pair (u, v) with u·v = prod and u + v = sum, or null. */
function factorPair(prod: number, sum: number): [number, number] | null {
  if (!Number.isInteger(prod) || !Number.isInteger(sum)) return null;
  const lim = Math.min(20000, Math.abs(prod) + 1);
  for (let u = -lim; u <= lim; u++) {
    if (u === 0) { if (prod === 0 && v0(sum) === 0) return [0, sum]; continue; }
    if (prod % u === 0) { const v = prod / u; if (u + v === sum) return [u, v]; }
  }
  return null;
}
const v0 = (s: number): number => s; // (clarity helper for the prod=0 edge)

function quadratic(p: Poly, x: string): Worked {
  const a = p[2]!, b = p[1]!, c = p[0]!;
  // name the coefficients up front, so a / b / c / ac are never mystery letters
  const w = calc().step(
    `${polyTex(p, x)} \\;=\\; a${x}^2 + b${x} + c`,
    `compare to ax² + bx + c: a = ${n2(a)} (the x² coefficient), b = ${n2(b)} (the middle), c = ${n2(c)} (the constant)`,
  );
  const ac = a * c;
  const pair = factorPair(ac, b);
  if (pair && [a, b, c].every(Number.isInteger)) {
    const [u, v] = pair;
    w.step(`a \\times c = (${n2(a)})(${n2(c)}) = ${n2(ac)}`, 'multiply the x² coefficient by the constant')
      .step(`\\text{find } u, v:\\ \\ u \\cdot v = ${n2(ac)}\\ \\text{ and }\\ u + v = ${n2(b)} \\;\\Rightarrow\\; u = ${n2(u)},\\ v = ${n2(v)}`, `two numbers that multiply to a·c (${n2(ac)}) and add to b (${n2(b)})`)
      .step(`${cx(a, `${x}^2`)} ${u < 0 ? '-' : '+'} ${n2(Math.abs(u))}${x} ${v < 0 ? '-' : '+'} ${n2(Math.abs(v))}${x} ${c < 0 ? '-' : '+'} ${n2(Math.abs(c))}`, `split the middle term ${n2(b)}${x} into ${n2(u)}${x} + ${n2(v)}${x}`)
      .step(`= ${factorTex(p, x)}`, 'group in pairs and take out the common factor');
    return w.done(0);
  }
  // doesn't factor with whole numbers → the quadratic formula instead
  const disc = b * b - 4 * a * c;
  const sol = solve(p)!;
  w.step(`\\Delta = b^2 - 4ac = (${n2(b)})^2 - 4(${n2(a)})(${n2(c)}) = ${n2(disc)}`, disc < 0 ? 'the discriminant is negative, so the roots are complex' : 'the discriminant b² − 4ac (no whole-number pair exists, so use the formula)')
    .step(`x = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a} = \\dfrac{${n2(-b)} \\pm \\sqrt{${n2(disc)}}}{${n2(2 * a)}}`, 'substitute a, b and Δ into the quadratic formula')
    .step(sol.roots.length === 2 ? `x = ${toStr(sol.roots[0]!)} \\text{ or } ${toStr(sol.roots[1]!)}` : `x = ${toStr(sol.roots[0]!)}`, 'the two roots')
    .step(`= ${factorTex(p, x)}`, 'factored form');
  return w.done(0);
}

/** Step-by-step FACTORISATION of a polynomial. */
export function factorSteps(p0: Poly, x = 'x'): Worked {
  const p = trim(p0);
  const d = degree(p);
  if (d <= 1) return calc().step(polyTex(p, x), d === 1 ? 'already linear (a factor itself)' : 'a constant').done(0);
  if (d === 2) return quadratic(p, x);

  // higher degree → factor theorem, peel one rational root at a time
  const w = calc().step(polyTex(p, x), 'the polynomial');
  let cur = p;
  for (const root of solve(p)!.roots) {
    if (root.im !== 0) continue;
    const r = root.re;
    if (degree(cur) <= 2 || Math.abs(evalPoly(cur, r)) > 1e-6) continue;
    w.step(`f(${n2(r)}) = 0 \\Rightarrow ${lin(r, x)} \\text{ is a factor}`, 'factor theorem');
    cur = deflate(cur, r);
    w.step(`\\text{quotient } = ${polyTex(cur, x)}`, 'divide it out (synthetic division)');
  }
  if (degree(cur) === 2) w.step(`${polyTex(cur, x)} \\Rightarrow \\text{factor the quadratic}`, 'split the middle term / formula');
  w.step(`= ${factorTex(p, x)}`, 'fully factored');
  return w.done(0);
}

/** Step-by-step SOLUTION of p = 0 (factor, then each factor = 0 → the roots). */
export function solveSteps(p0: Poly, x = 'x'): Worked {
  const p = trim(p0);
  const sol = solve(p);
  if (!sol) return calc().step(polyTex(p, x), 'no equation to solve').done(0);
  const w = calc().step(`${polyTex(p, x)} = 0`, 'set the polynomial to zero');
  if (degree(p) === 2) {
    const inner = quadratic(p, x);
    for (const s of inner.steps.slice(1)) w.step(s.tex, s.note); // reuse the quadratic working
  } else {
    w.step(`${factorTex(p, x)} = 0`, 'factor it (factor theorem)')
      .step('\\text{each factor } = 0', 'a product is 0 when a factor is 0');
  }
  const roots = sol.roots.map((r) => `${x} = ${toStr(r)}`).join(' \\text{ or } ');
  w.step(roots || '\\text{no roots}', sol.realRoots.length < sol.roots.length ? 'real and complex roots' : 'the roots');
  return w.done(sol.realRoots[0] ?? 0);
}
