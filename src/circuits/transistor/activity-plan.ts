import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const transistorActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'A gate electric field controls a separate drain current',
  objectives: ['Relate gate drive to channel formation', 'Interpret a MOSFET transfer curve'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict below threshold',
      lead: 'Commit before moving the gate control.',
      success: 'off-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Cross the threshold',
      lead: 'Move the gate through threshold and inspect both views.',
      controls: true,
      reveal: ['model'],
      success: 'channel-formed',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the linked views',
      lead: 'Compare the lamp, operating point and drain-current readout.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the operating point',
      lead: 'Connect gate drive, drain current, load and drain voltage.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Compare two loads',
      lead: 'Keep the channel on, then make a clear load change and explain why drain current and voltage change.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'load-compared',
    },
  ],
  questions: [
    {
      id: 'on',
      prompt:
        'In this idealized switch model, a useful channel forms when the gate voltage exceeds threshold Vₜₕ. With the gate held below Vₜₕ, which state does the model show?',
      choices: [
        { value: 'on', label: 'ON (lamp lit, drain current flows)' },
        { value: 'off', label: 'OFF (lamp dark, no drain current)' },
      ],
      answer: 'off',
      explain:
        'Below threshold this model treats channel current as negligible, so the lamp stays dark. Real MOSFETs have a gradual subthreshold region rather than a perfectly sharp boundary.',
    },
  ],
  success: [
    {
      id: 'off-answer',
      source: 'answer',
      key: 'on',
      operator: 'eq',
      value: 'off',
      pendingLabel: 'Predict the below-threshold state.',
    },
    {
      id: 'channel-formed',
      source: 'metric',
      key: 'on',
      operator: 'eq',
      value: true,
      pendingLabel: 'Raise the gate until a channel forms.',
    },
    {
      id: 'load-compared',
      source: 'metric',
      key: 'loadChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change the load resistance.',
    },
  ],
});
