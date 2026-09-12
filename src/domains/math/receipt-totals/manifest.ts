import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { receiptItemSchema } from '../schemas.js';

export default defineLab({
  id: 'receipt-totals',
  tag: 'ReceiptTotals',
  domain: 'math',
  group: 'Math',
  title: 'Receipt totals (qty × price)',
  description:
    'A shop receipt where the learner tap-fills the total items and total cost; classic "summed the prices, forgot the quantity" distractors. Multiplicative + additive reasoning grounded in a real bill.',
  schema: z.object({
    store: z.string().default('Half Foods'),
    currency: z.string().default('$'),
    items: z.array(receiptItemSchema).optional(),
    askItems: z.boolean().default(true),
    askCost: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  omit: ['activity'],
  experience: {
    objectives: [
      'Calculate each line total from quantity and unit price',
      'Accumulate line totals into an accurate receipt total',
      'Distinguish item count, unit-price sum and total cost',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['5', '6', '7'],
    outcomes: ['math', 'arithmetic', 'multiplication'],
    durationMinutes: 8,
    interaction: 'build',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
