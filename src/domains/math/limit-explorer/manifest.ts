import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { calculusExpressionSchema, calculusRangeSchema } from '../schemas.js';

export default defineLab({
  id: 'limit-explorer',
  domain: 'math',
  group: 'Math',
  title: 'Limit explorer',
  description: 'Approach x → c from both sides; see the limit even where f(c) is a hole.',
  schema: z.object({
    equation: calculusExpressionSchema.optional(),
    xRange: calculusRangeSchema.optional(),
    c: z.number().finite().optional(),
    title: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Compare left- and right-hand behavior near a target input',
      'Distinguish a limit from the function value at the target',
      'Diagnose when a two-sided limit does not exist',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['math', 'calculus', 'limits'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
