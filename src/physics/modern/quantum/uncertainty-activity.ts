import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const uncertaintyActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Can a particle be sharp in position and momentum?',
  objectives: [
    'Interpret spread as quantum uncertainty',
    'Connect position and momentum as Fourier-paired descriptions',
    'Recognize a Gaussian minimum-uncertainty state',
  ],
  success: [{ id: 'cause', source: 'answer', key: 'cause', pendingLabel: 'Explain the reciprocal widths.' }],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the momentum view',
      lead: 'What happens when the packet is localized?',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Narrow the position window',
      lead: 'Change one width and watch both distributions.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Compare the spreads',
      lead: 'Read Δx, Δp, and their product.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Connect the Fourier pair',
      lead: 'A narrow shape requires a broader range of wave numbers.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Reject the instrument myth',
      lead: 'The distributions belong to the prepared quantum state, not merely an inaccurate ruler.',
    },
  ],
  questions: [
    {
      id: 'cause',
      prompt: 'Why does a narrowly localized Gaussian have a broad momentum distribution?',
      choices: [
        { value: 'fourier', label: 'Its position and momentum wavefunctions are Fourier pairs' },
        { value: 'camera', label: 'The detector is simply out of focus' },
        { value: 'slower', label: 'Localization makes every particle slower' },
      ],
      answer: 'fourier',
      explain:
        'Narrow support in one member of a Fourier pair requires broad support in the other. For this minimum-uncertainty Gaussian, ΔxΔp = ℏ/2.',
    },
  ],
});
