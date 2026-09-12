/**
 * The complex-number RULEBOOK: the core identities as {@link RuleDef} data for the
 * RuleCard concept engine (formula + analogy + a live worked calculator +
 * derivation + tricks). Calculators run on the complex kernel and narrate.
 */

import { createElement } from 'react';
import { calc, texNum, type Worked } from '../../kit/calc.js';
import type { RuleDef } from '../../kit/rule.js';
import * as C from './core.js';
import { DeMoivreFigure, IPowerCycleFigure, ModulusTriangleFigure, OmegaFigure } from './rule-figures.js';

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

export function explainDeMoivre(r: number, thetaDeg: number, n: number): Worked {
  const radius = r ** n;
  const angle = thetaDeg * n;
  return calc()
    .step(
      `(r\\angle\\theta)^{${n}} = r^{${n}}\\angle(${n}\\theta)`,
      'raise the modulus; multiply the argument',
    )
    .step(`${r}^{${n}}\\angle(${n}\\times ${thetaDeg}^\\circ)`)
    .step(`= ${texNum(Math.round(radius * 100) / 100)}\\angle ${angle}^\\circ`)
    .done(radius);
}

export const I_POWER_RULE: RuleDef = {
  id: 'i-powers',
  name: 'Powers of i (the 4-cycle)',
  formula: 'i^2 = -1, \\quad i^{n} = i^{\\,n \\bmod 4}',
  analogy: 'i is a quarter-turn. i² is two quarter-turns = a half-turn = −1. Four turns is back to 1.',
  figure: (v) => createElement(IPowerCycleFigure, { n: v.n ?? 0 }),
  inputs: [{ key: 'n', label: 'n', default: 5, min: 0, max: 24 }],
  compute: (v) => explainIPow(v.n ?? 0),
  challenge: [
    {
      id: 'i-sixth-power',
      prompt: 'Powers of i repeat every four. What is i⁶?',
      choices: [
        {
          value: 'one',
          label: '1',
          feedback: 'Six leaves remainder 2, not 0, when divided by four.',
        },
        { value: 'minus-one', label: '−1' },
        { value: 'i', label: 'i', feedback: 'i corresponds to remainder 1.' },
        {
          value: 'minus-i',
          label: '−i',
          feedback: '−i corresponds to remainder 3.',
        },
      ],
      answer: 'minus-one',
      explain: '6 mod 4 = 2, so i⁶ = i² = −1.',
    },
  ],
  derivation: [
    {
      tex: 'i = \\text{rotate } 90^\\circ',
      note: 'i lives at a quarter-turn on the unit circle',
    },
    { tex: 'i^2 = \\text{rotate } 180^\\circ = -1', note: 'two quarter-turns' },
    { tex: 'i^3 = -i, \\quad i^4 = 1', note: 'three and four turns' },
    {
      tex: '\\Rightarrow i^n \\text{ depends only on } n \\bmod 4',
      note: 'the cycle 1, i, −1, −i',
    },
  ],
  tricks: [
    'The cycle is 1, i, −1, −i, then it repeats.',
    'So i¹⁰² = i^(102 mod 4) = i² = −1.',
    '"Multiply by i" = rotate 90° anticlockwise; "× −1" = rotate 180°.',
  ],
};

export const MODULUS_RULE: RuleDef = {
  id: 'modulus',
  name: 'Modulus |z| = √(a²+b²)',
  formula: '|z| = |a + bi| = \\sqrt{a^2 + b^2}',
  analogy:
    'The straight-line distance from 0 to the point (a, b), exactly the length of the z vector (Pythagoras).',
  figure: (v) => createElement(ModulusTriangleFigure, { a: v.a ?? 0, b: v.b ?? 0 }),
  inputs: [
    { key: 'a', label: 'a (real)', default: 3, min: -12, max: 12 },
    { key: 'b', label: 'b (imag)', default: 4, min: -12, max: 12 },
  ],
  compute: (v) => explainModulus(v.a ?? 0, v.b ?? 0),
  challenge: [
    {
      id: 'modulus-three-four',
      prompt: 'What is the distance of 3 + 4i from the origin?',
      choices: [
        { value: '5', label: '5' },
        {
          value: '7',
          label: '7',
          feedback: 'Modulus is Euclidean distance, not |3| + |4|.',
        },
        {
          value: '25',
          label: '25',
          feedback: '25 is the squared modulus; take its square root.',
        },
      ],
      answer: '5',
      explain: 'The real and imaginary parts form a 3–4–5 right triangle: √(3² + 4²) = 5.',
    },
  ],
  tricks: [
    'It is the hypotenuse of the a, b right triangle.',
    '|z|² = z · z̄ (a number times its conjugate).',
    '|z₁ z₂| = |z₁| |z₂| (lengths multiply on multiplication).',
  ],
};

