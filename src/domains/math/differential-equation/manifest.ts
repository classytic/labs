import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { calculusExpressionSchema, calculusRangeSchema } from '../schemas.js';

export default defineLab({
  id: 'differential-equation',
  tag: 'DifferentialEquation',
  domain: 'math',
  group: 'Math',
  title: 'Differential equation explorer',
  description:
    'Trace first-order initial-value problems through a slope field and compare guarded Euler and RK4 integration.',
  schema: z.object({
    prompt: z.string().optional(),
    equation: calculusExpressionSchema.optional(),
    xRange: calculusRangeSchema.optional(),
    yRange: calculusRangeSchema.optional(),
    initial: z.tuple([z.number().finite(), z.number().finite()]).optional(),
    stepSize: z.number().finite().min(0.02).max(10).optional(),
    probe: z.number().finite().optional(),
    title: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Read local derivative information from a slope field',
      'Compare Euler and RK4 approximations from the same initial condition',
      'Explain how step size changes numerical error',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['math', 'calculus', 'differential-equations', 'euler-method', 'runge-kutta'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'graph',
    prerequisites: ['derivative-explorer', 'integral-explorer'],
    related: ['taylor-series', 'gradient-descent', 'newton-method'],
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
