import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'linear-system',
  tag: 'LinearSystem',
  domain: 'math',
  group: 'Math',
  title: 'System of equations (x & y)',
  description:
    'Two clue lines on a grid, drag to the crossing point that obeys both. The advanced "find x and y" lab.',
  schema: z.object({
    m1: z.number().default(1),
    b1: z.number().default(1),
    m2: z.number().default(-1),
    b2: z.number().default(5),
  }),
  experience: {
    objectives: [
      'Interpret each line as the solution set of one equation',
      'Locate the point that satisfies both equations simultaneously',
      'Diagnose systems with one, no or infinitely many solutions',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['math', 'algebra', 'simultaneous-equations'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
