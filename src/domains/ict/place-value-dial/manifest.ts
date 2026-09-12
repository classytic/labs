import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'place-value-dial',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'Place-value dial (count in any base)',
  description:
    'Odometer wheels in base-N: +1 ripples a carry left while the power-of-N place values light up and sum to the live value; base-2 shows ON/OFF bit cells.',
  schema: z.object({
    base: z.number().default(2),
    width: z.number().default(4),
    start: z.number().default(0),
    target: z.number().optional(),
    showWeights: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Interpret each digit by its power-of-base place value',
      'Trace a carry as one wheel overflows into the next place',
      'Construct an authored target in binary or another base and verify its weighted sum',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['ict', 'number-bases', 'place-value'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'number',
  },
  loadRuntime: () => import('./runtime.js'),
});
