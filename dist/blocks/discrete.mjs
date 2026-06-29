import { RuleLab } from "../kit/rule.mjs";
import { COUNTING_RULES } from "../discrete/rules.mjs";
import { TruthTableLab } from "../discrete/truth-table/preset.mjs";
import { CountingTreeLab } from "../discrete/counting-tree/preset.mjs";
import { VennSetBoardLab } from "../discrete/venn/preset.mjs";
import { SampleSpaceBoardLab } from "../discrete/sample-space/preset.mjs";
import { BooleanCircuitLab } from "../discrete/logic-circuit/preset.mjs";
import { KarnaughMapLab } from "../discrete/karnaugh/preset.mjs";
import { MonteCarloLab } from "../discrete/monte-carlo/preset.mjs";
import { MontyHallLab } from "../discrete/monty-hall/preset.mjs";
import { OutcomeBuilderLab } from "../discrete/outcome-builder/preset.mjs";
import { CombinationStudioLab } from "../discrete/combination-studio/preset.mjs";
import { BayesLab } from "../discrete/bayes/preset.mjs";
import { LawOfLargeNumbersLab } from "../discrete/lln/preset.mjs";
import { CountingSlotsLab } from "../discrete/counting-slots/preset.mjs";
import { SelectionLab } from "../discrete/selection/preset.mjs";
import { ArrangementsLab } from "../discrete/arrangements/preset.mjs";
import { PascalTriangleLab } from "../discrete/pascal/preset.mjs";
import { BinomialDistributionLab } from "../discrete/binomial/preset.mjs";
import { HypergeometricLab } from "../discrete/hypergeometric/preset.mjs";
import { ExpectedValueLab } from "../discrete/expected-value/preset.mjs";
import { LabConfig } from "./lab-config.mjs";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { defineBlock } from "@classytic/cms-ui/contract";

