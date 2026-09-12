import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'histogram',
  domain: 'statistics',
  group: 'Statistics',
  tag: 'HistogramBox',
  title: 'Histogram & box plot',
  description:
    'The shape of data: a binned histogram + a box-and-whisker on a shared axis. Click to drop points; symmetric/skewed/bimodal presets; outliers beyond 1.5·IQR.',
  schema: z
    .object({
      data: z.array(z.number().finite()).optional(),
      bins: z.number().int().min(2).max(16).optional(),
      min: z.number().finite().optional(),
      max: z.number().finite().optional(),
      ...commonLabProps,
    })
    .refine((value) => value.min === undefined || value.max === undefined || value.max > value.min, {
      message: 'max must be greater than min',
      path: ['max'],
    }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['statistics', 'data-display'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Connect a distribution shape to its box-plot summary',
      'Compare the resistance of median and IQR with the sensitivity of the mean',
      'Recognize skew, bimodality, and outliers in unfamiliar datasets',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
