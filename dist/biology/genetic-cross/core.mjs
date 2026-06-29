//#region src/biology/genetic-cross/core.ts
const PALETTE = [
	"var(--stage-accent)",
	"var(--stage-accent-2)",
	"var(--stage-good)",
	"var(--stage-warn)",
	"var(--stage-danger)",
	"var(--stage-muted)"
];
const blendKey = (x, y) => [x, y].sort().join("|");
function resolveModel(spec) {
	const order = new Map(spec.alleles.map((a, i) => [a.symbol, i]));
	const rank = new Map(spec.alleles.map((a) => [a.symbol, a.rank]));
	const trait = new Map(spec.alleles.map((a) => [a.symbol, a.trait]));
	const blends = new Map((spec.blends ?? []).map((b) => [blendKey(b.pair[0], b.pair[1]), b]));
	const labelOfPair = (a, b) => {
		const bl = blends.get(blendKey(a, b));
		if (bl) return bl.label;
		const maxR = Math.max(rank.get(a) ?? 0, rank.get(b) ?? 0);
		const tops = [a, b].filter((s) => (rank.get(s) ?? 0) === maxR);
		const traits = [...new Set(tops.map((s) => trait.get(s) ?? s))];
		return traits.length === 1 ? traits[0] : traits.join("");
	};
	const syms = spec.alleles.map((a) => a.symbol);
	const genotypes = [];
	const seen = [];
	for (let i = 0; i < syms.length; i++) for (let j = i; j < syms.length; j++) {
		genotypes.push([syms[i], syms[j]]);
		const l = labelOfPair(syms[i], syms[j]);
		if (!seen.includes(l)) seen.push(l);
	}
	const colorMap = new Map(seen.map((l, idx) => [l, spec.colors?.[l] ?? PALETTE[idx % PALETTE.length]]));
	for (const b of spec.blends ?? []) if (b.color) colorMap.set(b.label, b.color);
	const phenotypeColor = (label) => colorMap.get(label) ?? PALETTE[0];
	return {
		trait: spec.trait ?? "phenotype",
		alleles: spec.alleles,
		norm: (a, b) => (order.get(a) ?? 0) <= (order.get(b) ?? 0) ? [a, b] : [b, a],
		phenotypeOf: (a, b) => ({
			label: labelOfPair(a, b),
			color: phenotypeColor(labelOfPair(a, b))
		}),
		phenotypeColor,
		genotypes,
		masks: (a, b) => !blends.has(blendKey(a, b)) && (rank.get(a) ?? 0) > (rank.get(b) ?? 0)
	};
}
/** Simple dominant/recessive, the classic monohybrid (also backs PunnettCross). */
const monohybridSpec = (letter = "A", dominant = "tall", recessive = "short") => ({
	trait: "trait",
	alleles: [{
		symbol: letter.toUpperCase(),
		rank: 2,
		trait: dominant
	}, {
		symbol: letter.toLowerCase(),
		rank: 1,
		trait: recessive
	}],
	colors: {
		[dominant]: "var(--stage-accent)",
		[recessive]: "var(--stage-muted)"
	}
});
/** ABO blood groups, multiple alleles + codominance (Aᴬ Aᴮ → AB). */
const BLOOD_TYPE_SPEC = {
	trait: "blood type",
	alleles: [
		{
			symbol: "A",
			rank: 2,
			trait: "A"
		},
		{
			symbol: "B",
			rank: 2,
			trait: "B"
		},
		{
			symbol: "O",
			rank: 1,
			trait: "O"
		}
	],
	colors: {
		A: "var(--stage-accent)",
		B: "var(--stage-accent-2)",
		AB: "var(--stage-good)",
		O: "var(--stage-muted)"
	}
};
/** Incomplete dominance, red × white = pink (a blended heterozygote). */
const INCOMPLETE_SPEC = {
	trait: "flower colour",
	alleles: [{
		symbol: "R",
		rank: 1,
		trait: "red"
	}, {
		symbol: "W",
		rank: 1,
		trait: "white"
	}],
	blends: [{
		pair: ["R", "W"],
		label: "pink",
		color: "var(--stage-accent)"
	}],
	colors: {
		red: "var(--stage-danger)",
		white: "color-mix(in oklab, var(--stage-fg) 82%, var(--stage-bg))"
	}
};
const CROSS_PRESETS = {
	monohybrid: monohybridSpec(),
	"blood-type": BLOOD_TYPE_SPEC,
	incomplete: INCOMPLETE_SPEC
};
/** Two independent genes, the classic dihybrid 9:3:3:1 (height × seed colour). */
const DIHYBRID_LOCI = [monohybridSpec("A", "tall", "short"), monohybridSpec("B", "yellow", "green")];
/** every distinct phenotype label a single-locus model can show (stable order). */
function phenotypeLabels(m) {
	const seen = [];
	for (const [a, b] of m.genotypes) {
		const l = m.phenotypeOf(a, b).label;
		if (!seen.includes(l)) seen.push(l);
	}
	return seen;
}
const COMBO_PALETTE = [
	"var(--stage-good)",
	"var(--stage-accent)",
	"var(--stage-accent-2)",
	"var(--stage-warn)",
	"var(--stage-danger)",
	"var(--stage-muted)"
];
/** stable colour map for the combined phenotype labels of a multi-locus cross. */
function comboColorMap(models) {
	const perLocus = models.map(phenotypeLabels);
	let combos = [""];
	for (const labels of perLocus) combos = combos.flatMap((c) => labels.map((l) => c ? `${c} ${l}` : l));
	return new Map(combos.map((c, i) => [c, COMBO_PALETTE[i % COMBO_PALETTE.length]]));
}

//#endregion
export { BLOOD_TYPE_SPEC, CROSS_PRESETS, DIHYBRID_LOCI, INCOMPLETE_SPEC, comboColorMap, monohybridSpec, resolveModel };