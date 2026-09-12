import { describe, expect, it } from 'vitest';
import {
  cobweb,
  gradientAt,
  iterationProblems,
  run,
  signChange,
  verdict,
} from '../src/math/iteration/core.js';

/**
 * x³ − x − 1 = 0 has its root near 1.3247, the plastic number. Two rearrangements of the SAME
 * equation behave completely differently, which is the whole subject of the lab.
 */
const GOOD = (x: number): number => Math.cbrt(x + 1); // x = (x+1)^(1/3), gradient ~0.19 at the root
const BAD = (x: number): number => x ** 3 - 1; // x = x³ − 1, gradient ~5.3 at the root
const ROOT = 1.3247179572;

describe('the same equation, two rearrangements', () => {
  it('converges on the shallow one', () => {
    const r = run(GOOD, 1.5);
    expect(r.outcome).toBe('converged');
    expect(r.root).toBeCloseTo(ROOT, 6);
  });

  it('diverges on the steep one, from the same starting value', () => {
    // Both rearrangements are algebraically correct and have the same root. Only the gradient
    // differs, which is the point a learner is never told.
    expect(run(BAD, 1.5).outcome).toBe('diverged');
  });

  it('diverges even when started very close to the root', () => {
    // Proof that it is the rearrangement and not the starting value: 1.33 is within 0.006 of the
    // root and still flies away.
    expect(run(BAD, 1.33).outcome).toBe('diverged');
  });

  it('leaves the root exactly where it is, since a root is a fixed point', () => {
    expect(GOOD(ROOT)).toBeCloseTo(ROOT, 8);
    expect(BAD(ROOT)).toBeCloseTo(ROOT, 8);
  });
});

describe('the gradient explains it', () => {
  it('measures a gradient below 1 for the convergent form', () => {
    const v = verdict(GOOD, ROOT);
    expect(Math.abs(v.gradient)).toBeLessThan(1);
    expect(v.converges).toBe(true);
  });

  it('measures a gradient above 1 for the divergent form', () => {
    const v = verdict(BAD, ROOT);
    expect(Math.abs(v.gradient)).toBeGreaterThan(1);
    expect(v.converges).toBe(false);
    expect(v.why).toMatch(/above 1/);
  });

  it('detects the alternating case from a negative gradient', () => {
    // cos x has a fixed point near 0.739 with gradient −sin(0.739) ≈ −0.67, so it spirals in from
    // alternate sides rather than creeping up one.
    const v = verdict(Math.cos, 0.739085);
    expect(v.converges).toBe(true);
    expect(v.alternates).toBe(true);
    expect(v.why).toMatch(/alternate sides/);
  });

  it('differentiates numerically to a usable accuracy', () => {
    expect(gradientAt((x) => x * x, 3)).toBeCloseTo(6, 6);
    expect(gradientAt(Math.sin, 0)).toBeCloseTo(1, 6);
  });
});

describe('the cobweb path', () => {
  it('starts on the x-axis at the first value', () => {
    const path = cobweb(run(GOOD, 1.5).steps);
    expect(path[0]).toEqual({ x: 1.5, y: 0 });
  });

  it('alternates a vertical stroke with a horizontal one', () => {
    // Vertical means the x is unchanged; horizontal means the y is. That alternation IS the method:
    // evaluate F, then feed the result back in as the next input.
    const path = cobweb(run(GOOD, 1.5).steps);
    for (let i = 1; i + 1 < path.length; i += 2) {
      expect(path[i]!.x).toBeCloseTo(path[i - 1]!.x, 12); // vertical
      expect(path[i + 1]!.y).toBeCloseTo(path[i]!.y, 12); // horizontal
    }
  });

  it('lands every horizontal stroke on the line y = x', () => {
    const path = cobweb(run(GOOD, 1.5).steps);
    for (let i = 2; i < path.length; i += 2) expect(path[i]!.x).toBeCloseTo(path[i]!.y, 12);
  });

  it('has nothing to draw for an empty run', () => {
    expect(cobweb([])).toEqual([]);
  });
});

describe('locating the root first', () => {
  it('finds a sign change across the root', () => {
    const f = (x: number): number => x ** 3 - x - 1;
    const s = signChange(f, 1, 2);
    expect(s.changes).toBe(true);
    expect(s.fa).toBeLessThan(0);
    expect(s.fb).toBeGreaterThan(0);
  });

  it('reports no change across an interval that misses the root', () => {
    const f = (x: number): number => x ** 3 - x - 1;
    expect(signChange(f, 2, 3).changes).toBe(false);
  });

  it('quotes both values, because an exam answer must', () => {
    const s = signChange((x) => x ** 3 - x - 1, 1, 2);
    expect(s.fa).toBeCloseTo(-1, 9);
    expect(s.fb).toBeCloseTo(5, 9);
  });
});

describe('authoring checks', () => {
  it('passes a genuine rearrangement', () => {
    expect(iterationProblems(GOOD, 1.5, ROOT)).toEqual([]);
  });

  it('catches a rearrangement whose fixed point is somewhere else', () => {
    // The commonest authoring error: quoting an iteration that does not actually solve the equation
    // the lesson is about. Every number on screen would then be wrong in a plausible way.
    const problems = iterationProblems((x) => Math.cbrt(x + 5), 1.5, ROOT);
    expect(problems[0]).toMatch(/not a fixed point/);
  });

  it('catches an F that cannot be evaluated', () => {
    expect(iterationProblems((x) => Math.sqrt(x - 100), 1.5, ROOT)[0]).toMatch(/cannot be evaluated/);
  });
});
