import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'sequence-predict',
  domain: 'math',
  group: 'Math',
  tag: 'SequencePredict',
  title: 'Exponential / sequence (watch it grow)',
  description:
    'A count shown as a growing crowd of dots (3 → 6 → 12, new ones lit up); the learner tap-fills the hidden terms. Geometric (×ratio) or arithmetic (+difference). The "joke that doubles" lesson.',
  schema: z.object({
    start: z.number().default(3),
    rule: z.enum(['geometric', 'arithmetic']).default('geometric'),
    factor: z.number().default(2),
    shown: z.number().default(1),
    predict: z.number().default(2),
    stepLabel: z.string().default('Day'),
    highlightNew: z.boolean().default(true),
    scene: z.string().default('cluster'),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Distinguish additive growth from multiplicative growth',
      'Predict hidden terms from a visual and numerical sequence',
      'Express the repeated change as an arithmetic or geometric rule',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['7', '8', '9'],
    outcomes: ['math', 'sequences', 'exponential-growth'],
    durationMinutes: 10,
    interaction: 'predict',
    authorability: 'moderate',
  },
  omit: ['activity'],
  loadRuntime: () => import('./runtime.js'),
});
