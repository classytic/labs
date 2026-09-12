import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'series',
  domain: 'statistics',
  group: 'Statistics',
  tag: 'Series',
  title: 'Sequences & series',
  description:
    'Arithmetic / geometric sequences as bars with a running-total line; for |r|<1 the total converges onto the dashed S∞ guide.',
  schema: z.object({
    kind: z.enum(['arithmetic', 'geometric']).optional(),
    first: z.number().finite().optional(),
    step: z.number().finite().optional(),
    count: z.number().int().min(2).max(16).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['sequences', 'series'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Distinguish arithmetic growth from geometric growth',
      'Connect term and partial-sum formulas to their visual traces',
      'Predict when a geometric series converges to a finite sum',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
