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

import * as C from '../complex/core.js';
import { evaluate, type Node } from '@classytic/stage';

export type Poly = number[]; // ascending coefficients

const EPS = 1e-9;
const MAX_ITER = 300;
const MAX_DEG = 8; // bound work + array sizes

export const trim = (p: Poly): Poly => { let n = p.length; while (n > 1 && Math.abs(p[n - 1]!) < 1e-12) n--; return p.slice(0, n); };
export const degree = (p: Poly): number => trim(p).length - 1;

/** Horner evaluation (real). */
export function evalPoly(p: Poly, x: number): number { let s = 0; for (let i = p.length - 1; i >= 0; i--) s = s * x + (p[i] ?? 0); return s; }
/** Horner evaluation (complex). */
export function evalC(p: Poly, z: C.Complex): C.Complex { let s = C.ZERO; for (let i = p.length - 1; i >= 0; i--) s = C.add(C.mul(s, z), C.cx(p[i] ?? 0)); return s; }
/** Derivative polynomial. */
export const deriv = (p: Poly): Poly => trim(p.slice(1).map((c, i) => c * (i + 1)));

export function add(a: Poly, b: Poly): Poly { const n = Math.max(a.length, b.length), o: Poly = []; for (let i = 0; i < n; i++) o.push((a[i] ?? 0) + (b[i] ?? 0)); return trim(o); }
export function mul(a: Poly, b: Poly): Poly { const o = new Array<number>(a.length + b.length - 1).fill(0); for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) o[i + j]! += a[i]! * b[j]!; return trim(o); }

/** Synthetic division of p by (x − r); returns the quotient (assumes r is a root,
 *  i.e. drops the remainder). The "divide out a found factor" step. */
export function deflate(p: Poly, r: number): Poly {
  const n = p.length - 1;
  if (n < 1) return [0];
  const q = new Array<number>(n).fill(0);
  q[n - 1] = p[n]!;
  for (let k = n - 2; k >= 0; k--) q[k] = p[k + 1]! + r * q[k + 1]!;
  return trim(q);
}

const tnum = (n: number): string => { const r = Math.round(n * 1e6) / 1e6; return (Object.is(r, -0) ? 0 : r).toString(); };
/** LaTeX of a polynomial in descending order, e.g. [−6,11,−6,1] → "x^{3} - 6x^{2} + 11x - 6". */
export function polyTex(p0: Poly, x = 'x'): string {
  const p = trim(p0);
  let out = '';
  for (let d = p.length - 1; d >= 0; d--) {
    const c = p[d]!;
    if (c === 0) continue;
    const mag = Math.abs(c);
    const cp = d === 0 ? tnum(mag) : mag === 1 ? '' : tnum(mag);
    const xp = d === 0 ? '' : d === 1 ? x : `${x}^{${d}}`;
    const t = `${cp}${xp}`;
    out += out === '' ? (c < 0 ? `-${t}` : t) : (c < 0 ? ` - ${t}` : ` + ${t}`);
  }
  return out || '0';
}

// ── build a Poly from an expression AST (single var x; other vars baked) ────────

function hasVar(node: Node, x: string): boolean {
  switch (node.type) {
    case 'var': return node.name === x;
    case 'neg': return hasVar(node.arg, x);
    case 'binary': return hasVar(node.left, x) || hasVar(node.right, x);
    case 'call': return node.args.some((a) => hasVar(a, x));
    default: return false;
  }
}

/** Coefficients of `node` as a polynomial in `x` (other vars from `params`), or
 *  null if it isn't a polynomial in x (sin(x), 1/x, fractional power, …). */
export function fromAst(node: Node, x = 'x', params: Record<string, number> = {}): Poly | null {
  if (!hasVar(node, x)) { const v = evaluate(node, params); return Number.isFinite(v) ? [v] : null; }
  switch (node.type) {
    case 'var': return [0, 1];
    case 'neg': { const c = fromAst(node.arg, x, params); return c && c.map((k) => -k); }
    case 'binary': {
      const { op, left, right } = node;
      const L = fromAst(left, x, params);
      if (!L) return null;
      if (op === '+') { const R = fromAst(right, x, params); return R && add(L, R); }
      if (op === '-') { const R = fromAst(right, x, params); return R && add(L, R.map((k) => -k)); }
      if (op === '*') { const R = fromAst(right, x, params); return R && mul(L, R); }
      if (op === '/') { if (hasVar(right, x)) return null; const d = evaluate(right, params); return Number.isFinite(d) && d !== 0 ? L.map((k) => k / d) : null; }
      if (op === '^') { if (hasVar(right, x)) return null; const n = evaluate(right, params); if (!Number.isInteger(n) || n < 0 || n > MAX_DEG) return null; let acc: Poly = [1]; for (let i = 0; i < n; i++) acc = mul(acc, L); return acc; }
      return null;
    }
    default: return null;
  }
}

// ── roots: Durand–Kerner + exact-rational snapping ──────────────────────────────

