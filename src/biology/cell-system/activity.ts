import { defineAuthoredActivity } from '../../kit/activity-authoring.js';
export const cellSystemActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Ship a protein out of the cell',
  objectives: [
    'Trace information and cargo through organelles',
    'Explain why secretion follows an ordered route',
    'Diagnose organelle failure from downstream evidence',
  ],
  success: [
    { id: 'route', source: 'answer', key: 'route', pendingLabel: 'Identify the compartment after rough ER.' },
  ],
  steps: [
    {
      id: 'nucleus',
      phase: 'predict',
      title: 'Copy the instructions',
      lead: 'Start with DNA without moving it out of the nucleus.',
    },
    {
      id: 'ribosome',
      phase: 'act',
      title: 'Build the chain',
      lead: 'Follow mRNA to a ribosome.',
      controls: true,
    },
    {
      id: 'rough-er',
      phase: 'observe',
      title: 'Enter the secretory route',
      lead: 'Track the signal-directed protein into rough ER.',
    },
    {
      id: 'golgi',
      phase: 'explain',
      title: 'Modify and sort',
      lead: 'Inspect why cargo cannot skip compartments.',
    },
    {
      id: 'membrane',
      phase: 'transfer',
      title: 'Release and diagnose',
      lead: 'Break one organelle and infer the downstream consequence.',
    },
  ],
  questions: [
    {
      id: 'route',
      prompt: 'After synthesis into the rough ER, where does a secreted protein normally travel next?',
      choices: [
        { value: 'golgi', label: 'Golgi apparatus' },
        { value: 'nucleus', label: 'Back into the nucleus' },
        { value: 'mitochondrion', label: 'Mitochondrion' },
      ],
      answer: 'golgi',
      explain:
        'Transport vesicles carry folded secretory proteins from rough ER to the Golgi for modification and sorting.',
    },
  ],
});
