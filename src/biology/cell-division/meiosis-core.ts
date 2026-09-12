export const MEIOSIS_CHECKPOINTS = [
  'pairing',
  'crossing-over',
  'metaphase-i',
  'anaphase-i',
  'metaphase-ii',
  'products',
] as const;
export type MeiosisCheckpoint = (typeof MEIOSIS_CHECKPOINTS)[number];
export type AssortmentOrientation = 'maternal-left' | 'paternal-left';
export interface MeiosisState {
  checkpoint: MeiosisCheckpoint;
  index: number;
  division: 0 | 1 | 2;
  title: string;
  summary: string;
  ploidy: 'diploid' | 'haploid';
  cellCount: number;
  sistersAttached: boolean;
  homologsPaired: boolean;
}
const DATA: Record<MeiosisCheckpoint, Omit<MeiosisState, 'checkpoint' | 'index'>> = {
  pairing: {
    division: 0,
    title: 'Prophase I: homologs pair',
    summary:
      'Maternal and paternal homologs synapse as a bivalent; each homolog already has two sister chromatids.',
    ploidy: 'diploid',
    cellCount: 1,
    sistersAttached: true,
    homologsPaired: true,
  },
  'crossing-over': {
    division: 0,
    title: 'Crossing over',
    summary:
      'Non-sister chromatids exchange corresponding segments at a chiasma, creating recombinant chromatids.',
    ploidy: 'diploid',
    cellCount: 1,
    sistersAttached: true,
    homologsPaired: true,
  },
  'metaphase-i': {
    division: 1,
    title: 'Metaphase I: orient the bivalent',
    summary: 'Homolog pairs align independently. Sister kinetochores act together toward the same pole.',
    ploidy: 'diploid',
    cellCount: 1,
    sistersAttached: true,
    homologsPaired: true,
  },
  'anaphase-i': {
    division: 1,
    title: 'Anaphase I: homologs separate',
    summary: 'Homologous chromosomes move apart while sister chromatids remain joined.',
    ploidy: 'haploid',
    cellCount: 2,
    sistersAttached: true,
    homologsPaired: false,
  },
  'metaphase-ii': {
    division: 2,
    title: 'Metaphase II: align chromosomes',
    summary: 'In each haploid cell, sister kinetochores attach to opposite poles.',
    ploidy: 'haploid',
    cellCount: 2,
    sistersAttached: true,
    homologsPaired: false,
  },
  products: {
    division: 2,
    title: 'Four haploid products',
    summary:
      'Sister chromatids have separated, producing four haploid cells; crossing over can make every product genetically distinct.',
    ploidy: 'haploid',
    cellCount: 4,
    sistersAttached: false,
    homologsPaired: false,
  },
};
export function meiosisState(checkpoint: MeiosisCheckpoint): MeiosisState {
  return { checkpoint, index: MEIOSIS_CHECKPOINTS.indexOf(checkpoint), ...DATA[checkpoint] };
}
export function meiosisProducts(crossover: boolean, orientation: AssortmentOrientation): string[] {
  const base = crossover ? ['AB', 'Ab', 'aB', 'ab'] : ['AB', 'AB', 'ab', 'ab'];
  return orientation === 'maternal-left' ? base : [...base].reverse();
}
