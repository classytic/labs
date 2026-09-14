import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';

export const activity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Qualitative Analysis Bench',
  objectives: [
    'Select a suitable reagent or gas test.',
    'Record the observation before drawing a conclusion.',
    'Identify an unknown ion or gas from qualitative-analysis evidence.',
  ],
  questions: [
    {
      id: 'observation-first',
      prompt: 'Which statement is a direct observation?',
      choices: [
        { value: 'white-solid', label: 'A white precipitate forms' },
        { value: 'chloride', label: 'The sample contains chloride ions' },
        { value: 'salt', label: 'The unknown is a salt' },
      ],
      answer: 'white-solid',
      explain: 'An observation states what is seen; an identity is an inference from that evidence.',
    },
  ],
  success: [
    {
      id: 'evidence-order',
      source: 'answer',
      key: 'observation-first',
      pendingLabel: 'Distinguish an observation from a conclusion.',
    },
    {
      id: 'test-run',
      source: 'metric',
      key: 'observation',
      pendingLabel: 'Run a useful test and record its observation.',
    },
    {
      id: 'identified',
      source: 'metric',
      key: 'identity',
      pendingLabel: 'Identify the unknown from the evidence.',
    },
  ],
  steps: [
    {
      id: 'prepare',
      phase: 'predict',
      title: 'Separate evidence from inference',
      lead: 'Commit to what counts as a direct observation.',
      success: 'evidence-order',
    },
    {
      id: 'choose',
      phase: 'act',
      title: 'Choose a test',
      lead: 'Pick one reagent or gas test before seeing the observation.',
      controls: true,
      success: 'test-run',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Record what happened',
      lead: 'Use colour, precipitate, and gas behaviour—not the reagent name alone—as evidence.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'identify',
      phase: 'explain',
      title: 'Identify the unknown',
      lead: 'Match the recorded observation to the ion or gas.',
      reveal: ['model', 'evidence'],
      controls: true,
      success: 'identified',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Test another sample',
      lead: 'Change the authored sample and repeat the evidence-first workflow.',
      reveal: ['model', 'evidence'],
    },
  ],
});
