import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { calculusExpressionSchema, calculusRangeSchema } from '../schemas.js';

export default defineLab({
  id: 'derivative-explorer',
  domain: 'math',
  group: 'Math',
  title: 'Derivative explorer',
  description: 'Drag a point; the secant becomes the exact tangent. Shows f′(x).',
  schema: z.object({
    equation: calculusExpressionSchema.optional(),
    xRange: calculusRangeSchema.optional(),
    // startX is snapped into the AUTHORED xRange (valueInRange), not a fixed slider range.
    startX: z.number().finite().optional(),
    title: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Interpret the derivative as the limiting slope of secant lines',
      'Compare a secant estimate with the tangent slope at a movable point',
      'Transfer local-rate reasoning to a different authored function',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['math', 'calculus', 'derivative'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
