import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';

export const activity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Physics Practical Studio',
  objectives: [
    'Plan a fair test with suitable apparatus and variables.',
    'Collect repeated measurements and interpret a graph-ready table.',
    'Evaluate uncertainty and propose a practical improvement.',
  ],
  questions: [
    {
      id: 'timing-improvement',
      prompt: 'Which change most directly reduces percentage timing uncertainty?',
      choices: [
        { value: 'more-swings', label: 'Time more oscillations, then divide by their number' },
        { value: 'heavier-bob', label: 'Use a heavier pendulum bob' },
        { value: 'larger-angle', label: 'Release from a much larger angle' },
      ],
      answer: 'more-swings',
      explain: 'A longer measured interval makes reaction time a smaller percentage of the reading.',
    },
  ],
  success: [
    { id: 'plan-ready', source: 'metric', key: 'apparatus', pendingLabel: 'Choose the essential apparatus.' },
    { id: 'table-ready', source: 'metric', key: 'readings', pendingLabel: 'Record three different lengths.' },
    {
      id: 'evaluation-ready',
      source: 'answer',
      key: 'timing-improvement',
      pendingLabel: 'Choose an effective improvement.',
    },
  ],
  steps: [
    {
      id: 'plan',
      phase: 'predict',
      title: 'Plan the fair test',
      lead: 'Choose the apparatus needed to measure how pendulum length affects period.',
      controls: true,
      success: 'plan-ready',
    },
    {
      id: 'measure',
      phase: 'act',
      title: 'Collect repeated readings',
      lead: 'Change length and time ten oscillations. Record at least three different lengths.',
      reveal: ['model', 'evidence'],
      controls: true,
      success: 'table-ready',
    },
    {
      id: 'interpret',
      phase: 'observe',
      title: 'Interpret the evidence',
      lead: 'Compare period squared with length and inspect the measurement uncertainty.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the pattern',
      lead: 'Use the table to explain the relationship between length and period squared.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'evaluate',
      phase: 'transfer',
      title: 'Improve the method',
      lead: 'Select the change that most directly reduces timing uncertainty.',
      reveal: ['model', 'evidence'],
      success: 'evaluation-ready',
    },
  ],
});
