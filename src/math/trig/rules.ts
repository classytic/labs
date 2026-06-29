/**
 * The trig RULEBOOK: signs (CAST), exact values, the Pythagorean identity, and
 * degree↔radian — as RuleDef data for the RuleCard concept engine (formula +
 * analogy + live worked calculator + derivation + tricks). Calculators run on the
 * trig teaching kernel.
 */

import { createElement, Fragment } from 'react';
import { calc, type Worked } from '../../kit/calc.js';
import type { RuleDef } from '../../kit/rule.js';
import { UnitCircleMini, SpecialTriangles } from './diagrams.js';
import * as T from './core.js';

const fmt = (n: number): string => (Number.isNaN(n) ? '\\text{undef}' : (Math.round(n * 1000) / 1000).toString());

/** Which functions are positive in the quadrant of `deg`, with the signs. */
export function explainCast(deg: number): Worked {
  const q = T.quadrant(deg);
  const pos = T.castPositive(deg);
  const sg = (fn: T.TrigFn): string => `\\${fn}: ${T.sign(fn, deg) > 0 ? '+' : T.sign(fn, deg) < 0 ? '-' : '0'}`;
  return calc()
    .step(`\\theta = ${T.normDeg(deg)}^\\circ \\Rightarrow \\text{Quadrant } ${q || '\\text{axis}'}`, 'where the terminal ray lands')
    .step(`${sg('sin')}, \\quad ${sg('cos')}, \\quad ${sg('tan')}`, q ? `Q${q}: only ${pos.join('/')} positive (${T.castLetter(deg)})` : 'on an axis')
    .done(q);
}

/** Exact sin/cos/tan at a special angle, via reference angle + sign. */
export function explainExact(deg: number): Worked {
  const ref = T.referenceAngleDeg(deg);
  const special = T.isSpecial(deg);
  const c = calc().step(`\\theta = ${T.normDeg(deg)}^\\circ, \\quad \\text{reference } = ${ref}^\\circ`, 'reduce to the acute angle');
  if (special) {
    c.step(`\\sin = ${T.exactTex('sin', deg)}, \\;\\; \\cos = ${T.exactTex('cos', deg)}, \\;\\; \\tan = ${T.exactTex('tan', deg)}`, 'reference value × the quadrant sign');
  } else {
    c.step(`\\sin \\approx ${fmt(T.evalTrig('sin', deg))}, \\;\\; \\cos \\approx ${fmt(T.evalTrig('cos', deg))}`, 'not a standard angle, decimal');
  }
  return c.done(ref);
}

/** Degree → exact radian. */
export function explainDegRad(deg: number): Worked {
  return calc()
    .step(`${T.normDeg(deg)}^\\circ \\times \\dfrac{\\pi}{180^\\circ}`, 'because 180° = π radians')
    .step(`= ${T.radTex(deg)}`)
    .done(T.toRad(deg));
}

export const CAST_RULE: RuleDef = {
  id: 'cast', name: 'CAST: signs by quadrant',
  formula: '\\text{Q1: All} \\;|\\; \\text{Q2: Sin} \\;|\\; \\text{Q3: Tan} \\;|\\; \\text{Q4: Cos}',
  analogy: '"All Students Take Calculus." Going anticlockwise from Q1: All positive, then only Sin, then only Tan, then only Cos.',
  figure: (v) => createElement(UnitCircleMini, { deg: v.deg ?? 0, showLegs: true, showCast: true }),
  inputs: [{ key: 'deg', label: 'θ°', default: 210, min: 0, max: 345, step: 15 }],
  compute: (v) => explainCast(v.deg ?? 0),
  derivation: [
    { tex: '\\cos\\theta = x, \\quad \\sin\\theta = y', note: 'the point on the unit circle' },
    { tex: '\\tan\\theta = \\tfrac{\\sin\\theta}{\\cos\\theta} = \\tfrac{y}{x}' },
    { tex: '\\text{so the signs are just the signs of } x, y', note: 'Q2: x<0,y>0 ⇒ only sin +' },
  ],
  tricks: ['It is literally the sign of x (cos) and y (sin) in each quadrant.', 'tan is positive where sin and cos AGREE in sign (Q1, Q3).', 'Reference angle gives the size; CAST gives the sign.'],
};

export const EXACT_RULE: RuleDef = {
  id: 'exact-values', name: 'Exact special-angle values',
  formula: '\\sin 30^\\circ=\\tfrac12,\\; \\cos 30^\\circ=\\tfrac{\\sqrt3}{2},\\; \\sin 45^\\circ=\\tfrac{\\sqrt2}{2}',
  analogy: 'They all come from two triangles: the 45-45-90 (sides 1,1,√2) and the 30-60-90 (sides 1,√3,2).',
  figure: (v) => createElement(Fragment, null,
    createElement('div', { style: { display: 'grid', gap: 6, justifyItems: 'center' } },
      createElement(UnitCircleMini, { deg: v.deg ?? 0, showLegs: true, showValue: true }),
      createElement(SpecialTriangles, {}),
    ),
  ),
  inputs: [{ key: 'deg', label: 'θ°', default: 150, min: 0, max: 330, step: 30 }],
  compute: (v) => explainExact(v.deg ?? 0),
  tricks: ['Only the multiples of 30° and 45° are "exact".', 'Find the reference angle, look up its value, then apply the CAST sign.', 'sin and cos swap between 30° and 60° (½ ↔ √3⁄2).'],
};

export const PYTHAG_RULE: RuleDef = {
  id: 'pythagorean', name: 'The Pythagorean identity',
  formula: '\\sin^2\\theta + \\cos^2\\theta = 1',
  analogy: 'It IS Pythagoras on the unit circle: the point (cosθ, sinθ) sits at distance 1 from the centre, so x² + y² = 1.',
  figure: createElement(UnitCircleMini, { deg: 52, showLegs: true, showHyp: true }),
  derivation: [
    { tex: '(\\cos\\theta,\\ \\sin\\theta) \\text{ is on the unit circle}', note: 'radius 1' },
    { tex: 'x^2 + y^2 = 1^2', note: 'distance from the origin' },
    { tex: '\\Rightarrow \\cos^2\\theta + \\sin^2\\theta = 1' },
  ],
  tricks: ['Divide by cos²θ → 1 + tan²θ = sec²θ.', 'Divide by sin²θ → 1 + cot²θ = csc²θ.', 'Lets you get cos from sin (up to sign): cosθ = ±√(1 − sin²θ).'],
};

export const DEG_RAD_RULE: RuleDef = {
  id: 'deg-rad', name: 'Degrees ↔ radians',
  formula: '180^\\circ = \\pi \\text{ rad}, \\qquad 1^\\circ = \\tfrac{\\pi}{180}',
  analogy: 'A radian is the angle that wraps one radius-length of arc around the circle; a full turn (360°) is 2π of them.',
  figure: (v) => createElement(UnitCircleMini, { deg: v.deg ?? 0, showLegs: false }),
  inputs: [{ key: 'deg', label: 'θ°', default: 30, min: 0, max: 360, step: 15 }],
  compute: (v) => explainDegRad(v.deg ?? 0),
  tricks: ['× π/180 to go deg → rad; × 180/π to go back.', 'Memorise the anchors: 180°=π, 90°=π/2, 60°=π/3, 45°=π/4, 30°=π/6.', 'Calculus needs radians (so d/dx sin x = cos x works).'],
};

export const TRIG_RULES: RuleDef[] = [CAST_RULE, EXACT_RULE, PYTHAG_RULE, DEG_RAD_RULE];
