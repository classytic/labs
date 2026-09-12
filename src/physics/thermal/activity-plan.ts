import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const thermalActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Track energy and explain the thermal change',
  objectives: [
    'Predict the thermal response',
    'Change one physical quantity',
    'Explain the energy transfer with evidence',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the change',
      lead: 'Commit to the direction or relative size of the thermal response.',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Run the experiment',
      lead: 'Change one material, temperature, geometry, or process.',
      controls: true,
      reveal: ['model'],
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the energy evidence',
      lead: 'Compare the scene with its measured energy, rate, or state.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the mechanism',
      lead: 'Connect the evidence to particles, energy conservation, or a thermodynamic law.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Test a contrasting case',
      lead: 'Change the mechanism, boundary, material, or device and compare.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
  ],
});
