import type { LabPathway } from './types.js';
export const cellSystemsPathway: LabPathway = {
  id: 'biology-cell-systems',
  title: 'Cell systems: boundary, energy, information, and inheritance',
  description:
    'Build one connected model of a cell by moving from membrane exchange through ATP supply and protein secretion to chromosome inheritance.',
  domain: 'biology',
  grades: ['10', '11', '12'],
  estimatedMinutes: 98,
  steps: [
    {
      id: 'membrane-transport',
      tag: 'MembraneTransportLab',
      title: 'Control the boundary',
      purpose: 'Predict passive and active movement from gradients, permeability, proteins, and ATP.',
    },
    {
      id: 'respiration',
      tag: 'RespirationLab',
      title: 'Turn matter into usable energy',
      purpose: 'Connect glucose and oxygen to respiration products and ATP.',
    },
    {
      id: 'cell-energy',
      tag: 'CellEnergyLab',
      title: 'Balance the ATP budget',
      purpose: 'Match respiratory supply to cellular work and diagnose limiting inputs.',
    },
    {
      id: 'central-dogma',
      tag: 'CentralDogmaLab',
      title: 'Turn stored information into protein',
      purpose: 'Trace DNA through mRNA to an amino-acid sequence.',
    },
    {
      id: 'cell-system',
      tag: 'CellSystemLab',
      title: 'Ship a protein through the cell',
      purpose: 'Follow secretory cargo through organelles and diagnose downstream failures.',
    },
    {
      id: 'mitosis-explorer',
      tag: 'MitosisExplorerLab',
      title: 'Preserve the genome',
      purpose: 'Track duplicated chromosomes into genetically matching daughter cells.',
    },
    {
      id: 'meiosis-explorer',
      tag: 'MeiosisExplorerLab',
      title: 'Generate inherited variation',
      purpose: 'Separate homologs and sisters across two divisions while tracking variation.',
    },
  ],
};
