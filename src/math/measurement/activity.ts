import { defineAuthoredActivity } from '../../kit/activity-authoring.js';
export const measurementActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Measure shape by changing its representation',
  objectives: [
    'Connect circular motion to circumference and π',
    'Build area and volume formulas from decomposed regions',
    'Estimate irregular area and describe approximation error',
  ],
  success: [{ id: 'pi', source: 'answer', key: 'pi', pendingLabel: 'Explain why rolling reveals π.' }],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict what changes',
      lead: 'Change one dimension before calculating.',
    },
    {
      id: 'manipulate',
      phase: 'act',
      title: 'Manipulate the model',
      lead: 'Use the same dimensions in the diagram and formula.',
      controls: true,
    },
    {
      id: 'decompose',
      phase: 'observe',
      title: 'Read the parts',
      lead: 'Identify circumference, faces, removed regions, or boundary cells.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the formula',
      lead: 'Connect every term to a visible length or region.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Change the situation',
      lead: 'Move between rolling, containers, paths, and irregular land.',
    },
  ],
  questions: [
    {
      id: 'pi',
      prompt: 'Why does distance after one complete wheel turn equal π times its diameter?',
      choices: [
        { value: 'circumference', label: 'The rim lays one circumference along the ground' },
        { value: 'radius', label: 'The wheel moves forward by one radius' },
        { value: 'area', label: 'The wheel converts its area into distance' },
      ],
      answer: 'circumference',
      explain: 'Without slipping, one revolution unwraps the entire circumference C = πd along the surface.',
    },
  ],
});
