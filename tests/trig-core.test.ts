/**
 * Trig teaching-kernel tests, signs (CAST), exact values, reference angles, and
 * the degree → exact-radian helper.
 */

import { describe, it, expect } from 'vitest';
import {
  evalTrig, normDeg, quadrant, referenceAngleDeg, sign, castPositive, castLetter,
  isSpecial, exactTex, radTex,
} from '../src/math/trig/core.js';
import { TRIG_RULES, explainExact } from '../src/math/trig/rules.js';

describe('trig kernel: quadrants, signs, CAST', () => {
  it('normalises and quadrants', () => {
    expect(normDeg(-30)).toBe(330);
    expect(normDeg(450)).toBe(90);
    expect(quadrant(45)).toBe(1);
    expect(quadrant(150)).toBe(2);
    expect(quadrant(210)).toBe(3);
    expect(quadrant(300)).toBe(4);
    expect(quadrant(90)).toBe(0); // on an axis
  });
  it('signs follow CAST (All / Sin / Tan / Cos)', () => {
    expect(sign('sin', 30)).toBe(1); expect(sign('cos', 30)).toBe(1); expect(sign('tan', 30)).toBe(1); // Q1 all +
    expect(sign('sin', 150)).toBe(1); expect(sign('cos', 150)).toBe(-1); expect(sign('tan', 150)).toBe(-1); // Q2 sin +
    expect(sign('tan', 210)).toBe(1); expect(sign('sin', 210)).toBe(-1); // Q3 tan +
    expect(sign('cos', 300)).toBe(1); expect(sign('sin', 300)).toBe(-1); // Q4 cos +
    expect(castPositive(210)).toEqual(['tan']);
    expect(castLetter(150)).toBe('S');
  });
  it('tan is UNDEFINED at 90° / 270°, never ±∞', () => {
    expect(Number.isNaN(evalTrig('tan', 90))).toBe(true);
    expect(Number.isNaN(evalTrig('tan', 270))).toBe(true);
    expect(Number.isNaN(sign('tan', 90))).toBe(true);
    expect(evalTrig('sin', 90)).toBeCloseTo(1, 12);
    expect(evalTrig('cos', 180)).toBeCloseTo(-1, 12);
  });
  it('reference angle', () => {
    expect(referenceAngleDeg(150)).toBe(30);
    expect(referenceAngleDeg(210)).toBe(30);
    expect(referenceAngleDeg(330)).toBe(30);
    expect(referenceAngleDeg(135)).toBe(45);
  });
});

describe('trig kernel: exact values + radians', () => {
  it('special-angle detection + exact LaTeX with quadrant sign', () => {
    expect(isSpecial(30)).toBe(true);
    expect(isSpecial(37)).toBe(false);
    expect(exactTex('sin', 30)).toBe('\\tfrac12');
    expect(exactTex('cos', 60)).toBe('\\tfrac12');
    expect(exactTex('cos', 150)).toBe('-\\tfrac{\\sqrt3}{2}'); // Q2 cos negative
    expect(exactTex('sin', 210)).toBe('-\\tfrac12');           // Q3 sin negative
    expect(exactTex('tan', 45)).toBe('1');
    expect(exactTex('tan', 90)).toBe('\\text{undefined}');
    expect(exactTex('sin', 180)).toBe('0');
    expect(exactTex('sin', 37)).toBeNull();                    // not a special angle
  });
  it('degree → exact radian (multiple of π)', () => {
    expect(radTex(0)).toBe('0');
    expect(radTex(30)).toBe('\\tfrac{\\pi}{6}');
    expect(radTex(90)).toBe('\\tfrac{\\pi}{2}');
    expect(radTex(180)).toBe('\\pi');
    expect(radTex(270)).toBe('\\tfrac{3\\pi}{2}');
    expect(radTex(360)).toBe('0'); // normalised
  });
});

describe('trig rulebook (concept engine)', () => {
  it('every rule computes + shows working at its default', () => {
    expect(TRIG_RULES.length).toBe(4);
    for (const r of TRIG_RULES) {
      // every rule must teach something: a working calculator, or a derivation/tricks
      if (r.inputs?.length) {
        const defaults = Object.fromEntries(r.inputs.map((f) => [f.key, f.default]));
        expect((r.compute?.(defaults)?.steps.length ?? 0)).toBeGreaterThan(0);
      } else {
        expect((r.derivation?.length ?? 0) + (r.tricks?.length ?? 0)).toBeGreaterThan(0);
      }
    }
    // exact calculator narrates the sign-applied value
    expect(explainExact(150).steps.some((s) => /sqrt3/.test(s.tex))).toBe(true);
  });
});
