import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { DEFAULT_ACCOUNTS, DEFAULT_TXNS } from '../shared.js';

/** Equation balance — transactions carry a NESTED `effects` array the schema form can't edit
 *  well, so it ships a custom authoring editor (chart-of-accounts + transaction-effects) via
 *  loadAuthoring. */
export default defineLab({
  id: 'equation-balance',
  tag: 'EquationBalance',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Accounting equation balance (A = L + E)',
  description:
    'Apply transactions onto a two-pan scale (Assets vs Liabilities + Equity); the beam re-levels after each balanced entry, and a free-post mode tips the books to drill the misconception. Author the chart of accounts + transactions.',
  schema: z.object({
    accounts: z
      .array(
        z.object({
          id: z.string().trim().min(1),
          name: z.string().trim().min(1),
          category: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']),
        }),
      )
      .min(2)
      .default(DEFAULT_ACCOUNTS),
    transactions: z
      .array(
        z.object({
          id: z.string().trim().min(1),
          label: z.string().trim().min(1),
          effects: z
            .array(z.object({ account: z.string().trim().min(1), delta: z.number().finite() }))
            .min(2),
        }),
      )
      .min(1)
      .default(DEFAULT_TXNS),
    freePost: z.boolean().default(false),
    title: z.string().optional(),
    prompt: z.string().optional(),
    objectives: z.array(z.string().trim().min(1)).optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['accounting', 'accounting-equation'],
    durationMinutes: 15,
    interaction: 'guided',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Preserve Assets = Liabilities + Equity while posting transactions',
      'Trace each account effect to the correct side of the equation',
      'Diagnose why a one-sided posting breaks the books',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
