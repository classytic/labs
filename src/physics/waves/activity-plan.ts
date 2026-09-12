import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const waveActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Make a wave, then explain the pattern',
  objectives: [
    'Predict a wave response',
    'Manipulate the live model',
    'Explain the visible pattern using wave quantities',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the pattern',
      lead: 'Commit to what you expect before playing the model.',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Run the wave',
      lead: 'Play the model and change one wave quantity.',
      controls: true,
      reveal: ['model'],
      success: 'played',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the evidence',
      lead: 'Compare the moving pattern with its measurements.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the pattern',
      lead: 'Connect the visible motion to wavelength, frequency, phase, or boundary conditions.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Make a contrasting case',
      lead: 'Change the model and compare the new pattern.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
  ],
  success: [
    {
      id: 'played',
      source: 'metric',
      key: 'played',
      operator: 'eq',
      value: true,
      pendingLabel: 'Play the wave model.',
    },
  ],
});
