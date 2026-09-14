import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { calculusExpressionSchema, calculusRangeSchema } from '../schemas.js';

export default defineLab({
  id: 'integral-explorer',
  domain: 'math',
  group: 'Math',
  title: 'Integral explorer',
  description: 'Area under a curve via Riemann rectangles, drag endpoints, add n, converge.',
  schema: z.object({
    prompt: z.string().optional(),
    equation: calculusExpressionSchema.optional(),
    xRange: calculusRangeSchema.optional(),
    a: z.number().finite().optional(),
    b: z.number().finite().optional(),
    n: z.number().int().min(1).max(80).optional(),
    title: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Interpret a definite integral as signed accumulation',
      'Compare left, midpoint and right rectangle estimates',
      'Explain why refining a partition improves an estimate',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['math', 'calculus', 'integral'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
