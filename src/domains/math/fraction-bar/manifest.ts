import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'fraction-bar',
  domain: 'math',
  group: 'Math',
  title: 'Fraction strip',
  description:
    'A strip cut into equal parts; drag to shade k/n. Reads as fraction, decimal, percent and (with a whole) a quantity. An optional compare strip shows the equivalent fraction.',
  schema: z.object({
    denom: z.number().default(4),
    num: z.number().default(0),
    target: z.number().optional(),
    whole: z.number().optional(),
    unit: z.string().default(''),
    compareDenom: z.number().optional(),
    showEquiv: z.boolean().default(true),
    scene: z.string().default('none'),
    height: z.number().min(180).max(640).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  omit: ['activity'],
  experience: {
    objectives: [
      'Construct a fraction by shading equal parts of a whole',
      'Connect one fraction to its decimal, percentage and quantity forms',
      'Recognize equivalent fractions using aligned strips',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['5', '6', '7'],
    outcomes: ['math', 'fractions'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
