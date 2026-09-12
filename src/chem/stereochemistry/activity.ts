import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const stereochemistryActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Can a molecule escape its mirror image?',
  objectives: [
    'Recognize a tetrahedral stereogenic centre',
    'Apply CIP priority order',
    'Distinguish enantiomers from conformations',
  ],
  success: [
    {
      id: 'mirror-understood',
      source: 'answer',
      key: 'superimposable',
      pendingLabel: 'Decide whether the mirror pair can be superimposed.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the mirror relationship',
      lead: 'Commit before rotating either structure.',
      reveal: ['model'],
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Rotate and mirror',
      lead: 'Turn the tetrahedron and compare all four substituents.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Follow priorities 1 → 2 → 3',
      lead: 'Keep priority 4 pointing away when assigning R or S.',
      reveal: ['model'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain why rotation is insufficient',
      lead: 'A reflection reverses handedness; an ordinary rotation preserves it.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Test a different carbon centre',
      lead: 'Decide whether changing one substituent creates or removes chirality.',
    },
  ],
  questions: [
    {
      id: 'superimposable',
      prompt:
        'A tetrahedral carbon has four different groups. Is its mirror image superimposable by rotation alone?',
      choices: [
        { value: 'yes', label: 'Yes — rotate it' },
        { value: 'no', label: 'No — it is an enantiomer' },
        { value: 'sometimes', label: 'Only around one bond' },
      ],
      answer: 'no',
      explain:
        'Rotation preserves handedness. A mirror reflection reverses the configuration from R to S or S to R.',
    },
    {
      id: 'duplicate-group',
      prompt: 'If two groups attached to the tetrahedral carbon are identical, is that carbon stereogenic?',
      choices: [
        { value: 'no', label: 'No' },
        { value: 'yes', label: 'Yes' },
      ],
      answer: 'no',
      explain:
        'A tetrahedral stereogenic centre requires four different substituents; a duplicate pair removes that handedness.',
    },
  ],
});
