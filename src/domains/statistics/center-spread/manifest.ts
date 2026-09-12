import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'center-spread',
  domain: 'statistics',
  group: 'Statistics',
  tag: 'CenterSpread',
  title: 'Centre & spread (mean as balance point)',
  description:
    'Drag data points on a number line: the mean rides as a balance-point fulcrum, the median holds, the mode lights up, and a σ band breathes. Outliers move the mean, not the median.',
  schema: z.object({
    data: z.array(z.number().finite()).min(1).optional(),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
    step: z.number().finite().positive().optional(),
    showSigma: z.boolean().optional(),
    challenge: z.object({ stat: z.enum(['mean', 'median']), target: z.number().finite() }).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['statistics', 'centre-spread'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Compare mean, median, mode, and spread on the same dataset',
      'Explain why an outlier moves the mean more than the median',
      'Use standard deviation as a visual measure of spread',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
