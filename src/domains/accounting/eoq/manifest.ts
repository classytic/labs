import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'eoq',
  domain: 'accounting',
  group: 'Accounting',
  tag: 'EOQ',
  title: 'Economic order quantity (the cheapest batch)',
  description:
    'How much to order each time: big batches mean few orders (low ordering cost) but lots of stock (high holding cost), and small batches the reverse. The two opposing costs make total cost U-shaped, and its minimum is the EOQ = √(2DS/H), where ordering cost equals holding cost. Finally VISUAL (the U-curve, not just a number): drag your order size and see the saving vs the EOQ. Author demand + costs. Predict-first, curriculum-neutral.',
  schema: z.object({
    annualDemand: z.number().positive().finite().min(500).max(20000).optional(),
    orderCost: z
      .number()
      .positive()
      .finite()
      .min(10)
      .max(200)
      .optional()
      .describe('cost per order placed (S)'),
    holdingCostPerUnit: z
      .number()
      .positive()
      .finite()
      .min(1)
      .max(20)
      .optional()
      .describe('annual holding cost per unit (H)'),
    orderQty: z.number().positive().finite().min(10).max(600).optional(),
    currency: z.string().trim().min(1).optional(),
    unitLabel: z.string().trim().min(1).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['finance', 'inventory', 'eoq'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Explain the trade-off between ordering and holding costs',
      'Find the lowest-cost order policy from visual evidence',
      'Transfer the policy when demand or costs change',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
