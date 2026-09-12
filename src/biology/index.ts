// @classytic/labs/biology, interactive biology labs (enzymes, photosynthesis,
// inheritance). Built on @classytic/stage; tokenized, authorable, agent-drivable.
export { EnzymeRateLab, type EnzymeRateProps } from './enzyme-rate/index.js';
export { PhotosynthesisFactorsLab, type PhotosynthesisFactorsProps } from './photosynthesis-factors/index.js';
export { PunnettCrossLab, type PunnettCrossProps } from './punnett-cross/index.js';
export { RespirationLab, type RespirationProps } from './respiration/index.js';
export {
  GeneticCrossLab,
  type GeneticCrossProps,
  SexLinkedCrossLab,
  type SexLinkedCrossProps,
  resolveModel,
  monohybridSpec,
  BLOOD_TYPE_SPEC,
  INCOMPLETE_SPEC,
  CROSS_PRESETS,
  DIHYBRID_LOCI,
  type CrossModelSpec,
  type AlleleSpec,
  type BlendSpec,
  type Phenotype,
  type ResolvedModel,
  type CrossPresetKey,
} from './genetic-cross/index.js';
export {
  SequenceLab,
  type SequenceLabProps,
  CentralDogmaLab,
  type CentralDogmaProps,
  buildSequenceModel,
  CODON_TABLE,
  DNA_COMPLEMENT,
  TRANSCRIBE,
  BASE_COLOR,
  DNA_BASES,
  RNA_BASES,
  SEQUENCE_PRESETS,
  type SequenceKind,
  type SequenceModel,
} from './sequence/index.js';
export {
  MitosisExplorerLab,
  MitosisSemanticScene,
  MITOSIS_CHECKPOINTS,
  mitosisState,
  nextMitosisCheckpoint,
  type MitosisCheckpoint,
  type MitosisState,
  type MitosisExplorerLabProps,
  type MitosisSceneProps,
} from './cell-division/index.js';
export {
  MeiosisExplorerLab,
  MeiosisSemanticScene,
  MEIOSIS_CHECKPOINTS,
  meiosisState,
  meiosisProducts,
  type MeiosisCheckpoint,
  type MeiosisState,
  type MeiosisExplorerLabProps,
  type MeiosisSceneProps,
  type AssortmentOrientation,
} from './cell-division/index.js';
export {
  MembraneTransportLab,
  MembraneTransportSemanticScene,
  membraneTransportState,
  TRANSPORT_MODES,
  type TransportMode,
  type MembraneTransportState,
  type MembraneTransportLabProps,
  type MembraneTransportSceneProps,
} from './membrane-transport/index.js';
export {
  CellEnergyLab,
  CellEnergySemanticScene,
  cellEnergyState,
  type CellEnergyState,
  type CellEnergyLabProps,
  type CellEnergySceneProps,
} from './cell-energy/index.js';
export {
  CellSystemLab,
  CellSystemSemanticScene,
  cellSystemState,
  CELL_JOURNEY,
  ORGANELLE_FAILURES,
  type CellJourneyStep,
  type OrganelleFailure,
  type CellSystemState,
  type CellSystemLabProps,
  type CellSystemSceneProps,
} from './cell-system/index.js';
