import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const photoelectricActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Can brighter light free an electron?',
  objectives: [
    'Discover the threshold frequency',
    'Separate photon energy from photon rate',
    'Measure maximum kinetic energy with stopping potential',
  ],
  success: [
    {
      id: 'intensity',
      source: 'answer',
      key: 'intensity',
      pendingLabel: 'Distinguish intensity from frequency.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict before illuminating',
      lead: 'Can intense red light eject electrons from every metal?',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Tune the light',
      lead: 'Change wavelength, brightness, metal, and collector bias.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Find the threshold',
      lead: 'Emission begins abruptly when hf exceeds the work function.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Balance one photon',
      lead: 'Kmax = hf − φ; brightness changes how many photons arrive.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Identify an unknown metal',
      lead: 'Use its threshold or stopping potential.',
    },
  ],
  questions: [
    {
      id: 'intensity',
      prompt: 'Above threshold, increasing intensity mainly changes…',
      choices: [
        { value: 'count', label: 'the number of emitted electrons' },
        { value: 'energy', label: 'each electron’s maximum energy' },
        { value: 'threshold', label: 'the metal’s threshold frequency' },
      ],
      answer: 'count',
      explain:
        'Intensity changes photon arrival rate. At fixed frequency, each photon still has the same energy hf.',
    },
  ],
});
