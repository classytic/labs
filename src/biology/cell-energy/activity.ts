import { defineAuthoredActivity } from '../../kit/activity-authoring.js';
export const cellEnergyActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Keep a working cell supplied with ATP',
  objectives: [
    'Connect glucose and oxygen delivery to mitochondrial ATP production',
    'Identify the limiting respiratory input',
    'Relate ATP supply to active cellular work',
  ],
  success: [
    { id: 'oxygen', source: 'answer', key: 'oxygen', pendingLabel: 'Explain the effect of oxygen shortage.' },
  ],
  steps: [
    {
      id: 'inputs',
      phase: 'predict',
      title: 'Trace matter into the cell',
      lead: 'Follow glucose and oxygen from the membrane to mitochondria.',
    },
    {
      id: 'demand',
      phase: 'act',
      title: 'Raise cellular work',
      lead: 'Increase ATP demand and keep supply matched.',
      controls: true,
    },
    {
      id: 'limit',
      phase: 'observe',
      title: 'Find the limiting input',
      lead: 'Change one respiratory input at a time.',
    },
    {
      id: 'oxygen',
      phase: 'explain',
      title: 'Remove oxygen',
      lead: 'Compare aerobic respiration with low-yield fermentation.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Explain fatigue',
      lead: 'Connect constrained ATP supply to reduced cellular work.',
    },
  ],
  questions: [
    {
      id: 'oxygen',
      prompt: 'Why does ATP production fall sharply when oxygen becomes limiting?',
      choices: [
        { value: 'acceptor', label: 'Oxygen enables high-yield aerobic respiration' },
        { value: 'fuel', label: 'Oxygen is converted directly into glucose' },
        { value: 'pump', label: 'Oxygen mechanically pumps ATP' },
      ],
      answer: 'acceptor',
      explain:
        'Oxygen is the final electron acceptor in aerobic respiration. Without it, oxidative phosphorylation stops and fermentation yields far less ATP per glucose.',
    },
  ],
});
