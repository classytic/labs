import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const lightClockActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Two clocks, one pair of events',
  objectives: [
    'Distinguish proper time from coordinate time',
    'Derive time dilation from a longer light path',
    'Read the same events in a spacetime diagram',
  ],
  success: [
    {
      id: 'tick-complete',
      source: 'metric',
      key: 'tick-complete',
      pendingLabel: 'Run one complete emission–reflection–return tick.',
    },
    {
      id: 'proper-time',
      source: 'answer',
      key: 'clock',
      pendingLabel: 'Identify the proper-time clock.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict before the pulse leaves',
      lead: 'From the platform, which clock takes longer between the same two tick events?',
      success: 'proper-time',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Trace one complete tick',
      lead: 'Scrub emission → reflection → return.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Link path and clocks',
      lead: 'The moving pulse follows a longer diagonal path while every observer still measures c.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Name the proper interval',
      lead: 'Ask which frame records both events at one location.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Set a target aging difference',
      lead: 'Choose a new speed and predict the ratio.',
    },
  ],
  questions: [
    {
      id: 'clock',
      prompt: 'Which elapsed time is proper time for emission and return on the ship?',
      choices: [
        { value: 'ship', label: 'The ship clock' },
        { value: 'platform', label: 'The platform clock' },
        { value: 'both', label: 'Both are proper time' },
      ],
      answer: 'ship',
      explain:
        'Emission and return occur at the same place in the ship frame, so the ship clock measures the proper time Δτ.',
    },
  ],
});
