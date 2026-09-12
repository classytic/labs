import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const siliconActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'What is a semiconductor? Silicon and doping',
  objectives: [
    'Distinguish intrinsic, n-type and p-type silicon',
    'Identify electrons and holes as mobile carriers',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict donor doping',
      lead: 'Decide what a group-V dopant contributes.',
      success: 'donor-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Compare carrier populations',
      lead: 'Switch doping and temperature while tracking the mobile carriers.',
      controls: true,
      reveal: ['model'],
      success: 'comparison-made',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Inspect the broken bond',
      lead: 'Trace the extra electron or missing bond electron back to the dopant.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the carrier type',
      lead: 'Use the incomplete or extra bond as evidence.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Compare doping with heating',
      lead: 'Return to intrinsic silicon, raise temperature, and compare paired carriers with majority carriers.',
      controls: true,
    },
  ],
  questions: [
    {
      id: 'donor',
      prompt: 'Replacing silicon with a group-V donor primarily adds…',
      choices: [
        { value: 'electron', label: 'a mobile electron: n-type' },
        { value: 'hole', label: 'a mobile hole: p-type' },
        { value: 'none', label: 'no carrier' },
      ],
      answer: 'electron',
      explain: 'The fifth valence electron is weakly bound and becomes a mobile majority carrier.',
    },
  ],
  success: [
    {
      id: 'donor-answer',
      source: 'answer',
      key: 'donor',
      operator: 'eq',
      value: 'electron',
      pendingLabel: 'Identify the donor carrier.',
    },
    {
      id: 'comparison-made',
      source: 'metric',
      key: 'mode',
      operator: 'neq',
      value: 'intrinsic',
      pendingLabel: 'Compare intrinsic silicon with a doped case.',
    },
  ],
});

export const mosfetActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Inside a MOSFET: build the inversion channel',
  objectives: ['Distinguish depletion from inversion', 'Relate gate and drain drive to channel current'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict below threshold',
      lead: 'Decide whether depletion alone connects source and drain.',
      success: 'channel-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Form the channel',
      lead: 'Move gate drive through threshold and compare carrier views.',
      controls: true,
      reveal: ['model'],
      success: 'channel-formed',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Inspect inversion',
      lead: 'Distinguish the depleted surface from the carrier channel that bridges both wells.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain inversion',
      lead: 'Use the body, wells, oxide and channel carriers as evidence.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Separate gate and drain control',
      lead: 'Hold the channel above threshold, then vary drain drive and compare current.',
      controls: true,
    },
  ],
  questions: [
    {
      id: 'channel',
      prompt: 'Below threshold, the depleted surface region is…',
      choices: [
        { value: 'isolating', label: 'still isolating source from drain' },
        { value: 'channel', label: 'already a conducting channel' },
      ],
      answer: 'isolating',
      explain:
        'Depletion removes majority carriers; inversion carriers form the conducting channel only beyond threshold in this model.',
    },
  ],
  success: [
    {
      id: 'channel-answer',
      source: 'answer',
      key: 'channel',
      operator: 'eq',
      value: 'isolating',
      pendingLabel: 'Distinguish depletion from inversion.',
    },
    {
      id: 'channel-formed',
      source: 'metric',
      key: 'gate',
      operator: 'gte',
      value: 1.5,
      pendingLabel: 'Raise gate drive through threshold.',
    },
  ],
});

export const bjtActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Inside a bipolar transistor',
  objectives: ['Relate base-emitter drive to carrier injection', 'Distinguish base and collector current'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the controlling junction',
      lead: 'Identify what must be forward biased.',
      success: 'junction-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Increase the junction drive',
      lead: 'Watch injected carriers cross the thin base.',
      controls: true,
      reveal: ['model'],
      success: 'active-tested',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Follow the carrier stream',
      lead: 'Compare the small recombining fraction with the carriers collected across the base.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the current gain',
      lead: 'Most injected carriers reach the collector; a smaller fraction recombines in the base.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Test the exponential turn-on',
      lead: 'Change base-emitter drive and compare the resulting collector current.',
      controls: true,
    },
  ],
  questions: [
    {
      id: 'junction',
      prompt: 'Which junction must be forward biased to inject carriers from the emitter?',
      choices: [
        { value: 'be', label: 'base–emitter' },
        { value: 'bc', label: 'base–collector' },
        { value: 'ce', label: 'collector–emitter' },
      ],
      answer: 'be',
      explain: 'Forward bias across the base–emitter junction injects carriers into the thin base.',
    },
  ],
  success: [
    {
      id: 'junction-answer',
      source: 'answer',
      key: 'junction',
      operator: 'eq',
      value: 'be',
      pendingLabel: 'Choose the injecting junction.',
    },
    {
      id: 'active-tested',
      source: 'metric',
      key: 'active',
      operator: 'eq',
      value: true,
      pendingLabel: 'Raise the base-emitter drive until collector current appears.',
    },
  ],
});
