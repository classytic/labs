import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const molecularGeometryActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'From electron domains to molecular shape',
  objectives: [
    'Predict electron geometry and molecular shape from bonding and lone-pair domains',
    'Relate approximate bond angles and introductory hybridization labels to three-dimensional geometry',
    'Use molecular symmetry to determine whether bond dipoles cancel',
  ],
  success: [
    {
      id: 'shape-understood',
      source: 'answer',
      key: 'shape',
      pendingLabel: 'Explain why lone pairs change the named molecular shape.',
    },
    {
      id: 'polarity-explained',
      source: 'reflection',
      key: 'polarity',
      pendingLabel: 'Explain the polarity using geometry and symmetry.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict before rotating',
      lead: 'Count electron domains and predict the molecular shape.',
      success: 'shape-understood',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Rotate the structure',
      lead: 'Reveal depth and compare bonds with lone-pair domains.',
      reveal: ['model', 'evidence'],
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read geometry evidence',
      lead: 'Compare electron geometry, molecular shape, and angle.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain polarity',
      lead: 'Decide whether the bond dipoles cancel by symmetry.',
      success: 'polarity-explained',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Change the molecule',
      lead: 'Apply the same domain-counting method to another molecule.',
      reveal: ['model', 'evidence'],
      controls: true,
    },
  ],
  questions: [
    {
      id: 'shape',
      prompt: 'Why is H₂O bent although its electron-domain geometry is tetrahedral?',
      choices: [
        { value: 'lone', label: 'two tetrahedral positions contain lone pairs' },
        { value: 'orbit', label: 'oxygen travels in a curved orbit' },
        { value: 'mass', label: 'hydrogen mass bends the bonds' },
      ],
      answer: 'lone',
      explain:
        'Four electron domains arrange approximately tetrahedrally, but molecular shape names only atom positions; two positions are lone pairs.',
    },
    {
      kind: 'reflection',
      id: 'polarity',
      prompt:
        'Use the three-dimensional geometry to explain whether the selected molecule’s bond dipoles cancel.',
      rubric: [
        'Names the molecular geometry or symmetry',
        'Connects vector cancellation to the molecule’s polarity',
      ],
    },
  ],
});
