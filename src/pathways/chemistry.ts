import type { LabPathway } from './types.js';

/** A model-building sequence rather than a catalog dump. Each activity changes
 * representation only after the previous one supplies the needed concept. */
export const chemistryFoundationsPathway: LabPathway = {
  id: 'chemistry-from-atoms-to-amounts',
  title: 'Chemistry: from atomic models to measurable reactions',
  description:
    'Move from atomic structure and periodic evidence through probability orbitals, three-dimensional bonding, reactions, quantities, solutions, and acid-base measurement.',
  domain: 'chem',
  grades: ['10', '11', '12'],
  estimatedMinutes: 101,
  steps: [
    {
      id: 'bohr-atom',
      tag: 'BohrAtom',
      title: 'Shells establish atomic structure',
      purpose:
        'Use a deliberately limited shell model to connect proton number, electrons, and broad periodic organization.',
      defaultAttributes: { protons: 8 },
    },
    {
      id: 'periodic-trends',
      tag: 'PeriodicTrends',
      title: 'The table becomes evidence',
      purpose:
        'Read atomic radius, ionisation energy, and electronegativity as recurring evidence rather than facts to memorise.',
    },
    {
      id: 'atomic-orbital',
      tag: 'AtomicOrbitalLab',
      title: 'Probability replaces electron paths',
      purpose:
        'Upgrade from shells to orbital probability, phase, and nodes without treating orbitals as containers.',
      defaultAttributes: { orbital: '2p-z', view: 'cloud' },
    },
    {
      id: 'molecular-geometry',
      tag: 'MolecularGeometryLab',
      title: 'Electron domains become molecular shape',
      purpose: 'Connect directional bonding models, lone pairs, three-dimensional shape, and polarity.',
      defaultAttributes: {
        molecule: 'h2o',
        showLonePairs: true,
        showDipoles: true,
        showHybridOrbitals: true,
      },
    },
    {
      id: 'reaction-lab',
      tag: 'ReactionLab',
      title: 'Collisions rearrange bonds',
      purpose:
        'Move from static molecular structure to collision, bond rearrangement, and temperature-dependent reaction behavior.',
    },
    {
      id: 'stoichiometry',
      tag: 'Stoichiometry',
      title: 'A balanced equation becomes a quantity model',
      purpose: 'Use coefficients as ratios to identify limiting reagent, product yield, and excess reactant.',
    },
    {
      id: 'solution-box',
      tag: 'SolutionBox',
      title: 'Amount and volume become concentration',
      purpose:
        'Link particle amount, solution volume, and concentration before using concentration in an experiment.',
    },
    {
      id: 'titration',
      tag: 'Titration',
      title: 'Concentration becomes experimental evidence',
      purpose:
        'Use a measured volume, pH curve, equivalence point, and indicator interval to reason about an unknown acid.',
      defaultAttributes: {
        analyte: 'weak-acid',
        concAcid: 0.1,
        volAcidMl: 25,
        concBase: 0.1,
        pKa: 4.76,
        indicator: 'phenolphthalein',
      },
    },
  ],
};
