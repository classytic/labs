import type { LabPathway } from './types.js';

/** A phenomenon-first route into quantum information. The pathway contains
 * metadata only, so CMS and MDX hosts can inspect or generate it without
 * importing React, Three.js, or any lab runtime. */
export const quantumFoundationsPathway: LabPathway = {
  id: 'quantum-from-evidence-to-programs',
  title: 'Quantum physics: from experimental evidence to qubit programs',
  description:
    'Begin with observations classical models cannot explain, construct probability and state models, then use those models to program a single qubit.',
  domain: 'physics',
  grades: ['11', '12'],
  estimatedMinutes: 76,
  steps: [
    {
      id: 'photoelectric-effect',
      tag: 'PhotoelectricEffectLab',
      title: 'Light arrives in energy packets',
      purpose:
        'Use threshold wavelength and stopping potential to separate photon energy from photon arrival rate.',
      defaultAttributes: { metal: 'sodium', wavelengthNm: 500, intensity: 0.35 },
    },
    {
      id: 'double-slit',
      tag: 'DoubleSlitLab',
      title: 'Single events build a probability pattern',
      purpose: 'Accumulate localized detections and test why distinguishable paths no longer interfere.',
      defaultAttributes: { detections: 80, wavelengthNm: 550, slitSeparationUm: 120, whichPath: false },
    },
    {
      id: 'bloch-sphere',
      tag: 'BlochSphereLab',
      title: 'A pure qubit becomes a direction',
      purpose:
        'Connect complex amplitudes and relative phase to measurement probabilities in multiple bases.',
      defaultAttributes: { preset: 'plus', measurementAxis: 'z' },
    },
    {
      id: 'quantum-gates',
      tag: 'QuantumGateJourneyLab',
      title: 'State transformations become programs',
      purpose:
        'Compose reversible gates, predict their effect, and reach a target state while preserving normalization.',
    },
  ],
};
