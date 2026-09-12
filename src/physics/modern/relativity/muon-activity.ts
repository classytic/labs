import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';
export const muonSurvivalActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Particles that should not reach the ground',
  objectives: [
    'Connect unstable-particle decay to time dilation',
    'Compare classical and relativistic predictions',
    'Explain survival using proper time',
  ],
  success: [
    {
      id: 'run-complete',
      source: 'metric',
      key: 'run-complete',
      pendingLabel: 'Run the cohort to the detector.',
    },
    { id: 'cause', source: 'answer', key: 'cause', pendingLabel: 'Explain why more muons survive.' },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the detector count',
      lead: 'Without relativity, can a short-lived muon cross the atmosphere?',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Change the muon speed',
      lead: 'Move β and compare both predictions.',
      controls: true,
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read two clocks',
      lead: 'Earth assigns a travel time; the muon experiences less proper time.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Resolve the mystery',
      lead: 'Decay follows the proper time recorded with the muon.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Move the detector',
      lead: 'Change altitude and predict how the count responds.',
    },
  ],
  questions: [
    {
      id: 'cause',
      prompt: 'Why do relativistic muons reach Earth in much greater numbers?',
      choices: [
        { value: 'proper', label: 'Less proper time elapses before arrival' },
        { value: 'stable', label: 'Fast muons stop being radioactive' },
        { value: 'gravity', label: 'Gravity prevents their decay' },
      ],
      answer: 'proper',
      explain:
        'The decay law uses the muon’s proper time. At high γ, much less proper time elapses during the Earth-frame journey.',
    },
  ],
});
