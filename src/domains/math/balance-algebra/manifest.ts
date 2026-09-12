import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'balance-algebra',
  tag: 'BalanceAlgebra',
  domain: 'math',
  group: 'Math',
  title: 'Balance scale (algebra)',
  description: 'Drag x to balance a·x + b = c, learners solve a linear equation by balancing the scale.',
  schema: z.object({
    coef: z.number().default(2),
    addend: z.number().default(1),
    rhs: z.number().default(7),
    answer: z.number().default(3),
    controlId: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Interpret equality as two quantities in balance',
      'Adjust an unknown until both expressions have equal value',
      'Explain an inverse-operation solution using the balance model',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['7', '8', '9'],
    outcomes: ['math', 'algebra', 'linear-equations'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
