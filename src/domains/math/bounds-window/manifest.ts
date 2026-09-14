import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'bounds-window',
  tag: 'BoundsWindow',
  domain: 'math',
  group: 'Math',
  title: 'Bounds through a division',
  description:
    'Two rounded measurements drawn as their own windows, one over the other as a fraction. Drag each marker and the quotient recomputes: right on top makes it grow, right underneath makes it shrink. The greatest value is upper over LOWER, which is the step students reliably invert after learning bounds on an area.',
  schema: z.object({
    numerator: z.number().default(120),
    /** Rounding unit, so 10 means "to the nearest 10" and the window is plus or minus 5. */
    numeratorUnit: z.number().positive().default(10),
    numeratorLabel: z.string().default('Distance'),
    numeratorSymbol: z.string().default('m'),
    denominator: z.number().default(16),
    denominatorUnit: z.number().positive().default(1),
    denominatorLabel: z.string().default('Time'),
    denominatorSymbol: z.string().default('s'),
    resultLabel: z.string().default('Speed'),
    resultSymbol: z.string().default('m/s'),
    goal: z.enum(['max', 'min']).default('max'),
    height: z.number().min(220).max(560).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Write the upper and lower bound of a rounded measurement',
      'Predict which bound of each measurement makes a quotient extreme',
      'Explain why a division takes opposite bounds where a product takes the same ones',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10'],
    outcomes: ['math', 'limits-of-accuracy', 'bounds'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
