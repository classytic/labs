import { defineAuthoredActivity } from '../kit/activity-authoring.js';

export const circuitDividerActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Series and parallel: what stays the same?',
  objectives: [
    'Distinguish voltage division from current division',
    'Relate topology to equivalent resistance',
    'Use the divider rules in a changed circuit',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the invariant',
      lead: 'Commit before changing the topology.',
      success: 'invariant-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Tune the circuit',
      lead: 'Change voltage or resistance and read the solver output.',
      controls: true,
      reveal: ['model'],
      success: 'value-changed',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the linked evidence',
      lead: 'Compare the schematic, equivalent resistance and branch values.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the divider rule',
      lead: 'Use what stays equal to explain what must divide.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Change the topology',
      lead: 'Switch between series and parallel and transfer the reasoning.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'topology-changed',
    },
  ],
  questions: [
    {
      id: 'invariant',
      prompt: 'In a series circuit, which quantity is the same through both resistors?',
      choices: [
        { value: 'voltage', label: 'Voltage' },
        { value: 'current', label: 'Current' },
        { value: 'power', label: 'Power' },
      ],
      answer: 'current',
      explain:
        'A series path has one branch, so the same current passes through every component while voltage divides.',
    },
  ],
  success: [
    {
      id: 'invariant-answer',
      source: 'answer',
      key: 'invariant',
      operator: 'eq',
      value: 'current',
      pendingLabel: 'Choose the series-circuit invariant.',
    },
    {
      id: 'value-changed',
      source: 'metric',
      key: 'valueChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change voltage or either resistance.',
    },
    {
      id: 'topology-changed',
      source: 'metric',
      key: 'topologyChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Switch the circuit topology.',
    },
  ],
});
