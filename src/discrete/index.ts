/**
 * @classytic/labs/discrete — discrete-math lab pack (counting, probability,
 * pigeonhole, logic, boolean algebra, sets). FOUNDATIONS phase: the pure kernels
 * are here; the GENERAL lab families (TruthTableEngine, CountingTree, VennSetBoard,
 * BooleanCircuit, …) land on top of these next.
 *
 * Two kernels, by who consumes them:
 *   • combinatorics / sets / probability / pigeonhole / rng  → ./core (labs)
 *   • propositional logic (parse, truth table, equivalence)  → @classytic/stage
 *     (`compileLogic` etc.) — re-exported here so a discrete lab/agent imports
 *     everything from one place.
 */

export * from './core/index.js';

// ── general lab families (built on the kernels above) ──
export { TruthTableLab, type TruthTableProps, type TruthTableMode } from './truth-table/index.js';
export { CountingTreeLab, type CountingTreeProps, type TreeBranch, type TreeStage, type CountAsk } from './counting-tree/index.js';
export { VennSetBoardLab, type VennSetBoardProps, type VennSet, type VennMode } from './venn/index.js';
export { SampleSpaceBoardLab, type SampleSpaceProps, type SampleEvent, type Reduce, type Cmp } from './sample-space/index.js';
export { BooleanCircuitLab, type BooleanCircuitProps, type CircuitInput, type CircuitGate, type CircuitOutput } from './logic-circuit/index.js';
export { KarnaughMapLab, type KMapProps, type KMapMode } from './karnaugh/index.js';
export { MonteCarloLab, type MonteCarloProps, type MCSeries, type ExperimentSpec } from './monte-carlo/index.js';
export { MontyHallLab, type MontyHallProps } from './monty-hall/index.js';
export { OutcomeBuilderLab, type OutcomeBuilderProps } from './outcome-builder/preset.js';
export { BayesLab, type BayesProps } from './bayes/preset.js';
// Law of large numbers — live, on the `sampler` Monte-Carlo core (coin/die = weights).
export { LawOfLargeNumbersLab, type LlnProps } from './lln/index.js';
export { CountingSlotsLab, type CountingSlotsProps, type SlotMode } from './counting-slots/preset.js';
export { SelectionLab, type SelectionProps, type SelectionGroup, type SelectionMode } from './selection/preset.js';
export { ArrangementsLab, type ArrangementsProps, type ArrangeItem } from './arrangements/preset.js';
export { PascalTriangleLab, type PascalProps, type PascalView } from './pascal/preset.js';
export { BinomialDistributionLab, type BinomialProps } from './binomial/preset.js';
export { HypergeometricLab, type HypergeometricProps } from './hypergeometric/preset.js';
export { ExpectedValueLab, type ExpectedValueProps, type EVOutcome } from './expected-value/preset.js';

// the logic kernel lives in stage (shared with ICT boolean); surface it here too
export {
  compileLogic, parseLogic, evalBool, truthTable, classify, equivalent, toDNF, toCNF, logicToLatex,
  minimize, primeImplicants, minimalCover, cubeCovers, cubeTerm, cubeOfSelection,
  type LNode, type CompiledLogic, type LogicResult, type TruthTable, type TruthRow, type Classification,
  type Cube, type Minimization,
} from '@classytic/stage';
