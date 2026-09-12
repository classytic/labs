import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';

export const xraySpectrumActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Build and filter an X-ray spectrum',
  objectives: [
    'Connect tube voltage to maximum photon energy',
    'Distinguish bremsstrahlung from characteristic lines',
    'Explain beam hardening by filtration',
  ],
  success: [
    {
      id: 'exposure-complete',
      source: 'metric',
      key: 'exposure-complete',
      pendingLabel: 'Run one complete tube exposure.',
    },
    { id: 'filter', source: 'answer', key: 'filter', pendingLabel: 'Explain what filtration changes.' },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the cutoff',
      lead: 'How energetic can one photon become?',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Accelerate electrons',
      lead: 'Change voltage, target, and aluminium filtration.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the spectrum',
      lead: 'Find the continuum, endpoint, and target lines.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Account for the energy',
      lead: 'Electron braking makes a continuum; shell transitions add discrete peaks.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Shape the beam',
      lead: 'Remove low-energy photons while preserving a useful spectrum.',
    },
  ],
  questions: [
    {
      id: 'filter',
      prompt: 'Adding aluminium filtration mainly removes…',
      choices: [
        { value: 'low', label: 'lower-energy photons' },
        { value: 'endpoint', label: 'only the endpoint photons' },
        { value: 'lines', label: 'only characteristic lines' },
      ],
      answer: 'low',
      explain:
        'Low-energy photons are preferentially attenuated, raising the spectrum’s mean energy while reducing total output.',
    },
  ],
});
