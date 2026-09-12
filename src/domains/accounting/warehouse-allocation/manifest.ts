import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'warehouse-allocation',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Warehouse cost allocation (by floor area)',
  description:
    'Split a shared overhead (warehouse rent) across departments by floor area, on the apportion engine. A floor plan partitions into zones whose width is the area, so cost share = width; the cost-per-sq-ft rate is one number for all. Author the total cost and the departments + their areas. Predict-first, curriculum-neutral.',
  schema: z.object({
    totalCost: z.number().positive().finite().optional(),
    departments: z
      .array(z.object({ name: z.string().trim().min(1), sqft: z.number().nonnegative().finite() }))
      .min(2)
      .refine(
        (departments) => departments.some((department) => department.sqft > 0),
        'At least one department must have positive floor area.',
      )
      .optional()
      .describe('departments and their floor areas'),
    currency: z.string().trim().min(1).optional(),
    unitLabel: z.string().trim().min(1).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['finance', 'cost-allocation'],
    durationMinutes: 10,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Allocate a shared warehouse cost by floor-area share',
      'Connect floor-plan width with cost responsibility',
      'Explain the common cost-per-area rate',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
