import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'iteration',
  tag: 'Iteration',
  domain: 'math',
  group: 'Numerical methods',
  title: 'Iteration and the cobweb diagram',
  description:
    'Two rearrangements of one equation, both correct and both with the same root, where one converges and the other flies apart from the same start. The cobweb shows why: up to the curve, across to y = x, and the gradient of F at the root decides whether the box shrinks or widens.',
  schema: z.object({
    equationTex: z.string().trim().max(120).optional().describe('the equation being solved, as LaTeX'),
    rearrangements: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(30),
          expr: z.string().trim().min(1).max(80).describe('F(x) as an expression in x'),
          tex: z.string().trim().min(1).max(120),
        }),
      )
      .min(1)
      .max(4)
      .optional()
      .describe('give at least one that converges and one that does not'),
    start: z.number().finite().optional(),
    root: z
      .number()
      .finite()
      .optional()
      .describe('roughly where the root is; must be a fixed point of every rearrangement'),
    span: z.number().positive().max(20).optional().describe('half-width of the window around the root'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Run an iterative formula and recognise convergence from the values settling',
      'Read a cobweb as evaluate-then-feed-back',
      'Explain why one rearrangement converges and another does not',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['numerical-methods', 'iteration', 'convergence'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
