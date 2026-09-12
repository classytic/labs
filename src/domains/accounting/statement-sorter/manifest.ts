import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

const accountCat = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense']),
});

export default defineLab({
  id: 'statement-sorter',
  tag: 'StatementSorter',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Statement sorter (the two statements)',
  description:
    'Sort each account into the Income Statement or the Balance Sheet (coached), then close the books to carry net profit into Equity and watch A = L + E hold. Author the accounts + balances.',
  schema: z.object({
    accounts: z
      .array(accountCat.extend({ balance: z.number().finite() }))
      .min(2)
      .optional(),
    asOfLabel: z.string().optional(),
    showClosing: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
    objectives: z.array(z.string().trim().min(1)).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['accounting', 'financial-statements'],
    durationMinutes: 15,
    interaction: 'guided',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Classify period accounts separately from financial-position accounts',
      'Calculate profit from income and expenses',
      'Explain how closing profit into equity reconnects the statements',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
