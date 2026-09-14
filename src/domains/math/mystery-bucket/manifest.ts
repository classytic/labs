import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'mystery-bucket',
  tag: 'MysteryBucket',
  domain: 'math',
  group: 'Math',
  title: 'Mystery bucket (weigh the unknown)',
  description:
    'Essentials opener, add unit weights until a balance is level to discover the hidden weight. No symbols.',
  schema: z.object({
    bucketWeight: z.number().default(5),
    bucketCount: z.number().default(1),
    maxWeights: z.number().default(12),
    start: z.number().default(0),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Interpret balance as equality without relying on algebraic symbols',
      'Find an unknown weight by composing known unit weights',
      'Translate the concrete balance into an equation',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['5', '6', '7'],
    outcomes: ['math', 'algebra', 'equations'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
