import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'number-line',
  tag: 'NumberLine',
  domain: 'math',
  group: 'Math',
  title: 'Number line',
  description: 'A draggable marker on a number line (incl. below zero), optionally pose a target to land on.',
  schema: z.object({
    min: z.number().default(-8),
    max: z.number().default(8),
    start: z.number().default(0),
    target: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Place positive and negative values by relative position on a number line',
      'Estimate and refine a target location from scale intervals',
      'Transfer distance and direction reasoning to a changed range',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['4', '5', '6'],
    outcomes: ['math', 'number-line', 'integers'],
    durationMinutes: 6,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
