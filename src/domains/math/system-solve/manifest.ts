import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'system-solve',
  tag: 'SystemSolve',
  domain: 'math',
  group: 'Math',
  title: 'System of equations (two clues, by elimination)',
  description:
    'Two unknowns, two clues, solved by elimination (not just the graph crossing). Swappable concrete scene: a shop receipt, a bucket balance, or algebra tiles. Creators theme the same maths any way.',
  schema: z.object({
    scene: z.string().default('receipt'),
    symA: z.string().default('🍍'),
    labelA: z.string().default('Pineapple'),
    answerA: z.number().default(5),
    symB: z.string().default('🥭'),
    labelB: z.string().default('Mango'),
    answerB: z.number().default(2),
    a0: z.number().default(2),
    b0: z.number().default(1),
    a1: z.number().default(1),
    b1: z.number().default(1),
    currency: z.string().optional(),
    unit: z.string().optional(),
    store: z.string().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  omit: ['activity'],
  experience: {
    objectives: [
      'Translate two contextual clues into a pair of linear equations',
      'Eliminate one unknown and solve for the other',
      'Verify that the solution satisfies both original clues',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['8', '9', '10'],
    outcomes: ['math', 'algebra', 'simultaneous-equations'],
    durationMinutes: 12,
    interaction: 'build',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
});
