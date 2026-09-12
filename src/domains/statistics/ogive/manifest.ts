import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'ogive',
  tag: 'Ogive',
  domain: 'statistics',
  group: 'Statistics',
  title: 'Cumulative frequency curve (read the quartiles)',
  description:
    'The S-curve, and the movement that reads it: go across at n/4, n/2 or 3n/4, drop down, read the value. Plots against the upper class boundary, interpolates inside the class the reading lands in, and draws the interquartile range as a width on the value axis rather than a subtraction.',
  schema: z.object({
    bins: z
      .array(
        z.object({
          from: z.number().finite(),
          to: z.number().finite(),
          frequency: z.number().min(0),
        }),
      )
      .min(2)
      .max(12)
      .optional()
      .describe('grouped classes, contiguous: each class starts where the previous one ended'),
    unit: z.string().trim().max(20).optional().describe('what one value is, e.g. "mark", "minute"'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Read a median and quartiles off a cumulative frequency curve',
      'See the interquartile range as the width holding the middle half of the data',
      'Use n/2 for grouped data rather than the (n+1)/2 list rule',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11', '12'],
    outcomes: ['statistics', 'data-display', 'quartiles'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
