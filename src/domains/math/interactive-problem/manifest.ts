import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { equationSchema, paramSchema, deriveSchema, askSchema } from '../schemas.js';

/** The equations/params/derive/ask builders can't come from the auto-form, so it ships the full
 *  engine editor via loadAuthoring. */
export default defineLab({
  id: 'interactive-problem',
  domain: 'math',
  group: 'Math',
  title: 'Interactive problem (engine)',
  description:
    'Author equations + sliders, derive roots/intersections/tangent/normal/area, and grade a typed answer, no code.',
  schema: z.object({
    equations: z.array(equationSchema).optional(),
    params: z.array(paramSchema).optional(),
    xRange: z.tuple([z.number(), z.number()]).optional(),
    yRange: z.union([z.tuple([z.number(), z.number()]), z.literal('auto')]).optional(),
    derive: z.array(deriveSchema).optional(),
    ask: askSchema.optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Use authored parameters to investigate a mathematical model',
      'Connect derived roots, intersections, tangents or areas to graph evidence',
      'Construct and justify a response to an authored transfer question',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['math', 'problem-solving', 'graphing'],
    durationMinutes: 15,
    interaction: 'build',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
