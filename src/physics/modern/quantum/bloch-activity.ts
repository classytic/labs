import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const blochSphereActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'A qubit is more than a probability slider',
  objectives: [
    'Map amplitudes to a Bloch vector',
    'Predict measurements in X, Y, and Z bases',
    'Distinguish a superposition from a classical mixture',
  ],
  success: [{ id: 'plus', source: 'answer', key: 'plus', pendingLabel: 'Predict the |+⟩ measurement.' }],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Point before measuring',
      lead: 'Choose |+⟩ and predict a Z measurement.',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Rotate the state',
      lead: 'Change polar and phase angles.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Change measurement basis',
      lead: 'The state stays fixed while the question changes.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Read amplitudes',
      lead: 'Latitude controls populations; longitude is relative phase.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Construct a target state',
      lead: 'Match an authored probability in two bases.',
    },
  ],
  questions: [
    {
      id: 'plus',
      prompt: 'For |+⟩, what is the probability of measuring 0 in the Z basis?',
      choices: [
        { value: 'half', label: '50%' },
        { value: 'all', label: '100%' },
        { value: 'none', label: '0%' },
      ],
      answer: 'half',
      explain: '|+⟩ lies on the equator: its |0⟩ and |1⟩ amplitudes have equal magnitude.',
    },
  ],
});
