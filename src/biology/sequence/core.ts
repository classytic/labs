/**
 * Molecular-sequence core, the base-pairing rules that drive SequenceLab. One
 * tool covers three topics by swapping the rule:
 *   • replication  , DNA template → new DNA strand   (A–T, G–C)
 *   • transcription, DNA template → mRNA             (A–U, T–A, G–C, C–G)
 *   • translation  , mRNA codons → amino acids       (the genetic code)
 *
 * Pure data + a builder; the UI lives in the preset. The "unit" is a base for
 * replication/transcription and a 3-letter codon for translation, so the same
 * match-the-partner interaction serves all three.
 */

export type SequenceKind = 'replication' | 'transcription' | 'translation';

export const DNA_BASES = ['A', 'T', 'G', 'C'] as const;
export const RNA_BASES = ['A', 'U', 'G', 'C'] as const;

/** new DNA strand opposite a DNA template. */
export const DNA_COMPLEMENT: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
/** mRNA base opposite a DNA template base (T→A but A→U). */
export const TRANSCRIBE: Record<string, string> = { A: 'U', T: 'A', G: 'C', C: 'G' };

/** classic CPK-ish base colours, tokenized. */
export const BASE_COLOR: Record<string, string> = {
  A: 'var(--stage-good)',
  T: 'var(--stage-danger)',
  U: 'var(--stage-warn)',
  G: 'var(--stage-accent-2)',
  C: 'var(--stage-accent)',
};

/** standard genetic code, mRNA codon → amino acid (3-letter), Stop for terminators. */
export const CODON_TABLE: Record<string, string> = {
  UUU: 'Phe', UUC: 'Phe', UUA: 'Leu', UUG: 'Leu', CUU: 'Leu', CUC: 'Leu', CUA: 'Leu', CUG: 'Leu',
  AUU: 'Ile', AUC: 'Ile', AUA: 'Ile', AUG: 'Met', GUU: 'Val', GUC: 'Val', GUA: 'Val', GUG: 'Val',
  UCU: 'Ser', UCC: 'Ser', UCA: 'Ser', UCG: 'Ser', CCU: 'Pro', CCC: 'Pro', CCA: 'Pro', CCG: 'Pro',
  ACU: 'Thr', ACC: 'Thr', ACA: 'Thr', ACG: 'Thr', GCU: 'Ala', GCC: 'Ala', GCA: 'Ala', GCG: 'Ala',
  UAU: 'Tyr', UAC: 'Tyr', UAA: 'Stop', UAG: 'Stop', CAU: 'His', CAC: 'His', CAA: 'Gln', CAG: 'Gln',
  AAU: 'Asn', AAC: 'Asn', AAA: 'Lys', AAG: 'Lys', GAU: 'Asp', GAC: 'Asp', GAA: 'Glu', GAG: 'Glu',
  UGU: 'Cys', UGC: 'Cys', UGA: 'Stop', UGG: 'Trp', CGU: 'Arg', CGC: 'Arg', CGA: 'Arg', CGG: 'Arg',
  AGU: 'Ser', AGC: 'Ser', AGA: 'Arg', AGG: 'Arg', GGU: 'Gly', GGC: 'Gly', GGA: 'Gly', GGG: 'Gly',
};

/** spare amino acids to pad the translation palette so it isn't trivially short. */
const AA_DISTRACTORS = ['Met', 'Phe', 'Leu', 'Gly', 'Ser', 'Val', 'Lys', 'Stop'];

export interface SequenceModel {
  kind: SequenceKind;
  units: string[];                 // template units (bases or codons)
  partnerOf: (unit: string) => string;
  options: string[];               // palette of possible partners
  topLabel: string;
  bottomLabel: string;
  /** true when the partner is itself a base (replication/transcription), colour it. */
  partnerIsBase: boolean;
}

const uniq = <T,>(xs: T[]): T[] => [...new Set(xs)];

export function buildSequenceModel(kind: SequenceKind, template: string[]): SequenceModel {
  if (kind === 'translation') {
    const answers = template.map((c) => CODON_TABLE[c] ?? '???');
    const options = uniq([...answers, ...AA_DISTRACTORS]).slice(0, Math.max(4, uniq(answers).length + 2));
    return { kind, units: template, partnerOf: (c) => CODON_TABLE[c] ?? '???', options, topLabel: 'mRNA codons', bottomLabel: 'amino acids', partnerIsBase: false };
  }
  if (kind === 'transcription') {
    return { kind, units: template, partnerOf: (b) => TRANSCRIBE[b] ?? '?', options: [...RNA_BASES], topLabel: 'DNA template', bottomLabel: 'mRNA', partnerIsBase: true };
  }
  return { kind, units: template, partnerOf: (b) => DNA_COMPLEMENT[b] ?? '?', options: [...DNA_BASES], topLabel: 'template strand (old)', bottomLabel: 'new strand', partnerIsBase: true };
}

/** canned templates a creator can start from. */
export const SEQUENCE_PRESETS: Record<SequenceKind, string[]> = {
  replication: ['T', 'A', 'C', 'G', 'G', 'A', 'T', 'C'],
  transcription: ['T', 'A', 'C', 'G', 'G', 'A', 'T'],
  translation: ['AUG', 'UUU', 'GGA', 'UAC', 'UAA'],
};
