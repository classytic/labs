import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const lorentzExplorerActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Change coordinates, preserve the event',
  objectives: [
    'Transform spacetime coordinates',
    'Classify timelike, lightlike, and spacelike intervals',
    'Verify the invariant interval',
  ],
  success: [
    {
      id: 'invariant',
      source: 'answer',
      key: 'invariant',
      pendingLabel: 'Identify what every inertial frame preserves.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Classify before transforming',
      lead: 'Place an event inside, on, or outside the light cone.',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Change the frame',
      lead: 'Drag the event and vary β.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Compare both ledgers',
      lead: 'Coordinates change while the interval remains fixed.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Read tilted axes',
      lead: 'A new frame changes its space and simultaneity directions.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Construct an interval',
      lead: 'Create an authored timelike, lightlike, or spacelike target.',
    },
  ],
  questions: [
    {
      id: 'invariant',
      prompt: 'What remains unchanged under a Lorentz transformation?',
      choices: [
        { value: 'interval', label: 'the spacetime interval (ct)² − x²' },
        { value: 'time', label: 'the time coordinate alone' },
        { value: 'space', label: 'the position coordinate alone' },
      ],
      answer: 'interval',
      explain: 'Space and time coordinates mix, but the Minkowski spacetime interval is invariant.',
    },
  ],
});
