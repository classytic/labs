import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { calculusExpressionSchema, calculusRangeSchema } from '../schemas.js';

export default defineLab({
  id: 'taylor-series',
  tag: 'TaylorSeries',
  domain: 'math',
  group: 'Math',
  title: 'Taylor series explorer',
  description:
    'Build a local polynomial from exact symbolic derivatives and inspect approximation error across the graph.',
  schema: z.object({
    equation: calculusExpressionSchema.optional(),
    xRange: calculusRangeSchema.optional(),
    center: z.number().finite().optional(),
    order: z.number().int().min(0).max(8).optional(),
    probe: z.number().finite().optional(),
    title: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Build a local polynomial from successive derivatives',
      'Relate approximation order and distance from the center to error',
      'Choose an order that meets an authored error target',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['math', 'calculus', 'derivative', 'taylor-series', 'approximation'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'graph',
    prerequisites: ['derivative-explorer'],
    related: ['newton-method', 'limit-explorer'],
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
