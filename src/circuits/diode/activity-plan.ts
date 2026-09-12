import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const diodeActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'The diode: a one-way valve',
  objectives: ['Relate diode orientation to current', 'Read the nonlinear current–voltage curve'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict reverse bias',
      lead: 'Decide what happens before flipping the diode.',
      success: 'reverse-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Test both orientations',
      lead: 'Flip the diode and compare the operating point, current and lamp.',
      controls: true,
      reveal: ['model'],
      success: 'orientation-tested',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the operating point',
      lead: 'Connect lamp state, current readout and the point on the I–V curve.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the nonlinear knee',
      lead: 'Use the circuit and I–V graph together.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Limit the forward current',
      lead: 'Return to forward bias, change the series resistance and compare the operating point.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'resistance-compared',
    },
  ],
  questions: [
    {
      id: 'reverse',
      prompt: 'In this model, reverse-biasing the diode makes the lamp…',
      choices: [
        { value: 'dark', label: 'dark: current is negligible' },
        { value: 'bright', label: 'brighter' },
        { value: 'same', label: 'unchanged' },
      ],
      answer: 'dark',
      explain: 'Reverse bias blocks current in this idealized operating range.',
    },
  ],
  success: [
    {
      id: 'reverse-answer',
      source: 'answer',
      key: 'reverse',
      operator: 'eq',
      value: 'dark',
      pendingLabel: 'Predict the reverse-biased state.',
    },
    {
      id: 'orientation-tested',
      source: 'metric',
      key: 'reversed',
      operator: 'eq',
      value: true,
      pendingLabel: 'Flip the diode into reverse bias.',
    },
    {
      id: 'resistance-compared',
      source: 'metric',
      key: 'resistanceChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Return forward and change the series resistance.',
    },
  ],
});
