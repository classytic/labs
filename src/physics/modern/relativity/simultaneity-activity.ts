import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const simultaneityActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Same events, different now',
  objectives: [
    'Define simultaneity using synchronized clocks',
    'Transform separated events between frames',
    'Distinguish emission time from light-arrival time',
  ],
  success: [
    {
      id: 'comparison-complete',
      source: 'metric',
      key: 'comparison-complete',
      pendingLabel: 'Run the event comparison once.',
    },
    {
      id: 'order',
      source: 'answer',
      key: 'order',
      pendingLabel: 'Predict the train-frame order.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Choose the train-frame order',
      lead: 'The platform clocks record two separated flashes at the same time.',
      success: 'order',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Change relative speed',
      lead: 'Watch the train clocks assigned to the same two events.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Compare event ledgers',
      lead: 'The event pair is unchanged; its coordinates are frame-dependent.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Separate seeing from assigning',
      lead: 'Correct light-travel delay with synchronized clocks.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Reverse the train',
      lead: 'Predict how the event order reverses.',
    },
  ],
  questions: [
    {
      id: 'order',
      prompt: 'For a train moving right, which platform-simultaneous flash has the earlier train-frame time?',
      choices: [
        { value: 'right', label: 'the right/front flash' },
        { value: 'left', label: 'the left/rear flash' },
        { value: 'same', label: 'they remain simultaneous' },
      ],
      answer: 'right',
      explain:
        't′ = γ(t − vx/c²). At equal platform time, the event at larger x has the earlier train-frame time.',
    },
  ],
});
