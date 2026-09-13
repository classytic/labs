import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'cost-derivation',
  tag: 'CostDerivation',
  domain: 'ict',
  group: 'Algorithms',
  title: 'Deriving a running time: the triangle, the halving and the tree',
  description:
    'A learner can recognise O(n log n) and still be unable to produce it, and producing it is what an exam asks for. Three pictures cover nearly every cost in an introductory course: the triangle of comparisons that collapses to n(n−1)/2, the chain of halvings that solves 2^k = n, and the recursion tree whose every level does the same n work. Drag n and the count moves with the picture, so the formula is something the learner watched hold.',
  schema: z.object({
    mode: z.enum(['nested', 'halving', 'recursion']).optional().describe('which derivation'),
    n: z.number().int().min(2).max(64).optional().describe('items; small enough to count by eye'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Derive n(n−1)/2 from the triangle of comparisons rather than quoting it',
      'Show where log₂ n comes from by counting halvings and solving 2^k = n',
      'Explain n log n as work-per-level times number-of-levels',
    ],
    phases: ['predict', 'act', 'observe', 'explain'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['12', 'undergraduate'],
    outcomes: ['complexity', 'big-o', 'analysis'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
