import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const mechanicsActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Predict, run, and explain the physical system',
  objectives: [
    'Predict the physical response',
    'Manipulate one system variable',
    'Explain the result using measured evidence',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the response',
      lead: 'Commit to a direction, ordering, or outcome before running the model.',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Run the model',
      lead: 'Change one physical variable or start the experiment.',
      controls: true,
      reveal: ['model'],
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the evidence',
      lead: 'Compare motion, forces, and energy with the measured quantities.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the result',
      lead: 'Use a conservation law or force relationship to explain the evidence.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Test a contrasting case',
      lead: 'Change the initial condition or constraint and compare outcomes.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
  ],
});
