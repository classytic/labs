import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';

export const activity = defineAuthoredActivity({
  pattern: 'allocation',
  title: 'Bank Reconciliation Workbench',
  objectives: [
    'Update the cash book for items known first from the bank statement.',
    'Separate cash-book corrections from timing differences.',
    'Reconcile the updated cash-book balance with the bank-statement balance.',
  ],
  questions: [
    {
      id: 'correct-order',
      prompt: 'What must happen before preparing the bank reconciliation statement?',
      choices: [
        { value: 'update', label: 'Update the cash book for entries discovered on the bank statement' },
        { value: 'timing', label: 'Enter every timing difference in the cash book' },
        { value: 'discard', label: 'Replace the cash-book balance with the bank-statement balance' },
      ],
      answer: 'update',
      explain:
        'First correct and update the cash book; only genuine timing differences belong in the reconciliation.',
    },
  ],
  success: [
    {
      id: 'order-ready',
      source: 'answer',
      key: 'correct-order',
      pendingLabel: 'Choose the correct starting action.',
    },
    {
      id: 'cash-book-ready',
      source: 'metric',
      key: 'cash-book-items',
      pendingLabel: 'Post every cash-book update first.',
    },
    {
      id: 'reconciled',
      source: 'metric',
      key: 'timing-items',
      pendingLabel: 'Place the remaining timing differences.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Choose the first action',
      lead: 'Decide which record must be updated before reconciling timing differences.',
      success: 'order-ready',
    },
    {
      id: 'update',
      phase: 'act',
      title: 'Update the cash book first',
      lead: 'Post bank charges, direct debits and credit transfers discovered on the statement.',
      reveal: ['model', 'evidence'],
      controls: true,
      success: 'cash-book-ready',
    },
    {
      id: 'reconcile',
      phase: 'observe',
      title: 'Reconcile timing differences',
      lead: 'Now place unpresented cheques and deposits not yet credited.',
      reveal: ['model', 'evidence'],
      controls: true,
      success: 'reconciled',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the equality',
      lead: 'Confirm that both records describe the same cash after timing is aligned.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Reverse the starting point',
      lead: 'Read the reconciliation in reverse from bank statement to updated cash book.',
      reveal: ['model', 'evidence'],
    },
  ],
});
