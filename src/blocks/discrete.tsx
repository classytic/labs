/**
 * @classytic/labs/blocks, discrete-math & probability lab block specs.
 *
 * `defineBlock` editor adapters for the discrete labs (logic, counting, sets,
 * probability, distributions). Each pairs a Zod schema with a `Component` that, in
 * editing mode, shows the schema-driven `<LabConfig>` panel. Attributes are spread
 * straight into the lab (schema keys == prop names). Exported at
 * `@classytic/labs/blocks/discrete`. `@classytic/cms-ui` + `zod` are optional peers.
 */

import type { ReactNode } from 'react';
import { z } from 'zod';
import { defineBlock } from '@classytic/cms-ui/contract';
import { LabConfig } from './lab-config.js';
import {
  TruthTableLab, CountingTreeLab, VennSetBoardLab, SampleSpaceBoardLab, BooleanCircuitLab,
  KarnaughMapLab, MonteCarloLab, MontyHallLab, OutcomeBuilderLab, BayesLab, CountingSlotsLab,
  SelectionLab, ArrangementsLab, PascalTriangleLab, BinomialDistributionLab, HypergeometricLab,
  ExpectedValueLab, LawOfLargeNumbersLab, CombinationStudioLab, COUNTING_RULES,
} from '../discrete/index.js';
import { RuleLab, type RuleDef } from '../kit/rule.js';

const common = { title: z.string().optional(), prompt: z.string().optional(), objectives: z.array(z.string()).optional(), hints: z.array(z.string()).optional(), controlId: z.string().optional() };

/* eslint-disable @typescript-eslint/no-explicit-any */
type Defd = ReturnType<typeof defineBlock>;
/** Build a block: schema + a LabConfig-wrapped editing Component (spreads attrs). */
function lab(key: string, tag: string, label: string, description: string, schema: z.ZodObject<any>, Comp: (a: any) => ReactNode): Defd {
  return defineBlock({
    key, tag, void: true, label, description, category: 'interactive', schema,
    Component: ({ attributes, mode, updateAttributes }) => {
      const widget = Comp(attributes);
      if (mode !== 'editing' || !updateAttributes) return widget;
      return <div><LabConfig schema={schema} value={attributes} onChange={updateAttributes} />{widget}</div>;
    },
  });
}

const truthSchema = z.object({ formula: z.string().default('p -> q'), compare: z.string().optional(), mode: z.enum(['show', 'fill', 'classify']).default('fill'), breakdown: z.boolean().optional(), ...common });
export const TruthTableBlock = lab('truth-table', 'TruthTable', 'Truth table', 'Any propositional formula → truth table with sub-expression build-up, fill/classify modes, and an equivalence verdict against a second formula.', truthSchema, (a) => <TruthTableLab {...a} />);

const treeSchema = z.object({ stages: z.array(z.object({ label: z.string().optional(), branches: z.array(z.object({ label: z.string(), weight: z.number().optional() })) })).optional(), pool: z.array(z.string()).optional(), draws: z.number().optional(), replacement: z.boolean().optional(), mode: z.enum(['count', 'probability']).optional(), ask: z.enum(['ordered', 'unordered']).optional(), ...common });
export const CountingTreeBlock = lab('counting-tree', 'CountingTree', 'Counting / probability tree', 'Sequential counting + probability trees: multiplication principle, permutations (shrinking pool), with-replacement, ÷k! collapse, or weighted probability paths. Best for small cases.', treeSchema, (a) => <CountingTreeLab {...a} />);

const vennSchema = z.object({ sets: z.array(z.object({ name: z.string(), members: z.array(z.union([z.number(), z.string()])) })), mode: z.enum(['explore', 'shade']).default('explore'), target: z.string().optional(), ...common });
export const VennBlock = lab('venn', 'VennSetBoard', 'Venn diagram & inclusion–exclusion', '2–3 sets from real members: region counts + the inclusion–exclusion breakdown, or shade-to-match a set expression (graded on the logic kernel).', vennSchema, (a) => <VennSetBoardLab {...a} />);

