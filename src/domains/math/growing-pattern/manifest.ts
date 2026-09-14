import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'growing-pattern',
  tag: 'GrowingPattern',
  domain: 'math',
  group: 'Math',
  title: 'Pattern → formula',
  description: 'A figure grows by a·n + b; learners find the rule (hidden predict row forces extrapolation).',
  schema: z.object({
    a: z.number().default(2),
    b: z.number().default(3),
    steps: z.number().default(4),
    title: z.string().optional(),
    prompt: z.string().optional(),
    controlId: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Separate the fixed starting structure from the repeated growth in a visual pattern',
      'Predict hidden later terms from earlier figures',
      'Express an authored linear pattern as a rule in n',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['6', '7', '8'],
    outcomes: ['math', 'patterns', 'linear-sequences'],
    durationMinutes: 10,
    interaction: 'predict',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
