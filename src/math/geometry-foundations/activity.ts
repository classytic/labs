import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const geometryFoundationsActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Decompose a shape to expose its invariant',
  objectives: [
    'Explain the Pythagorean relationship as conservation of area',
    'Relate angles subtended by the same circle arc',
    'Derive polygon angle sums by triangulation',
  ],
  success: [
    {
      id: 'decomposition',
      source: 'answer',
      key: 'decomposition',
      pendingLabel: 'Explain why decomposition preserves the result.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the invariant',
      lead: 'Commit before changing the shape.',
    },
    {
      id: 'manipulate',
      phase: 'act',
      title: 'Change the construction',
      lead: 'Move one geometric parameter while the construction stays linked.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Compare representations',
      lead: 'Read the diagram and its measured quantities together.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the decomposition',
      lead: 'Name the equal areas, shared arc, or component triangles.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Test another shape',
      lead: 'Change mode and decide which invariant still applies.',
    },
  ],
  questions: [
    {
      id: 'decomposition',
      prompt: 'Why can a geometric rearrangement prove a formula?',
      choices: [
        { value: 'preserves', label: 'It preserves lengths and areas while exposing a new partition' },
        { value: 'appearance', label: 'A visually convincing picture is always a proof' },
        { value: 'measure', label: 'Measurement alone proves every possible case' },
      ],
      answer: 'preserves',
      explain:
        'A valid dissection accounts for every piece without overlap or gaps, so the total area is invariant.',
    },
  ],
});
