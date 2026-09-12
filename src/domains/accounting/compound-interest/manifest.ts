import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivityStepSchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'compound-interest',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Compound interest (the money snowball)',
  description:
    'Simple interest is a straight line; compound curves up because interest earns interest, and the shaded gap is that "interest on interest". A snowball shows the money (core = deposit, dashed rings = each doubling). Guided mode (default) teaches in 5 steps: story, predict, reveal, gap, payoff with free sliders; turn it off for the everything-at-once explorer. Author the deposit, rate, years, compounding frequency and currency. Curriculum-neutral.',
  schema: z.object({
    principal: z
      .number()
      .min(100)
      .max(1000000)
      .optional()
      .describe(
        'starting deposit; the cap is currency-blind, so it must hold a realistic taka or rupee amount, not only a dollar one',
      ),
    ratePct: z.number().min(1).max(20).optional().describe('annual interest rate, % (e.g. 8)'),
    years: z.number().min(1).max(40).optional(),
    frequency: z.enum(['annual', 'monthly']).optional(),
    currency: z.string().optional().describe('currency symbol, e.g. $ or ৳'),
    guided: z.boolean().optional().describe('step-by-step lesson arc; off = free explorer'),
    steps: z.array(authoredActivityStepSchema).min(1).optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['finance', 'compound-interest'],
    durationMinutes: 15,
    interaction: 'guided',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict long-run simple versus compound growth',
      'Explain interest earned on earlier interest',
      'Transfer the model across rates, horizons and compounding policies',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
