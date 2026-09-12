import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const capacitorLeakActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Charge, hold and leak',
  objectives: [
    'Relate the RC time constant to exponential change',
    'Connect capacitor voltage, field strength and stored charge',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict one time constant',
      lead: 'Choose the remaining fraction during discharge.',
      success: 'decay-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Charge then leak',
      lead: 'Fill the capacitor, switch paths and compare time constants.',
      controls: true,
      reveal: ['model'],
      success: 'discharged',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the linked views',
      lead: 'Connect plate field, capacitor voltage and the exponential trace.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the curve',
      lead: 'Connect the shrinking voltage difference to the slowing rate.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Redesign the hold time',
      lead: 'Change capacitance or leakage resistance and compare the discharge time constant.',
      controls: true,
    },
  ],
  questions: [
    {
      id: 'decay',
      prompt: 'After one discharge time constant, about how much voltage remains?',
      choices: [
        { value: '37', label: '37%' },
        { value: '63', label: '63%' },
        { value: '0', label: '0%' },
      ],
      answer: '37',
      explain: 'Exponential discharge leaves e⁻¹ ≈ 37% after one time constant.',
    },
  ],
  success: [
    {
      id: 'decay-answer',
      source: 'answer',
      key: 'decay',
      operator: 'eq',
      value: '37',
      pendingLabel: 'Predict the one-time-constant remainder.',
    },
    {
      id: 'discharged',
      source: 'metric',
      key: 'fraction',
      operator: 'lte',
      value: 0.05,
      pendingLabel: 'Charge, switch to leak, and let the voltage fall below 5%.',
    },
  ],
});
