/**
 * Genetics core — a SERIALIZABLE cross model + the rule that turns a genotype into
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
 * No reinvented numerics — this is just the genetics rule; UI lives in the preset.
 */

export interface AlleleSpec { symbol: string; rank: number; trait: string }
export interface BlendSpec { pair: [string, string]; label: string; color?: string }
export interface CrossModelSpec {
  trait?: string;                       // what the phenotype IS, e.g. "blood type"
  alleles: AlleleSpec[];                // ordered: drives gamete display + genotype sort
  blends?: BlendSpec[];                 // explicit heterozygote overrides (incomplete dominance)
  colors?: Record<string, string>;      // phenotype label → css colour
}

export interface Phenotype { label: string; color: string }

const PALETTE = ['var(--stage-accent)', 'var(--stage-accent-2)', 'var(--stage-good)', 'var(--stage-warn)', 'var(--stage-danger)', 'var(--stage-muted)'];
const blendKey = (x: string, y: string): string => [x, y].sort().join('|');

export interface ResolvedModel {
  trait: string;
  alleles: AlleleSpec[];
  /** order a genotype's two alleles by their declared position (stable display). */
  norm: (a: string, b: string) => [string, string];
  phenotypeOf: (a: string, b: string) => Phenotype;
  phenotypeColor: (label: string) => string;
  /** every possible genotype as a normalised [a,b] pair (for parent pickers). */
  genotypes: [string, string][];
  /** true if `a` masks `b` here — a dominant over a present lower-rank allele. */
  masks: (a: string, b: string) => boolean;
}

export function resolveModel(spec: CrossModelSpec): ResolvedModel {
  const order = new Map(spec.alleles.map((a, i) => [a.symbol, i]));
  const rank = new Map(spec.alleles.map((a) => [a.symbol, a.rank]));
  const trait = new Map(spec.alleles.map((a) => [a.symbol, a.trait]));
  const blends = new Map((spec.blends ?? []).map((b) => [blendKey(b.pair[0], b.pair[1]), b]));

  const labelOfPair = (a: string, b: string): string => {
    const bl = blends.get(blendKey(a, b));
    if (bl) return bl.label;
    const maxR = Math.max(rank.get(a) ?? 0, rank.get(b) ?? 0);
    const tops = [a, b].filter((s) => (rank.get(s) ?? 0) === maxR);
    const traits = [...new Set(tops.map((s) => trait.get(s) ?? s))];
    return traits.length === 1 ? traits[0]! : traits.join('');
  };

  // stable colour assignment: walk genotypes in declared order, first-seen wins
  const syms = spec.alleles.map((a) => a.symbol);
  const genotypes: [string, string][] = [];
  const seen: string[] = [];
  for (let i = 0; i < syms.length; i++) {
    for (let j = i; j < syms.length; j++) {
      genotypes.push([syms[i]!, syms[j]!]);
      const l = labelOfPair(syms[i]!, syms[j]!);
      if (!seen.includes(l)) seen.push(l);
    }
  }
  const colorMap = new Map(seen.map((l, idx) => [l, spec.colors?.[l] ?? PALETTE[idx % PALETTE.length]!]));
  for (const b of spec.blends ?? []) if (b.color) colorMap.set(b.label, b.color);

  const phenotypeColor = (label: string): string => colorMap.get(label) ?? PALETTE[0]!;

  return {
    trait: spec.trait ?? 'phenotype',
    alleles: spec.alleles,
    norm: (a, b) => ((order.get(a) ?? 0) <= (order.get(b) ?? 0) ? [a, b] : [b, a]),
    phenotypeOf: (a, b) => ({ label: labelOfPair(a, b), color: phenotypeColor(labelOfPair(a, b)) }),
    phenotypeColor,
    genotypes,
    masks: (a, b) => !blends.has(blendKey(a, b)) && (rank.get(a) ?? 0) > (rank.get(b) ?? 0),
  };
}

// ── canned models (creators pick one or author their own spec) ───────────────

/** Simple dominant/recessive — the classic monohybrid (also backs PunnettCross). */
export const monohybridSpec = (letter = 'A', dominant = 'tall', recessive = 'short'): CrossModelSpec => ({
  trait: 'trait',
  alleles: [
    { symbol: letter.toUpperCase(), rank: 2, trait: dominant },
    { symbol: letter.toLowerCase(), rank: 1, trait: recessive },
  ],
  colors: { [dominant]: 'var(--stage-accent)', [recessive]: 'var(--stage-muted)' },
});

/** ABO blood groups — multiple alleles + codominance (Aᴬ Aᴮ → AB). */
export const BLOOD_TYPE_SPEC: CrossModelSpec = {
  trait: 'blood type',
  alleles: [
    { symbol: 'A', rank: 2, trait: 'A' },
    { symbol: 'B', rank: 2, trait: 'B' },
    { symbol: 'O', rank: 1, trait: 'O' },
  ],
  colors: { A: 'var(--stage-accent)', B: 'var(--stage-accent-2)', AB: 'var(--stage-good)', O: 'var(--stage-muted)' },
};

/** Incomplete dominance — red × white = pink (a blended heterozygote). */
export const INCOMPLETE_SPEC: CrossModelSpec = {
  trait: 'flower colour',
  alleles: [
    { symbol: 'R', rank: 1, trait: 'red' },
    { symbol: 'W', rank: 1, trait: 'white' },
  ],
  blends: [{ pair: ['R', 'W'], label: 'pink', color: 'var(--stage-accent)' }],
  colors: { red: 'var(--stage-danger)', white: 'color-mix(in oklab, var(--stage-fg) 82%, var(--stage-bg))' },
};

export const CROSS_PRESETS = { monohybrid: monohybridSpec(), 'blood-type': BLOOD_TYPE_SPEC, incomplete: INCOMPLETE_SPEC } as const;
export type CrossPresetKey = keyof typeof CROSS_PRESETS;

/** Two independent genes — the classic dihybrid 9:3:3:1 (height × seed colour). */
export const DIHYBRID_LOCI: CrossModelSpec[] = [
  monohybridSpec('A', 'tall', 'short'),
  monohybridSpec('B', 'yellow', 'green'),
];

/** every distinct phenotype label a single-locus model can show (stable order). */
export function phenotypeLabels(m: ResolvedModel): string[] {
  const seen: string[] = [];
  for (const [a, b] of m.genotypes) { const l = m.phenotypeOf(a, b).label; if (!seen.includes(l)) seen.push(l); }
  return seen;
}

const COMBO_PALETTE = ['var(--stage-good)', 'var(--stage-accent)', 'var(--stage-accent-2)', 'var(--stage-warn)', 'var(--stage-danger)', 'var(--stage-muted)'];

/** stable colour map for the combined phenotype labels of a multi-locus cross. */
export function comboColorMap(models: ResolvedModel[]): Map<string, string> {
  const perLocus = models.map(phenotypeLabels);
  let combos: string[] = [''];
  for (const labels of perLocus) combos = combos.flatMap((c) => labels.map((l) => (c ? `${c} ${l}` : l)));
  return new Map(combos.map((c, i) => [c, COMBO_PALETTE[i % COMBO_PALETTE.length]!]));
}
