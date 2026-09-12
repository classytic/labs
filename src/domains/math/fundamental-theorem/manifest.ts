import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { calculusExpressionSchema, calculusRangeSchema } from '../schemas.js';

export default defineLab({
  id: 'fundamental-theorem',
  tag: 'FundamentalTheorem',
  domain: 'math',
  group: 'Math',
  title: 'Fundamental Theorem of Calculus',
  description:
    'Link signed area A(x) to its rate of change: move one probe across synchronized f and accumulation graphs.',
  schema: z.object({
    equation: calculusExpressionSchema.optional(),
    xRange: calculusRangeSchema.optional(),
    anchor: z.number().finite().optional(),
    startX: z.number().finite().optional(),
    title: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Connect a function value to the instantaneous growth of its accumulation function',
      'Track signed area and accumulated value on synchronized graphs',
      'Explain the derivative–integral relationship in a changed interval',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['math', 'calculus', 'integral', 'derivative', 'fundamental-theorem'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'graph',
    prerequisites: ['derivative-explorer', 'integral-explorer'],
    related: ['limit-explorer'],
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
