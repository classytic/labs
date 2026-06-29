import { Elem } from "./sets.mjs";

//#region src/discrete/core/inclusionExclusion.d.ts
interface IETerm {
  /** Which input sets this term intersects (indices into `sets`). */
  indices: number[];
  size: number;
  /** +1 for odd-sized subsets, −1 for even (the alternating sign). */
  sign: 1 | -1;
}
interface IEResult {
  /** |A ∪ B ∪ …| via inclusion–exclusion. */
  unionSize: number;
  /** The signed terms, in increasing subset size. */
  terms: IETerm[];
}
declare function inclusionExclusion<T extends Elem>(sets: readonly (readonly T[])[]): IEResult;
//#endregion
export { IEResult, IETerm, inclusionExclusion };