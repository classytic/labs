import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'bank-reconciliation',
  tag: 'BankReconciliation',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Bank Reconciliation Workbench',
  description:
    'Update the cash book first, then reconcile outstanding items until it agrees with the bank statement.',
  schema: z.object({
    title: z.string().optional(),
    prompt: z.string().optional(),
    openingCashBook: z.number().finite().default(1200),
  }),
  taxonomy: {
    grades: ['9', '10'],
    outcomes: ['accounting', 'bank-reconciliation', 'cash-book'],
    durationMinutes: 12,
    interaction: 'guided',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Update the cash book for items known first from the bank statement.',
      'Separate cash-book corrections from timing differences.',
      'Reconcile the updated cash-book balance with the bank-statement balance.',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
