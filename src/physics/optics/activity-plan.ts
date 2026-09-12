import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const opticsActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Predict, trace, and explain a light path',
  objectives: [
    'Predict the light path',
    'Manipulate the optical system',
    'Explain the result with a ray rule',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the path',
      lead: 'Commit to where the ray or image will go before changing the model.',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Change the optical system',
      lead: 'Move one optical element or change one measured quantity.',
      controls: true,
      reveal: ['model'],
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Trace the evidence',
      lead: 'Follow the principal rays and read the measurements.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the result',
      lead: 'Connect the visible path to reflection, refraction, or the imaging equation.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Test a contrasting case',
      lead: 'Cross a focal landmark, swap media, or alter a reflecting surface.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
  ],
});
