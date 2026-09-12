import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const bindingEnergyActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Where nuclear energy comes from',
  objectives: [
    'Interpret mass defect as binding energy',
    'Read binding energy per nucleon',
    'Explain why light nuclei fuse and heavy nuclei fission toward the iron region',
  ],
  success: [
    {
      id: 'direction',
      source: 'answer',
      key: 'direction',
      pendingLabel: 'Identify the downhill energy direction.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Weigh the parts',
      lead: 'Will a bound nucleus weigh the same as its separated nucleons?',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Compare nuclei',
      lead: 'Move from hydrogen toward uranium.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Find the stability ridge',
      lead: 'Binding per nucleon rises toward the iron region.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Account for missing mass',
      lead: 'The mass difference left as energy when the nucleus formed.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Predict an energy-releasing change',
      lead: 'Move nuclei toward more binding per nucleon.',
    },
  ],
  questions: [
    {
      id: 'direction',
      prompt: 'Which changes can release nuclear energy?',
      choices: [
        { value: 'toward', label: 'Changes toward more binding per nucleon' },
        { value: 'away', label: 'Changes away from the iron region' },
        { value: 'mass', label: 'Only changes that conserve atomic mass exactly' },
      ],
      answer: 'toward',
      explain:
        'Products with greater binding energy per nucleon have lower total rest mass; the difference can emerge as released energy.',
    },
  ],
});
