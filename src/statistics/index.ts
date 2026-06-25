/**
 * @classytic/labs/statistics — descriptive statistics & sequences/series. The
 * pure kernels (centre/spread, arithmetic/geometric) plus the GENERAL lab
 * families built on them. Probability lives next door in /discrete.
 */

export * from './core/index.js';

export { CenterSpreadLab, type CenterSpreadProps } from './center-spread/preset.js';
export { SequenceLab, type SequenceProps } from './sequence/preset.js';
export { GaltonBoardLab, type GaltonBoardProps } from './galton/preset.js';
export { HistogramBoxLab, type HistogramBoxProps } from './histogram/preset.js';
export { NormalDistributionLab, type NormalProps, type NormalMode } from './normal/preset.js';
export { ZTableLab, type ZTableProps, type ZTail } from './z-table/preset.js';
export { SamplingDistributionLab, type SamplingProps, type SamplingMode } from './sampling/preset.js';
