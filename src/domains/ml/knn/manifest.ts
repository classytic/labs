import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'knn',
  domain: 'ml',
  group: 'Machine learning',
  tag: 'KnnBoundary',
  title: 'k-nearest neighbours boundary',
  description:
    'The answer to “a line can’t split XOR”: choose a generated dataset, drag the test point to see its nearest neighbours vote, and vary k to compare jagged overfit with oversmoothing.',
  schema: z.object({
    dataset: z.enum(['blobs', 'xor', 'circles']).default('circles'),
    k: z
      .number()
      .int()
      .min(1)
      .max(15)
      .refine((value) => value % 2 === 1, 'Use an odd k to avoid tied votes')
      .default(5),
    seed: z.number().int().min(0).max(2_147_483_647).default(7),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['machine-learning', 'classification', 'knn'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict a query class from its nearest labelled neighbours',
      'Compare how k and dataset shape the decision regions',
      'Distinguish a query prediction from leave-one-out model validation',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
