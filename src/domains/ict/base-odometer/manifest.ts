import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'base-odometer',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'Base odometer (every base at once)',
  description:
    'Stacked odometer rows driven by one shared integer, binary/octal/decimal/hex roll in lockstep (binary fastest), proving base is a representation, not a different number. Race toggle animates the cascade.',
  schema: z.object({
    max: z.number().default(255),
    start: z.number().default(0),
    race: z.boolean().default(false),
    speed: z.number().default(2),
    highlightBase: z.number().optional(),
    target: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Recognize binary, octal, decimal and hexadecimal as representations of one value',
      'Predict when carries occur in different bases',
      'Convert an authored value by matching synchronized odometer states',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['ict', 'number-bases'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'number',
  },
  loadRuntime: () => import('./runtime.js'),
});
