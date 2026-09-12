import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const atomicOrbitalActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Atomic orbitals are probability models',
  objectives: [
    'Distinguish an orbital probability distribution from a classical electron path',
    'Connect orbital quantum numbers to symmetry and radial or angular nodes',
    'Interpret wavefunction phase separately from probability density and electrical charge',
  ],
  success: [
    {
      id: 'meaning-understood',
      source: 'answer',
      key: 'meaning',
      pendingLabel: 'Choose what the probability cloud represents.',
    },
    {
      id: 'model-explained',
      source: 'reflection',
      key: 'model-explanation',
      pendingLabel: 'Explain how the picture differs from an electron orbit.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the node',
      lead: 'Choose where probability should fall to zero before rotating the model.',
      success: 'meaning-understood',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Rotate and compare',
      lead: 'Change orbital and viewpoint; phase colour is wavefunction sign, not charge.',
      reveal: ['model', 'evidence'],
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Find zero-probability regions',
      lead: 'Use the cross-section and node counts as evidence.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the representation',
      lead: 'Explain why the dots are samples rather than moving electrons.',
      success: 'model-explained',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Transfer to another orbital',
      lead: 'Predict the nodes of a different n and l, then test it.',
      reveal: ['model', 'evidence'],
      controls: true,
    },
  ],
  questions: [
    {
      id: 'meaning',
      prompt: 'What does a brighter, denser region represent?',
      choices: [
        { value: 'probability', label: 'greater probability density' },
        { value: 'path', label: 'the electron’s orbit path' },
        { value: 'charge', label: 'more positive charge' },
      ],
      answer: 'probability',
      explain:
        'For a one-electron orbital model, |ψ|² gives probability density. The dots are deterministic samples of that density, not a trajectory.',
    },
    {
      kind: 'reflection',
      id: 'model-explanation',
      prompt: 'How does this probability model differ from a planet-like electron orbit?',
      rubric: [
        'States that the cloud represents probability density rather than a path',
        'Distinguishes wavefunction phase colour from charge',
      ],
    },
  ],
});