const sampleSchema = z.object({ dims: z.array(z.number()).optional(), outcomes: z.array(z.string()).optional(), event: z.object({ reduce: z.enum(['sum', 'diff', 'max', 'min', 'product', 'same']).optional(), cmp: z.enum(['eq', 'lt', 'gt', 'le', 'ge']).optional(), value: z.number().optional(), favorable: z.array(z.string()).optional(), label: z.string().optional() }).optional(), dice: z.boolean().optional(), showValue: z.boolean().optional(), mode: z.enum(['explore', 'target']).optional(), ...common });
export const SampleSpaceBlock = lab('sample-space', 'SampleSpaceBoard', 'Sample space (equally-likely)', 'Dice/coins/cards as a grid of equally-likely outcomes: select an event → favourable ÷ total = P, as a reduced fraction. Real dice glyphs.', sampleSchema, (a) => <SampleSpaceBoardLab {...a} />);

const gateType = z.enum(['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR']);
const circuitSchema = z.object({ inputs: z.array(z.union([z.string(), z.object({ id: z.string(), label: z.string().optional() })])), gates: z.array(z.object({ id: z.string(), type: gateType, in: z.array(z.string()) })), outputs: z.array(z.object({ id: z.string(), in: z.string(), label: z.string().optional(), color: z.string().optional(), goal: z.boolean().optional() })), initial: z.record(z.string(), z.boolean()).optional(), ...common });
export const BooleanCircuitBlock = lab('logic-circuit', 'BooleanCircuit', 'Logic circuit (gates → lamps)', 'Author a netlist (switches, typed gates, output LEDs); learners flip switches and watch power flow light the outputs. Optional goal = a puzzle.', circuitSchema, (a) => <BooleanCircuitLab {...a} />);

const kmapSchema = z.object({ formula: z.string().optional(), minterms: z.array(z.number()).optional(), dontCares: z.array(z.number()).optional(), vars: z.array(z.string()).optional(), mode: z.enum(['show', 'simplify']).default('show'), ...common });
export const KarnaughBlock = lab('karnaugh', 'KarnaughMap', 'Karnaugh map', 'Boolean minimisation by circling: Gray-coded map of a formula/minterms; show the minimal SOP cover or let learners draw their own groups (wrap-aware).', kmapSchema, (a) => <KarnaughMapLab {...a} />);

const mcSchema = z.object({ experiment: z.object({ kind: z.enum(['montyHall', 'piDarts', 'diceSum', 'bernoulli']), doors: z.number().optional(), dice: z.number().optional(), target: z.number().optional(), p: z.number().optional(), label: z.string().optional() }).optional(), viz: z.enum(['runchart', 'scatter']).optional(), seed: z.number().optional(), ...common });
export const MonteCarloBlock = lab('monte-carlo', 'MonteCarlo', 'Monte Carlo (law of large numbers)', 'Estimate a probability by sampling: π-darts (scatter) or a convergence run-chart (Monty Hall, dice-sum, Bernoulli) homing onto the true value.', mcSchema, (a) => <MonteCarloLab {...a} />);

const montySchema = z.object({ doors: z.number().optional(), seed: z.number().optional(), ...common });
export const MontyHallBlock = lab('monty-hall', 'MontyHall', 'Monty Hall game', 'Play the paradox: pick a door, Monty opens a goat, stay or switch, every game grows the switch/stay win-rate bars to 2/3 vs 1/3.', montySchema, (a) => <MontyHallLab {...a} />);

const outcomeSchema = z.object({ stages: z.array(z.enum(['coin', 'die'])).optional(), maxOutcomes: z.number().optional(), ...common });
export const OutcomeBuilderBlock = lab('outcome-builder', 'OutcomeBuilder', 'Sample-space builder (coins & dice)', 'Add coins/dice and watch every outcome fan out with the counting principle; click outcomes to mark an event → P = favourable ÷ total.', outcomeSchema, (a) => <OutcomeBuilderLab {...a} />);

