import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'z-table',
  domain: 'statistics',
  group: 'Statistics',
  tag: 'ZTable',
  title: 'z-table (standardize & look up)',
  description:
    'Standardize x → z, and the live Φ(z) grid highlights the row/column/cell (auto-scrolled) while a mini curve shades the tail. Negative z via symmetry.',
  schema: z.object({
    x: z.number().finite().optional(),
    mu: z.number().finite().optional(),
    sigma: z.number().finite().positive().optional(),
    tail: z.enum(['left', 'right']).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['distributions', 'z-scores'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Standardize a raw value into a z-score',
      'Read cumulative probability from a z-table row and column',
      'Convert a left-tail probability into its right-tail complement',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
