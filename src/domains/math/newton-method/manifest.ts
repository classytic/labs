import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { calculusExpressionSchema, calculusRangeSchema } from '../schemas.js';

export default defineLab({
  id: 'newton-method',
  tag: 'NewtonMethod',
  domain: 'math',
  group: 'Math',
  title: 'Newton’s method',
  description:
    'Use successive tangent intercepts to solve f(x)=0; see convergence, flat derivatives, cycles, and divergence.',
  schema: z.object({
    prompt: z.string().optional(),
    equation: calculusExpressionSchema.optional(),
    xRange: calculusRangeSchema.optional(),
    startX: z.number().finite().optional(),
    maxSteps: z.number().int().min(1).max(30).optional(),
    title: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Construct a Newton step from a tangent intercept',
      'Judge convergence using residual and iteration evidence',
      'Recognize starting points that cause slow convergence, cycles or failure',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['math', 'calculus', 'derivative', 'numerical-methods', 'root-finding'],
    durationMinutes: 15,
    interaction: 'guided',
    authorability: 'moderate',
    representation: 'graph',
    prerequisites: ['derivative-explorer'],
    related: ['gradient-descent', 'polynomial-solver'],
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
