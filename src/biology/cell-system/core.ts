export const CELL_JOURNEY = ['nucleus', 'ribosome', 'rough-er', 'golgi', 'vesicle', 'membrane'] as const;
export type CellJourneyStep = (typeof CELL_JOURNEY)[number];
export const ORGANELLE_FAILURES = ['none', 'nucleus', 'ribosome', 'rough-er', 'golgi', 'vesicle'] as const;
export type OrganelleFailure = (typeof ORGANELLE_FAILURES)[number];
export interface CellSystemState {
  step: CellJourneyStep;
  index: number;
  cargo: 'gene' | 'mRNA' | 'polypeptide' | 'folding protein' | 'sorted protein' | 'secretory vesicle';
  location: string;
  process: string;
  failure: OrganelleFailure;
  blocked: boolean;
  consequence: string;
}
const DATA: Record<CellJourneyStep, Pick<CellSystemState, 'cargo' | 'location' | 'process'>> = {
  nucleus: {
    cargo: 'gene',
    location: 'nucleus',
    process: 'DNA is transcribed into a complementary mRNA copy.',
  },
  ribosome: {
    cargo: 'mRNA',
    location: 'cytosolic ribosome',
    process: 'A ribosome reads mRNA codons and links amino acids.',
  },
  'rough-er': {
    cargo: 'polypeptide',
    location: 'rough ER',
    process: 'A signal peptide directs the growing protein into the rough ER for folding.',
  },
  golgi: {
    cargo: 'folding protein',
    location: 'Golgi apparatus',
    process: 'Golgi cisternae modify, label, and sort the protein.',
  },
  vesicle: {
    cargo: 'sorted protein',
    location: 'transport vesicle',
    process: 'A membrane vesicle carries the sorted cargo toward the cell surface.',
  },
  membrane: {
    cargo: 'secretory vesicle',
    location: 'plasma membrane',
    process: 'The vesicle fuses with the membrane and releases the protein by exocytosis.',
  },
};
export function cellSystemState(step: CellJourneyStep, failure: OrganelleFailure = 'none'): CellSystemState {
  const index = CELL_JOURNEY.indexOf(step),
    failureIndex = failure === 'none' ? -1 : CELL_JOURNEY.indexOf(failure),
    blocked = failureIndex >= 0 && index >= failureIndex,
    consequence =
      failure === 'none'
        ? 'The protein can complete the secretion pathway.'
        : blocked
          ? `The journey stops at ${failure}; downstream compartments receive no functional cargo.`
          : `The defect is downstream, so this earlier step can still occur.`;
  return { step, index, ...DATA[step], failure, blocked, consequence };
}