export const DE_MOIVRE_RULE: RuleDef = {
  id: 'de-moivre',
  name: 'De Moivre, (r∠θ)ⁿ = rⁿ ∠ nθ',
  formula:
    '\\big(r(\\cos\\theta + i\\sin\\theta)\\big)^{n} = r^{n}\\big(\\cos n\\theta + i\\sin n\\theta\\big)',
  analogy:
    'To raise to a power: MULTIPLY the lengths and ADD the angles. Squaring squares the modulus and doubles the argument.',
  figure: (v) =>
    createElement(DeMoivreFigure, {
      r: v.r ?? 1,
      thetaDeg: v.theta ?? 0,
      n: Math.round(v.n ?? 2),
    }),
  inputs: [
    { key: 'r', label: 'modulus r', default: 1.2, min: 0.5, max: 2, step: 0.1 },
    {
      key: 'theta',
      label: 'angle θ°',
      default: 40,
      min: 0,
      max: 180,
      step: 10,
    },
    { key: 'n', label: 'power n', default: 2, min: 2, max: 4 },
  ],
  compute: (v) => explainDeMoivre(v.r ?? 1, v.theta ?? 0, Math.round(v.n ?? 2)),
  challenge: [
    {
      id: 'de-moivre-square',
      prompt: 'When a complex number r∠θ is squared, what happens?',
      choices: [
        { value: 'square-double', label: 'Modulus squares; angle doubles' },
        {
          value: 'double-square',
          label: 'Modulus doubles; angle squares',
          feedback: 'Powers multiply arguments but raise moduli to the power.',
        },
        {
          value: 'unchanged',
          label: 'Both stay unchanged',
          feedback: 'Complex multiplication changes both length and direction.',
        },
      ],
      answer: 'square-double',
      explain: '(r eⁱθ)² = r²eⁱ²θ, so the modulus becomes r² and the argument becomes 2θ.',
    },
  ],
  derivation: [
    {
      tex: 'z = r(\\cos\\theta + i\\sin\\theta) = r\\,e^{i\\theta}',
      note: 'polar form',
    },
    {
      tex: 'z^n = (r\\,e^{i\\theta})^n = r^n e^{i n\\theta}',
      note: 'exponents: lengths^n, angles ×n',
    },
    {
      tex: '= r^n(\\cos n\\theta + i\\sin n\\theta)',
      note: 'back to rectangular',
    },
  ],
  tricks: [
    'Powers SPIRAL: |z|>1 winds outward, |z|<1 inward, |z|=1 stays on the circle.',
    'It turns the n nth-roots into "split the angle into n equal slices".',
    'Roots of unity zⁿ = 1 are n points 360°/n apart on the unit circle.',
  ],
};

export const OMEGA_RULE: RuleDef = {
  id: 'omega',
  name: 'Omega ω: the cube roots of unity',
  formula: '\\omega=e^{2\\pi i/3},\\quad \\omega^3=1,\\quad 1+\\omega+\\omega^2=0',
  analogy:
    'Three equal unit vectors spaced 120° apart close into an equilateral triangle, so their vector sum is zero.',
  figure: createElement(OmegaFigure),
  challenge: [
    {
      id: 'omega-sum',
      prompt: 'The vectors 1, ω and ω² are equally spaced around the unit circle. What is their sum?',
      choices: [
        { value: 'zero', label: '0' },
        {
          value: 'one',
          label: '1',
          feedback: 'Their horizontal and vertical components cancel by symmetry.',
        },
        {
          value: 'omega',
          label: 'ω',
          feedback: 'No one root is privileged; the three vectors balance around the origin.',
        },
      ],
      answer: 'zero',
      explain: 'The three unit vectors are 120° apart and close head-to-tail, so 1 + ω + ω² = 0.',
    },
  ],
  derivation: [
    { tex: 'z^3-1=(z-1)(z^2+z+1)' },
    { tex: '\\omega\\ne1,\\quad \\omega^3=1' },
    {
      tex: '\\Rightarrow \\omega^2+\\omega+1=0',
      note: 'the non-real roots satisfy the quadratic factor',
    },
  ],
  tricks: [
    'ω̄ = ω² and |ω| = 1.',
    'Powers repeat every three: 1, ω, ω², 1, …',
    'The same geometry generalizes to n roots spaced 360°/n apart.',
  ],
};

export const COMPLEX_RULES: RuleDef[] = [I_POWER_RULE, MODULUS_RULE, DE_MOIVRE_RULE, OMEGA_RULE];
