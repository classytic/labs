import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { equationSchema, paramSchema } from '../schemas.js';

/** Equations are a string|{expr} union and sliders are a param list — the auto-form can't build
 *  those, so it ships the equation + slider editors via loadAuthoring. */
export default defineLab({
  id: 'graph',
  domain: 'math',
  group: 'Math',
  title: 'Graph (equation)',
  description: 'Plot equations you type, y = a·sin(b·x), x^2, … with learner sliders.',
  schema: z.object({
    equations: z.array(equationSchema).optional(),
    params: z.array(paramSchema).optional(),
    xRange: z.tuple([z.number(), z.number()]).optional(),
    yScale: z.enum(['linear', 'log']).optional(),
    title: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Connect an authored equation to its graph',
      'Predict how a parameter changes shape, scale or position',
      'Compare multiple functions on a shared coordinate system',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11', '12'],
    outcomes: ['math', 'graphing', 'functions'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
