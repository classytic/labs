import { defineAuthoredActivity } from '../../kit/activity-authoring.js';

export const conductionActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Why current flows: electrons drifting in a field',
  objectives: ['Separate thermal motion from net drift', 'State the limits of the ohmic model'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict electron drift',
      lead: 'Separate electron motion from conventional current.',
      success: 'direction-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Apply an electric field',
      lead: 'Increase voltage and compare field, drift and current.',
      controls: true,
      reveal: ['model'],
      success: 'current-made',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read motion at two scales',
      lead: 'Separate fast thermal jiggle from the much slower net drift.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain resistance',
      lead: 'Connect scattering to limited drift in an ohmic sample.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Test proportional current',
      lead: 'Change voltage again and check whether current follows it proportionally.',
      controls: true,
    },
  ],
  questions: [
    {
      id: 'direction',
      prompt: 'In a metal, electron drift is…',
      choices: [
        { value: 'against', label: 'opposite the electric field' },
        { value: 'with', label: 'along the electric field' },
        { value: 'random', label: 'purely random even with voltage' },
      ],
      answer: 'against',
      explain:
        'Electrons are negatively charged, so their drift is opposite the electric field and conventional current.',
    },
  ],
  success: [
    {
      id: 'direction-answer',
      source: 'answer',
      key: 'direction',
      operator: 'eq',
      value: 'against',
      pendingLabel: 'Predict the electron drift direction.',
    },
    {
      id: 'current-made',
      source: 'metric',
      key: 'voltage',
      operator: 'gte',
      value: 0.1,
      pendingLabel: 'Apply a nonzero voltage.',
    },
  ],
});

export const pnJunctionActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'Inside a PN junction',
  objectives: ['Connect bias to depletion width', 'Explain why forward and reverse current differ'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict what bias does',
      lead: 'Decide which bias narrows the depletion region.',
      success: 'bias-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Drive the junction',
      lead: 'Sweep through reverse, equilibrium and forward bias.',
      controls: true,
      reveal: ['model'],
      success: 'forward-tested',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Inspect the barrier',
      lead: 'Connect depletion width, fixed ions and carrier crossing.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the asymmetry',
      lead: 'Connect barrier width, carrier crossing and recombination.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Reverse the bias',
      lead: 'Drive the same junction in reverse and explain why the barrier widens.',
      controls: true,
    },
  ],
  questions: [
    {
      id: 'bias',
      prompt: 'Which bias narrows the depletion region?',
      choices: [
        { value: 'forward', label: 'forward bias' },
        { value: 'reverse', label: 'reverse bias' },
        { value: 'neither', label: 'neither' },
      ],
      answer: 'forward',
      explain: 'Forward bias lowers the junction barrier and narrows the depletion region.',
    },
  ],
  success: [
    {
      id: 'bias-answer',
      source: 'answer',
      key: 'bias',
      operator: 'eq',
      value: 'forward',
      pendingLabel: 'Choose the bias that narrows the barrier.',
    },
    {
      id: 'forward-tested',
      source: 'metric',
      key: 'forward',
      operator: 'eq',
      value: true,
      pendingLabel: 'Apply enough forward bias to observe conduction.',
    },
  ],
});

export const hallEffectActivity = defineAuthoredActivity({
  pattern: 'investigation',
  title: 'The Hall effect: are the carriers electrons or holes?',
  objectives: [
    'Relate Hall-voltage polarity to carrier sign',
    'Track current, drift and magnetic force consistently',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the Hall polarity',
      lead: 'Use the stated voltage convention.',
      success: 'polarity-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Reverse carriers and field',
      lead: 'Compare the physical edge and the sign left there.',
      controls: true,
      reveal: ['model'],
      success: 'field-tested',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the edge charge',
      lead: 'Connect carrier sign, accumulated edge charge and Hall-voltage polarity.',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain why the edge is shared',
      lead: 'Both charge sign and drift direction reverse.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Identify an unknown carrier',
      lead: 'Switch from electrons to holes and use the Hall-voltage sign to identify the carrier type.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'carrier-compared',
    },
  ],
  questions: [
    {
      id: 'polarity',
      prompt: 'For the displayed convention, electron conduction gives a Hall voltage that is…',
      choices: [
        { value: 'negative', label: 'negative' },
        { value: 'positive', label: 'positive' },
        { value: 'zero', label: 'always zero' },
      ],
      answer: 'negative',
      explain:
        'Electrons accumulate negative charge at the deflection edge, so Vtop − Vbottom is negative here.',
    },
  ],
  success: [
    {
      id: 'polarity-answer',
      source: 'answer',
      key: 'polarity',
      operator: 'eq',
      value: 'negative',
      pendingLabel: 'Choose the electron Hall polarity.',
    },
    {
      id: 'field-tested',
      source: 'metric',
      key: 'field',
      operator: 'neq',
      value: 0,
      pendingLabel: 'Apply a nonzero magnetic field.',
    },
    {
      id: 'carrier-compared',
      source: 'metric',
      key: 'holes',
      operator: 'eq',
      value: true,
      pendingLabel: 'Switch to hole carriers.',
    },
  ],
});
