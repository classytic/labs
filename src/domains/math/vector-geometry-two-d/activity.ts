import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const activity = defineAuthoredActivity({
  pattern: 'construction',
  title: 'Vector Geometry 2D',
  objectives: [
    'Find a displacement from two position vectors.',
    'Test parallelism and collinearity using a scalar multiple.',
    'Resolve a velocity into a unit vector.',
  ],
  questions: [
    {
      id: 'route',
      prompt: 'OA = (2,1) and OB = (8,4). What is AB?',
      choices: [
        { value: 'subtract', label: 'OB - OA' },
        { value: 'add', label: 'OB + OA' },
        { value: 'reverse', label: 'OA - OB' },
      ],
      answer: 'subtract',
      explain: 'The route A to B is A to O plus O to B, so AB = -OA + OB.',
    },
  ],
  success: [
    { id: 'route-rule', source: 'answer', key: 'route', pendingLabel: 'Choose the correct route.' },
    {
      id: 'vector-found',
      source: 'metric',
      key: 'vector-found',
      pendingLabel: 'Find the displacement and scale relation.',
    },
    { id: 'unit-vector', source: 'metric', key: 'unit-vector', pendingLabel: 'Identify the unit vector.' },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the route',
      lead: 'Use destination minus start.',
      success: 'route-rule',
    },
    {
      id: 'construct',
      phase: 'act',
      title: 'Construct AB',
      lead: 'Select the displacement and its relation to OA.',
      controls: true,
      success: 'vector-found',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the geometry',
      lead: 'A scalar multiple proves parallel direction; sharing a point then proves collinearity.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Separate direction from size',
      lead: 'Divide a non-zero vector by its magnitude to make a unit vector.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Resolve the velocity',
      lead: 'Choose the unit vector in the direction of (6,8).',
      controls: true,
      success: 'unit-vector',
    },
  ],
});
