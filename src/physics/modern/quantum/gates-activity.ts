import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const quantumGatesActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Program a qubit by rotating it',
  objectives: [
    'Interpret gates as reversible state transformations',
    'Connect H to superposition and phase gates to longitude',
    'Predict a short gate sequence',
  ],
  success: [{ id: 'hh', source: 'answer', key: 'hh', pendingLabel: 'Predict two Hadamard gates.' }],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict before applying',
      lead: 'Where will the next gate move the vector?',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Build a gate sequence',
      lead: 'Apply X, Z, H, or S one step at a time.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read state and history',
      lead: 'The amplitudes and Bloch direction update together.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Reverse the journey',
      lead: 'Unitary gates preserve total probability.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Reach a target',
      lead: 'Construct an authored state from |0⟩.',
    },
  ],
  questions: [
    {
      id: 'hh',
      prompt: 'Starting at |0⟩, what does applying H twice produce?',
      choices: [
        { value: 'zero', label: '|0⟩ again' },
        { value: 'one', label: '|1⟩' },
        { value: 'random', label: 'an unpredictable state' },
      ],
      answer: 'zero',
      explain: 'H is its own inverse: H² = I.',
    },
  ],
});
