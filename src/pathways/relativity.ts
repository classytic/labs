import type { LabPathway } from './types.js';
export const relativityFoundationsPathway: LabPathway = {
  id: 'relativity-from-events-to-evidence',
  title: 'Relativity: from light signals to measured evidence',
  description:
    'Build special relativity from invariant light speed, synchronized event coordinates, and atmospheric evidence.',
  domain: 'physics',
  grades: ['11', '12'],
  estimatedMinutes: 86,
  steps: [
    {
      id: 'relativity-light-clock',
      tag: 'RelativityLightClockLab',
      title: 'Light clocks reveal time dilation',
      purpose: 'Compare proper and coordinate time using the same emission and return events.',
      defaultAttributes: { beta: 0.6, properTick: 2, view: 'linked' },
    },
    {
      id: 'relativity-simultaneity',
      tag: 'RelativitySimultaneityLab',
      title: 'Separated events lose a universal now',
      purpose: 'Transform platform-simultaneous flashes into the moving train frame.',
      defaultAttributes: { beta: 0.6, separationM: 300 },
    },
    {
      id: 'length-contraction',
      tag: 'LengthContractionLab',
      title: 'Length requires a shared now',
      purpose:
        'Measure simultaneous endpoints and connect contraction to the preceding event transformation.',
      defaultAttributes: { beta: 0.8, properLengthM: 100 },
    },
    {
      id: 'lorentz-transformation',
      tag: 'LorentzTransformationLab',
      title: 'One transformation unifies the consequences',
      purpose:
        'Drag arbitrary events, classify their intervals, and verify what every inertial frame preserves.',
      defaultAttributes: { beta: 0.6 },
    },
    {
      id: 'muon-survival',
      tag: 'MuonSurvivalLab',
      title: 'Particle counts become experimental evidence',
      purpose: 'Use proper-time decay to explain why atmospheric muons reach Earth.',
      defaultAttributes: { beta: 0.995, altitudeKm: 10, population: 1000 },
    },
  ],
};
