import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

const accountCat = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']),
});

export default defineLab({
  id: 'journal-poster',
  tag: 'JournalPoster',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Journal poster (debits, credits & T-accounts)',
  description:
    'Learner picks the debit (left) + credit (right) account for each authored event; instant coached feedback fills the T-accounts and a live trial balance. Author the chart of accounts + the events.',
  schema: z.object({
    accounts: z.array(accountCat).min(2).optional(),
    transactions: z
      .array(
        z.object({
          id: z.string().trim().min(1),
          prompt: z.string().trim().min(1),
          debit: z.string().trim().min(1),
          credit: z.string().trim().min(1),
          amount: z.number().positive().finite(),
        }),
      )
      .min(1)
      .optional(),
    showTrialBalance: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
    objectives: z.array(z.string().trim().min(1)).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['accounting', 'double-entry'],
    durationMinutes: 15,
    interaction: 'guided',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Apply normal-balance rules to authentic business events',
      'Post equal debits and credits into the ledger',
      'Explain what a balanced trial balance proves and does not prove',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
