import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'normal',
  domain: 'statistics',
  group: 'Statistics',
  tag: 'NormalDistribution',
  title: 'Normal curve, area & z-scores',
  description:
    'Drag the shaded bounds → P(a≤X≤b) as area, with z-scores; or the 68-95-99.7 rule view. Slide μ and σ to reshape it.',
  schema: z.object({
    mu: z.number().min(-5).max(5).optional(),
    sigma: z.number().min(0.3).max(3).optional(),
    // a and b are the two draggable bounds; their window is mu ± 4σ, so it moves with the
    // authored mean and spread rather than sitting at a fixed range.
    a: z.number().optional(),
    b: z.number().optional(),
    mode: z.enum(['area', 'rule']).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['distributions', 'normal', 'z-scores'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Interpret probability as area under a normal curve',
      'Relate raw values to z-scores',
      'Transfer the 68–95–99.7 rule to unfamiliar intervals',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
