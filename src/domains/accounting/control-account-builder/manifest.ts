import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'control-account-builder',
  tag: 'ControlAccountBuilder',
  domain: 'accounting',
  group: 'Accounting',
  title: 'Control Account Builder',
  description:
    'Source journal totals, post them to the correct side, and balance sales and purchases ledger control accounts.',
  schema: z.object({ title: z.string().optional(), prompt: z.string().optional() }),
  taxonomy: {
    grades: ['9', '10'],
    outcomes: ['accounting', 'control-accounts', 'books-of-prime-entry'],
    durationMinutes: 15,
    interaction: 'guided',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Source control-account entries from the correct books of prime entry.',
      'Place entries on the debit or credit side of sales and purchases ledger control accounts.',
      'Balance a control account and interpret its closing balance.',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
