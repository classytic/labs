/**
 * Finite-set kernel, set algebra over arrays of primitives (the Venn /
 * inclusion–exclusion labs run on these). De Morgan here mirrors the logic
 * kernel's De Morgan: ∩↔∧, ∪↔∨, complement↔¬ (the "trinity" spine). Order is
 * first-seen (insertion) and duplicates are collapsed, so results are clean sets.
 */

export type Elem = string | number;

const dedupe = <T extends Elem>(xs: readonly T[]): T[] => [...new Set(xs)];

export function union<T extends Elem>(a: readonly T[], b: readonly T[]): T[] {
  return dedupe([...a, ...b]);
}

export function intersection<T extends Elem>(a: readonly T[], b: readonly T[]): T[] {
  const bs = new Set(b);
  return dedupe(a.filter((x) => bs.has(x)));
}

export function difference<T extends Elem>(a: readonly T[], b: readonly T[]): T[] {
  const bs = new Set(b);
  return dedupe(a.filter((x) => !bs.has(x)));
}

export function symmetricDifference<T extends Elem>(a: readonly T[], b: readonly T[]): T[] {
  return union(difference(a, b), difference(b, a));
}

/** Aᶜ within a universe. */
export function complement<T extends Elem>(a: readonly T[], universe: readonly T[]): T[] {
  return difference(universe, a);
}

export function isSubset<T extends Elem>(a: readonly T[], b: readonly T[]): boolean {
  const bs = new Set(b);
  return dedupe(a).every((x) => bs.has(x));
}

export function setEqual<T extends Elem>(a: readonly T[], b: readonly T[]): boolean {
  return isSubset(a, b) && isSubset(b, a);
}

/** All 2^|a| subsets. */
export function powerset<T extends Elem>(a: readonly T[]): T[][] {
  const s = dedupe(a);
  const out: T[][] = [[]];
  for (const x of s) {
    const len = out.length;
    for (let i = 0; i < len; i++) out.push([...out[i]!, x]);
  }
  return out;
}

export function cartesian<A extends Elem, B extends Elem>(a: readonly A[], b: readonly B[]): [A, B][] {
  const out: [A, B][] = [];
  for (const x of a) for (const y of b) out.push([x, y]);
  return out;
}
