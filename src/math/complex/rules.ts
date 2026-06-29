/**
 * The complex-number RULEBOOK: the core identities as {@link RuleDef} data for the
 * RuleCard concept engine (formula + analogy + a live worked calculator +
 * derivation + tricks). Calculators run on the complex kernel and narrate.
 */

import { calc, texNum, type Worked } from '../../kit/calc.js';
import type { RuleDef } from '../../kit/rule.js';
import * as C from './core.js';

const sq = (x: number): string => (x < 0 ? `(${x})^2` : `${x}^2`);

/** |z| = √(a²+b²), with the working. */
export function explainModulus(a: number, b: number): Worked {
  const v = Math.hypot(a, b);
  return calc()
    .step(`|z| = \\sqrt{a^2 + b^2} = \\sqrt{${sq(a)} + ${sq(b)}}`, 'the distance of z from the origin')
    .step(`= \\sqrt{${a * a + b * b}}`)
    .step(`= ${texNum(Math.round(v * 100) / 100)}`)
    .done(v);
}

/** iⁿ via the exact 4-cycle, with the working. */
export function explainIPow(n: number): Worked {
  const m = ((Math.trunc(n) % 4) + 4) % 4;
  const z = C.iPow(n);
  return calc()
    .step(`i^{${n}} = i^{(${n} \\bmod 4)} = i^{${m}}`, 'powers of i repeat every 4')
    .step(`= ${C.toTex(z)}`, ['1', 'i', '-1', '-i'][m])
    .done(0);
}

export const I_POWER_RULE: RuleDef = {
  id: 'i-powers', name: 'Powers of i (the 4-cycle)',
  formula: 'i^2 = -1, \\quad i^{n} = i^{\\,n \\bmod 4}',
  analogy: 'i is a quarter-turn. i² is two quarter-turns = a half-turn = −1. Four turns is back to 1.',
  inputs: [{ key: 'n', label: 'n', default: 5, min: 0, max: 24 }],
  compute: (v) => explainIPow(v.n ?? 0),
  derivation: [
    { tex: 'i = \\text{rotate } 90^\\circ', note: 'i lives at a quarter-turn on the unit circle' },
    { tex: 'i^2 = \\text{rotate } 180^\\circ = -1', note: 'two quarter-turns' },
    { tex: 'i^3 = -i, \\quad i^4 = 1', note: 'three and four turns' },
    { tex: '\\Rightarrow i^n \\text{ depends only on } n \\bmod 4', note: 'the cycle 1, i, −1, −i' },
  ],
  tricks: ['The cycle is 1, i, −1, −i, then it repeats.', 'So i¹⁰² = i^(102 mod 4) = i² = −1.', '"Multiply by i" = rotate 90° anticlockwise; "× −1" = rotate 180°.'],
};

export const MODULUS_RULE: RuleDef = {
  id: 'modulus', name: 'Modulus |z| = √(a²+b²)',
  formula: '|z| = |a + bi| = \\sqrt{a^2 + b^2}',
  analogy: 'The straight-line distance from 0 to the point (a, b) — exactly the length of the z vector (Pythagoras).',
  inputs: [{ key: 'a', label: 'a (real)', default: 3, min: -12, max: 12 }, { key: 'b', label: 'b (imag)', default: 4, min: -12, max: 12 }],
  compute: (v) => explainModulus(v.a ?? 0, v.b ?? 0),
  tricks: ['It is the hypotenuse of the a, b right triangle.', '|z|² = z · z̄ (a number times its conjugate).', '|z₁ z₂| = |z₁| |z₂| (lengths multiply on multiplication).'],
};

export const DE_MOIVRE_RULE: RuleDef = {
  id: 'de-moivre', name: "De Moivre — (r∠θ)ⁿ = rⁿ ∠ nθ",
  formula: '\\big(r(\\cos\\theta + i\\sin\\theta)\\big)^{n} = r^{n}\\big(\\cos n\\theta + i\\sin n\\theta\\big)',
  analogy: 'To raise to a power: MULTIPLY the lengths and ADD the angles. Squaring squares the modulus and doubles the argument.',
  derivation: [
    { tex: 'z = r(\\cos\\theta + i\\sin\\theta) = r\\,e^{i\\theta}', note: 'polar form' },
    { tex: 'z^n = (r\\,e^{i\\theta})^n = r^n e^{i n\\theta}', note: 'exponents: lengths^n, angles ×n' },
    { tex: '= r^n(\\cos n\\theta + i\\sin n\\theta)', note: 'back to rectangular' },
  ],
  tricks: ['Powers SPIRAL: |z|>1 winds outward, |z|<1 inward, |z|=1 stays on the circle.', 'It turns the n nth-roots into "split the angle into n equal slices".', 'Roots of unity zⁿ = 1 are n points 360°/n apart on the unit circle.'],
};

export const COMPLEX_RULES: RuleDef[] = [I_POWER_RULE, MODULUS_RULE, DE_MOIVRE_RULE];
