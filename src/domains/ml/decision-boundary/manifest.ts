import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'decision-boundary',
  domain: 'ml',
  group: 'Machine learning',
  title: 'Linear decision boundary (perceptron)',
  description:
    'A linear classifier you can see think: choose a generated dataset, drag the boundary’s two handles to split two classes by hand, then watch a perceptron learn. XOR exposes why one straight line is not enough.',
  schema: z.object({
    dataset: z.enum(['separable', 'overlap', 'xor']).default('separable'),
    seed: z.number().int().min(0).max(2_147_483_647).default(11),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['machine-learning', 'classification', 'perceptron'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict whether a dataset can be separated by one straight boundary',
      'Use misclassification evidence to adjust or train a perceptron',
      'Explain why XOR requires a nonlinear boundary or richer representation',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
