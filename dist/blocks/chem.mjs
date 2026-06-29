import { GasBoxLab } from "../chem/gas-box/preset.mjs";
import { SolutionBoxLab } from "../chem/solution/solution-box.mjs";
import { DilutionLab } from "../chem/solution/dilution.mjs";
import { BohrAtom } from "../chem/bohr-atom.mjs";
import { ReactionProfile } from "../chem/reaction-profile.mjs";
import { ReactionLab } from "../chem/reaction-lab.mjs";
import { Battery } from "../chem/battery.mjs";
import { LeChatelierLab } from "../chem/equilibrium/preset.mjs";
import { TitrationLab } from "../chem/titration/preset.mjs";
import { ElectrochemLab } from "../chem/electrochem/preset.mjs";
import { KineticsLab } from "../chem/kinetics/preset.mjs";
import { StoichiometryLab } from "../chem/stoichiometry/preset.mjs";
import { PeriodicTrendsLab } from "../chem/periodic-trends/preset.mjs";
import { ConfigPanel, ConfigRow, NumField, TextField } from "./authoring.mjs";
import { commonLabProps, labBlock } from "./lab-block.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/chem.tsx
/**
* @classytic/labs/blocks, chemistry lab block specs.
*
* `defineBlock` editor adapters for the chemistry labs (one domain per file; the
* registry is assembled in `./index.ts`). Each spec pairs a real zod schema with
* a render `Component` that, in `mode === 'editing'`, shows the row-based
* authoring kit (`./authoring`). `@classytic/cms-ui` + `zod` are optional peers
* touched only by the blocks layer.
*/
const LeChatelierBlock = labBlock({
	key: "le-chatelier",
	label: "Le Chatelier: equilibrium shifts",
	description: "A reversible reaction A ⇌ νB at equilibrium (Q = K). Stress it, add a species, compress, heat, and it shifts to oppose the change (shift direction emerges from the core, never hardcoded). AUTHOR YOUR OWN reaction: set the species names, product coefficient, colours, K, and whether the forward reaction is endothermic. Defaults to N₂O₄ ⇌ 2 NO₂ (colourless ⇌ brown).",
	schema: z.object({
		reactantName: z.string().optional().describe("left species, e.g. N₂O₄"),
		productName: z.string().optional().describe("right species, e.g. NO₂"),
		productCoeff: z.number().optional().describe("ν in A ⇌ νB (default 2)"),
		productColor: z.string().optional().describe("CSS colour the flask tints toward as product forms"),
		reactantColor: z.string().optional(),
		K: z.number().optional().describe("equilibrium constant at room temperature"),
		endothermic: z.boolean().optional().describe("forward reaction endothermic → heating makes more product (default true)"),
		...commonLabProps
	}),
	Component: (a) => /* @__PURE__ */ jsx(LeChatelierLab, { ...a })
});
const ElectrochemBlock = labBlock({
	key: "electrochem",
	label: "Galvanic cell (Nernst EMF)",
	description: "A voltaic cell with two metal half-cells, a salt bridge, and a live voltmeter. The lower-E° metal is the anode (−); electrons flow to the cathode (+). The meter reads the Nernst EMF E = E°cell − (RT/nF)·ln Q, so changing an ion concentration moves the voltage, or pick the same metal both sides for a concentration cell. Author the two electrodes + concentrations.",
	schema: z.object({
		metalA: z.enum([
			"Mg",
			"Al",
			"Zn",
			"Fe",
			"Ni",
			"Pb",
			"Cu",
			"Ag"
		]).optional(),
		metalB: z.enum([
			"Mg",
			"Al",
			"Zn",
			"Fe",
			"Ni",
			"Pb",
			"Cu",
			"Ag"
		]).optional(),
		concA: z.number().optional().describe("electrode 1 ion concentration, mol/L"),
		concB: z.number().optional().describe("electrode 2 ion concentration, mol/L"),
		...commonLabProps
	}),
	Component: (a) => /* @__PURE__ */ jsx(ElectrochemLab, { ...a })
});
const PeriodicTrendsBlock = labBlock({
	key: "periodic-trends",
	label: "Periodic trends (heatmap)",
	description: "The periodic table (H–Xe) coloured by a property, atomic radius, ionisation energy or electronegativity, so the trend reads as a gradient: radius grows down/left, ionisation energy & electronegativity grow up/right. Hover an element for its value. Pick the default property and a highlighted element; ships a predict-first question.",
	schema: z.object({
		property: z.enum([
			"radius",
			"ie",
			"en"
		]).optional().describe("which property to colour by"),
		highlight: z.string().optional().describe("element symbol to highlight, e.g. Cl"),
		...commonLabProps
	}),
	Component: (a) => /* @__PURE__ */ jsx(PeriodicTrendsLab, { ...a })
});
const StoichiometryBlock = labBlock({
	key: "stoichiometry",
	label: "Stoichiometry (limiting reagent)",
	description: "A balanced reaction as a recipe: reactants are trays of molecule tokens, the consumed part solid and the leftover faded, so the limiting reagent is the tray that empties (highlighted) and excess shows as faded tokens. The product tray fills with what forms. Backed by solveStoichiometry (extent, limiting reagent, moles/grams, leftovers). Pick a reaction (water/ammonia/methane/rust) or author your own; drag the amounts.",
	schema: z.object({
		reaction: z.enum([
			"water",
			"ammonia",
			"methane",
			"rust"
		]).optional(),
		amounts: z.array(z.number()).optional().describe("reactant amounts in mol (aligned with the reaction)"),
		...commonLabProps
	}),
	Component: (a) => /* @__PURE__ */ jsx(StoichiometryLab, { ...a })
});
const KineticsBlock = labBlock({
	key: "kinetics",
	label: "Reaction kinetics (collisions + Arrhenius)",
	description: "A vessel of molecules where only high-energy collisions (≥ Eₐ) succeed and convert A→B, beside the Maxwell–Boltzmann energy spread (shaded reactive tail) and a live A/B bar. Heat it or add a catalyst (lowers Eₐ) and watch the rate jump, backed by k = A·e^(−Eₐ/RT). Author the activation energy, rate, order, molecule count and temperature; ships a predict-first question.",
	schema: z.object({
		EaKJ: z.number().optional().describe("activation energy, kJ/mol"),
		kRef: z.number().optional().describe("rate constant at 300 K (sets the pace)"),
		order: z.union([
			z.literal(0),
			z.literal(1),
			z.literal(2)
		]).optional().describe("reaction order for the half-life readout"),
		molecules: z.number().optional().describe("molecules in the vessel (6–60)"),
		T0: z.number().optional().describe("initial temperature, K"),
		...commonLabProps
	}),
	Component: (a) => /* @__PURE__ */ jsx(KineticsLab, { ...a })
});
const TitrationBlock = labBlock({
	key: "titration",
	label: "Acid–base titration (pH curve)",
	description: "Drip strong base into an acid and build the pH curve: buffer region (weak acid, midpoint pH = pKa), the steep jump at the equivalence point (pH 7 strong, >7 weak), and the phenolphthalein flip to pink. Built on the acid–base kernel. AUTHOR the scenario: acid type, concentrations, volume and the weak-acid pKa.",
	schema: z.object({
		analyte: z.enum(["strong-acid", "weak-acid"]).optional(),
		concAcid: z.number().optional().describe("acid concentration in the flask, mol/L"),
		volAcidMl: z.number().optional().describe("acid volume in the flask, mL"),
		concBase: z.number().optional().describe("strong-base titrant concentration, mol/L"),
		pKa: z.number().optional().describe("weak-acid pKa (e.g. 4.76 acetic, 3.75 formic)"),
		...commonLabProps
	}),
	Component: (a) => /* @__PURE__ */ jsx(TitrationLab, { ...a })
});
const GasBoxBlock = defineBlock({
	key: "gas-box",
	tag: "GasBox",
	void: true,
	label: "Gas box (PV = nRT, kinetic theory)",
	description: "Hundreds of molecules bounce in a box; drag the piston (V), heat it (T), add molecules (n), pressure is MEASURED from wall collisions, so PV=nRT emerges. Lock T/V/P for Boyle/Gay-Lussac/Charles.",
	category: "interactive",
	schema: z.object({
		holdConstant: z.enum([
			"none",
			"temperature",
			"volume",
			"pressure"
		]).default("none"),
		particleCount: z.number().default(180),
		temperature: z.number().default(300),
		volume: z.number().default(7),
		showGauge: z.boolean().default(true),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(GasBoxLab, {
			holdConstant: attributes.holdConstant,
			particleCount: attributes.particleCount,
			temperature: attributes.temperature,
			volume: attributes.volume,
			showGauge: attributes.showGauge,
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
					placeholder: "Gas in a box"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "molecules n",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.particleCount ?? 180,
					onChange: (v) => updateAttributes({ particleCount: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "temperature K",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.temperature ?? 300,
					onChange: (v) => updateAttributes({ temperature: v })
				})
			})
		] }), widget] });
	}
});
const SolutionBoxBlock = defineBlock({
	key: "solution-box",
	tag: "SolutionBox",
	void: true,
	label: "Solution box (molarity = n/V)",
	description: "Solute as dots in a box: add solute (more dots) or water (same dots, bigger box), M=n/V shows as a number AND colour intensity. Draggable probe proves molarity is a local density.",
	category: "interactive",
	schema: z.object({
		moles: z.number().default(.5),
		volume: z.number().default(.5),
		showProbe: z.boolean().default(true),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(SolutionBoxLab, {
			moles: attributes.moles,
			volume: attributes.volume,
			showProbe: attributes.showProbe,
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
					placeholder: "Molarity is a crowd"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "solute (mol)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.moles ?? .5,
					onChange: (v) => updateAttributes({ moles: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "volume (L)",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.volume ?? .5,
					onChange: (v) => updateAttributes({ volume: v })
				})
			})
		] }), widget] });
	}
});
const DilutionBlock = defineBlock({
	key: "dilution",
	tag: "Dilution",
	void: true,
	label: "Dilution (C₁V₁ = C₂V₂)",
	description: "Two beakers show the SAME solute dots, concentrated in the aliquot, spread in the final volume, so C₁V₁=C₂V₂ is seen as conservation of moles: same dots, bigger box, lower concentration.",
	category: "interactive",
	schema: z.object({
		stockConcentration: z.number().default(2),
		aliquotVolume: z.number().default(.25),
		finalVolume: z.number().default(1),
		title: z.string().optional(),
		prompt: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const widget = /* @__PURE__ */ jsx(DilutionLab, {
			stockConcentration: attributes.stockConcentration,
			aliquotVolume: attributes.aliquotVolume,
			finalVolume: attributes.finalVolume,
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
					placeholder: "Dilution"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "stock C₁",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.stockConcentration ?? 2,
					onChange: (v) => updateAttributes({ stockConcentration: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "aliquot V₁",
				children: /* @__PURE__ */ jsx(NumField, {
					value: attributes.aliquotVolume ?? .25,
					onChange: (v) => updateAttributes({ aliquotVolume: v })
				})
			})
		] }), widget] });
	}
});
const BohrAtomBlock = defineBlock({
	key: "bohr-atom",
	void: true,
	label: "Bohr atom",
	description: "Animated shell model, drag Z to walk the first 20 elements; shells fill 2, 8, 8.",
	category: "interactive",
	schema: z.object({
		protons: z.number().optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const protons = typeof attributes.protons === "number" ? attributes.protons : 6;
		const title = attributes.title ?? "Bohr model of the atom";
		const widget = /* @__PURE__ */ jsx(BohrAtom, {
			protons,
			title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [/* @__PURE__ */ jsx(ConfigRow, {
			label: "Title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: title,
				onChange: (v) => updateAttributes({ title: v }),
				className: "flex-1"
			})
		}), /* @__PURE__ */ jsx(ConfigRow, {
			label: "protons Z",
			children: /* @__PURE__ */ jsx(NumField, {
				value: protons,
				onChange: (v) => updateAttributes({ protons: v })
			})
		})] }), widget] });
	}
});
const ReactionProfileBlock = defineBlock({
	key: "reaction-profile",
	void: true,
	label: "Reaction profile",
	description: "Energy diagram, activation energy, ΔH (exo/endothermic), catalyst toggle.",
	category: "interactive",
	schema: z.object({
		deltaH: z.number().optional(),
		activationEnergy: z.number().optional(),
		catalyst: z.boolean().optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const deltaH = typeof attributes.deltaH === "number" ? attributes.deltaH : -40;
		const activationEnergy = typeof attributes.activationEnergy === "number" ? attributes.activationEnergy : 60;
		const catalyst = attributes.catalyst === true;
		const title = attributes.title ?? "Reaction energy profile";
		const widget = /* @__PURE__ */ jsx(ReactionProfile, {
			deltaH,
			activationEnergy,
			catalyst,
			title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Title",
				children: /* @__PURE__ */ jsx(TextField, {
					value: title,
					onChange: (v) => updateAttributes({ title: v }),
					className: "flex-1"
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "ΔH",
				children: /* @__PURE__ */ jsx(NumField, {
					value: deltaH,
					onChange: (v) => updateAttributes({ deltaH: v })
				})
			}),
			/* @__PURE__ */ jsx(ConfigRow, {
				label: "Eₐ",
				children: /* @__PURE__ */ jsx(NumField, {
					value: activationEnergy,
					onChange: (v) => updateAttributes({ activationEnergy: v })
				})
			})
		] }), widget] });
	}
});
const ReactionLabBlock = defineBlock({
	key: "reaction-lab",
	void: true,
	label: "Reaction lab",
	description: "Atoms collide and bond, A + B → A–B, with a temperature/kinetics knob.",
	category: "interactive",
	schema: z.object({
		a: z.string().optional(),
		b: z.string().optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const a = typeof attributes.a === "string" && attributes.a ? attributes.a : "A";
		const b = typeof attributes.b === "string" && attributes.b ? attributes.b : "B";
		const widget = /* @__PURE__ */ jsx(ReactionLab, {
			a,
			b,
			title: attributes.title ?? `${a} + ${b} → ${a}–${b}`
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(ConfigPanel, { children: /* @__PURE__ */ jsxs(ConfigRow, {
			label: "atoms",
			children: [
				/* @__PURE__ */ jsx(TextField, {
					value: a,
					onChange: (v) => updateAttributes({ a: v }),
					className: "w-16"
				}),
				/* @__PURE__ */ jsx("span", {
					className: "text-muted-foreground",
					children: "+"
				}),
				/* @__PURE__ */ jsx(TextField, {
					value: b,
					onChange: (v) => updateAttributes({ b: v }),
					className: "w-16"
				})
			]
		}) }), widget] });
	}
});
const BatteryBlock = defineBlock({
	key: "battery",
	void: true,
	label: "Battery (galvanic cell)",
	description: "Electrons flow from anode to cathode, half-reactions + EMF.",
	category: "interactive",
	schema: z.object({
		emf: z.number().optional(),
		title: z.string().optional()
	}),
	Component: ({ attributes, mode, updateAttributes }) => {
		const title = attributes.title ?? "Galvanic cell: electrons on the move";
		const widget = /* @__PURE__ */ jsx(Battery, {
			emf: typeof attributes.emf === "number" ? attributes.emf : 1.1,
			title
		});
		if (mode !== "editing" || !updateAttributes) return widget;
		return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(ConfigPanel, { children: [/* @__PURE__ */ jsx(ConfigRow, {
			label: "Title",
			children: /* @__PURE__ */ jsx(TextField, {
				value: title,
				onChange: (v) => updateAttributes({ title: v }),
				className: "flex-1"
			})
		}), /* @__PURE__ */ jsx(ConfigRow, {
			label: "EMF (V)",
			children: /* @__PURE__ */ jsx(NumField, {
				value: typeof attributes.emf === "number" ? attributes.emf : 1.1,
				onChange: (v) => updateAttributes({ emf: v })
			})
		})] }), widget] });
	}
});
const chemBlocks = [
	GasBoxBlock,
	SolutionBoxBlock,
	DilutionBlock,
	BohrAtomBlock,
	ReactionProfileBlock,
	ReactionLabBlock,
	BatteryBlock,
	LeChatelierBlock,
	TitrationBlock,
	ElectrochemBlock,
	KineticsBlock,
	StoichiometryBlock,
	PeriodicTrendsBlock
];
const chemComponents = {
	GasBox: GasBoxLab,
	SolutionBox: SolutionBoxLab,
	Dilution: DilutionLab,
	BohrAtom,
	ReactionProfile,
	ReactionLab,
	Battery,
	LeChatelier: LeChatelierLab,
	Titration: TitrationLab,
	Electrochem: ElectrochemLab,
	Kinetics: KineticsLab,
	Stoichiometry: StoichiometryLab,
	PeriodicTrends: PeriodicTrendsLab
};

//#endregion
export { BatteryBlock, BohrAtomBlock, DilutionBlock, ElectrochemBlock, GasBoxBlock, KineticsBlock, LeChatelierBlock, PeriodicTrendsBlock, ReactionLabBlock, ReactionProfileBlock, SolutionBoxBlock, StoichiometryBlock, TitrationBlock, chemBlocks, chemComponents };