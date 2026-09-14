import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
export default defineLab({
  id: 'linearisation',
  tag: 'LinearisationLab',
  domain: 'math',
  group: 'Mathematics',
  title: 'Linearisation Lab',
  description: 'Transform power and exponential laws into straight lines, then recover their constants.',
  schema: z.object({ title: z.string().optional(), prompt: z.string().optional() }),
  taxonomy: {
    grades: ['9', '10'],
    outcomes: ['linearisation', 'straight-lines', 'logarithms'],
    durationMinutes: 10,
    interaction: 'guided',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Choose transformed axes that produce a straight line.',
      'Read constants from the gradient and intercept.',
      'Translate the straight-line result back to the original model.',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
