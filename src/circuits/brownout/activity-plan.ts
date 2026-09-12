import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const brownoutActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'When a supply rail sags',
  objectives: ['Relate supply voltage to valid logic levels', 'Distinguish a brownout from component damage'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the failing signal',
      lead: 'Decide what happens below the usable supply range.',
      success: 'brownout-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Sag the supply',
      lead: 'Move from a healthy rail through the marginal band into brownout.',
      controls: true,
      reveal: ['model'],
      success: 'brownout-tested',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the shrinking margin',
      lead: 'Compare rail voltage, output swing and the valid-logic bands.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the lost noise margin',
      lead: 'Connect transistor drive, output swing and valid logic thresholds.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Recover the logic rail',
      lead: 'Raise the supply through the marginal band and find a robust operating point.',
      controls: true,
    },
  ],
  questions: [
    {
      id: 'brownout',
      prompt: 'When the supply is too low for the modeled transistors, the output becomes…',
      choices: [
        { value: 'invalid', label: 'an invalid logic level' },
        { value: 'perfect', label: 'perfect but slower' },
        { value: 'damaged', label: 'permanently damaged' },
      ],
      answer: 'invalid',
      explain: 'The model loses usable output swing; a brownout does not by itself imply damage.',
    },
  ],
  success: [
    {
      id: 'brownout-answer',
      source: 'answer',
      key: 'brownout',
      operator: 'eq',
      value: 'invalid',
      pendingLabel: 'Predict the low-supply output.',
    },
    {
      id: 'brownout-tested',
      source: 'metric',
      key: 'zone',
      operator: 'eq',
      value: 'dead',
      pendingLabel: 'Lower the rail until the modeled output becomes invalid.',
    },
  ],
});
