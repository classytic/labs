import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'statement-builder',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Financial statements (income statement → balance sheet)',
  description:
    'The two statements and how they LINK: the income statement works out net profit (revenue − cost of sales − expenses), which is then added to capital on the balance sheet, where assets = capital + liabilities. Drag the trading figures and watch net profit flow into equity while the sheet stays balanced (cash is the balancing figure). Terminology is authorable. Predict-first, curriculum-neutral.',
  schema: z.object({
    revenue: z.number().min(40000).max(200000).optional(),
    costOfSales: z.number().min(20000).max(140000).optional(),
    expenses: z.number().min(5000).max(60000).optional(),
    nonCurrentAssets: z.number().optional(),
    inventory: z.number().optional(),
    capital: z.number().optional(),
    loan: z.number().optional(),
    currentLiabilities: z.number().optional(),
    currency: z.string().optional(),
    incomeStatementName: z.string().optional(),
    balanceSheetName: z.string().optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['finance', 'financial-statements'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Build profit from revenue, cost of sales and expenses',
      'Trace net profit into owner equity',
      'Explain why assets equal capital plus liabilities',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
