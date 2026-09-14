import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';

export const activity = defineAuthoredActivity({
  pattern: 'construction',
  title: 'Log Law Workbench',
  objectives: [
    'Choose the logarithm law that matches the operation.',
    'Move powers to coefficients without changing the value.',
    'Use change of base to evaluate or solve an exponential equation.',
  ],
  questions: [
    {
      id: 'predict-product',
      prompt: 'Which expression equals log_a(mn)?',
      choices: [
        { value: 'sum', label: 'log_a(m) + log_a(n)' },
        { value: 'product', label: 'log_a(m) log_a(n)' },
        { value: 'difference', label: 'log_a(m) - log_a(n)' },
      ],
      answer: 'sum',
      explain: 'Multiplication inside one logarithm becomes addition outside it.',
    },
    {
      id: 'transfer-solve',
      prompt: 'If 3^x = 17, which exact expression gives x?',
      choices: [
        { value: 'ratio', label: 'log(17) / log(3)' },
        { value: 'product', label: 'log(17) log(3)' },
        { value: 'difference', label: 'log(17) - log(3)' },
      ],
      answer: 'ratio',
      explain: 'Taking logs gives x log(3) = log(17), so divide by log(3).',
    },
  ],
  success: [
    {
      id: 'product-law',
      source: 'answer',
      key: 'predict-product',
      pendingLabel: 'Connect a product to a sum of logs.',
    },
    {
      id: 'laws-tested',
      source: 'metric',
      key: 'laws-tested',
      pendingLabel: 'Check every core logarithm law.',
    },
    {
      id: 'exponential-solved',
      source: 'answer',
      key: 'transfer-solve',
      pendingLabel: 'Solve an unfamiliar exponential equation.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the product law',
      lead: 'Commit before opening the workbench.',
      success: 'product-law',
    },
    {
      id: 'build',
      phase: 'act',
      title: 'Match each structure',
      lead: 'Choose a law, then select its equivalent form.',
      controls: true,
      success: 'laws-tested',
    },
    {
      id: 'evidence',
      phase: 'observe',
      title: 'Read the reversible pattern',
      lead: 'Combining and splitting are the same laws used in opposite directions.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Name the restrictions',
      lead: 'A real logarithm needs a positive argument, a positive base, and a base not equal to one.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Solve by changing base',
      lead: 'Turn the unknown index into a coefficient.',
      success: 'exponential-solved',
    },
  ],
});
