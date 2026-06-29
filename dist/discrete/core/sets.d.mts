//#region src/discrete/core/sets.d.ts
/**
 * Finite-set kernel, set algebra over arrays of primitives (the Venn /
 * inclusion–exclusion labs run on these). De Morgan here mirrors the logic
 * kernel's De Morgan: ∩↔∧, ∪↔∨, complement↔¬ (the "trinity" spine). Order is
 * first-seen (insertion) and duplicates are collapsed, so results are clean sets.
 */
type Elem = string | number;
declare function union<T extends Elem>(a: readonly T[], b: readonly T[]): T[];
declare function intersection<T extends Elem>(a: readonly T[], b: readonly T[]): T[];
declare function difference<T extends Elem>(a: readonly T[], b: readonly T[]): T[];
declare function symmetricDifference<T extends Elem>(a: readonly T[], b: readonly T[]): T[];
/** Aᶜ within a universe. */
declare function complement<T extends Elem>(a: readonly T[], universe: readonly T[]): T[];
declare function isSubset<T extends Elem>(a: readonly T[], b: readonly T[]): boolean;
declare function setEqual<T extends Elem>(a: readonly T[], b: readonly T[]): boolean;
/** All 2^|a| subsets. */
declare function powerset<T extends Elem>(a: readonly T[]): T[][];
declare function cartesian<A extends Elem, B extends Elem>(a: readonly A[], b: readonly B[]): [A, B][];
//#endregion
export { Elem, cartesian, complement, difference, intersection, isSubset, powerset, setEqual, symmetricDifference, union };