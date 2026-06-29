//#region src/biology/sequence/core.d.ts
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
type SequenceKind = 'replication' | 'transcription' | 'translation';
declare const DNA_BASES: readonly ["A", "T", "G", "C"];
declare const RNA_BASES: readonly ["A", "U", "G", "C"];
/** new DNA strand opposite a DNA template. */
declare const DNA_COMPLEMENT: Record<string, string>;
/** mRNA base opposite a DNA template base (T→A but A→U). */
declare const TRANSCRIBE: Record<string, string>;
/** classic CPK-ish base colours, tokenized. */
declare const BASE_COLOR: Record<string, string>;
/** standard genetic code, mRNA codon → amino acid (3-letter), Stop for terminators. */
declare const CODON_TABLE: Record<string, string>;
interface SequenceModel {
  kind: SequenceKind;
  units: string[];
  partnerOf: (unit: string) => string;
  options: string[];
  topLabel: string;
  bottomLabel: string;
  /** true when the partner is itself a base (replication/transcription), colour it. */
  partnerIsBase: boolean;
}
declare function buildSequenceModel(kind: SequenceKind, template: string[]): SequenceModel;
/** canned templates a creator can start from. */
declare const SEQUENCE_PRESETS: Record<SequenceKind, string[]>;
//#endregion
export { BASE_COLOR, CODON_TABLE, DNA_BASES, DNA_COMPLEMENT, RNA_BASES, SEQUENCE_PRESETS, SequenceKind, SequenceModel, TRANSCRIBE, buildSequenceModel };