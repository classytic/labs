import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const activity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Modulus Cases',
  objectives: [
    'Interpret modulus as distance.',
    'Split an equation into valid algebraic cases.',
    'Check roots and inequality intervals on the folded graph.',
  ],
  questions: [
    {
      id: 'distance',
      prompt: 'What does |2x - 3| = 5 mean?',
      choices: [
        { value: 'distance', label: '2x - 3 is five units from zero' },
        { value: 'positive', label: '2x - 3 must equal 5 only' },
        { value: 'square', label: '2x - 3 must be squared' },
      ],
      answer: 'distance',
      explain: 'A distance of five from zero has two signed cases: 5 and -5.',
    },
  ],
  success: [
    {
      id: 'distance-meaning',
      source: 'answer',
      key: 'distance',
      pendingLabel: 'Interpret the modulus as distance.',
    },
    { id: 'roots', source: 'metric', key: 'roots', pendingLabel: 'Select both roots.' },
    { id: 'interval', source: 'metric', key: 'interval', pendingLabel: 'Transfer to a modulus inequality.' },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the two cases',
      lead: 'Think about distance on a number line.',
      success: 'distance-meaning',
    },
    {
      id: 'solve',
      phase: 'act',
      title: 'Select both roots',
      lead: 'Solve 2x - 3 = 5 and 2x - 3 = -5.',
      controls: true,
      success: 'roots',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Inspect the folded graph',
      lead: 'Both intersections have the same vertical height.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Check every root',
      lead: 'Substitute into the original modulus equation, not only a branch.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Choose the interval',
      lead: 'Solve |2x - 3| < 5 from the same boundaries.',
      controls: true,
      success: 'interval',
    },
  ],
});
