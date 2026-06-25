/**
 * Gallery registry — the SINGLE list of scenes the visual harness renders.
 * Add one entry and it shows up in BOTH:
 *   • the deterministic SVG-geometry snapshot test (tests/gallery.test.tsx), and
 *   • the rendered PNG gallery (tests/gallery/rasterize.mjs).
 *
 * Plain `createElement` (no JSX) so a bare `node` script can import it too.
 * Imports the BUILT dist — the harness judges what actually ships. Run
 * `npm run build` first (the `gallery` script does this for you).
 */

import { createElement as h } from 'react';
import {
  ProjectileLab, RiverBoat, GravityDrop, VectorScene,
  VectorBoardLab, VectorTypesLab, RainRelativeLab, LeverBalanceLab, OpticsLab, RampForcesLab,
  ImpulseLab, BulletWallsLab, CircularMotionLab, EnergySkateLab, SimpleHarmonicLab,
  AtwoodLab, TerminalVelocityLab, KeplerLab, GravitationLab,
  HeatTransferLab, ThermalExpansionLab, TemperatureScalesLab, HeatingCurveLab, WaterDensityLab,
  WaveLab, RippleTankLab, DopplerLab, StringReflectionLab, MagnetismLab, LorentzForceLab,
  StoppingDistanceLab, CollisionTrackLab, WorkEnergyLab, CarnotCycleLab, EfficiencyLab, EntropyLab,
  GasProcessLab, ElectricFieldLab,
} from '../../dist/physics/index.mjs';
import { BalanceAlgebraLab } from '../../dist/math/index.mjs';
import { WordMatchLab, PrepositionSceneLab } from '../../dist/language/index.mjs';
import { GeometryBuilder } from '../../dist/geometry/index.mjs';
import { EquationBalanceLab, MarketEquilibriumLab, ElasticityRevenueLab, DemandShiftVsMoveLab, JournalPosterLab, StatementSorterLab } from '../../dist/commerce/index.mjs';
import { TruthTableLab, CountingTreeLab, VennSetBoardLab, SampleSpaceBoardLab, BooleanCircuitLab, KarnaughMapLab, BayesLab, PascalTriangleLab, BinomialDistributionLab, HypergeometricLab, ExpectedValueLab } from '../../dist/discrete/index.mjs';
import { FunctionMachineLab, VertexParabolaLab, NumberLineLab, LinearSystemLab, HarmonicFormLab, InteractiveProblem, TriangleTrig, Grapher } from '../../dist/math/index.mjs';
import { CircuitLab, CapacitorLeakLab } from '../../dist/circuits/index.mjs';
import { GasBoxLab, SolutionBoxLab, DilutionLab, ReactionLab } from '../../dist/chem/index.mjs';
import { PlaceValueDialLab, BitGrouperLab, BaseOdometerLab } from '../../dist/ict/index.mjs';
import {
  EnzymeRateLab, PhotosynthesisFactorsLab, PunnettCrossLab, RespirationLab,
  GeneticCrossLab, SexLinkedCrossLab, SequenceLab, CentralDogmaLab,
  BLOOD_TYPE_SPEC, DIHYBRID_LOCI,
} from '../../dist/biology/index.mjs';
import { CycleLab, WATER_CYCLE, ROCK_CYCLE, CARBON_CYCLE } from '../../dist/geography/index.mjs';
import { CenterSpreadLab, SequenceLab as SeqSeriesLab, NormalDistributionLab, ZTableLab } from '../../dist/statistics/index.mjs';

const ICON_DECK = {
  termLang: 'en-US', transLang: 'bn-BD',
  items: [
    { term: 'bird', translation: 'পাখি', icon: '🐦' },
    { term: 'tree', translation: 'গাছ', icon: '🌳' },
    { term: 'fish', translation: 'মাছ', icon: '🐟' },
    { term: 'cat', translation: 'বিড়াল', icon: { kind: 'emoji', id: '🐱', alt: 'a cat' } },
  ],
};
const PREP_ITEMS = [
  { before: 'The bird is', noun: 'the tree.', answer: 'above', options: ['above', 'in', 'under'], scene: 'above', figure: '🐦', landmark: '🌳' },
];

