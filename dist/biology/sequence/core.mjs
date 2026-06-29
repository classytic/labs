//#region src/biology/sequence/core.ts
const DNA_BASES = [
	"A",
	"T",
	"G",
	"C"
];
const RNA_BASES = [
	"A",
	"U",
	"G",
	"C"
];
/** new DNA strand opposite a DNA template. */
const DNA_COMPLEMENT = {
	A: "T",
	T: "A",
	G: "C",
	C: "G"
};
/** mRNA base opposite a DNA template base (T→A but A→U). */
const TRANSCRIBE = {
	A: "U",
	T: "A",
	G: "C",
	C: "G"
};
/** classic CPK-ish base colours, tokenized. */
const BASE_COLOR = {
	A: "var(--stage-good)",
	T: "var(--stage-danger)",
	U: "var(--stage-warn)",
	G: "var(--stage-accent-2)",
	C: "var(--stage-accent)"
};
/** standard genetic code, mRNA codon → amino acid (3-letter), Stop for terminators. */
const CODON_TABLE = {
	UUU: "Phe",
	UUC: "Phe",
	UUA: "Leu",
	UUG: "Leu",
	CUU: "Leu",
	CUC: "Leu",
	CUA: "Leu",
	CUG: "Leu",
	AUU: "Ile",
	AUC: "Ile",
	AUA: "Ile",
	AUG: "Met",
	GUU: "Val",
	GUC: "Val",
	GUA: "Val",
	GUG: "Val",
	UCU: "Ser",
	UCC: "Ser",
	UCA: "Ser",
	UCG: "Ser",
	CCU: "Pro",
	CCC: "Pro",
	CCA: "Pro",
	CCG: "Pro",
	ACU: "Thr",
	ACC: "Thr",
	ACA: "Thr",
	ACG: "Thr",
	GCU: "Ala",
	GCC: "Ala",
	GCA: "Ala",
	GCG: "Ala",
	UAU: "Tyr",
	UAC: "Tyr",
	UAA: "Stop",
	UAG: "Stop",
	CAU: "His",
	CAC: "His",
	CAA: "Gln",
	CAG: "Gln",
	AAU: "Asn",
	AAC: "Asn",
	AAA: "Lys",
	AAG: "Lys",
	GAU: "Asp",
	GAC: "Asp",
	GAA: "Glu",
	GAG: "Glu",
	UGU: "Cys",
	UGC: "Cys",
	UGA: "Stop",
	UGG: "Trp",
	CGU: "Arg",
	CGC: "Arg",
	CGA: "Arg",
	CGG: "Arg",
	AGU: "Ser",
	AGC: "Ser",
	AGA: "Arg",
	AGG: "Arg",
	GGU: "Gly",
	GGC: "Gly",
	GGA: "Gly",
	GGG: "Gly"
};
/** spare amino acids to pad the translation palette so it isn't trivially short. */
const AA_DISTRACTORS = [
	"Met",
	"Phe",
	"Leu",
	"Gly",
	"Ser",
	"Val",
	"Lys",
	"Stop"
];
const uniq = (xs) => [...new Set(xs)];
function buildSequenceModel(kind, template) {
	if (kind === "translation") {
		const answers = template.map((c) => CODON_TABLE[c] ?? "???");
		return {
			kind,
			units: template,
			partnerOf: (c) => CODON_TABLE[c] ?? "???",
			options: uniq([...answers, ...AA_DISTRACTORS]).slice(0, Math.max(4, uniq(answers).length + 2)),
			topLabel: "mRNA codons",
			bottomLabel: "amino acids",
			partnerIsBase: false
		};
	}
	if (kind === "transcription") return {
		kind,
		units: template,
		partnerOf: (b) => TRANSCRIBE[b] ?? "?",
		options: [...RNA_BASES],
		topLabel: "DNA template",
		bottomLabel: "mRNA",
		partnerIsBase: true
	};
	return {
		kind,
		units: template,
		partnerOf: (b) => DNA_COMPLEMENT[b] ?? "?",
		options: [...DNA_BASES],
		topLabel: "template strand (old)",
		bottomLabel: "new strand",
		partnerIsBase: true
	};
}
/** canned templates a creator can start from. */
const SEQUENCE_PRESETS = {
	replication: [
		"T",
		"A",
		"C",
		"G",
		"G",
		"A",
		"T",
		"C"
	],
	transcription: [
		"T",
		"A",
		"C",
		"G",
		"G",
		"A",
		"T"
	],
	translation: [
		"AUG",
		"UUU",
		"GGA",
		"UAC",
		"UAA"
	]
};

//#endregion
export { BASE_COLOR, CODON_TABLE, DNA_BASES, DNA_COMPLEMENT, RNA_BASES, SEQUENCE_PRESETS, TRANSCRIBE, buildSequenceModel };