const comboOptionSchema = z.object({ id: z.string(), label: z.string(), emoji: z.string().optional(), color: z.string().optional() });
const comboCatSchema = z.object({ id: z.string(), label: z.string(), slot: z.enum(['top', 'bottom', 'hat', 'hold', 'none']).optional(), options: z.array(comboOptionSchema) });
const studioSchema = z.object({ scenario: z.string().optional(), categories: z.array(comboCatSchema).optional(), figure: z.enum(['character', 'card']).optional(), startActive: z.number().optional(), maxWall: z.number().optional(), ...common });
export const CombinationStudioBlock = lab('combination-studio', 'CombinationStudio', 'Combination studio (rule of product, felt)', 'The multiplication principle made tactile: pick from each rack, assemble each outcome (a dressed character or an emoji card), fill a rows × columns wall, then add a variable and watch the total multiply. Predict-first. Any authored scenario (outfits, sundaes, plates, routes).', studioSchema, (a) => <CombinationStudioLab {...a} />);

const bayesSchema = z.object({ prior: z.number().default(0.01), sensitivity: z.number().default(0.9), falsePositive: z.number().default(0.09), population: z.number().default(1000), conditionLabels: z.tuple([z.string(), z.string()]).optional(), testLabels: z.tuple([z.string(), z.string()]).optional(), predict: z.boolean().optional(), ...common });
export const BayesBlock = lab('bayes', 'Bayes', 'Bayes / base-rate trap', 'Conditional probability via an area model + natural-frequency tree: a rare-disease positive test is usually a false alarm. Sliders for prevalence/sensitivity/false-positive.', bayesSchema, (a) => <BayesLab {...a} />);

const slotsSchema = z.object({ items: z.array(z.string()).optional(), slots: z.number().optional(), positions: z.array(z.string()).optional(), mode: z.enum(['arrange', 'choose']).optional(), replacement: z.boolean().optional(), ...common });
export const CountingSlotsBlock = lab('counting-slots', 'CountingSlots', 'Counting by filling slots', 'The multiplication principle as filling positions: pool shrinks, product builds (nPr, n!, nᵏ); "choose" mode collapses orderings ÷k! → nCr. Derives the formula.', slotsSchema, (a) => <CountingSlotsLab {...a} />);

const selectionSchema = z.object({ groups: z.array(z.object({ label: z.string(), count: z.number(), color: z.string().optional() })).optional(), draw: z.number().optional(), want: z.array(z.number()).optional(), mode: z.enum(['count', 'probability']).optional(), ...common });
export const SelectionBlock = lab('selection', 'Selection', 'Draw from the bag (cards & colored balls)', 'Selecting from groups: ways = ∏ C(group,want), P = ways ÷ C(N,k). Colored-ball urns and card hands from one model.', selectionSchema, (a) => <SelectionLab {...a} />);

const arrangeSchema = z.object({ word: z.string().optional(), items: z.array(z.object({ label: z.string(), count: z.number(), color: z.string().optional() })).optional(), ...common });
export const ArrangementsBlock = lab('arrangements', 'Arrangements', 'Arrange with repeats (multiset)', 'Arrangements when some items are identical (MISSISSIPPI): n! ÷ (n₁!·n₂!…), derived from the swap-overcount.', arrangeSchema, (a) => <ArrangementsLab {...a} />);

const pascalSchema = z.object({ rows: z.number().optional(), view: z.enum(['build', 'binomial', 'parity']).optional(), ...common });
export const PascalBlock = lab('pascal', 'PascalTriangle', "Pascal's triangle", 'Each cell = the two above added = C(n,k); a row = (a+b)ⁿ; odd/even cells reveal the Sierpiński fractal.', pascalSchema, (a) => <PascalTriangleLab {...a} />);

const binomialSchema = z.object({ n: z.number().default(10), p: z.number().default(0.5), showNormal: z.boolean().optional(), ...common });
export const BinomialBlock = lab('binomial', 'Binomial', 'Binomial distribution', 'P(k successes) = C(n,k)pᵏ(1−p)ⁿ⁻ᵏ as bars; click a bar to derive it; bell overlay shows it approach the normal.', binomialSchema, (a) => <BinomialDistributionLab {...a} />);

const hyperSchema = z.object({ N: z.number().default(10), K: z.number().default(4), n: z.number().default(3), ...common });
export const HypergeometricBlock = lab('hypergeometric', 'Hypergeometric', 'With vs without replacement', 'Same urn, draw n: binomial (with replacement) vs hypergeometric (without) as paired bars; same mean, hyper narrower, merging as N grows.', hyperSchema, (a) => <HypergeometricLab {...a} />);

