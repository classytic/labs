import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const circuitActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Power the circuit',
  objectives: ['Trace a complete current path', 'Relate switch state and source voltage to circuit current'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the open circuit',
      lead: 'Decide what an open switch does to current.',
      success: 'switch-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Complete the path',
      lead: 'Operate switches and tune the source to reach the authored goal.',
      controls: true,
      reveal: ['model'],
      success: 'goal-reached',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Trace the live path',
      lead: 'Follow the energized branch through each component and read its current.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the result',
      lead: 'Name the closed path and the components limiting current.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Change the source',
      lead: 'Vary the source voltage and predict how bulb current and brightness respond.',
      controls: true,
    },
  ],
  questions: [
    {
      id: 'switch',
      prompt: 'In this simple series path, an open switch makes current…',
      choices: [
        { value: 'zero', label: 'zero' },
        { value: 'larger', label: 'larger' },
        { value: 'unchanged', label: 'unchanged' },
      ],
      answer: 'zero',
      explain: 'An open switch breaks the conducting path.',
    },
  ],
  success: [
    {
      id: 'switch-answer',
      source: 'answer',
      key: 'switch',
      operator: 'eq',
      value: 'zero',
      pendingLabel: 'Predict the open-switch current.',
    },
    {
      id: 'goal-reached',
      source: 'metric',
      key: 'solved',
      operator: 'eq',
      value: true,
      pendingLabel: 'Operate the circuit until the authored goal is reached.',
    },
  ],
});
