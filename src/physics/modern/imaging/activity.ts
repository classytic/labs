import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';

export const xrayAttenuationActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'What makes contrast in an X-ray image?',
  objectives: [
    'Model attenuation through layered matter',
    'Connect detector exposure to radiograph brightness',
    'Test how thickness and photon energy change contrast',
  ],
  success: [
    {
      id: 'exposure-complete',
      source: 'metric',
      key: 'exposure-complete',
      pendingLabel: 'Run one complete detector exposure.',
    },
    { id: 'bone', source: 'answer', key: 'bone', pendingLabel: 'Explain why bone appears light.' },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the detector image',
      lead: 'Which path sends fewer photons to the detector?',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Change the specimen',
      lead: 'Adjust photon energy and layer thickness.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read both paths',
      lead: 'Compare transmitted fractions before image inversion.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Follow Beer–Lambert attenuation',
      lead: 'Each layer adds optical depth: I/I₀ = e⁻Σμx.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Design useful contrast',
      lead: 'Find settings that distinguish the insert without treating this model as clinical guidance.',
    },
  ],
  questions: [
    {
      id: 'bone',
      prompt: 'Why does the bone insert look lighter in the conventional radiograph view?',
      choices: [
        { value: 'absorbs', label: 'It attenuates more photons, exposing the detector less' },
        { value: 'emits', label: 'It emits visible white light' },
        { value: 'faster', label: 'Photons travel faster through bone' },
      ],
      answer: 'absorbs',
      explain:
        'The denser path has greater optical depth, so fewer photons reach the detector. Conventional display maps lower exposure to a lighter tone.',
    },
  ],
});
