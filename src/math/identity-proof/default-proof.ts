/**
 * The smallest proof that demonstrates the mechanic, and nothing more.
 *
 * A lab needs SOME default so it renders in the gallery and in the CMS editor's picker before an
 * author has configured it. It does not need a lesson. The first version of this file carried a
 * five-step proof with thirteen written explanations, about 426 words, which is three lessons'
 * worth of prose living in the wrong repository: the curriculum's checks (25-word sentences, the
 * idiom blocklist, the prose budget, the LaTeX escaping scan) read MDX only, so none of it was ever
 * inspected by anything.
 *
 * So the rule for this file is: enough to prove the component works, short enough that nobody is
 * tempted to teach from it. Real proofs are authored in the lesson, where they are reviewed.
 */

import type { Move, Proof } from './core.js';

/**
 * The move vocabulary.
 *
 * Phrased as ACTIONS rather than identity names. "Use the Pythagorean identity" is a label a
 * learner can pick without understanding; "Replace 1 - cos²θ with sin²θ" states what will happen
 * to the expression, which is the level at which the choice is actually made.
 */
export const DEFAULT_MOVES: Move[] = [
  { id: 'to-sin-cos', label: 'Write every function in terms of sin θ and cos θ' },
  { id: 'cancel', label: 'Cancel a common factor' },
  { id: 'square-both', label: 'Square both sides' },
  { id: 'pythagoras', label: 'Replace 1 − cos²θ with sin²θ' },
];

export const DEFAULT_PROOF: Proof = {
  claim: '\\tan\\theta\\cos\\theta \\equiv \\sin\\theta',
  start: 'lhs',
  target: '\\sin\\theta',
  steps: [
    {
      from: '\\tan\\theta\\cos\\theta',
      move: 'to-sin-cos',
      to: '\\frac{\\sin\\theta}{\\cos\\theta} \\times \\cos\\theta',
      why: 'tan θ is a definition, so rewriting it leaves one expression in two functions.',
      detours: [
        {
          move: 'square-both',
          why: 'Squaring acts on both sides at once, which assumes the identity being proved.',
        },
        { move: 'pythagoras', why: 'There is no 1 − cos²θ here to replace.' },
      ],
    },
    {
      from: '\\frac{\\sin\\theta}{\\cos\\theta} \\times \\cos\\theta',
      move: 'cancel',
      to: '\\sin\\theta',
      why: 'cos θ divides out top and bottom, leaving the right-hand side.',
      detours: [{ move: 'to-sin-cos', why: 'Everything is already in sin θ and cos θ.' }],
    },
  ],
};
