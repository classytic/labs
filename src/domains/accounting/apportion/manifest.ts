import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'apportion',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Apportion a shared cost (by any basis)',
  description:
    'Split one shared pool across parts in proportion to a basis, the general cost-apportionment lab. The pool and the basis are BOTH authorable, so the same lab teaches warehouse rent by floor area, factory overhead by machine-hours, a head-office cost by headcount, or partnership profit by capital. A bar partitions into zones whose width is the share; one rate (pool ÷ total basis) applies to all. Predict-first, curriculum-neutral.',
  schema: z.object({
    total: z.number().positive().finite().optional().describe('the shared pool to split, e.g. total rent'),
    parts: z
      .array(z.object({ name: z.string().trim().min(1), weight: z.number().nonnegative().finite() }))
      .min(2)
      .refine(
        (parts) => parts.some((part) => part.weight > 0),
        'At least one part must have a positive basis amount.',
      )
      .optional()
      .describe('the parts and their basis amounts'),
    poolLabel: z.string().trim().min(1).optional(),
    basisLabel: z.string().trim().min(1).optional(),
    unitLabel: z.string().trim().min(1).optional(),
    currency: z.string().trim().min(1).optional(),
    maxWeight: z.number().positive().finite().optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['finance', 'cost-apportionment'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Connect each basis share to its share of a common cost pool',
      'Construct an allocation that meets a target share',
      'Explain why every part uses one common rate',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
