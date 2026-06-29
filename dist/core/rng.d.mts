//#region src/core/rng.d.ts
/**
 * Seeded PRNG, deterministic randomness so a simulation is REPLAYABLE (same
 * seed → same run; an agent can pin a seed, a lesson reproduces exactly, SSR /
 * Remotion stays stable). mulberry32: tiny, fast, good enough for teaching. This
 * is the canonical home (generic numerics live in core, per the shared-math rule);
 * discrete/core re-exports it for back-compat. NEVER use Math.random in a lab.
 */
type Rng = () => number;
/** A PRNG returning [0,1). Same seed → same sequence. */
declare function mulberry32(seed: number): Rng;
/** Integer in [lo, hi] inclusive. */
declare function randInt(rng: Rng, lo: number, hi: number): number;
/** Fisher–Yates shuffle (new array; does not mutate input). */
declare function shuffle<T>(arr: readonly T[], rng: Rng): T[];
/** Sample `k` distinct items (without replacement). */
declare function sample<T>(arr: readonly T[], k: number, rng: Rng): T[];
/** A normal (Gaussian) variate via Box–Muller, for sampling-distribution sims. */
declare function gaussian(rng: Rng, mu?: number, sigma?: number): number;
//#endregion
export { Rng, gaussian, mulberry32, randInt, sample, shuffle };