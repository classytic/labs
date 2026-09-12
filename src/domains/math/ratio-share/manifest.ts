import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'ratio-share',
  domain: 'math',
  group: 'Math',
  title: 'Share in a ratio',
  description:
    'Split a quantity in the ratio a:b by dragging one divider. Reads back the amounts and the simplified ratio; any equivalent split (40:60 = 2:3) solves it.',
  schema: z.object({
    a: z.number().positive().default(2),
    b: z.number().positive().default(3),
    total: z.number().positive().default(100),
    unit: z.string().default(''),
    labelA: z.string().default('A'),
    labelB: z.string().default('B'),
    step: z.number().positive().default(1),
    scene: z.string().default('none'),
    height: z.number().min(180).max(640).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  omit: ['activity'],
  experience: {
    objectives: [
      'Partition a total into two authored ratio shares',
      'Connect divider position to both amounts and their simplified ratio',
      'Recognize equivalent ratio descriptions of the same split',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['6', '7', '8'],
    outcomes: ['math', 'ratio'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