/** Snap a near-rational real to its exact value (denominators 1..12), else itself. */
function snapReal(r: number): number {
  for (const d of [1, 2, 3, 4, 5, 6, 8, 10, 12]) {
    const n = Math.round(r * d);
    if (Math.abs(r * d - n) < 1e-7) { const v = n / d; return Object.is(v, -0) ? 0 : v; }
  }
  return Math.round(r * 1e9) / 1e9;
}
const snap = (z: C.Complex): C.Complex => (Math.abs(z.im) < 1e-7 ? { re: snapReal(z.re), im: 0 } : { re: snapReal(z.re), im: snapReal(z.im) });

/**
 * All complex roots of `p` via Durand–Kerner simultaneous iteration (then snapped).
 * For a degree-n polynomial returns n roots; real roots come back with im = 0.
 */
export function allRoots(p0: Poly): C.Complex[] {
  const p = trim(p0);
  const n = p.length - 1;
  if (n <= 0) return [];
  const lead = p[n]!;
  const m = p.map((c) => c / lead); // monic
  // initial guesses spread on a circle, off the real axis (avoids symmetric stalls)
  let z: C.Complex[] = Array.from({ length: n }, (_, k) => C.fromPolar(1 + 0.1 * k / n, (2 * Math.PI * k) / n + 0.6));
  for (let it = 0; it < MAX_ITER; it++) {
    let maxDelta = 0;
    const next = z.map((zi, i) => {
      let denom: C.Complex = C.ONE;
      for (let j = 0; j < n; j++) if (j !== i) denom = C.mul(denom, C.sub(zi, z[j]!));
      const corr = C.div(evalC(m, zi), denom);
      if (!C.isFiniteC(corr)) return zi;
      maxDelta = Math.max(maxDelta, C.abs(corr));
      return C.sub(zi, corr);
    });
    z = next;
    if (maxDelta < EPS) break;
  }
  const roots = z.map(snap);
  // stable order: real roots ascending, then complex by (re, im)
  roots.sort((a, b) => (a.im === 0 && b.im === 0 ? a.re - b.re : a.im === 0 ? -1 : b.im === 0 ? 1 : a.re - b.re || a.im - b.im));
  return roots;
}

export interface PolyRoots {
  poly: Poly;
  degree: number;
  roots: C.Complex[];
  realRoots: number[];
}

/** Solve p = 0 for ALL roots (any degree up to MAX_DEG). null if degenerate. */
export function solve(p0: Poly): PolyRoots | null {
  const p = trim(p0);
  const d = p.length - 1;
  if (d < 1) return null;
  const roots = allRoots(p);
  const realRoots = roots.filter((r) => r.im === 0).map((r) => r.re);
  return { poly: p, degree: d, roots, realRoots };
}

/** Solve an expression-AST equation `expr = 0` for x, any degree. null if not a
 *  polynomial in x. (Linear/quadratic also flow through here, exactly.) */
export function solveEquation(node: Node, x = 'x', params: Record<string, number> = {}): PolyRoots | null {
  const p = fromAst(node, x, params);
  return p ? solve(p) : null;
}

// ── factored form ───────────────────────────────────────────────────────────────

const fnum = (n: number): string => { const r = Math.round(n * 1e6) / 1e6; return (Object.is(r, -0) ? 0 : r).toString().replace(/^-/, '−'); };
/** "(x − r)" with the sign tucked in, and "(x − 0)" → "x". */
const linTex = (r: number, x: string): string => (r === 0 ? x : `(${x} ${r < 0 ? '+' : '−'} ${fnum(Math.abs(r))})`);

/**
 * Factored form of the polynomial over the reals: leading coefficient × linear
 * factors (real roots, with multiplicity) × irreducible quadratics (complex
 * conjugate pairs). e.g. x³−6x²+11x−6 → "(x − 1)(x − 2)(x − 3)".
 */
export function factorTex(p0: Poly, x = 'x'): string {
  const p = trim(p0);
  const lead = p[p.length - 1] ?? 1;
  const sol = solve(p);
  if (!sol) return fnum(p[0] ?? 0);
  const used = new Array(sol.roots.length).fill(false);
  const parts: string[] = [];
  for (let i = 0; i < sol.roots.length; i++) {
    if (used[i]) continue;
    const z = sol.roots[i]!;
    if (z.im === 0) { used[i] = true; parts.push(linTex(z.re, x)); continue; }
    // pair with the conjugate → real quadratic x² − 2a x + (a²+b²)
    used[i] = true;
    const j = sol.roots.findIndex((w, k) => !used[k] && Math.abs(w.re - z.re) < 1e-6 && Math.abs(w.im + z.im) < 1e-6);
    if (j >= 0) used[j] = true;
    const b2 = z.re * z.re + z.im * z.im, two = 2 * z.re;
    const mid = Math.abs(two) < 1e-9 ? '' : ` ${two < 0 ? '+' : '−'} ${fnum(Math.abs(two))}${x}`;
    parts.push(`(${x}^2${mid} ${b2 < 0 ? '−' : '+'} ${fnum(Math.abs(b2))})`);
  }
  const lc = Math.abs(lead - 1) < 1e-9 ? '' : `${fnum(lead)}\\,`;
  return parts.length ? `${lc}${parts.join('')}` : fnum(lead);
}
