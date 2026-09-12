import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'bayes',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'Bayes',
  title: 'Bayes / base-rate trap',
  description:
    'Conditional probability via an area model + natural-frequency tree: a rare-disease positive test is usually a false alarm. Sliders for prevalence/sensitivity/false-positive.',
  schema: z.object({
    prior: z.number().min(0.001).max(0.5).default(0.01),
    sensitivity: z.number().min(0.5).max(1).default(0.9),
    falsePositive: z.number().min(0).max(0.5).default(0.09),
    population: z.number().int().min(100).max(100000).default(1000),
    conditionLabels: z.tuple([z.string().min(1), z.string().min(1)]).optional(),
    testLabels: z.tuple([z.string().min(1), z.string().min(1)]).optional(),
    predict: z.boolean().optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['12'],
    outcomes: ['probability', 'bayes', 'conditional-probability'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict how a rare base rate changes a positive-test result',
      'Compare true positives with false positives using natural frequencies',
      'Transfer Bayes reasoning across prevalence and test quality',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
