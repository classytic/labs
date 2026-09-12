/**
 * Hash tables: why lookup is fast, and the exact thing that makes it stop being fast.
 *
 * The idea students take away from a lecture is "hashing is O(1)". The idea they need is that
 * it is O(1) UNTIL the table fills, and that collisions are not a rare accident but the normal
 * consequence of putting n keys into fewer than n buckets. So every trace reports load factor,
 * collisions and the average number of probes a lookup costs, and those numbers move as keys
 * are added.
 *
 * The hash is FNV-1a, computed with integer operations only. No Math.random and no floating
 * point, so a server render and a browser render agree exactly.
 */

export type HashStrategy = 'chaining' | 'linear-probing';

/** FNV-1a. Deterministic, well spread for short strings, and short enough to read. */
export function hashKey(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index++) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export interface HashStep {
  key: string;
  hash: number;
  /** The bucket the hash chose. */
  home: number;
  /** Where the key actually ended up. Differs from `home` only when probing. */
  slot: number;
  /** Buckets inspected to place this key. 1 means it went straight in. */
  probes: number;
  collided: boolean;
  /** Table contents AFTER this insertion. */
  buckets: string[][];
  message: string;
}

export interface HashTrace {
  size: number;
  strategy: HashStrategy;
  keys: string[];
  steps: HashStep[];
  buckets: string[][];
  collisions: number;
  /** Keys per bucket. Above about 0.7 a probing table degrades sharply. */
  loadFactor: number;
  /** Longest chain, which is the worst-case lookup under chaining. */
  longestChain: number;
  /** Mean probes per insertion, the measured cost of the collisions above. */
  averageProbes: number;
  /** Keys that did not fit. Only possible when probing a full table. */
  dropped: string[];
}

const emptyBuckets = (size: number): string[][] => Array.from({ length: size }, () => []);
const snapshot = (buckets: string[][]): string[][] => buckets.map((bucket) => [...bucket]);

/**
 * Insert each key in order, recording what it cost.
 *
 * Chaining appends to the bucket's list, so it always succeeds and its cost shows up as chain
 * length. Linear probing walks forward to the next free slot, so its cost shows up as probes and
 * it can run out of room, which is the failure mode worth seeing.
 */
export function hashTrace(
  keys: readonly string[],
  size: number,
  strategy: HashStrategy = 'chaining',
): HashTrace {
  const width = Math.max(1, Math.floor(size));
  const buckets = emptyBuckets(width);
  const steps: HashStep[] = [];
  const dropped: string[] = [];
  let collisions = 0;
  let totalProbes = 0;

  for (const key of keys) {
    const hash = hashKey(key);
    const home = hash % width;

    if (strategy === 'chaining') {
      const collided = buckets[home]!.length > 0;
      if (collided) collisions++;
      buckets[home]!.push(key);
      totalProbes += 1;
      steps.push({
        key,
        hash,
        home,
        slot: home,
        probes: 1,
        collided,
        buckets: snapshot(buckets),
        message: collided
          ? `"${key}" hashes to bucket ${home}, which is taken. Chaining appends it there, so that bucket now holds ${buckets[home]!.length}.`
          : `"${key}" hashes to bucket ${home}, which is free.`,
      });
      continue;
    }

    // Linear probing: walk forward until a free slot, wrapping once around the table.
    let probes = 0;
    let slot = home;
    while (probes < width && buckets[slot]!.length > 0) {
      probes++;
      slot = (home + probes) % width;
    }
    probes++;
    if (buckets[slot]!.length > 0) {
      dropped.push(key);
      steps.push({
        key,
        hash,
        home,
        slot: -1,
        probes,
        collided: true,
        buckets: snapshot(buckets),
        message: `"${key}" hashes to bucket ${home}, but the table is full. A probing table cannot hold more keys than buckets.`,
      });
      continue;
    }
    const collided = slot !== home;
    if (collided) collisions++;
    buckets[slot]!.push(key);
    totalProbes += probes;
    steps.push({
      key,
      hash,
      home,
      slot,
      probes,
      collided,
      buckets: snapshot(buckets),
      message: collided
        ? `"${key}" wanted bucket ${home}, which is taken. Probing forward found bucket ${slot} after ${probes} looks.`
        : `"${key}" hashes to bucket ${home}, which is free.`,
    });
  }

  const stored = buckets.reduce((sum, bucket) => sum + bucket.length, 0);
  const placed = steps.length - dropped.length;
  return {
    size: width,
    strategy,
    keys: [...keys],
    steps,
    buckets,
    collisions,
    loadFactor: stored / width,
    longestChain: Math.max(0, ...buckets.map((bucket) => bucket.length)),
    averageProbes: placed === 0 ? 0 : totalProbes / placed,
    dropped,
  };
}

/**
 * Buckets inspected to find a key, or to prove it absent.
 *
 * This is the number that matters: insertion cost is paid once, but lookup is paid forever, and
 * it is what degrades as the table fills.
 */
export function lookupCost(trace: HashTrace, key: string): number {
  const home = hashKey(key) % trace.size;
  if (trace.strategy === 'chaining') {
    const bucket = trace.buckets[home]!;
    const index = bucket.indexOf(key);
    return index === -1 ? Math.max(1, bucket.length) : index + 1;
  }
  for (let probes = 0; probes < trace.size; probes++) {
    const slot = (home + probes) % trace.size;
    const bucket = trace.buckets[slot]!;
    if (bucket[0] === key) return probes + 1;
    if (bucket.length === 0) return probes + 1;
  }
  return trace.size;
}
