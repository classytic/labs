import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const rcChargingActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'RC charging: filling the capacitor',
  objectives: [
    'Relate the time constant to resistance and capacitance',
    'Interpret charging and discharging curves',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict one time constant',
      lead: 'Commit before changing the circuit.',
      success: 'one-tau-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Move through time',
      lead: 'Compare charge and discharge at one and five time constants.',
      controls: true,
      reveal: ['model'],
      success: 'time-tested',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the linked views',
      lead: 'Connect capacitor fill, curve position and the voltage readout.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Connect R, C and τ',
      lead: 'Use the curve and readouts to explain how the time scale changes.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Redesign the time constant',
      lead: 'Change R or C and compare the new time scale without changing the curve shape.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'tau-changed',
    },
  ],
  questions: [
    {
      id: 'one-tau',
      prompt: 'After one time constant, a charging capacitor reaches about…',
      choices: [
        { value: '37', label: '37%' },
        { value: '50', label: '50%' },
        { value: '63', label: '63%' },
        { value: '100', label: '100%' },
      ],
      answer: '63',
      explain: 'For charging, Vc/Vs = 1 − e⁻¹ ≈ 0.632 at t = τ.',
    },
  ],
  success: [
    {
      id: 'one-tau-answer',
      source: 'answer',
      key: 'one-tau',
      operator: 'eq',
      value: '63',
      pendingLabel: 'Choose the one-time-constant value.',
    },
    {
      id: 'time-tested',
      source: 'metric',
      key: 'time',
      operator: 'gte',
      value: 1,
      pendingLabel: 'Move time to at least one τ.',
    },
    {
      id: 'tau-changed',
      source: 'metric',
      key: 'tauChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change resistance or capacitance.',
    },
  ],
});
