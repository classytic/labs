/**
 * Inclusion–exclusion — the "overcount, then correct" move made general. Returns
 * the |union| AND the signed term breakdown (+singles −pairs +triples …) so the
 * Venn lab can show each region settling to a net count of 1. Works for any n
 * (kept ≤ ~16 for the 2ⁿ subset walk; lessons use 2–3).
 */

import type { Elem } from './sets.js';
import { intersection } from './sets.js';

export interface IETerm {
  /** Which input sets this term intersects (indices into `sets`). */
  indices: number[];
  size: number;
  /** +1 for odd-sized subsets, −1 for even (the alternating sign). */
  sign: 1 | -1;
}

export interface IEResult {
  /** |A ∪ B ∪ …| via inclusion–exclusion. */
  unionSize: number;
  /** The signed terms, in increasing subset size. */
  terms: IETerm[];
}

export function inclusionExclusion<T extends Elem>(sets: readonly (readonly T[])[]): IEResult {
  const n = sets.length;
  if (n > 16) throw new Error('inclusionExclusion: too many sets (max 16)');
  const terms: IETerm[] = [];
  let unionSize = 0;
  for (let mask = 1; mask < (1 << n); mask++) {
    const indices: number[] = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) indices.push(i);
    let acc: readonly T[] = sets[indices[0]!]!;
    for (let j = 1; j < indices.length; j++) acc = intersection(acc, sets[indices[j]!]!);
    const sign: 1 | -1 = indices.length % 2 === 1 ? 1 : -1;
    terms.push({ indices, size: acc.length, sign });
    unionSize += sign * acc.length;
  }
  terms.sort((a, b) => a.indices.length - b.indices.length);
  return { unionSize, terms };
}
