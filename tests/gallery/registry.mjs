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
  RiverBoat,
  GravityDrop,
  VectorScene,
  VectorBoardLab,
  VectorTypesLab,
  RainRelativeLab,
  LeverBalanceLab,
  OpticsLab,
  RampForcesLab,
  ImpulseLab,
  BulletWallsLab,
  CircularMotionLab,
  EnergySkateLab,
  SimpleHarmonicLab,
  AtwoodLab,
  LinearPursuitLab,
  TerminalVelocityLab,
  KeplerLab,
  GravitationLab,
  HeatTransferLab,
  ThermalExpansionLab,
  TemperatureScalesLab,
  HeatingCurveLab,
  WaterDensityLab,
  WaveLab,
  RippleTankLab,
  DopplerLab,
  StringReflectionLab,
  MagnetismLab,
  LorentzForceLab,
  StoppingDistanceLab,
  CollisionTrackLab,
  WorkEnergyLab,
  PowerLab,
  StressStrainLab,
  FluidPressureLab,
  ForcePairsLab,
  CoupleTorqueLab,
  CarnotCycleLab,
  EfficiencyLab,
  EntropyLab,
  GasProcessLab,
  ElectricFieldLab,
  ElectricFluxLab,
  GaussLab,
  WorkPotentialLab,
  AlternatingCurrentLab,
  MovingLauncherLab,
  FallingTargetLab,
  InterceptLab,
  VenturiLab,
} from '../../dist/physics/index.mjs';
import {
  RelativitySimultaneityLab,
  LengthContractionLab,
  RelativityLightClockLab,
} from '../../dist/physics/modern/index.mjs';
import {
  AreaRearrangeLab,
  RadianWrapLab,
  BalanceAlgebraLab,
  MeasurementLab,
  SlideRuleLab,
  SolidNetLab,
  TrigExplorer,
  TransformLab,
} from '../../dist/math/index.mjs';
import { WordMatchLab, PrepositionSceneLab } from '../../dist/language/index.mjs';
import { GeometryBuilder, GeometryBoard } from '../../dist/geometry/index.mjs';
import {
  EquationBalanceLab,
  MarketEquilibriumLab,
  ElasticityRevenueLab,
  DemandShiftVsMoveLab,
  JournalPosterLab,
  StatementSorterLab,
} from '../../dist/commerce/index.mjs';
import { ExamQuestion } from '../../dist/exam/index.mjs';
import { OgiveLab, FrequencyDensity } from '../../dist/statistics/index.mjs';
import {
  TruthTableLab,
  CountingTreeLab,
  VennSetBoardLab,
  SampleSpaceBoardLab,
  KarnaughMapLab,
  BayesLab,
  PascalTriangleLab,
  BinomialDistributionLab,
  HypergeometricLab,
  ExpectedValueLab,
} from '../../dist/discrete/index.mjs';
import { LogicScene, netlistToDoc } from '../../dist/logic/index.mjs';
import {
  FunctionMachineLab,
  VertexParabolaLab,
  NumberLineLab,
  LinearSystemLab,
  HarmonicFormLab,
  InteractiveProblem,
  TriangleTrig,
  ObliqueTriangle,
  BearingsLab,
  IdentityProof,
  PartialFractions,
  IterationLab,
  LinesInSpaceLab,
  BrokenTreeLab,
  StraightLineLab,
  CircleLab,
  ConicLab,
  DomainRangeLab,
  Grapher,
} from '../../dist/math/index.mjs';
import {
  CircuitLab,
  CircuitNetworkLab,
  CapacitorLeakLab,
  RCChargingLab,
  DiodeLab,
  TransistorLab,
  CmosInverterLab,
  CmosNandLab,
  CmosNorLab,
  RNmosNotLab,
  BrownoutLab,
  AcDcLab,
  MosfetInsideLab,
  PnJunctionLab,
  BjtInsideLab,
  SiliconLatticeLab,
  ConductionLab,
  HallEffectLab,
} from '../../dist/circuits/index.mjs';
import { GasBoxLab, SolutionBoxLab, DilutionLab, ReactionLab } from '../../dist/chem/index.mjs';
import { PlaceValueDialLab, BitGrouperLab, BaseOdometerLab } from '../../dist/ict/index.mjs';
import {
  EnzymeRateLab,
  PhotosynthesisFactorsLab,
  PunnettCrossLab,
  RespirationLab,
  GeneticCrossLab,
  SexLinkedCrossLab,
  SequenceLab,
  CentralDogmaLab,
  BLOOD_TYPE_SPEC,
  DIHYBRID_LOCI,
} from '../../dist/biology/index.mjs';
import { CycleLab, WATER_CYCLE, ROCK_CYCLE, CARBON_CYCLE } from '../../dist/geography/index.mjs';
import {
  CenterSpreadLab,
  SequenceLab as SeqSeriesLab,
  NormalDistributionLab,
  ZTableLab,
} from '../../dist/statistics/index.mjs';

