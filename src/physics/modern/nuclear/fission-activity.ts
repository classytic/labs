import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const fissionChainActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Hold a chain reaction steady',
  objectives: [
    'Interpret effective multiplication k',
    'Explain neutron absorption by control rods',
    'Connect fission count to released binding energy',
  ],
  success: [
    { id: 'critical', source: 'answer', key: 'critical', pendingLabel: 'Identify a steady chain reaction.' },
    {
      id: 'run-complete',
      source: 'metric',
      key: 'runComplete',
      operator: 'eq',
      value: true,
      pendingLabel: 'Run all neutron generations.',
    },
    {
      id: 'restored',
      source: 'metric',
      key: 'restored',
      operator: 'eq',
      value: true,
      pendingLabel: 'Apply a disturbance, then restore criticality.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the next generation',
      lead: 'Will each generation shrink, persist, or grow?',
      success: 'critical',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Move the absorber',
      lead: 'Insert the conceptual control rod and target k ≈ 1.',
      controls: true,
      success: 'run-complete',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Watch generations',
      lead: 'Compare produced, captured, and escaped neutrons.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Account for the energy',
      lead: 'Each fission moves products toward stronger binding.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Recover from a disturbance',
      lead: 'Change the starting multiplication and restore criticality.',
      controls: true,
      success: 'restored',
    },
  ],
  questions: [
    {
      id: 'critical',
      prompt: 'What does k = 1 mean in this generation model?',
      choices: [
        { value: 'steady', label: 'Each generation replaces itself on average' },
        { value: 'stopped', label: 'No nuclei fission' },
        { value: 'double', label: 'The population doubles each generation' },
      ],
      answer: 'steady',
      explain:
        'At k = 1, each neutron generation produces one equally large successor generation on average.',
    },
  ],
});
