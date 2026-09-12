import { defineAuthoredActivity } from '../../kit/activity-authoring.js';
export const membraneTransportActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Predict what crosses the membrane',
  objectives: [
    'Use concentration gradients to predict net movement',
    'Distinguish channels from pumps',
    'Explain osmosis as net water movement',
  ],
  success: [
    {
      id: 'energy',
      source: 'answer',
      key: 'energy',
      pendingLabel: 'Identify the energy-dependent mechanism.',
    },
  ],
  steps: [
    {
      id: 'gradient',
      phase: 'predict',
      title: 'Read the gradient',
      lead: 'Compare particle concentration on both sides.',
    },
    {
      id: 'pathway',
      phase: 'act',
      title: 'Choose a pathway',
      lead: 'Switch between bilayer, channel, water, and pump transport.',
      controls: true,
    },
    {
      id: 'evidence',
      phase: 'observe',
      title: 'Follow individual particles',
      lead: 'Separate random molecular motion from net movement.',
    },
    {
      id: 'energy',
      phase: 'explain',
      title: 'Challenge the gradient',
      lead: 'Remove ATP and inspect what the pump can do.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Apply it to a cell',
      lead: 'Predict swelling, shrinking, or solute uptake.',
    },
  ],
  questions: [
    {
      id: 'energy',
      prompt: 'Which mechanism can move a solute against its concentration gradient?',
      choices: [
        { value: 'active', label: 'An ATP-powered carrier' },
        { value: 'simple', label: 'Simple diffusion' },
        { value: 'osmosis', label: 'Osmosis' },
      ],
      answer: 'active',
      explain:
        'Active transport couples a carrier cycle to energy, commonly ATP, so net transport can oppose the concentration gradient.',
    },
  ],
});
