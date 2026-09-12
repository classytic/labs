import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'ratio-lab',
  domain: 'accounting',
  group: 'Accounting',
  tag: 'Ratio',
  title: 'Financial ratios (health traffic lights)',
  description:
    'Turn the figures into a diagnosis: liquidity (current, quick), profitability (gross & net margin, ROCE), gearing and inventory turnover each get a value and a traffic-light health tone, so a wall of numbers becomes a verdict. Drag the underlying figures and watch a firm move between healthy, stretched and at-risk. Author the balances + currency. Predict-first, curriculum-neutral.',
  schema: z
    .object({
      currentAssets: z.number().nonnegative().finite().optional(),
      inventory: z.number().nonnegative().finite().optional(),
      currentLiabilities: z.number().positive().finite().optional(),
      nonCurrentLiabilities: z.number().nonnegative().finite().optional(),
      equity: z.number().positive().finite().optional(),
      revenue: z.number().positive().finite().optional(),
      costOfSales: z.number().nonnegative().finite().optional(),
      expenses: z.number().nonnegative().finite().optional(),
      currency: z.string().trim().min(1).optional(),
      show: z
        .union([
          z.enum(['liquidity', 'profitability', 'gearing', 'efficiency']),
          z
            .array(
              z.enum([
                'current',
                'quick',
                'grossMargin',
                'netMargin',
                'roce',
                'gearing',
                'inventoryTurnover',
              ]),
            )
            .min(1),
        ])
        .optional(),
      ...commonLabProps,
    })
    .refine(
      ({ currentAssets, inventory }) =>
        currentAssets == null || inventory == null || inventory <= currentAssets,
      { message: 'inventory cannot exceed current assets', path: ['inventory'] },
    ),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['finance', 'ratio-analysis'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Diagnose liquidity, profitability and gearing from connected evidence',
      'Repair a weak liquidity position by changing authored balances',
      'Explain why a ratio responds to an intervention',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
