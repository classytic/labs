import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'sorting-quest',
  domain: 'ict',
  group: 'Algorithms & Data Structures',
  title: 'Sorting quest (compare, swap, count)',
  description:
    'Step through bubble, insertion, selection, merge or quicksort on an authored array, predicting each swap. Comparisons and writes are counted while it runs, and a cost panel ranks every method on the SAME input, so the difference between quadratic and n log n is measured rather than asserted.',
  schema: z.object({
    values: z.array(z.number().int()).min(1).max(16).default([7, 2, 9, 1, 5, 8, 3]),
    algorithm: z.enum(['bubble', 'insertion', 'selection', 'merge', 'quick']).default('bubble'),
    predict: z.boolean().default(true),
    showCosts: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12', 'undergraduate'],
    outcomes: ['algorithms', 'sorting', 'complexity'],
    durationMinutes: 15,
    interaction: 'predict',
    authorability: 'simple',
    representation: 'table',
    prerequisites: [],
    related: ['heap-quest', 'grid-path-dp'],
  },
  experience: {
    objectives: [
      'Predict whether a compared pair swaps or stays',
      'Read the running comparison and write counts as the cost of a method',
      'Compare several sorting methods on one input and connect the counts to their growth rates',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
