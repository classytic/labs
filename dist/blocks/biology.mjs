import { EnzymeRateLab } from "../biology/enzyme-rate/preset.mjs";
import { PhotosynthesisFactorsLab } from "../biology/photosynthesis-factors/preset.mjs";
import { CROSS_PRESETS, DIHYBRID_LOCI } from "../biology/genetic-cross/core.mjs";
import { GeneticCrossLab } from "../biology/genetic-cross/preset.mjs";
import { SexLinkedCrossLab } from "../biology/genetic-cross/sex-linked.mjs";
import { PunnettCrossLab } from "../biology/punnett-cross/preset.mjs";
import { RespirationLab } from "../biology/respiration/preset.mjs";
import { SEQUENCE_PRESETS } from "../biology/sequence/core.mjs";
import { SequenceLab } from "../biology/sequence/preset.mjs";
import { CentralDogmaLab } from "../biology/sequence/central-dogma.mjs";
import { ChipToggle, ConfigPanel, ConfigRow, JsonArea, NumField, TextField } from "./authoring.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/biology.tsx
/**
* @classytic/labs/blocks, biology lab block specs.
*
* `defineBlock` editor adapters for the biology labs. One domain per file;
* assembled in `./index.ts` and exported at `@classytic/labs/blocks/biology`.
*/
const EnzymeRateBlock = defineBlock({
	key: "enzyme-rate",
	tag: "EnzymeRate",
	void: true,
	label: "Enzyme rate (optimum & denaturation)",
	description: "Drag temperature (or pH); the rate climbs to an optimum then crashes as the lock-and-key active site is mangled, irreversibly for temperature (cooling won’t fix it), reversibly for pH. The bell is built from plotted points.",
	category: "interactive",
	schema: z.object({
		factor: z.enum(["temperature", "pH"]).default("temperature"),
		optimum: z.number().default(40),
		factorMin: z.number().default(0),
		factorMax: z.number().default(80),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(EnzymeRateLab, {
			factor: attributes.factor,
			optimum: attributes.optimum,
			factorMin: attributes.factorMin,
			factorMax: attributes.factorMax,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const isPh = attributes.factor === "pH";
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "The optimum, then the cliff"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "pH mode (reversible)",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: isPh,
					onClick: () => updateAttributes(isPh ? {
						factor: "temperature",
						optimum: 40,
						factorMin: 0,
						factorMax: 80
					} : {
						factor: "pH",
						optimum: 7,
						factorMin: 1,
						factorMax: 14
					}),
					children: "pH"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "optimum",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.optimum ?? 40,
					onChange: (v) => updateAttributes({ optimum: v })
				})
			})
		] }), widget] });
	}
});
const PhotosynthesisFactorsBlock = defineBlock({
	key: "photosynthesis-factors",
	tag: "PhotosynthesisFactors",
	void: true,
	label: "Photosynthesis: limiting factors",
	description: "Sliders for light, CO₂ and temperature; the rate climbs then plateaus at the factor in shortest supply (raise it → higher plateau), while temperature gives a peak (denaturation). Freeze curves to compare.",
	category: "interactive",
	schema: z.object({
		light: z.number().default(70),
		co2: z.number().default(50),
		temperature: z.number().default(25),
		tempOptimum: z.number().default(28),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(PhotosynthesisFactorsLab, {
			light: attributes.light,
			co2: attributes.co2,
			temperature: attributes.temperature,
			tempOptimum: attributes.tempOptimum,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [/* @__PURE__ */ jsx(ConfigRow, {
			label: "title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: attributes.title ?? "",
				onChange: (v) => updateAttributes({ title: v }),
				placeholder: "Limiting factors"
			})
		}), /* @__PURE__ */ jsx(ConfigRow, {
			label: "temp optimum",
			children: /* @__PURE__ */ jsx(NumField, {
				value: attributes.tempOptimum ?? 28,
				onChange: (v) => updateAttributes({ tempOptimum: v })
			})
		})] }), widget] });
	}
});
const PunnettCrossBlock = defineBlock({
	key: "punnett-cross",
	tag: "PunnettCross",
	void: true,
	label: "Punnett square (monohybrid cross)",
	description: "Pick each parent’s alleles; gametes drop onto the grid edges, the 2×2 fills, and the 1:2:1 genotype + 3:1 phenotype ratios read off as tally bars. Predict-before-reveal; click a cell to highlight matches.",
	category: "interactive",
	schema: z.object({
		parent1: z.string().default("Aa"),
		parent2: z.string().default("Aa"),
		alleleLetter: z.string().default("A"),
		dominantLabel: z.string().default("tall"),
		recessiveLabel: z.string().default("short"),
		predictFirst: z.boolean().default(true),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(PunnettCrossLab, {
			parent1: attributes.parent1,
			parent2: attributes.parent2,
			alleleLetter: attributes.alleleLetter,
			dominantLabel: attributes.dominantLabel,
			recessiveLabel: attributes.recessiveLabel,
			predictFirst: attributes.predictFirst,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "The 3:1 you can count"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "allele letter",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.alleleLetter ?? "A",
					onChange: (v) => updateAttributes({ alleleLetter: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "dominant label",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.dominantLabel ?? "tall",
					onChange: (v) => updateAttributes({ dominantLabel: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "recessive label",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.recessiveLabel ?? "short",
					onChange: (v) => updateAttributes({ recessiveLabel: v })
				})
			})
		] }), widget] });
	}
});
const RespirationBlock = defineBlock({
	key: "respiration",
	tag: "Respiration",
	void: true,
	label: "Photosynthesis ⇌ Respiration (the mirror)",
	description: "Two reaction flows drawn with shared molecule glyphs: photosynthesis and respiration, where the products of one are the reactants of the other. A day/night toggle shows the net gas exchange.",
	category: "interactive",
	schema: z.object({
		mode: z.enum(["day", "night"]).default("day"),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(RespirationLab, {
			mode: attributes.mode,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [/* @__PURE__ */ jsx(ConfigRow, {
			label: "title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: attributes.title ?? "",
				onChange: (v) => updateAttributes({ title: v }),
				placeholder: "One runs the other backwards"
			})
		}), /* @__PURE__ */ jsx(ConfigRow, {
			label: "start at night",
			children: /* @__PURE__ */ jsx(ChipToggle, {
				active: attributes.mode === "night",
				onClick: () => updateAttributes({ mode: attributes.mode === "night" ? "day" : "night" }),
				children: "night"
			})
		})] }), widget] });
	}
});
const GeneticCrossBlock = defineBlock({
	key: "genetic-cross",
	tag: "GeneticCross",
	void: true,
	label: "Genetic cross (dominance / codominance / blood groups)",
	description: "The general cross tool: pick a pattern, simple dominance, ABO blood groups (multiple alleles + codominance → AB), or incomplete dominance (red × white → pink), or author your own allele model. Gametes drop onto the 2×2 grid; genotype + phenotype ratios read off as tally bars. Predict-before-reveal.",
	category: "interactive",
	schema: z.object({
		preset: z.enum([
			"monohybrid",
			"blood-type",
			"incomplete",
			"dihybrid",
			"custom"
		]).default("blood-type"),
		spec: z.object({
			trait: z.string().optional(),
			alleles: z.array(z.object({
				symbol: z.string(),
				rank: z.number(),
				trait: z.string()
			})),
			blends: z.array(z.object({
				pair: z.tuple([z.string(), z.string()]),
				label: z.string(),
				color: z.string().optional()
			})).optional(),
			colors: z.record(z.string(), z.string()).optional()
		}).optional(),
		parent1: z.array(z.string()).optional(),
		parent2: z.array(z.string()).optional(),
		predictFirst: z.boolean().default(true),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const preset = attributes.preset ?? "blood-type";
		const dihybrid = preset === "dihybrid";
		const widget = /* @__PURE__ */ jsx(GeneticCrossLab, {
			spec: dihybrid ? void 0 : preset === "custom" ? attributes.spec : CROSS_PRESETS[preset],
			loci: dihybrid ? DIHYBRID_LOCI : void 0,
			parent1: attributes.parent1,
			parent2: attributes.parent2,
			predictFirst: attributes.predictFirst,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const cyclePreset = () => {
			const order = [
				"monohybrid",
				"blood-type",
				"incomplete",
				"dihybrid",
				"custom"
			];
			updateAttributes({
				preset: order[(order.indexOf(preset) + 1) % order.length],
				parent1: void 0,
				parent2: void 0
			});
		};
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "Blood groups"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "pattern",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: true,
					onClick: cyclePreset,
					children: preset
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "predict first",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: attributes.predictFirst !== false,
					onClick: () => updateAttributes({ predictFirst: attributes.predictFirst === false }),
					children: "predict-then-reveal"
				})
			}),
			preset === "custom" && /* @__PURE__ */ jsx(ConfigRow, {
				label: "model spec",
				children: /* @__PURE__ */ jsx(JsonArea, {
					value: attributes.spec ?? { alleles: [] },
					onChange: (v) => updateAttributes({ spec: v })
				})
			})
		] }), widget] });
	}
});
const SequenceBlock = defineBlock({
	key: "sequence",
	tag: "Sequence",
	void: true,
	label: "DNA/RNA sequence (replication / transcription / translation)",
	description: "A base-pairing builder: the template strand is given and the learner builds the partner by pairing each unit. Pick the process, replication (A–T, G–C, semiconservative), transcription (T→U into mRNA), or translation (codons → amino acids via the genetic code), and the template.",
	category: "interactive",
	schema: z.object({
		kind: z.enum([
			"replication",
			"transcription",
			"translation"
		]).default("replication"),
		template: z.array(z.string()).optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const kind = attributes.kind ?? "replication";
		const widget = /* @__PURE__ */ jsx(SequenceLab, {
			kind,
			template: attributes.template,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		const cycleKind = () => {
			const order = [
				"replication",
				"transcription",
				"translation"
			];
			const next = order[(order.indexOf(kind) + 1) % order.length];
			updateAttributes({
				kind: next,
				template: SEQUENCE_PRESETS[next]
			});
		};
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "DNA replication"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "process",
				children: /* @__PURE__ */ jsx(ChipToggle, {
					active: true,
					onClick: cycleKind,
					children: kind
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "template",
				children: /* @__PURE__ */ jsx(JsonArea, {
					value: attributes.template ?? SEQUENCE_PRESETS[kind],
					onChange: (v) => updateAttributes({ template: v })
				})
			})
		] }), widget] });
	}
});
const SexLinkedCrossBlock = defineBlock({
	key: "sex-linked-cross",
	tag: "SexLinkedCross",
	void: true,
	label: "Sex-linked cross (X-linked traits)",
	description: "An X-linked gene cross (colour blindness, haemophilia): the Y carries no allele, so males are hemizygous and a single recessive X shows. A carrier mother passes the trait to half her sons. Reuses the Punnett grid + predict-before-reveal.",
	category: "interactive",
	schema: z.object({
		allele: z.string().default("B"),
		dominant: z.string().default("normal"),
		recessive: z.string().default("colour-blind"),
		mother: z.tuple([z.string(), z.string()]).optional(),
		father: z.string().optional(),
		predictFirst: z.boolean().default(true),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(SexLinkedCrossLab, {
			allele: attributes.allele,
			dominant: attributes.dominant,
			recessive: attributes.recessive,
			mother: attributes.mother,
			father: attributes.father,
			predictFirst: attributes.predictFirst,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.title ?? "",
					onChange: (v) => updateAttributes({ title: v }),
					placeholder: "Colour blindness"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "dominant",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.dominant ?? "normal",
					onChange: (v) => updateAttributes({ dominant: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "recessive",
				children: /* @__PURE__ */ jsx(TextField, {
					value: attributes.recessive ?? "colour-blind",
					onChange: (v) => updateAttributes({ recessive: v })
				})
			})
		] }), widget] });
	}
});
const CentralDogmaBlock = defineBlock({
	key: "central-dogma",
	tag: "CentralDogma",
	void: true,
	label: "Central dogma (DNA → mRNA → protein)",
	description: "The whole flow in one tool: transcribe the DNA template into mRNA (T→U), then translate each 3-base codon into an amino acid. Translation unlocks only once the mRNA is correct, so the dependency is felt. Reuses the genetic-code core.",
	category: "interactive",
	schema: z.object({
		dna: z.array(z.string()).optional(),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(CentralDogmaLab, {
			dna: attributes.dna,
			title: attributes.title,
			prompt: attributes.prompt
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [/* @__PURE__ */ jsx(ConfigRow, {
			label: "title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: attributes.title ?? "",
				onChange: (v) => updateAttributes({ title: v }),
				placeholder: "The central dogma"
			})
		}), /* @__PURE__ */ jsx(ConfigRow, {
			label: "DNA template (multiple of 3)",
			children: /* @__PURE__ */ jsx(JsonArea, {
				value: attributes.dna ?? [
					"T",
					"A",
					"C",
					"G",
					"A",
					"A",
					"C",
					"C",
					"T",
					"A",
					"T",
					"T"
				],
				onChange: (v) => updateAttributes({ dna: v })
			})
		})] }), widget] });
	}
});
/** This domain's block specs + tag→component render map. */
const biologyBlocks = [
	EnzymeRateBlock,
	PhotosynthesisFactorsBlock,
	PunnettCrossBlock,
	RespirationBlock,
	GeneticCrossBlock,
	SequenceBlock,
	SexLinkedCrossBlock,
	CentralDogmaBlock
];
const biologyComponents = {
	EnzymeRate: EnzymeRateLab,
	PhotosynthesisFactors: PhotosynthesisFactorsLab,
	PunnettCross: PunnettCrossLab,
	Respiration: RespirationLab,
	GeneticCross: GeneticCrossLab,
	Sequence: SequenceLab,
	SexLinkedCross: SexLinkedCrossLab,
	CentralDogma: CentralDogmaLab
};

//#endregion
export { CentralDogmaBlock, EnzymeRateBlock, GeneticCrossBlock, PhotosynthesisFactorsBlock, PunnettCrossBlock, RespirationBlock, SequenceBlock, SexLinkedCrossBlock, biologyBlocks, biologyComponents };