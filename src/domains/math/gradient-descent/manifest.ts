import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { calculusExpressionSchema, calculusRangeSchema } from '../schemas.js';

export default defineLab({
  id: 'gradient-descent',
  domain: 'math',
  group: 'Math',
  title: 'Gradient descent',
  description: 'Walk downhill on a loss surface f(x,y) using exact ∂f/∂x, ∂f/∂y, the calculus behind ML.',
  schema: z.object({
    prompt: z.string().optional(),
    equation: calculusExpressionSchema.optional(),
    range: calculusRangeSchema.optional(),
    // start is snapped into the AUTHORED range (valueInRange); the only slider is learningRate.
    start: z.tuple([z.number().finite(), z.number().finite()]).optional(),
    learningRate: z.number().finite().min(0.01).max(0.6).optional(),
    title: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Use a gradient to choose a local downhill direction',
      'Relate learning rate to convergence, overshoot and instability',
      'Diagnose whether an optimization path found a local minimum',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['math', 'calculus', 'optimization'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