/** @type {{ name: string; element: import('react').ReactElement }[]} */
export const GALLERY = [
  { name: 'projectile-lab',  element: h(ProjectileLab, { targetMeters: 70 }) },
  { name: 'river-boat',      element: h(RiverBoat, { boatSpeed: 4, current: 3 }) },
  { name: 'gravity-drop',    element: h(GravityDrop, {}) },
  { name: 'lever-balance',   element: h(LeverBalanceLab, {}) },
  { name: 'balance-algebra', element: h(BalanceAlgebraLab, { coef: 2, addend: 1, rhs: 7, answer: 3 }) },
  { name: 'vector-scene',    element: h(VectorScene, {}) },
  { name: 'vector-board',    element: h(VectorBoardLab, { vectors: [{ id: 'a', comp: { x: 3, y: 1 }, drag: true, label: 'a' }, { id: 'b', comp: { x: 0.7, y: 2.1 }, drag: true, label: 'b' }], combine: 'sum', goal: { match: { x: 6, y: 4 } }, show: { components: true, angle: true, magnitude: true }, objectives: ['Add two vectors tip-to-tail', "Read a resultant's magnitude and direction"], title: 'Make the resultant 6 across, 4 up' }) },
  { name: 'vector-board-diff', element: h(VectorBoardLab, { vectors: [{ id: 'c', comp: { x: 5, y: 0 }, drag: true, label: 'V_C' }, { id: 'a', comp: { x: 0, y: -4 }, drag: true, label: 'V_A (rain)' }], combine: 'diff', resultantLabel: 'V_RC', show: { angle: true, magnitude: true }, title: 'Vector board — rain (relative velocity)' }) },
  { name: 'vector-types',    element: h(VectorTypesLab, {}) },
  { name: 'rain-relative',   element: h(RainRelativeLab, {}) },
  { name: 'optics',          element: h(OpticsLab, {}) },
  { name: 'ramp-forces',     element: h(RampForcesLab, { showComponents: true }) },
  { name: 'ramp-forces-push', element: h(RampForcesLab, { appliedN: 20, angleDeg: 25 }) },
  { name: 'impulse',         element: h(ImpulseLab, { contact: 0.05 }) },
  { name: 'impulse-soft',    element: h(ImpulseLab, { contact: 0.24 }) },
  { name: 'bullet-walls',    element: h(BulletWallsLab, { speed: 30, toughness: 160, planks: 6 }) },
  { name: 'circular-motion', element: h(CircularMotionLab, { speed: 6, radius: 3 }) },
  { name: 'energy-skate',    element: h(EnergySkateLab, { startHeight: 4 }) },
  { name: 'energy-skate-fric', element: h(EnergySkateLab, { startHeight: 4, friction: true }) },
  { name: 'shm-spring',      element: h(SimpleHarmonicLab, { mode: 'spring' }) },
  { name: 'shm-spring-only', element: h(SimpleHarmonicLab, { mode: 'spring', controlConfig: { hide: ['mode'] }, title: 'Mass on a spring' }) },
  { name: 'shm-pendulum',    element: h(SimpleHarmonicLab, { mode: 'pendulum' }) },
  { name: 'atwood',          element: h(AtwoodLab, { m1: 3, m2: 2 }) },
  { name: 'terminal-velocity', element: h(TerminalVelocityLab, { mass: 80, drag: 0.4 }) },
  { name: 'kepler',          element: h(KeplerLab, { eccentricity: 0.5 }) },
  { name: 'kepler-circle',   element: h(KeplerLab, { eccentricity: 0.05 }) },
  { name: 'gravitation',     element: h(GravitationLab, {}) },
  { name: 'heat-radiation',  element: h(HeatTransferLab, { mode: 'radiation' }) },
  { name: 'heat-conduction-only', element: h(HeatTransferLab, { mode: 'conduction', controlConfig: { hide: ['mechanism'] } }) },
  { name: 'expansion-area',  element: h(ThermalExpansionLab, { mode: 'area' }) },
  { name: 'expansion-volume', element: h(ThermalExpansionLab, { mode: 'volume' }) },
  { name: 'temperature-scales', element: h(TemperatureScalesLab, {}) },
  { name: 'grapher-arrhenius', element: h(Grapher, { equations: ['exp(-Ea/(0.0083*x))'], params: [{ name: 'Ea', min: 20, max: 80, value: 53 }], xRange: [250, 400], yScale: 'log', title: 'Arrhenius: rate vs temperature (log scale)' }) },
  { name: 'grapher-linear', element: h(Grapher, { equations: ['a*sin(b*x)'], params: [{ name: 'a', min: 1, max: 3, value: 2 }, { name: 'b', min: 0.5, max: 3, value: 1 }], title: 'Graph' }) },
  { name: 'heating-curve', element: h(HeatingCurveLab, {}) },
  { name: 'water-density', element: h(WaterDensityLab, {}) },
  { name: 'waves-travelling', element: h(WaveLab, { mode: 'travelling' }) },
  { name: 'waves-standing', element: h(WaveLab, { mode: 'standing' }) },
  { name: 'ripple-tank', element: h(RippleTankLab, {}) },
  { name: 'doppler', element: h(DopplerLab, {}) },
  { name: 'string-reflection', element: h(StringReflectionLab, {}) },
  { name: 'magnetism', element: h(MagnetismLab, {}) },
  { name: 'lorentz', element: h(LorentzForceLab, {}) },
  { name: 'stopping-distance', element: h(StoppingDistanceLab, {}) },
  { name: 'collision-track', element: h(CollisionTrackLab, {}) },
  { name: 'work-energy', element: h(WorkEnergyLab, {}) },
  { name: 'carnot', element: h(CarnotCycleLab, {}) },
  { name: 'efficiency', element: h(EfficiencyLab, {}) },
  { name: 'entropy', element: h(EntropyLab, {}) },
  { name: 'gas-process', element: h(GasProcessLab, {}) },
  { name: 'electric-field', element: h(ElectricFieldLab, {}) },
  { name: 'equation-balance', element: h(EquationBalanceLab, { start: 2, freePost: true }) },
  { name: 'truth-table', element: h(TruthTableLab, { formula: 'p -> q', mode: 'fill' }) },
  { name: 'truth-table-demorgan', element: h(TruthTableLab, { formula: '¬(p ∧ q)', compare: '¬p ∨ ¬q' }) },
  { name: 'counting-tree', element: h(CountingTreeLab, { pool: ['A', 'B', 'C', 'D'], draws: 3, replacement: false, mode: 'count', ask: 'ordered' }) },
  { name: 'counting-tree-prob', element: h(CountingTreeLab, { mode: 'probability', stages: [{ branches: [{ label: 'H', weight: 0.5 }, { label: 'T', weight: 0.5 }] }, { branches: [{ label: 'H', weight: 0.5 }, { label: 'T', weight: 0.5 }] }] }) },
  { name: 'venn', element: h(VennSetBoardLab, { sets: [{ name: 'Even', members: [2, 4, 6, 8, 10, 12] }, { name: 'Mult3', members: [3, 6, 9, 12] }, { name: 'Big', members: [7, 8, 9, 10, 11, 12] }], mode: 'explore' }) },
  { name: 'venn-shade', element: h(VennSetBoardLab, { sets: [{ name: 'A', members: [2, 4, 6, 8] }, { name: 'B', members: [3, 6, 9] }], mode: 'shade', target: 'A ∩ ¬B' }) },
  { name: 'sample-space', element: h(SampleSpaceBoardLab, { dims: [6, 6], dice: true, event: { reduce: 'sum', cmp: 'eq', value: 7, label: 'sum = 7' }, mode: 'target' }) },
  { name: 'logic-circuit-and', element: h(BooleanCircuitLab, { title: 'Two-key safe — both switches light the lamp', inputs: [{ id: 'a', label: 'key A' }, { id: 'b', label: 'key B' }], gates: [{ id: 'g', type: 'AND', in: ['a', 'b'] }], outputs: [{ id: 'L', in: 'g', label: 'lamp', goal: true }], objectives: ['See why AND needs every input on'] }) },
  { name: 'logic-circuit-and-lit', element: h(BooleanCircuitLab, { title: 'Two-key safe — both keys in, lamp ON', inputs: [{ id: 'a', label: 'key A' }, { id: 'b', label: 'key B' }], initial: { a: true, b: true }, gates: [{ id: 'g', type: 'AND', in: ['a', 'b'] }], outputs: [{ id: 'L', in: 'g', label: 'lamp', goal: true }] }) },
  { name: 'logic-circuit-xor', element: h(BooleanCircuitLab, { title: 'Staircase light — either switch flips it', inputs: [{ id: 'a', label: 'down' }, { id: 'b', label: 'up' }], gates: [{ id: 'g', type: 'XOR', in: ['a', 'b'] }], outputs: [{ id: 'L', in: 'g', label: 'light', color: 'var(--stage-warn)' }] }) },
  { name: 'logic-circuit-halfadder', element: h(BooleanCircuitLab, { title: 'Half adder — sum & carry', inputs: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], gates: [{ id: 's', type: 'XOR', in: ['a', 'b'] }, { id: 'c', type: 'AND', in: ['a', 'b'] }], outputs: [{ id: 'S', in: 's', label: 'sum' }, { id: 'C', in: 'c', label: 'carry', color: 'var(--stage-warn)' }] }) },
  { name: 'kmap-show', element: h(KarnaughMapLab, { formula: '(a ∧ b) ∨ (a ∧ ¬c)', mode: 'show', title: 'Simplify a ∧ b ∨ a ∧ ¬c' }) },
  { name: 'kmap-4var', element: h(KarnaughMapLab, { minterms: [0, 1, 2, 3, 4, 5, 7, 8, 12, 13], vars: ['a', 'b', 'c', 'd'], mode: 'show', title: '4-variable K-map' }) },
  { name: 'kmap-wrap', element: h(KarnaughMapLab, { minterms: [0, 2, 8, 10], vars: ['a', 'b', 'c', 'd'], mode: 'show', title: 'Four corners group to ¬b ∧ ¬d' }) },
  { name: 'kmap-simplify', element: h(KarnaughMapLab, { minterms: [0, 1, 2, 3, 4, 5, 7, 8, 12, 13], vars: ['a', 'b', 'c', 'd'], mode: 'simplify', title: 'Circle the groups yourself', prompt: 'Tap adjacent 1s into power-of-two blocks until every 1 is covered.' }) },
  { name: 'bayes', element: h(BayesLab, { prior: 0.01, sensitivity: 0.9, falsePositive: 0.09, population: 1000, title: 'The rare-disease test' }) },
  { name: 'pascal', element: h(PascalTriangleLab, { rows: 7, view: 'build' }) },
  { name: 'pascal-parity', element: h(PascalTriangleLab, { rows: 10, view: 'parity', title: 'Sierpinski' }) },
  { name: 'binomial', element: h(BinomialDistributionLab, { n: 10, p: 0.5, showNormal: true }) },
  { name: 'binomial-skew', element: h(BinomialDistributionLab, { n: 12, p: 0.25, title: 'skewed (p=0.25)' }) },
  { name: 'hypergeometric', element: h(HypergeometricLab, { N: 10, K: 4, n: 3 }) },
  { name: 'expected-value', element: h(ExpectedValueLab, { cost: 5 }) },
  { name: 'word-match',      element: h(WordMatchLab, { deck: ICON_DECK, show: 'icon' }) },
  { name: 'preposition',     element: h(PrepositionSceneLab, { items: PREP_ITEMS }) },
  { name: 'preposition-water', element: h(PrepositionSceneLab, { items: [{ before: 'The fish is', noun: 'the water.', answer: 'in', options: ['in', 'on', 'over'], scene: 'in', figure: '🐟', landmark: 'water' }] }) },
  { name: 'geometry-builder', element: h(GeometryBuilder, {}) },

  // ── math (stage explorers) ──
  { name: 'function-machine', element: h(FunctionMachineLab, { inputs: [1, 2, 3], outputs: [3, 5, 7], choices: ['×2 + 1', '×3', '+4', 'n² − 1'], answer: '×2 + 1' }) },
  { name: 'vertex-parabola', element: h(VertexParabolaLab, {}) },
  { name: 'harmonic-form', element: h(HarmonicFormLab, { a: 4, b: -3 }) },
  { name: 'interactive-intersections', element: h(InteractiveProblem, { title: 'k/x meets |x − 4|', equations: [{ expr: 'abs(x - 4)' }, { expr: 'k/x' }], params: [{ name: 'k', min: 0.5, max: 12, step: 0.5, value: 2 }], xRange: [0.1, 12], yRange: [-0.5, 10], derive: [{ kind: 'intersections', of: [0, 1] }], ask: { prompt: 'Largest k with exactly 3 intersections?', answer: { kind: 'number', value: 4, tol: 0.05 } }, activity: 'q12-intersections' }) },
  { name: 'triangle-trig', element: h(TriangleTrig, { angleDeg: 31, leg: 15, legKind: 'opposite', mode: 'depression', labels: { opposite: 'height', adjacent: 'distance' }, drive: ['angle'] }) },
  { name: 'number-line', element: h(NumberLineLab, {}) },
  { name: 'linear-system', element: h(LinearSystemLab, {}) },

  // ── circuits ──
  { name: 'circuit', element: h(CircuitLab, {}) },
  { name: 'capacitor-leak', element: h(CapacitorLeakLab, {}) },

  // ── chemistry ──
  { name: 'gas-box', element: h(GasBoxLab, {}) },
  { name: 'solution-box', element: h(SolutionBoxLab, {}) },
  { name: 'dilution', element: h(DilutionLab, {}) },
  { name: 'reaction', element: h(ReactionLab, {}) },

  // ── ICT (number systems) ──
  { name: 'place-value-dial', element: h(PlaceValueDialLab, {}) },
  { name: 'bit-grouper', element: h(BitGrouperLab, {}) },
  { name: 'base-odometer', element: h(BaseOdometerLab, {}) },

  // ── commerce (economics + accounting) ──
  { name: 'market-equilibrium', element: h(MarketEquilibriumLab, {}) },
  { name: 'elasticity-revenue', element: h(ElasticityRevenueLab, {}) },
  { name: 'demand-shift', element: h(DemandShiftVsMoveLab, {}) },
  { name: 'journal-poster', element: h(JournalPosterLab, {}) },
  { name: 'statement-sorter', element: h(StatementSorterLab, {}) },

  // ── biology ──
  { name: 'enzyme-rate', element: h(EnzymeRateLab, {}) },
  { name: 'photosynthesis-factors', element: h(PhotosynthesisFactorsLab, {}) },
  { name: 'respiration', element: h(RespirationLab, {}) },
  { name: 'punnett-cross', element: h(PunnettCrossLab, { predictFirst: false }) },
  { name: 'genetic-cross-blood', element: h(GeneticCrossLab, { spec: BLOOD_TYPE_SPEC, parent1: ['A', 'O'], parent2: ['B', 'O'], predictFirst: false, title: 'Blood groups (A0 × B0)' }) },
  { name: 'genetic-cross-dihybrid', element: h(GeneticCrossLab, { loci: DIHYBRID_LOCI, predictFirst: false, title: 'Dihybrid (AaBb × AaBb)' }) },
  { name: 'sex-linked-cross', element: h(SexLinkedCrossLab, { predictFirst: false }) },
  { name: 'sequence-replication', element: h(SequenceLab, { kind: 'replication' }) },
  { name: 'sequence-translation', element: h(SequenceLab, { kind: 'translation' }) },
  { name: 'central-dogma', element: h(CentralDogmaLab, {}) },

  // ── geography (cycle engine) ──
  { name: 'cycle-water', element: h(CycleLab, { nodes: WATER_CYCLE.nodes, edges: WATER_CYCLE.edges, challenge: 'label-process', title: 'Water cycle' }) },
  { name: 'cycle-rock', element: h(CycleLab, { nodes: ROCK_CYCLE.nodes, edges: ROCK_CYCLE.edges, challenge: 'trace', title: 'Rock cycle' }) },
  { name: 'cycle-carbon', element: h(CycleLab, { nodes: CARBON_CYCLE.nodes, edges: CARBON_CYCLE.edges, challenge: 'trace', title: 'Carbon cycle' }) },

  // ── statistics & sequences ──
  { name: 'center-spread', element: h(CenterSpreadLab, {}) },
  { name: 'normal-area', element: h(NormalDistributionLab, { mu: 0, sigma: 1, a: -1, b: 1, mode: 'area' }) },
  { name: 'normal-rule', element: h(NormalDistributionLab, { mode: 'rule', title: '68-95-99.7' }) },
  { name: 'z-table', element: h(ZTableLab, { x: 650, mu: 500, sigma: 100, title: 'z-table lookup' }) },
  { name: 'center-spread-challenge', element: h(CenterSpreadLab, { data: [1, 2, 4, 4, 9], challenge: { stat: 'mean', target: 4 }, title: 'Drag the balance point to the mean' }) },
  { name: 'sequence-arithmetic', element: h(SeqSeriesLab, { kind: 'arithmetic', first: 2, step: 3, count: 8, title: 'Arithmetic series' }) },
  { name: 'sequence-geometric', element: h(SeqSeriesLab, { kind: 'geometric', first: 1, step: 0.5, count: 8, title: 'Geometric series (convergence)' }) },
];
