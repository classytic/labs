import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';

export const activity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Linearisation Lab',
  objectives: [
    'Choose transformed axes that produce a straight line.',
    'Read constants from the gradient and intercept.',
    'Translate the straight-line result back to the original model.',
  ],
  questions: [
    {
      id: 'predict-axes',
      prompt: 'For y = Ax^n, which plot is linear?',
      choices: [
        { value: 'log-log', label: 'log y against log x' },
        { value: 'y-x', label: 'y against x' },
        { value: 'logy-x', label: 'log y against x' },
      ],
      answer: 'log-log',
      explain: 'Taking logs gives log y = n log x + log A.',
    },
  ],
  success: [
    { id: 'axes', source: 'answer', key: 'predict-axes', pendingLabel: 'Choose axes for a power law.' },
    { id: 'constants', source: 'metric', key: 'constants', pendingLabel: 'Recover both constants.' },
    { id: 'transfer', source: 'metric', key: 'transfer', pendingLabel: 'Linearise a second model.' },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the axes',
      lead: 'Decide what each axis must contain.',
      success: 'axes',
    },
    {
      id: 'recover',
      phase: 'act',
      title: 'Recover A and n',
      lead: 'Match gradient and intercept to the transformed equation.',
      controls: true,
      success: 'constants',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Connect both equations',
      lead: 'The straight line stores the original constants.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Write the comparison line',
      lead: 'Compare with Y = mX + c before reading any constants.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Change the model',
      lead: 'For y = Ab^x, use log y against x.',
      controls: true,
      success: 'transfer',
    },
  ],
});
