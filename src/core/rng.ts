/**
 * Seeded PRNG — deterministic randomness so a simulation is REPLAYABLE (same
 * seed → same run; an agent can pin a seed, a lesson reproduces exactly, SSR /
 * Remotion stays stable). mulberry32: tiny, fast, good enough for teaching. This
 * is the canonical home (generic numerics live in core, per the shared-math rule);
 * discrete/core re-exports it for back-compat. NEVER use Math.random in a lab.
 */

export type Rng = () => number;

/** A PRNG returning [0,1). Same seed → same sequence. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [lo, hi] inclusive. */
export function randInt(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/** Fisher–Yates shuffle (new array; does not mutate input). */
export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Sample `k` distinct items (without replacement). */
export function sample<T>(arr: readonly T[], k: number, rng: Rng): T[] {
  return shuffle(arr, rng).slice(0, Math.max(0, Math.min(k, arr.length)));
}

/** A normal (Gaussian) variate via Box–Muller — for sampling-distribution sims. */
export function gaussian(rng: Rng, mu = 0, sigma = 1): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