//#region src/blocks/discrete.tsx
const common = {
	title: z.string().optional(),
	prompt: z.string().optional(),
	objectives: z.array(z.string()).optional(),
	hints: z.array(z.string()).optional(),
	controlId: z.string().optional()
};
/** Build a block: schema + a LabConfig-wrapped editing Component (spreads attrs). */
function lab(key, tag, label, description, schema, Comp) {
	return defineBlock({
		key,
		tag,
		void: true,
		label,
		description,
		category: "interactive",
		schema,
		Component: ({ attributes, mode, updateAttributes }) => {
			const widget = Comp(attributes);
			if (mode !== "editing" || !updateAttributes) return widget;
			return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(LabConfig, {
				schema,
				value: attributes,
				onChange: updateAttributes
			}), widget] });
		}
	});
}
const truthSchema = z.object({
	formula: z.string().default("p -> q"),
	compare: z.string().optional(),
	mode: z.enum([
		"show",
		"fill",
		"classify"
	]).default("fill"),
	breakdown: z.boolean().optional(),
	...common
});
const TruthTableBlock = lab("truth-table", "TruthTable", "Truth table", "Any propositional formula → truth table with sub-expression build-up, fill/classify modes, and an equivalence verdict against a second formula.", truthSchema, (a) => /* @__PURE__ */ jsx(TruthTableLab, { ...a }));
const treeSchema = z.object({
	stages: z.array(z.object({
		label: z.string().optional(),
		branches: z.array(z.object({
			label: z.string(),
			weight: z.number().optional()
		}))
	})).optional(),
	pool: z.array(z.string()).optional(),
	draws: z.number().optional(),
	replacement: z.boolean().optional(),
	mode: z.enum(["count", "probability"]).optional(),
	ask: z.enum(["ordered", "unordered"]).optional(),
	...common
});
const CountingTreeBlock = lab("counting-tree", "CountingTree", "Counting / probability tree", "Sequential counting + probability trees: multiplication principle, permutations (shrinking pool), with-replacement, ÷k! collapse, or weighted probability paths. Best for small cases.", treeSchema, (a) => /* @__PURE__ */ jsx(CountingTreeLab, { ...a }));
const vennSchema = z.object({
	sets: z.array(z.object({
		name: z.string(),
		members: z.array(z.union([z.number(), z.string()]))
	})),
	mode: z.enum(["explore", "shade"]).default("explore"),
	target: z.string().optional(),
	...common
});
const VennBlock = lab("venn", "VennSetBoard", "Venn diagram & inclusion–exclusion", "2–3 sets from real members: region counts + the inclusion–exclusion breakdown, or shade-to-match a set expression (graded on the logic kernel).", vennSchema, (a) => /* @__PURE__ */ jsx(VennSetBoardLab, { ...a }));
const sampleSchema = z.object({
	dims: z.array(z.number()).optional(),
	outcomes: z.array(z.string()).optional(),
	event: z.object({
		reduce: z.enum([
			"sum",
			"diff",
			"max",
			"min",
			"product",
			"same"
		]).optional(),
		cmp: z.enum([
			"eq",
			"lt",
			"gt",
			"le",
			"ge"
		]).optional(),
		value: z.number().optional(),
		favorable: z.array(z.string()).optional(),
		label: z.string().optional()
	}).optional(),
	dice: z.boolean().optional(),
	showValue: z.boolean().optional(),
	mode: z.enum(["explore", "target"]).optional(),
	...common
});
const SampleSpaceBlock = lab("sample-space", "SampleSpaceBoard", "Sample space (equally-likely)", "Dice/coins/cards as a grid of equally-likely outcomes: select an event → favourable ÷ total = P, as a reduced fraction. Real dice glyphs.", sampleSchema, (a) => /* @__PURE__ */ jsx(SampleSpaceBoardLab, { ...a }));
const gateType = z.enum([
	"AND",
	"OR",
	"NOT",
	"NAND",
	"NOR",
	"XOR",
	"XNOR"
]);
const circuitSchema = z.object({
	inputs: z.array(z.union([z.string(), z.object({
		id: z.string(),
		label: z.string().optional()
	})])),
	gates: z.array(z.object({
		id: z.string(),
		type: gateType,
		in: z.array(z.string())
	})),
	outputs: z.array(z.object({
		id: z.string(),
		in: z.string(),
		label: z.string().optional(),
		color: z.string().optional(),
		goal: z.boolean().optional()
	})),
	initial: z.record(z.string(), z.boolean()).optional(),
	...common
});
const BooleanCircuitBlock = lab("logic-circuit", "BooleanCircuit", "Logic circuit (gates → lamps)", "Author a netlist (switches, typed gates, output LEDs); learners flip switches and watch power flow light the outputs. Optional goal = a puzzle.", circuitSchema, (a) => /* @__PURE__ */ jsx(BooleanCircuitLab, { ...a }));
const kmapSchema = z.object({
	formula: z.string().optional(),
	minterms: z.array(z.number()).optional(),
	dontCares: z.array(z.number()).optional(),
	vars: z.array(z.string()).optional(),
	mode: z.enum(["show", "simplify"]).default("show"),
	...common
});
const KarnaughBlock = lab("karnaugh", "KarnaughMap", "Karnaugh map", "Boolean minimisation by circling: Gray-coded map of a formula/minterms; show the minimal SOP cover or let learners draw their own groups (wrap-aware).", kmapSchema, (a) => /* @__PURE__ */ jsx(KarnaughMapLab, { ...a }));
const mcSchema = z.object({
	experiment: z.object({
		kind: z.enum([
			"montyHall",
			"piDarts",
			"diceSum",
			"bernoulli"
		]),
		doors: z.number().optional(),
		dice: z.number().optional(),
		target: z.number().optional(),
		p: z.number().optional(),
		label: z.string().optional()
	}).optional(),
	viz: z.enum(["runchart", "scatter"]).optional(),
	seed: z.number().optional(),
	...common
});
const MonteCarloBlock = lab("monte-carlo", "MonteCarlo", "Monte Carlo (law of large numbers)", "Estimate a probability by sampling: π-darts (scatter) or a convergence run-chart (Monty Hall, dice-sum, Bernoulli) homing onto the true value.", mcSchema, (a) => /* @__PURE__ */ jsx(MonteCarloLab, { ...a }));
const montySchema = z.object({
	doors: z.number().optional(),
	seed: z.number().optional(),
	...common
});
const MontyHallBlock = lab("monty-hall", "MontyHall", "Monty Hall game", "Play the paradox: pick a door, Monty opens a goat, stay or switch, every game grows the switch/stay win-rate bars to 2/3 vs 1/3.", montySchema, (a) => /* @__PURE__ */ jsx(MontyHallLab, { ...a }));
const outcomeSchema = z.object({
	stages: z.array(z.enum(["coin", "die"])).optional(),
	maxOutcomes: z.number().optional(),
	...common
});
const OutcomeBuilderBlock = lab("outcome-builder", "OutcomeBuilder", "Sample-space builder (coins & dice)", "Add coins/dice and watch every outcome fan out with the counting principle; click outcomes to mark an event → P = favourable ÷ total.", outcomeSchema, (a) => /* @__PURE__ */ jsx(OutcomeBuilderLab, { ...a }));
const comboOptionSchema = z.object({
	id: z.string(),
	label: z.string(),
	emoji: z.string().optional(),
	color: z.string().optional()
});
const comboCatSchema = z.object({
	id: z.string(),
	label: z.string(),
	slot: z.enum([
		"top",
		"bottom",
		"hat",
		"hold",
		"none"
	]).optional(),
	options: z.array(comboOptionSchema)
});
const studioSchema = z.object({
	scenario: z.string().optional(),
	categories: z.array(comboCatSchema).optional(),
	figure: z.enum(["character", "card"]).optional(),
	startActive: z.number().optional(),
	maxWall: z.number().optional(),
	...common
});
const CombinationStudioBlock = lab("combination-studio", "CombinationStudio", "Combination studio (rule of product, felt)", "The multiplication principle made tactile: pick from each rack, assemble each outcome (a dressed character or an emoji card), fill a rows × columns wall, then add a variable and watch the total multiply. Predict-first. Any authored scenario (outfits, sundaes, plates, routes).", studioSchema, (a) => /* @__PURE__ */ jsx(CombinationStudioLab, { ...a }));
const bayesSchema = z.object({
	prior: z.number().default(.01),
	sensitivity: z.number().default(.9),
	falsePositive: z.number().default(.09),
	population: z.number().default(1e3),
	conditionLabels: z.tuple([z.string(), z.string()]).optional(),
	testLabels: z.tuple([z.string(), z.string()]).optional(),
	predict: z.boolean().optional(),
	...common
});
const BayesBlock = lab("bayes", "Bayes", "Bayes / base-rate trap", "Conditional probability via an area model + natural-frequency tree: a rare-disease positive test is usually a false alarm. Sliders for prevalence/sensitivity/false-positive.", bayesSchema, (a) => /* @__PURE__ */ jsx(BayesLab, { ...a }));
const slotsSchema = z.object({
	items: z.array(z.string()).optional(),
	slots: z.number().optional(),
	positions: z.array(z.string()).optional(),
	mode: z.enum(["arrange", "choose"]).optional(),
	replacement: z.boolean().optional(),
	...common
});
const CountingSlotsBlock = lab("counting-slots", "CountingSlots", "Counting by filling slots", "The multiplication principle as filling positions: pool shrinks, product builds (nPr, n!, nᵏ); \"choose\" mode collapses orderings ÷k! → nCr. Derives the formula.", slotsSchema, (a) => /* @__PURE__ */ jsx(CountingSlotsLab, { ...a }));
const selectionSchema = z.object({
	groups: z.array(z.object({
		label: z.string(),
		count: z.number(),
		color: z.string().optional()
	})).optional(),
	draw: z.number().optional(),
	want: z.array(z.number()).optional(),
	mode: z.enum(["count", "probability"]).optional(),
	...common
});
const SelectionBlock = lab("selection", "Selection", "Draw from the bag (cards & colored balls)", "Selecting from groups: ways = ∏ C(group,want), P = ways ÷ C(N,k). Colored-ball urns and card hands from one model.", selectionSchema, (a) => /* @__PURE__ */ jsx(SelectionLab, { ...a }));
const arrangeSchema = z.object({
	word: z.string().optional(),
	items: z.array(z.object({
		label: z.string(),
		count: z.number(),
		color: z.string().optional()
	})).optional(),
	...common
});
const ArrangementsBlock = lab("arrangements", "Arrangements", "Arrange with repeats (multiset)", "Arrangements when some items are identical (MISSISSIPPI): n! ÷ (n₁!·n₂!…), derived from the swap-overcount.", arrangeSchema, (a) => /* @__PURE__ */ jsx(ArrangementsLab, { ...a }));
const pascalSchema = z.object({
	rows: z.number().optional(),
	view: z.enum([
		"build",
		"binomial",
		"parity"
	]).optional(),
	...common
});
const PascalBlock = lab("pascal", "PascalTriangle", "Pascal's triangle", "Each cell = the two above added = C(n,k); a row = (a+b)ⁿ; odd/even cells reveal the Sierpiński fractal.", pascalSchema, (a) => /* @__PURE__ */ jsx(PascalTriangleLab, { ...a }));
const binomialSchema = z.object({
	n: z.number().default(10),
	p: z.number().default(.5),
	showNormal: z.boolean().optional(),
	...common
});
const BinomialBlock = lab("binomial", "Binomial", "Binomial distribution", "P(k successes) = C(n,k)pᵏ(1−p)ⁿ⁻ᵏ as bars; click a bar to derive it; bell overlay shows it approach the normal.", binomialSchema, (a) => /* @__PURE__ */ jsx(BinomialDistributionLab, { ...a }));
const hyperSchema = z.object({
	N: z.number().default(10),
	K: z.number().default(4),
	n: z.number().default(3),
	...common
});
const HypergeometricBlock = lab("hypergeometric", "Hypergeometric", "With vs without replacement", "Same urn, draw n: binomial (with replacement) vs hypergeometric (without) as paired bars; same mean, hyper narrower, merging as N grows.", hyperSchema, (a) => /* @__PURE__ */ jsx(HypergeometricLab, { ...a }));
const evSchema = z.object({
	outcomes: z.array(z.object({
		label: z.string().optional(),
		value: z.number(),
		prob: z.number()
	})).optional(),
	cost: z.number().optional(),
	mode: z.enum(["count", "probability"]).optional(),
	...common
});
const ExpectedValueBlock = lab("expected-value", "ExpectedValue", "Expected value (is the game fair?)", "E[X] = Σ value·prob as a balance point of the payouts; cost marker shows the house edge; spin to watch the average converge.", evSchema, (a) => /* @__PURE__ */ jsx(ExpectedValueLab, { ...a }));
const llnSchema = z.object({
	experiment: z.enum(["coin", "die"]).optional(),
	...common
});
const LawOfLargeNumbersBlock = lab("lln", "LawOfLargeNumbers", "Law of large numbers", "A coin/die sampler: running frequencies converge onto the true probabilities as draws pile up.", llnSchema, (a) => /* @__PURE__ */ jsx(LawOfLargeNumbersLab, { ...a }));
const ruleSchema = z.object({
	preset: z.enum([
		"none",
		"rule-of-product",
		"rule-of-sum",
		"factorial",
		"permutation",
		"combination",
		"perm-with-rep"
	]).default("none"),
	name: z.string().default("My rule"),
	formula: z.string().default("a^2 + b^2 = c^2"),
	analogy: z.string().optional(),
	tricks: z.array(z.string()).optional(),
	derivation: z.array(z.object({
		tex: z.string(),
		note: z.string().optional()
	})).optional(),
	title: z.string().optional(),
	prompt: z.string().optional()
});
function ruleComp(a) {
	return /* @__PURE__ */ jsx(RuleLab, {
		rule: (a.preset && a.preset !== "none" ? COUNTING_RULES.find((r) => r.id === a.preset) : void 0) ?? {
			id: "custom",
			name: a.name ?? "Rule",
			formula: a.formula ?? "a^2 + b^2 = c^2",
			...a.analogy ? { analogy: a.analogy } : {},
			...a.derivation?.length ? { derivation: a.derivation } : {},
			...a.tricks?.length ? { tricks: a.tricks } : {}
		},
		title: a.title,
		prompt: a.prompt
	});
}
const RuleCardBlock = lab("rule-card", "RuleCard", "Rule card (concept)", "A formula taught properly: an analogy, a live worked calculator, a revealable derivation, and tricks. Pick a built-in counting rule (with its calculator), or author your own concept (formula + analogy + derivation + tricks, as data).", ruleSchema, ruleComp);
const discreteBlocks = [
	TruthTableBlock,
	CountingTreeBlock,
	VennBlock,
	SampleSpaceBlock,
	BooleanCircuitBlock,
	KarnaughBlock,
	MonteCarloBlock,
	MontyHallBlock,
	OutcomeBuilderBlock,
	BayesBlock,
	CountingSlotsBlock,
	SelectionBlock,
	ArrangementsBlock,
	PascalBlock,
	BinomialBlock,
	HypergeometricBlock,
	ExpectedValueBlock,
	LawOfLargeNumbersBlock,
	CombinationStudioBlock,
	RuleCardBlock
];
const discreteComponents = {
	TruthTable: TruthTableLab,
	CountingTree: CountingTreeLab,
	VennSetBoard: VennSetBoardLab,
	SampleSpaceBoard: SampleSpaceBoardLab,
	BooleanCircuit: BooleanCircuitLab,
	KarnaughMap: KarnaughMapLab,
	MonteCarlo: MonteCarloLab,
	MontyHall: MontyHallLab,
	OutcomeBuilder: OutcomeBuilderLab,
	Bayes: BayesLab,
	CountingSlots: CountingSlotsLab,
	Selection: SelectionLab,
	Arrangements: ArrangementsLab,
	PascalTriangle: PascalTriangleLab,
	Binomial: BinomialDistributionLab,
	Hypergeometric: HypergeometricLab,
	ExpectedValue: ExpectedValueLab,
	LawOfLargeNumbers: LawOfLargeNumbersLab,
	CombinationStudio: CombinationStudioLab,
	RuleCard: ruleComp
};

//#endregion
export { ArrangementsBlock, BayesBlock, BinomialBlock, BooleanCircuitBlock, CombinationStudioBlock, CountingSlotsBlock, CountingTreeBlock, ExpectedValueBlock, HypergeometricBlock, KarnaughBlock, LawOfLargeNumbersBlock, MonteCarloBlock, MontyHallBlock, OutcomeBuilderBlock, PascalBlock, RuleCardBlock, SampleSpaceBlock, SelectionBlock, TruthTableBlock, VennBlock, discreteBlocks, discreteComponents };