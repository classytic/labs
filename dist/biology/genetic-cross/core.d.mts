//#region src/biology/genetic-cross/core.d.ts
/**
 * Genetics core, a SERIALIZABLE cross model + the rule that turns a genotype into
 * a phenotype. Authored as data (so agents can declare it via JSON), resolved into
 * pure functions for the lab. One model covers simple dominance, multiple alleles,
 * codominance and incomplete dominance:
 *
 *  • each allele has a dominance `rank` + the `trait` it expresses
 *  • phenotype = the trait(s) of the highest-rank allele(s) present; two equal
 *    top-rank alleles with different traits express together (CODOMINANCE → "AB")
 *  • an optional `blends` entry overrides a specific heterozygote
 *    (INCOMPLETE DOMINANCE → red × white = pink)
 *
 * No reinvented numerics, this is just the genetics rule; UI lives in the preset.
 */
interface AlleleSpec {
  symbol: string;
  rank: number;
  trait: string;
}
interface BlendSpec {
  pair: [string, string];
  label: string;
  color?: string;
}
interface CrossModelSpec {
  trait?: string;
  alleles: AlleleSpec[];
  blends?: BlendSpec[];
  colors?: Record<string, string>;
}
interface Phenotype {
  label: string;
  color: string;
}
interface ResolvedModel {
  trait: string;
  alleles: AlleleSpec[];
  /** order a genotype's two alleles by their declared position (stable display). */
  norm: (a: string, b: string) => [string, string];
  phenotypeOf: (a: string, b: string) => Phenotype;
  phenotypeColor: (label: string) => string;
  /** every possible genotype as a normalised [a,b] pair (for parent pickers). */
  genotypes: [string, string][];
  /** true if `a` masks `b` here, a dominant over a present lower-rank allele. */
  masks: (a: string, b: string) => boolean;
}
declare function resolveModel(spec: CrossModelSpec): ResolvedModel;
/** Simple dominant/recessive, the classic monohybrid (also backs PunnettCross). */
declare const monohybridSpec: (letter?: string, dominant?: string, recessive?: string) => CrossModelSpec;
/** ABO blood groups, multiple alleles + codominance (Aᴬ Aᴮ → AB). */
declare const BLOOD_TYPE_SPEC: CrossModelSpec;
/** Incomplete dominance, red × white = pink (a blended heterozygote). */
declare const INCOMPLETE_SPEC: CrossModelSpec;
declare const CROSS_PRESETS: {
  readonly monohybrid: CrossModelSpec;
  readonly 'blood-type': CrossModelSpec;
  readonly incomplete: CrossModelSpec;
};
type CrossPresetKey = keyof typeof CROSS_PRESETS;
/** Two independent genes, the classic dihybrid 9:3:3:1 (height × seed colour). */
declare const DIHYBRID_LOCI: CrossModelSpec[];
//#endregion
export { AlleleSpec, BLOOD_TYPE_SPEC, BlendSpec, CROSS_PRESETS, CrossModelSpec, CrossPresetKey, DIHYBRID_LOCI, INCOMPLETE_SPEC, Phenotype, ResolvedModel, monohybridSpec, resolveModel };