// @classytic/labs/biology — interactive biology labs (enzymes, photosynthesis,
// inheritance). Built on @classytic/stage; tokenized, authorable, agent-drivable.
export { EnzymeRateLab, type EnzymeRateProps } from './enzyme-rate/index.js';
export { PhotosynthesisFactorsLab, type PhotosynthesisFactorsProps } from './photosynthesis-factors/index.js';
export { PunnettCrossLab, type PunnettCrossProps } from './punnett-cross/index.js';
export { RespirationLab, type RespirationProps } from './respiration/index.js';
export {
  GeneticCrossLab, type GeneticCrossProps,
  SexLinkedCrossLab, type SexLinkedCrossProps,
  resolveModel, monohybridSpec, BLOOD_TYPE_SPEC, INCOMPLETE_SPEC, CROSS_PRESETS, DIHYBRID_LOCI,
  type CrossModelSpec, type AlleleSpec, type BlendSpec, type Phenotype, type ResolvedModel, type CrossPresetKey,
} from './genetic-cross/index.js';
export {
  SequenceLab, type SequenceLabProps,
  CentralDogmaLab, type CentralDogmaProps,
  buildSequenceModel, CODON_TABLE, DNA_COMPLEMENT, TRANSCRIBE, BASE_COLOR, DNA_BASES, RNA_BASES, SEQUENCE_PRESETS,
  type SequenceKind, type SequenceModel,
} from './sequence/index.js';
