import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const acDcActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'AC or DC?',
  objectives: ['Distinguish alternating and direct voltage', 'Relate source frequency to the live waveform'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the charge motion',
      lead: 'Decide which source reverses direction.',
      success: 'source-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Compare the sources',
      lead: 'Switch source and change its voltage and frequency.',
      controls: true,
      reveal: ['model'],
      success: 'ac-tested',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the linked views',
      lead: 'Connect voltage sign, carrier motion and the oscilloscope trace.',
    },
  ],
  questions: [
    {
      id: 'source',
      prompt: 'Which source repeatedly reverses polarity?',
      choices: [
        { value: 'ac', label: 'AC' },
        { value: 'dc', label: 'DC' },
        { value: 'both', label: 'both' },
      ],
      answer: 'ac',
      explain: 'Alternating voltage changes sign; direct voltage keeps one polarity.',
    },
  ],
  success: [
    {
      id: 'source-answer',
      source: 'answer',
      key: 'source',
      operator: 'eq',
      value: 'ac',
      pendingLabel: 'Choose the source that reverses polarity.',
    },
    {
      id: 'ac-tested',
      source: 'metric',
      key: 'mode',
      operator: 'eq',
      value: 'ac',
      pendingLabel: 'Switch the model to AC.',
    },
  ],
});