const evSchema = z.object({ outcomes: z.array(z.object({ label: z.string().optional(), value: z.number(), prob: z.number() })).optional(), cost: z.number().optional(), mode: z.enum(['count', 'probability']).optional(), ...common });
export const ExpectedValueBlock = lab('expected-value', 'ExpectedValue', 'Expected value (is the game fair?)', 'E[X] = Σ value·prob as a balance point of the payouts; cost marker shows the house edge; spin to watch the average converge.', evSchema, (a) => <ExpectedValueLab {...a} />);

const llnSchema = z.object({ experiment: z.enum(['coin', 'die']).optional(), ...common });
export const LawOfLargeNumbersBlock = lab('lln', 'LawOfLargeNumbers', 'Law of large numbers', 'A coin/die sampler: running frequencies converge onto the true probabilities as draws pile up.', llnSchema, (a) => <LawOfLargeNumbersLab {...a} />);

// The concept engine as an authorable block: pick a built-in counting rule (with
// its live worked calculator) OR author any concept's static card (formula +
// analogy + derivation + tricks, all data — no code).
const ruleSchema = z.object({
  preset: z.enum(['none', 'rule-of-product', 'rule-of-sum', 'factorial', 'permutation', 'combination', 'perm-with-rep']).default('none'),
  name: z.string().default('My rule'),
  formula: z.string().default('a^2 + b^2 = c^2'),
  analogy: z.string().optional(),
  tricks: z.array(z.string()).optional(),
  derivation: z.array(z.object({ tex: z.string(), note: z.string().optional() })).optional(),
  title: z.string().optional(),
  prompt: z.string().optional(),
});
function ruleComp(a: z.infer<typeof ruleSchema>): ReactNode {
  const builtin = a.preset && a.preset !== 'none' ? COUNTING_RULES.find((r) => r.id === a.preset) : undefined;
  const rule: RuleDef = builtin ?? {
    id: 'custom', name: a.name ?? 'Rule', formula: a.formula ?? 'a^2 + b^2 = c^2',
    ...(a.analogy ? { analogy: a.analogy } : {}),
    ...(a.derivation?.length ? { derivation: a.derivation } : {}),
    ...(a.tricks?.length ? { tricks: a.tricks } : {}),
  };
  return <RuleLab rule={rule} title={a.title} prompt={a.prompt} />;
}
export const RuleCardBlock = lab('rule-card', 'RuleCard', 'Rule card (concept)', 'A formula taught properly: an analogy, a live worked calculator, a revealable derivation, and tricks. Pick a built-in counting rule (with its calculator), or author your own concept (formula + analogy + derivation + tricks, as data).', ruleSchema, ruleComp);

export const discreteBlocks = [
  TruthTableBlock, CountingTreeBlock, VennBlock, SampleSpaceBlock, BooleanCircuitBlock, KarnaughBlock,
  MonteCarloBlock, MontyHallBlock, OutcomeBuilderBlock, BayesBlock, CountingSlotsBlock, SelectionBlock,
  ArrangementsBlock, PascalBlock, BinomialBlock, HypergeometricBlock, ExpectedValueBlock, LawOfLargeNumbersBlock,
  CombinationStudioBlock, RuleCardBlock,
] as const;
export const discreteComponents = {
  TruthTable: TruthTableLab, CountingTree: CountingTreeLab, VennSetBoard: VennSetBoardLab, SampleSpaceBoard: SampleSpaceBoardLab,
  BooleanCircuit: BooleanCircuitLab, KarnaughMap: KarnaughMapLab, MonteCarlo: MonteCarloLab, MontyHall: MontyHallLab,
  OutcomeBuilder: OutcomeBuilderLab, Bayes: BayesLab, CountingSlots: CountingSlotsLab, Selection: SelectionLab,
  Arrangements: ArrangementsLab, PascalTriangle: PascalTriangleLab, Binomial: BinomialDistributionLab,
  Hypergeometric: HypergeometricLab, ExpectedValue: ExpectedValueLab, LawOfLargeNumbers: LawOfLargeNumbersLab,
  CombinationStudio: CombinationStudioLab, RuleCard: ruleComp,
} as const;
