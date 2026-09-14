import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'area-model',
  tag: 'AreaModel',
  domain: 'math',
  group: 'Math',
  title: 'Area model (algebra tiles)',
  description: '(x+a)(x+b) as a partitioned rectangle, EXPAND (drag x) or FACTOR (find a, b).',
  schema: z.object({
    title: z.string().optional(),
    prompt: z.string().optional(),
    a: z.number().default(3),
    b: z.number().default(2),
    mode: z.enum(['expand', 'factor']).default('expand'),
    controlId: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Connect each algebraic term to a region of a partitioned rectangle',
      'Predict the middle coefficient before revealing the expansion',
      'Reverse an expanded trinomial into its side factors',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['math', 'algebra', 'factoring'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