const ICON_DECK = {
  termLang: 'en-US',
  transLang: 'bn-BD',
  items: [
    { term: 'bird', translation: 'পাখি', icon: '🐦' },
    { term: 'tree', translation: 'গাছ', icon: '🌳' },
    { term: 'fish', translation: 'মাছ', icon: '🐟' },
    { term: 'cat', translation: 'বিড়াল', icon: { kind: 'emoji', id: '🐱', alt: 'a cat' } },
  ],
};
const PREP_ITEMS = [
  {
    before: 'The bird is',
    noun: 'the tree.',
    answer: 'above',
    options: ['above', 'in', 'under'],
    scene: 'above',
    figure: '🐦',
    landmark: '🌳',
  },
];

/** @type {{ name: string; element: import('react').ReactElement }[]} */
export const GALLERY = [
  { name: 'river-boat', element: h(RiverBoat, { boatSpeed: 4, current: 3 }) },
  { name: 'gravity-drop', element: h(GravityDrop, {}) },
  { name: 'lever-balance', element: h(LeverBalanceLab, {}) },
  { name: 'balance-algebra', element: h(BalanceAlgebraLab, { coef: 2, addend: 1, rhs: 7, answer: 3 }) },
  // Two numbered log scales, one sliding over the other: the shape most likely to
  // reintroduce label overlap, so it is judged lined up (where the numbers crowd).
  { name: 'slide-rule', element: h(SlideRuleLab, { a: 2, b: 3, aligned: true }) },
  // Judged where the pieces are furthest apart and most likely to overflow the
  // frame or collide with the caption.
  { name: 'area-rearrange-circle', element: h(AreaRearrangeLab, { mode: 'circle', sectors: 12 }) },
  { name: 'area-rearrange-triangle', element: h(AreaRearrangeLab, { mode: 'triangle' }) },
  // The net is the busiest of the four views: six labelled faces in a cross.
  // Two classical constructions, to prove the board can express them from the
  // primitives it already has. Tangents: the circle on diameter OP meets the
  // original circle at the two points of contact, so angle OTP is a right angle
  // by the semicircle theorem. Chord: A and B ride the rim via intersect, so the
  // chord stays a chord however it is dragged, and the right angle at its
  // midpoint is measured rather than constructed.
  {
    name: 'geometry-board-tangents',
    element: h(GeometryBoard, {
      title: 'Two tangents from one point',
      scene: [
        { type: 'point', id: 'O', x: 4, y: 0, label: 'O' },
        { type: 'point', id: 'P', x: 9.5, y: 0, draggable: true, label: 'P' },
        { type: 'circle', id: 'c', center: 'O', radius: 2 },
        // Scaffolding: the circle on diameter OP meets the given circle exactly at
        // the two points of contact. It does the locating, then gets out of the way.
        { type: 'midpoint', id: 'M', of: ['O', 'P'], hidden: true },
        { type: 'circle', id: 'cM', center: 'M', through: 'O', hidden: true },
        { type: 'intersect', id: 'T1', of: ['c', 'cM'], pick: 0, label: 'T' },
        { type: 'intersect', id: 'T2', of: ['c', 'cM'], pick: 1, label: 'U' },
        { type: 'segment', from: 'P', to: 'T1' },
        { type: 'segment', from: 'P', to: 'T2' },
        { type: 'segment', from: 'O', to: 'T1', dashed: true },
        { type: 'measure', kind: 'angle', of: ['O', 'T1', 'P'], label: 'OTP' },
        { type: 'measure', kind: 'distance', of: ['P', 'T1'] },
        { type: 'measure', kind: 'distance', of: ['P', 'T2'] },
      ],
    }),
  },
  {
    name: 'geometry-board-chord-foot',
    element: h(GeometryBoard, {
      title: 'The perpendicular from the centre',
      scene: [
        { type: 'point', id: 'O', x: 5, y: 0, label: 'O' },
        { type: 'circle', id: 'c', center: 'O', radius: 3.2 },
        // A and B are PINNED to the circle: a free handle sets a direction, and the
        // point is where that ray meets the circle. Drag the handle and the point
        // travels round the rim instead of wandering off it.
        // Unlabelled on purpose: the drag halo and the subtitle already say these
        // move, and a word here lands on top of the A and B it drives.
        { type: 'point', id: 'Ah', x: 2.2, y: 2.6, draggable: true },
        { type: 'point', id: 'Bh', x: 8.4, y: 1.6, draggable: true },
        // The ray is scaffolding and stays hidden; the RADIUS it carries is drawn,
        // because the congruence proof is about OA and OB being equal.
        { type: 'line', id: 'rayA', through: ['O', 'Ah'], hidden: true },
        { type: 'line', id: 'rayB', through: ['O', 'Bh'], hidden: true },
        { type: 'intersect', id: 'A', of: ['c', 'rayA'], pick: 1, label: 'A' },
        { type: 'intersect', id: 'B', of: ['c', 'rayB'], pick: 1, label: 'B' },
        { type: 'segment', from: 'O', to: 'A', dashed: true },
        { type: 'segment', from: 'O', to: 'B', dashed: true },
        { type: 'segment', from: 'A', to: 'B' },
        // Stated the way it can be BUILT: join the centre to the midpoint of the
        // chord and MEASURE the angle. The 90 is the discovery, not an assumption.
        // Reflecting O in the chord to find the foot independently was tried and
        // abandoned: the second circle-circle intersection resolved back to O, so
        // the two halves read equal only because both were radii.
        { type: 'midpoint', id: 'M', of: ['A', 'B'], label: 'M' },
        { type: 'segment', from: 'O', to: 'M', dashed: true },
        { type: 'measure', kind: 'angle', of: ['O', 'M', 'B'], label: 'OMB' },
      ],
    }),
  },
  // Judged at a FULL TURN: seven bands, six tick marks, the straightened ruler and the
  // "rim is closed" line are all on screen at once, which is the busiest this ever gets.
  { name: 'radian-wrap-full-turn', element: h(RadianWrapLab, { startRadians: 6.283185 }) },
  { name: 'radian-wrap-one', element: h(RadianWrapLab, { startRadians: 1 }) },
  { name: 'solid-net-net', element: h(SolidNetLab, { mode: 'net' }) },
  { name: 'solid-net-compound', element: h(SolidNetLab, { mode: 'compound' }) },
  // Applied measurement (the wheel / cylinder / area word-problem family) — every mode is judged.
  { name: 'measurement-pi-roll', element: h(MeasurementLab, { mode: 'pi-roll', radius: 2 }) },
  {
    name: 'measurement-wheel',
    element: h(MeasurementLab, { mode: 'wheel-distance', radius: 2, turns: 1.5 }),
  },
  { name: 'measurement-cylinder', element: h(MeasurementLab, { mode: 'cylinder', radius: 2, height: 5 }) },
  { name: 'measurement-path', element: h(MeasurementLab, { mode: 'walking-path' }) },
  { name: 'measurement-area', element: h(MeasurementLab, { mode: 'irregular-area' }) },
  { name: 'trig-explorer', element: h(TrigExplorer, {}) },
  { name: 'geometry-transform', element: h(TransformLab, {}) },
  { name: 'vector-scene', element: h(VectorScene, {}) },
  {
    name: 'vector-board',
    element: h(VectorBoardLab, {
      vectors: [
        { id: 'a', comp: { x: 3, y: 1 }, drag: true, label: 'a' },
        { id: 'b', comp: { x: 0.7, y: 2.1 }, drag: true, label: 'b' },
      ],
      combine: 'sum',
      goal: { match: { x: 6, y: 4 } },
      show: { components: true, angle: true, magnitude: true },
      objectives: ['Add two vectors tip-to-tail', "Read a resultant's magnitude and direction"],
      title: 'Make the resultant 6 across, 4 up',
    }),
  },
  {
    name: 'vector-board-diff',
    element: h(VectorBoardLab, {
      vectors: [
        { id: 'c', comp: { x: 5, y: 0 }, drag: true, label: 'V_C' },
        { id: 'a', comp: { x: 0, y: -4 }, drag: true, label: 'V_A (rain)' },
      ],
      combine: 'diff',
      resultantLabel: 'V_RC',
      show: { angle: true, magnitude: true },
      title: 'Vector board — rain (relative velocity)',
    }),
  },
  { name: 'vector-types', element: h(VectorTypesLab, {}) },
  { name: 'rain-relative', element: h(RainRelativeLab, {}) },
  // Authored-shell relativity lessons (the shell anatomy + scene type floor are judged here).
  { name: 'relativity-simultaneity', element: h(RelativitySimultaneityLab, { beta: 0.6, separationM: 300 }) },
  { name: 'length-contraction', element: h(LengthContractionLab, { beta: 0.8, properLengthM: 100 }) },
  { name: 'relativity-light-clock', element: h(RelativityLightClockLab, { beta: 0.6, view: 'linked' }) },
  { name: 'optics', element: h(OpticsLab, {}) },
  { name: 'ramp-forces', element: h(RampForcesLab, { showComponents: true }) },
  { name: 'ramp-forces-push', element: h(RampForcesLab, { appliedN: 20, angleDeg: 25 }) },
  { name: 'impulse', element: h(ImpulseLab, { contact: 0.05 }) },
  { name: 'impulse-soft', element: h(ImpulseLab, { contact: 0.24 }) },
  { name: 'bullet-walls', element: h(BulletWallsLab, { speed: 30, toughness: 160, planks: 6 }) },
  { name: 'circular-motion', element: h(CircularMotionLab, { speed: 6, radius: 3 }) },
  { name: 'energy-skate', element: h(EnergySkateLab, { startHeight: 4 }) },
  { name: 'energy-skate-fric', element: h(EnergySkateLab, { startHeight: 4, friction: true }) },
  { name: 'shm-spring', element: h(SimpleHarmonicLab, { mode: 'spring' }) },
  {
    name: 'shm-spring-only',
    element: h(SimpleHarmonicLab, {
      mode: 'spring',
      controlConfig: { hide: ['mode'] },
      title: 'Mass on a spring',
    }),
  },
  { name: 'shm-pendulum', element: h(SimpleHarmonicLab, { mode: 'pendulum' }) },
  { name: 'atwood', element: h(AtwoodLab, { m1: 3, m2: 2 }) },
  { name: 'linear-pursuit', element: h(LinearPursuitLab, { scenario: 'bus-car' }) },
  { name: 'terminal-velocity', element: h(TerminalVelocityLab, { mass: 80, drag: 0.4 }) },
  { name: 'kepler', element: h(KeplerLab, { eccentricity: 0.5 }) },
  { name: 'kepler-circle', element: h(KeplerLab, { eccentricity: 0.05 }) },
  { name: 'gravitation', element: h(GravitationLab, {}) },
  { name: 'heat-radiation', element: h(HeatTransferLab, { mode: 'radiation' }) },
  {
    name: 'heat-conduction-only',
    element: h(HeatTransferLab, { mode: 'conduction', controlConfig: { hide: ['mechanism'] } }),
  },
  { name: 'expansion-area', element: h(ThermalExpansionLab, { mode: 'area' }) },
  { name: 'expansion-volume', element: h(ThermalExpansionLab, { mode: 'volume' }) },
  { name: 'temperature-scales', element: h(TemperatureScalesLab, {}) },
  {
    name: 'grapher-arrhenius',
    element: h(Grapher, {
      equations: ['exp(-Ea/(0.0083*x))'],
      params: [{ name: 'Ea', min: 20, max: 80, value: 53 }],
      xRange: [250, 400],
      yScale: 'log',
      title: 'Arrhenius: rate vs temperature (log scale)',
    }),
  },
  {
    name: 'grapher-linear',
    element: h(Grapher, {
      equations: ['a*sin(b*x)'],
      params: [
        { name: 'a', min: 1, max: 3, value: 2 },
        { name: 'b', min: 0.5, max: 3, value: 1 },
      ],
      title: 'Graph',
    }),
  },
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
  { name: 'power-lift', element: h(PowerLab, {}) },
  { name: 'power-drive', element: h(PowerLab, { mode: 'drive' }) },
  { name: 'stress-strain-force', element: h(StressStrainLab, {}) },
  {
    name: 'stress-strain-modulus',
    element: h(StressStrainLab, { graph: 'stress-strain', diameterMm: 1.2, lengthM: 3 }),
  },
  { name: 'stress-strain-glass', element: h(StressStrainLab, { material: 'glass', loadN: 30 }) },
  { name: 'fluid-pressure', element: h(FluidPressureLab, {}) },
  { name: 'force-pairs', element: h(ForcePairsLab, {}) },
  { name: 'couple-torque', element: h(CoupleTorqueLab, {}) },
  { name: 'carnot', element: h(CarnotCycleLab, {}) },
  { name: 'efficiency', element: h(EfficiencyLab, {}) },
  { name: 'entropy', element: h(EntropyLab, {}) },
  { name: 'gas-process', element: h(GasProcessLab, {}) },
  { name: 'electric-field', element: h(ElectricFieldLab, {}) },
  { name: 'electric-flux', element: h(ElectricFluxLab, { field: 6, area: 3, angleDeg: 30 }) },
  { name: 'gauss-law', element: h(GaussLab, {}) },
  { name: 'work-potential', element: h(WorkPotentialLab, {}) },
  { name: 'alternating-current-waveform', element: h(AlternatingCurrentLab, {}) },
  { name: 'alternating-current-rms', element: h(AlternatingCurrentLab, { view: 'rms' }) },
  {
    name: 'alternating-current-rectified',
    element: h(AlternatingCurrentLab, { view: 'rectification', capacitanceUf: 1000 }),
  },
  { name: 'equation-balance', element: h(EquationBalanceLab, { start: 2, freePost: true }) },
  { name: 'truth-table', element: h(TruthTableLab, { formula: 'p -> q', mode: 'fill' }) },
  { name: 'truth-table-demorgan', element: h(TruthTableLab, { formula: '¬(p ∧ q)', compare: '¬p ∨ ¬q' }) },
  {
    name: 'counting-tree',
    element: h(CountingTreeLab, {
      pool: ['A', 'B', 'C', 'D'],
      draws: 3,
      replacement: false,
      mode: 'count',
      ask: 'ordered',
    }),
  },
  {
    name: 'counting-tree-prob',
    element: h(CountingTreeLab, {
      mode: 'probability',
      stages: [
        {
          branches: [
            { label: 'H', weight: 0.5 },
            { label: 'T', weight: 0.5 },
          ],
        },
        {
          branches: [
            { label: 'H', weight: 0.5 },
            { label: 'T', weight: 0.5 },
          ],
        },
      ],
    }),
  },
  {
    name: 'venn',
    element: h(VennSetBoardLab, {
      sets: [
        { name: 'Even', members: [2, 4, 6, 8, 10, 12] },
        { name: 'Mult3', members: [3, 6, 9, 12] },
        { name: 'Big', members: [7, 8, 9, 10, 11, 12] },
      ],
      mode: 'explore',
    }),
  },
  {
    name: 'venn-shade',
    element: h(VennSetBoardLab, {
      sets: [
        { name: 'A', members: [2, 4, 6, 8] },
        { name: 'B', members: [3, 6, 9] },
      ],
      mode: 'shade',
      target: 'A ∩ ¬B',
    }),
  },
  {
    name: 'sample-space',
    element: h(SampleSpaceBoardLab, {
      dims: [6, 6],
      dice: true,
      event: { reduce: 'sum', cmp: 'eq', value: 7, label: 'sum = 7' },
      mode: 'target',
    }),
  },
  // logic-circuit renders through the shared logic engine (netlist → LogicDoc → LogicScene).
  {
    name: 'logic-circuit-and',
    element: h(LogicScene, {
      doc: netlistToDoc({
        inputs: [
          { id: 'a', label: 'key A' },
          { id: 'b', label: 'key B' },
        ],
        gates: [{ id: 'g', type: 'AND', in: ['a', 'b'] }],
        outputs: [{ id: 'L', in: 'g', label: 'lamp', goal: true }],
      }),
      ariaLabel: 'two-key safe, AND gate',
    }),
  },
  {
    name: 'logic-circuit-and-lit',
    element: h(LogicScene, {
      doc: netlistToDoc({
        inputs: [
          { id: 'a', label: 'key A' },
          { id: 'b', label: 'key B' },
        ],
        initial: { a: true, b: true },
        gates: [{ id: 'g', type: 'AND', in: ['a', 'b'] }],
        outputs: [{ id: 'L', in: 'g', label: 'lamp', goal: true }],
      }),
      ariaLabel: 'two-key safe, both keys in, lamp on',
    }),
  },
  {
    name: 'logic-circuit-xor',
    element: h(LogicScene, {
      doc: netlistToDoc({
        inputs: [
          { id: 'a', label: 'down' },
          { id: 'b', label: 'up' },
        ],
        gates: [{ id: 'g', type: 'XOR', in: ['a', 'b'] }],
        outputs: [{ id: 'L', in: 'g', label: 'light', color: 'var(--stage-warn)' }],
      }),
      ariaLabel: 'staircase light, XOR gate',
    }),
  },
  {
    name: 'logic-circuit-halfadder',
    element: h(LogicScene, {
      doc: netlistToDoc({
        inputs: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ],
        gates: [
          { id: 's', type: 'XOR', in: ['a', 'b'] },
          { id: 'c', type: 'AND', in: ['a', 'b'] },
        ],
        outputs: [
          { id: 'S', in: 's', label: 'sum' },
          { id: 'C', in: 'c', label: 'carry', color: 'var(--stage-warn)' },
        ],
      }),
      ariaLabel: 'half adder, sum and carry',
    }),
  },
  {
    name: 'kmap-show',
    element: h(KarnaughMapLab, {
      formula: '(a ∧ b) ∨ (a ∧ ¬c)',
      mode: 'show',
      title: 'Simplify a ∧ b ∨ a ∧ ¬c',
    }),
  },
  {
    name: 'kmap-4var',
    element: h(KarnaughMapLab, {
      minterms: [0, 1, 2, 3, 4, 5, 7, 8, 12, 13],
      vars: ['a', 'b', 'c', 'd'],
      mode: 'show',
      title: '4-variable K-map',
    }),
  },
  {
    name: 'kmap-wrap',
    element: h(KarnaughMapLab, {
      minterms: [0, 2, 8, 10],
      vars: ['a', 'b', 'c', 'd'],
      mode: 'show',
      title: 'Four corners group to ¬b ∧ ¬d',
    }),
  },
  {
    name: 'kmap-simplify',
    element: h(KarnaughMapLab, {
      minterms: [0, 1, 2, 3, 4, 5, 7, 8, 12, 13],
      vars: ['a', 'b', 'c', 'd'],
      mode: 'simplify',
      title: 'Circle the groups yourself',
      prompt: 'Tap adjacent 1s into power-of-two blocks until every 1 is covered.',
    }),
  },
  {
    name: 'bayes',
    element: h(BayesLab, {
      prior: 0.01,
      sensitivity: 0.9,
      falsePositive: 0.09,
      population: 1000,
      title: 'The rare-disease test',
    }),
  },
  { name: 'pascal', element: h(PascalTriangleLab, { rows: 7, view: 'build' }) },
  { name: 'pascal-parity', element: h(PascalTriangleLab, { rows: 10, view: 'parity', title: 'Sierpinski' }) },
  { name: 'binomial', element: h(BinomialDistributionLab, { n: 10, p: 0.5, showNormal: true }) },
  {
    name: 'binomial-skew',
    element: h(BinomialDistributionLab, { n: 12, p: 0.25, title: 'skewed (p=0.25)' }),
  },
  { name: 'hypergeometric', element: h(HypergeometricLab, { N: 10, K: 4, n: 3 }) },
  { name: 'expected-value', element: h(ExpectedValueLab, { cost: 5 }) },
  { name: 'word-match', element: h(WordMatchLab, { deck: ICON_DECK, show: 'icon' }) },
  { name: 'preposition', element: h(PrepositionSceneLab, { items: PREP_ITEMS }) },
  {
    name: 'preposition-water',
    element: h(PrepositionSceneLab, {
      items: [
        {
          before: 'The fish is',
          noun: 'the water.',
          answer: 'in',
          options: ['in', 'on', 'over'],
          scene: 'in',
          figure: '🐟',
          landmark: 'water',
        },
      ],
    }),
  },
  { name: 'geometry-builder', element: h(GeometryBuilder, {}) },

  // ── math (stage explorers) ──
  {
    name: 'function-machine',
    element: h(FunctionMachineLab, {
      inputs: [1, 2, 3],
      outputs: [3, 5, 7],
      choices: ['×2 + 1', '×3', '+4', 'n² − 1'],
      answer: '×2 + 1',
    }),
  },
  { name: 'vertex-parabola', element: h(VertexParabolaLab, {}) },
  { name: 'harmonic-form', element: h(HarmonicFormLab, { a: 4, b: -3 }) },
  {
    name: 'interactive-intersections',
    element: h(InteractiveProblem, {
      title: 'k/x meets |x − 4|',
      equations: [{ expr: 'abs(x - 4)' }, { expr: 'k/x' }],
      params: [{ name: 'k', min: 0.5, max: 12, step: 0.5, value: 2 }],
      xRange: [0.1, 12],
      yRange: [-0.5, 10],
      derive: [{ kind: 'intersections', of: [0, 1] }],
      ask: {
        prompt: 'Largest k with exactly 3 intersections?',
        answer: { kind: 'number', value: 4, tol: 0.05 },
      },
      activity: 'q12-intersections',
    }),
  },
  {
    name: 'triangle-trig',
    element: h(TriangleTrig, {
      angleDeg: 31,
      leg: 15,
      legKind: 'opposite',
      mode: 'depression',
      labels: { opposite: 'height', adjacent: 'distance' },
      drive: ['angle'],
    }),
  },
  // Opens on the ambiguous case, because two triangles drawn on one set of given data is the
  // thing this lab exists to show and a snapshot of the one-solution case would hide it.
  { name: 'oblique-triangle', element: h(ObliqueTriangle, { given: 'ssa' }) },
  // The cosine-rule half, where the given parts leave no matching pair to start the sine rule.
  { name: 'oblique-triangle-cosine', element: h(ObliqueTriangle, { given: 'sas' }) },
  // A second leg past 180 degrees, so the snapshot shows the arc sweeping the LONG way clockwise;
  // at the default 150 the short way and the clockwise way agree, which would hide the whole point.
  // 120 then 210 also turns through a right angle, giving a 6-8-10 triangle rather than the near
  // retrace that 250 produced, where every label piled up on the start.
  { name: 'bearings', element: h(BearingsLab, { firstBearing: 120, secondBearing: 210 }) },
  // Opens on step one with nothing chosen, which is the state a learner actually faces.
  { name: 'identity-proof', element: h(IdentityProof, {}) },
  // Opens unsolved, which is the state a learner meets: the form has not been chosen yet, so
  // only the original curve is drawn and the decomposition is still a decision.
  { name: 'partial-fractions', element: h(PartialFractions, {}) },
  // The convergent rearrangement, which is what the default opens on.
  { name: 'iteration', element: h(IterationLab, {}) },
  // Frozen mid-flight: the parabola from the ground, and the ball still above the cart.
  { name: 'moving-launcher', element: h(MovingLauncherLab, { predict: false, at: 1.2 }) },
  // The same flight watched from the cart: straight up and straight down.
  { name: 'moving-launcher-cart-frame', element: h(MovingLauncherLab, { predict: false, at: 1.2, frame: 'cart' }) },
  // A cart that speeds up after firing, at landing: the ball comes down behind it.
  { name: 'moving-launcher-accelerating', element: h(MovingLauncherLab, { predict: false, at: 3, cartAccel: 1.5 }) },
  { name: 'moving-launcher-drop-throw', element: h(MovingLauncherLab, { mode: 'drop-and-throw', predict: false, at: 0.9 }) },
  // Aimed straight at the coconut, mid-flight: both have fallen the same ½gt² below their paths.
  { name: 'falling-target', element: h(FallingTargetLab, { angle: 26.5, speed: 30, at: 0.8 }) },
  { name: 'falling-target-opening', element: h(FallingTargetLab, {}) },
  // The opening: aimed straight at the deer, with the velocity construction drawn at the start.
  { name: 'intercept', element: h(InterceptLab, {}) },
  // Led correctly, mid-run: the two trails converging on the meeting point.
  { name: 'intercept-lead', element: h(InterceptLab, { heading: 38.9, at: 2 }) },
  // The pursuit curve out of breath at the end of the sprint.
  { name: 'intercept-chase', element: h(InterceptLab, { strategy: 'chase', at: 9 }) },
  // Undecided: the tubes stand empty with a question mark until the learner predicts.
  { name: 'venturi', element: h(VenturiLab, {}) },
  // Revealed: the narrow part's column stands lowest.
  { name: 'venturi-revealed', element: h(VenturiLab, { predict: false }) },
  // A throat tight enough to fall below atmospheric pressure: the middle tube would suck air.
  { name: 'venturi-suction', element: h(VenturiLab, { predict: false, throatRatio: 0.4 }) },
  // Opens undecided, which is the moment the lab is built for: two lines whose pictures cross,
  // with the nearer one drawn over the further at the crossing.
  { name: 'lines-in-space', element: h(LinesInSpaceLab, {}) },
  // The verdict revealed: the skew pair with its closest approach drawn and measured.
  { name: 'lines-in-space-skew', element: h(LinesInSpaceLab, { predict: false }) },
  // A pair that really meets, so the two verdicts can be compared side by side.
  {
    name: 'lines-in-space-meet',
    element: h(LinesInSpaceLab, { predict: false, a: [1, 2, 3], b: [1, 0, -1], c: [0, 0, 2], d: [1, 1, 0] }),
  },
  { name: 'lines-in-space-vectors', element: h(LinesInSpaceLab, { mode: 'vectors' }) },
  { name: 'lines-in-space-line', element: h(LinesInSpaceLab, { mode: 'line' }) },
  { name: 'lines-in-space-perpendicular', element: h(LinesInSpaceLab, { mode: 'perpendicular' }) },
  // The payoff, which the unsolved scene cannot show: three simple curves that add to the
  // complicated one, with the disagreement between them reported as a number.
  { name: 'partial-fractions-parts', element: h(PartialFractions, { revealed: true }) },
  { name: 'broken-tree', element: h(BrokenTreeLab, { originalHeight: 18, target: 12, breakHeight: 3 }) },
  { name: 'straight-line-two-point', element: h(StraightLineLab, { mode: 'two-point', showDistance: true }) },
  {
    name: 'straight-line-perpendicular',
    element: h(StraightLineLab, { mode: 'perpendicular', given: { m: 2, c: 1 }, through: { x: 4, y: 3 } }),
  },
  {
    name: 'straight-line-intercept',
    element: h(StraightLineLab, { mode: 'intercept-form', pointA: { x: 4, y: 0 }, pointB: { x: 0, y: 3 } }),
  },
  {
    name: 'circle-tangent',
    element: h(CircleLab, { center: { x: 1, y: -1 }, radius: 4, showTangent: true, showExpanded: true }),
  },
  { name: 'conic-parabola', element: h(ConicLab, { kind: 'parabola', a: 1 }) },
  { name: 'conic-ellipse', element: h(ConicLab, { kind: 'ellipse', a: 4, b: 2.5 }) },
  {
    name: 'domain-range-semicircle',
    element: h(DomainRangeLab, { equation: 'sqrt(9 - x^2)', xRange: [-6, 6] }),
  },
  {
    name: 'domain-range-pole',
    element: h(DomainRangeLab, { equation: '1/(x - 2)', xRange: [-6, 8], probe: 5 }),
  },
  { name: 'conic-hyperbola', element: h(ConicLab, { kind: 'hyperbola', a: 2, b: 1.5 }) },
  { name: 'number-line', element: h(NumberLineLab, {}) },
  { name: 'linear-system', element: h(LinearSystemLab, {}) },

  // ── circuits ──
  { name: 'circuit', element: h(CircuitLab, {}) },
  { name: 'circuit-network', element: h(CircuitNetworkLab, {}) },
  { name: 'rc-charging', element: h(RCChargingLab, {}) },
  { name: 'capacitor-leak', element: h(CapacitorLeakLab, {}) },
  { name: 'diode', element: h(DiodeLab, {}) },
  { name: 'transistor', element: h(TransistorLab, {}) },
  { name: 'cmos-inverter', element: h(CmosInverterLab, {}) },
  { name: 'cmos-nand', element: h(CmosNandLab, {}) },
  { name: 'cmos-nor', element: h(CmosNorLab, {}) },
  { name: 'rnmos-not', element: h(RNmosNotLab, {}) },
  { name: 'brownout', element: h(BrownoutLab, {}) },
  { name: 'ac-dc', element: h(AcDcLab, {}) },
  // semiconductor "inside the device" labs
  { name: 'mosfet-inside-nmos', element: h(MosfetInsideLab, {}) },
  { name: 'mosfet-inside-pmos', element: h(MosfetInsideLab, { pmos: true }) },
  { name: 'pn-junction', element: h(PnJunctionLab, {}) },
  { name: 'bjt-inside', element: h(BjtInsideLab, {}) },
  { name: 'silicon-lattice', element: h(SiliconLatticeLab, {}) },
  { name: 'conduction', element: h(ConductionLab, {}) },
  { name: 'hall-effect', element: h(HallEffectLab, {}) },

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

  // ── exam practice ──
  // Rendered with the block's own default question, so the scene is exactly what an author
  // sees the moment they insert it.
  { name: 'exam-question', element: h(ExamQuestion, { reference: '9702 Paper 2, question 1' }) },

  // The S-curve at its default reading, the median, which is the one a paper asks for first.
  { name: 'ogive', element: h(OgiveLab, {}) },

  // Opens on the WRONG rendering, height = frequency, because that is the belief the lab has
  // to displace; a snapshot of the correct picture alone would look like an ordinary histogram.
  { name: 'frequency-density', element: h(FrequencyDensity, {}) },
  // The same data under the correct rule, so the pair can be compared in the gallery.
  { name: 'frequency-density-correct', element: h(FrequencyDensity, { startMode: 'density' }) },

  // The same lab either side of v = u. The pair is the point: one scene can land directly
  // opposite, the other cannot at any heading, and the difference has to be legible.
  { name: 'river-boat-boat-wins', element: h(RiverBoat, { boatSpeed: 4, current: 2, riverWidth: 8 }) },
  { name: 'river-boat-current-wins', element: h(RiverBoat, { boatSpeed: 2, current: 5, riverWidth: 8 }) },

  // ── biology ──
  { name: 'enzyme-rate', element: h(EnzymeRateLab, {}) },
  { name: 'photosynthesis-factors', element: h(PhotosynthesisFactorsLab, {}) },
  { name: 'respiration', element: h(RespirationLab, {}) },
  { name: 'punnett-cross', element: h(PunnettCrossLab, { predictFirst: false }) },
  {
    name: 'genetic-cross-blood',
    element: h(GeneticCrossLab, {
      spec: BLOOD_TYPE_SPEC,
      parent1: ['A', 'O'],
      parent2: ['B', 'O'],
      predictFirst: false,
      title: 'Blood groups (A0 × B0)',
    }),
  },
  {
    name: 'genetic-cross-dihybrid',
    element: h(GeneticCrossLab, {
      loci: DIHYBRID_LOCI,
      predictFirst: false,
      title: 'Dihybrid (AaBb × AaBb)',
    }),
  },
  { name: 'sex-linked-cross', element: h(SexLinkedCrossLab, { predictFirst: false }) },
  { name: 'sequence-replication', element: h(SequenceLab, { kind: 'replication' }) },
  { name: 'sequence-translation', element: h(SequenceLab, { kind: 'translation' }) },
  { name: 'central-dogma', element: h(CentralDogmaLab, {}) },

  // ── geography (cycle engine) ──
  {
    name: 'cycle-water',
    element: h(CycleLab, {
      nodes: WATER_CYCLE.nodes,
      edges: WATER_CYCLE.edges,
      challenge: 'label-process',
      title: 'Water cycle',
    }),
  },
  {
    name: 'cycle-rock',
    element: h(CycleLab, {
      nodes: ROCK_CYCLE.nodes,
      edges: ROCK_CYCLE.edges,
      challenge: 'trace',
      title: 'Rock cycle',
    }),
  },
  {
    name: 'cycle-carbon',
    element: h(CycleLab, {
      nodes: CARBON_CYCLE.nodes,
      edges: CARBON_CYCLE.edges,
      challenge: 'trace',
      title: 'Carbon cycle',
    }),
  },

  // ── statistics & sequences ──
  { name: 'center-spread', element: h(CenterSpreadLab, {}) },
  { name: 'normal-area', element: h(NormalDistributionLab, { mu: 0, sigma: 1, a: -1, b: 1, mode: 'area' }) },
  { name: 'normal-rule', element: h(NormalDistributionLab, { mode: 'rule', title: '68-95-99.7' }) },
  { name: 'z-table', element: h(ZTableLab, { x: 650, mu: 500, sigma: 100, title: 'z-table lookup' }) },
  {
    name: 'center-spread-challenge',
    element: h(CenterSpreadLab, {
      data: [1, 2, 4, 4, 9],
      challenge: { stat: 'mean', target: 4 },
      title: 'Drag the balance point to the mean',
    }),
  },
  {
    name: 'sequence-arithmetic',
    element: h(SeqSeriesLab, { kind: 'arithmetic', first: 2, step: 3, count: 8, title: 'Arithmetic series' }),
  },
  {
    name: 'sequence-geometric',
    element: h(SeqSeriesLab, {
      kind: 'geometric',
      first: 1,
      step: 0.5,
      count: 8,
      title: 'Geometric series (convergence)',
    }),
  },
];
