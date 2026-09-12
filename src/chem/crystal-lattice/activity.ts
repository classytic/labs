import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const crystalLatticeActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'From one unit cell to a crystal',
  objectives: [
    'Distinguish simple cubic, BCC, and FCC unit cells',
    'Relate shared lattice sites to atoms per unit cell',
    'Compare coordination number and packing efficiency',
  ],
  success: [
    {
      id: 'packing-understood',
      source: 'answer',
      key: 'densest',
      pendingLabel: 'Identify the most efficiently packed cubic structure.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the densest cell',
      lead: 'Choose a structure before comparing its evidence.',
      reveal: ['model'],
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Build the repeating solid',
      lead: 'Change the unit cell and repeat it through space.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read local and bulk structure',
      lead: 'Connect neighbours and shared sites to the unit-cell totals.',
      reveal: ['model'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the packing',
      lead: 'Use geometry rather than the apparent number of drawn spheres.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Choose a structure for a new material',
      lead: 'Apply coordination and packing evidence to a material-design decision.',
    },
  ],
  questions: [
    {
      id: 'densest',
      prompt: 'Which cubic structure has the greatest packing efficiency?',
      choices: [
        { value: 'sc', label: 'Simple cubic' },
        { value: 'bcc', label: 'Body-centred cubic' },
        { value: 'fcc', label: 'Face-centred cubic' },
      ],
      answer: 'fcc',
      explain: 'FCC packs atoms along face diagonals and occupies about 74% of the cell.',
    },
    {
      id: 'material-choice',
      prompt: 'A model needs the greatest coordination and least empty space. Which unit cell should it use?',
      choices: [
        { value: 'fcc', label: 'FCC' },
        { value: 'bcc', label: 'BCC' },
        { value: 'sc', label: 'Simple cubic' },
      ],
      answer: 'fcc',
      explain:
        'FCC combines coordination number 12 with about 74% packing efficiency, the highest of these cubic cells.',
    },
  ],
});
