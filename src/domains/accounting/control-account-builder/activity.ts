import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';

export const activity = defineAuthoredActivity({
  pattern: 'allocation',
  title: 'Control Account Builder',
  objectives: [
    'Source control-account entries from the correct books of prime entry.',
    'Place entries on the debit or credit side of sales and purchases ledger control accounts.',
    'Balance a control account and interpret its closing balance.',
  ],
  questions: [
    {
      id: 'control-source',
      prompt: 'Where do most control-account postings come from?',
      choices: [
        { value: 'totals', label: 'Totals in books of prime entry' },
        { value: 'invoice', label: 'One selected invoice only' },
        { value: 'statement', label: 'The statement of financial position' },
      ],
      answer: 'totals',
      explain:
        'Control accounts summarise totals from the books of prime entry and help check subsidiary ledgers.',
    },
  ],
  success: [
    {
      id: 'source-ready',
      source: 'answer',
      key: 'control-source',
      pendingLabel: 'Identify the source of control-account postings.',
    },
    {
      id: 'sales-built',
      source: 'metric',
      key: 'sales-control',
      pendingLabel: 'Place every sales ledger control entry.',
    },
    {
      id: 'purchases-built',
      source: 'metric',
      key: 'purchases-control',
      pendingLabel: 'Place every purchases ledger control entry.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Find the source',
      lead: 'Identify where control-account totals originate.',
      success: 'source-ready',
    },
    {
      id: 'sales',
      phase: 'act',
      title: 'Build sales ledger control',
      lead: 'Classify each total by the side it enters in the sales ledger control account.',
      reveal: ['model', 'evidence'],
      controls: true,
      success: 'sales-built',
    },
    {
      id: 'purchases',
      phase: 'observe',
      title: 'Build purchases ledger control',
      lead: 'Apply the mirrored logic to amounts owed to suppliers.',
      reveal: ['model', 'evidence'],
      controls: true,
      success: 'purchases-built',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Read the closing balances',
      lead: 'Connect each balance carried down to trade receivables or trade payables.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Use control as a check',
      lead: 'Explain why agreement supports—but does not prove—the absence of errors.',
      reveal: ['model', 'evidence'],
    },
  ],
});
