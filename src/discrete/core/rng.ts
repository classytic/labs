/**
 * Seeded PRNG — moved to the shared `@classytic/labs/core` (generic numerics live
 * in core, per the shared-math rule). Re-exported here for back-compat so discrete
 * labs keep importing `../core/rng.js`.
 */
export { mulberry32, randInt, shuffle, sample, type Rng } from '../../core/rng.js';
