import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'polynomial-solver',
  domain: 'math',
  group: 'Math',
  title: 'Polynomial solver (factor / solve, step by step)',
  description:
    'Type a polynomial in x; the engine factors it or solves =0 and shows the working (split the middle term; factor theorem for higher degree). Any-degree roots incl. complex, client-side.',
  schema: z.object({
    expr: z.string().default('x^2 + 5x + 6'),
    mode: z.enum(['factor', 'solve']).default('factor'),
    editable: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Predict factors or roots from polynomial structure',
      'Follow valid algebraic steps from expression to factorization or solutions',
      'Verify real and complex roots by substitution',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['math', 'algebra', 'polynomials'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
