import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'bearings',
  tag: 'Bearings',
  domain: 'math',
  group: 'Trigonometry',
  title: 'Bearings and a two-leg journey',
  description:
    'Three-figure bearings drawn the way an exam diagram is drawn: a dashed north line at every turning point, and the arc swept clockwise even past 180 degrees. Closes with the direct distance home, which is the cosine rule on the triangle the two legs make.',
  schema: z.object({
    places: z
      .tuple([z.string().trim().max(24), z.string().trim().max(24), z.string().trim().max(24)])
      .optional()
      .describe('the three places, in the order they are visited'),
    firstBearing: z.number().min(0).max(359).optional(),
    firstDistance: z.number().positive().max(1000).optional(),
    secondBearing: z.number().min(0).max(359).optional(),
    secondDistance: z.number().positive().max(1000).optional(),
    unit: z.string().trim().max(12).optional().describe('distance unit, e.g. "km"'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Measure and state a bearing clockwise from north, in three figures',
      'Draw a new north line at each turning point of a journey',
      'Find a back bearing, and the direct distance home by the cosine rule',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['trigonometry', 'bearings', 'cosine-rule'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
