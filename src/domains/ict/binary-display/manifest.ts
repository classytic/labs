import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'binary-display',
  domain: 'ict',
  group: 'Computing & Digital Logic',
  title: 'Binary display (bits → seven-segment)',
  description:
    'A row of weighted bit switches (8 4 2 1) drives a seven-segment LED digit through a decoder, with live binary / decimal / hex readouts. The "number LED" payoff for DLD projects; set a target digit to make it a goal.',
  schema: z.object({
    bits: z.number().default(4),
    start: z.number().default(0),
    target: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Compose a value from weighted binary switches',
      'Trace a binary input through a seven-segment decoder to its display',
      'Construct a target digit and compare its binary, decimal and hexadecimal forms',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['ict', 'digital-logic', 'seven-segment'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'number',
    related: ['bit-grouper', 'logic-gate'],
  },
  loadRuntime: () => import('./runtime.js'),
});
