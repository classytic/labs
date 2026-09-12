import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const lengthContractionActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Measure both ends at one time',
  objectives: [
    'Distinguish proper length from contracted length',
    'Explain why endpoint measurements must be simultaneous',
    'Connect length contraction to the Lorentz transformation',
  ],
  success: [
    {
      id: 'measurement-complete',
      source: 'metric',
      key: 'measurement-complete',
      pendingLabel: 'Complete one simultaneous endpoint measurement.',
    },
    { id: 'method', source: 'answer', key: 'method', pendingLabel: 'Choose a valid length measurement.' },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the ruler reading',
      lead: 'How should the platform mark both ends of a moving rod?',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Change the speed',
      lead: 'Keep proper length fixed while β changes.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Inspect endpoint events',
      lead: 'Platform marks share a time; rod-frame transformed marks do not.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Identify proper length',
      lead: 'The rest frame measures both ends simultaneously at rest.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Design a measurement',
      lead: 'Choose speed and proper length for a target reading.',
    },
  ],
  questions: [
    {
      id: 'method',
      prompt: 'To measure a moving rod’s length in the platform frame, you must record…',
      choices: [
        { value: 'same-time', label: 'both endpoint positions at the same platform time' },
        { value: 'same-place', label: 'both endpoints at the same position' },
        { value: 'any-time', label: 'each endpoint whenever convenient' },
      ],
      answer: 'same-time',
      explain:
        'Length is the spatial separation of endpoint events selected simultaneously in the measuring frame.',
    },
  ],
});
