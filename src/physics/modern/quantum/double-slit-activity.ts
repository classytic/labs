import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const doubleSlitActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Random dots, lawful pattern',
  objectives: [
    'Distinguish individual detections from the probability distribution',
    'Relate fringe spacing to wavelength and slit separation',
    'Explain why available path information removes interference',
  ],
  success: [{ id: 'path', source: 'answer', key: 'path', pendingLabel: 'Explain the which-path result.' }],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict one photon',
      lead: 'Can you predict its exact landing point?',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Accumulate detections',
      lead: 'Increase exposure and change the apparatus.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Find order in randomness',
      lead: 'Individual events build a repeatable distribution.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Reveal the path',
      lead: 'Make path information available and compare.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Spread the fringes',
      lead: 'Change wavelength or slit separation.',
    },
  ],
  questions: [
    {
      id: 'path',
      prompt: 'Why does the interference pattern vanish when path information is available?',
      choices: [
        { value: 'distinguishable', label: 'The alternatives become distinguishable' },
        { value: 'blocked', label: 'Both slits become blocked' },
        { value: 'faster', label: 'Photons travel faster' },
      ],
      answer: 'distinguishable',
      explain:
        'Interference requires indistinguishable alternatives. A path-marking interaction removes their coherent cross term.',
    },
  ],
});
