import { defineAuthoredActivity } from '../../kit/activity-authoring.js';
export const spatialLorentzActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Steer a charge through fields',
  objectives: ['Apply F=q(E+v×B)', 'Distinguish electric acceleration from magnetic turning'],
  success: [{ id: 'work', source: 'answer', key: 'magnetic-work', pendingLabel: 'Explain magnetic work.' }],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the bend',
      lead: 'Use charge sign and the right-hand rule.',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Launch the particle',
      lead: 'Change velocity and field.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read force and path',
      lead: 'Compare electric, magnetic, and crossed fields.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the energy',
      lead: 'Separate turning from speeding up.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Aim along the field',
      lead: 'Apply the cross product to a new launch direction.',
    },
  ],
  questions: [
    {
      id: 'magnetic-work',
      prompt: 'A magnetic field acts alone. What happens to the particle speed?',
      choices: [
        { value: 'same', label: 'It stays constant' },
        { value: 'up', label: 'It increases' },
        { value: 'down', label: 'It decreases' },
      ],
      answer: 'same',
      explain: 'q(v×B) is perpendicular to velocity, so magnetic force changes direction but does no work.',
    },
    {
      id: 'parallel-launch',
      prompt:
        'A charged particle launches exactly parallel to a uniform magnetic field. What magnetic force acts?',
      choices: [
        { value: 'zero', label: 'Zero force' },
        { value: 'maximum', label: 'Maximum force' },
        { value: 'reverse', label: 'A force opposite its motion' },
      ],
      answer: 'zero',
      explain: 'The cross product v×B is zero when velocity and magnetic field are parallel.',
    },
  ],
});
