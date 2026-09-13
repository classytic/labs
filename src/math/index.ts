// @classytic/labs/math, interactive math labs.

// ── On the @classytic/stage engine (SVG, accessible, SceneDoc-portable) ──────
export { Grapher, type GrapherProps, type GraphEquation, type GraphParam } from './grapher/index.js';
export { DerivativeExplorer, type DerivativeExplorerProps } from './derivative-explorer/index.js';
export { IntegralExplorer, type IntegralExplorerProps } from './integral-explorer/index.js';
export { LimitExplorer, type LimitExplorerProps } from './limit-explorer/index.js';
export {
  FundamentalTheoremExplorer,
  type FundamentalTheoremExplorerProps,
} from './fundamental-theorem/index.js';
export {
  accumulationAt,
  derivativeAt as calculusDerivativeAt,
  functionViewport,
  normalizeRange as normalizeCalculusRange,
  riemannEstimate,
  riemannSlices,
  secantSlope as calculusSecantSlope,
  type RiemannMode,
  type RiemannSlice,
} from './calculus/index.js';
export { LinearSystemLab, type LinearSystemProps, type SystemLine } from './linear-system/index.js';
export { NumberLineLab, type NumberLineProps } from './number-line/index.js';
export { areaModelDoc, AreaModelLab, AREA_MODEL_ASSET, type AreaModelProps } from './area-model/index.js';
export {
  growingPatternDoc,
  GrowingPatternLab,
  PATTERN_FIGURE_ASSET,
  type GrowingPatternProps,
} from './pattern/index.js';
export {
  mysteryBucketDoc,
  MysteryBucketLab,
  MYSTERY_BUCKET_ASSET,
  type MysteryBucketProps,
} from './mystery-bucket/index.js';
export {
  balanceAlgebraDoc,
  BalanceAlgebraLab,
  BALANCE_ALGEBRA_ASSET,
  type BalanceEquation,
  type BalanceAlgebraProps,
} from './balance-algebra/index.js';
export { VertexParabolaLab, type ParabolaProps } from './parabola/index.js';
export { HarmonicFormLab, type HarmonicFormProps } from './harmonic-form/index.js';
export { FunctionMachineLab, type FunctionMachineProps } from './function-machine/index.js';
export { TrigExplorer, TRIG_FNS, type TrigFn } from './trig-explorer.js';
export { Derivation, type DerivationProps, type DerivationStep } from './derivation.js';
// On stage's <CanvasLayer> (zero-dep raw Canvas2D), a genuine high-element heatmap:
export { GradientDescent, type GradientDescentProps } from './gradient-descent.js';
export { NewtonMethodExplorer, type NewtonMethodExplorerProps } from './newton-method/index.js';
export { TaylorSeriesExplorer, type TaylorSeriesExplorerProps } from './taylor-series/index.js';
export {
  DifferentialEquationExplorer,
  type DifferentialEquationExplorerProps,
} from './differential-equation/index.js';
export { PhasePortraitExplorer, type PhasePortraitExplorerProps } from './phase-portrait/index.js';
export {
  interpolateSolution,
  odeStep,
  solveOde,
  phaseStep,
  solvePhaseSystem,
  type OdeMethod,
  type OdePoint,
  type OdeSolution,
  type PhaseDerivative,
  type PhaseField,
  type PhasePoint,
  type PhaseSolution,
} from './ode/index.js';
export { evaluateTaylor, factorial, maxApproximationError, taylorCoefficients } from './taylor/index.js';
export { newtonStep, newtonTrace, type NewtonIteration, type NewtonState } from './root-finding/index.js';
export {
  descentTrace,
  gradientStep,
  type DescentState,
  type GradientModel,
  type GradientPoint,
  type GradientStepResult,
} from './optimization/index.js';

// ── interactive-problem engine: a creator authors a config, the engine plots,
//    derives (roots/intersections/tangent/normal/area), and checks the answer ──
export {
  InteractiveProblem,
  type InteractiveProblemProps,
  type ProblemParam,
  type ProblemEquation,
  type Derived,
  type ProblemAsk,
} from './interactive/index.js';
export { TriangleTrig, type TriangleTrigProps } from './triangle-trig/index.js';
export {
  ObliqueTriangle,
  ambiguityNote,
  areaFrom,
  ruleFor,
  solveAAS,
  solveSAS,
  solveSSA,
  solveSSS,
  triangleProblems,
  type GivenCase,
  type ObliqueTriangleProps,
  type RuleChoice,
  type Triangle,
} from './oblique-triangle/index.js';
export {
  BearingsLab,
  backBearing,
  bearingBetween,
  bearingProblems,
  formatBearing,
  journey,
  legEnd,
  resultant,
  turnAngle,
  type BearingsProps,
  type Leg,
  type Resultant,
} from './bearings/index.js';
export {
  IdentityProof,
  DEFAULT_MOVES,
  DEFAULT_PROOF,
  isComplete,
  judge,
  menuFor,
  proofProblems,
  workingAfter,
  type Detour,
  type IdentityProofProps,
  type Move,
  type Proof,
  type ProofStep,
  type Verdict,
} from './identity-proof/index.js';
export {
  PartialFractions,
  denominator,
  formOf,
  maxDisagreement,
  partialFractionProblems,
  solveParts,
  termTex,
  type Factor,
  type FormOption,
  type PartialFractionsProps,
  type Term,
} from './partial-fractions/index.js';
export {
  IterationLab,
  cobweb,
  gradientAt,
  iterationProblems,
  run as runIteration,
  signChange,
  verdict,
  type IterationProps,
  type Outcome,
  type Rearrangement,
  type Run,
  type Step,
  // `Verdict` is already taken by identity-proof, which judges a chosen MOVE. This one judges
  // whether a rearrangement converges, so the two are unrelated despite the shared word.
  type Verdict as IterationVerdict,
} from './iteration/index.js';
// Only the names that cannot collide leave the barrel. The vector helpers (add, dot, norm and so
// on) are generic enough that another lab will want the same names, so they stay reachable from
// './lines-in-space/index.js' instead of claiming them here.
export {
  LinesInSpaceLab,
  relate as relateLines,
  footOfPerpendicular,
  lineProblems as spaceLineProblems,
  type LinesInSpaceProps,
  type LinesMode,
  type Line3,
  type LinePair,
  type Relation as LineRelation,
} from './lines-in-space/index.js';
export { BrokenTreeLab, type BrokenTreeProps } from './broken-tree/index.js';
export { StraightLineLab, type StraightLineProps, type StraightLineMode } from './straight-line/index.js';
export { CircleLab, type CircleProps } from './circle/index.js';
export { ConicLab, type ConicProps, type ConicKind } from './conic/index.js';
export { DomainRangeLab, type DomainRangeProps } from './domain-range/index.js';

// ── concrete → graph family: see a quantity, plot/predict the rule ──────────────
//    LinearModelLab  : marbles raise water → drag the point (proportion/rate)
//    SequencePredict : a crowd that doubles → tap-fill the next terms (geometric/arithmetic)
export { LinearModelLab, type LinearModelProps } from './linear-model/index.js';
// count-driven sibling: drag the input, objects drop in and the quantity scales live
export { RateMachineLab, type RateMachineProps } from './rate-machine/index.js';
export { SequencePredict, type SequencePredictProps, type SequenceRule } from './sequence-predict/index.js';
// authorable percentage manipulative (one bar engine, many analogies)
export { PercentBarLab, type PercentBarProps, type PercentSegment } from './percent-bar/index.js';
// complex numbers: the Argand-plane lab + the pure complex kernel (as `complex`)
export {
  ComplexPlaneLab,
  type ComplexPlaneProps,
  type ComplexMode,
  complex,
  type Complex,
  COMPLEX_RULES,
  I_POWER_RULE,
  MODULUS_RULE,
  DE_MOIVRE_RULE,
  OMEGA_RULE,
  explainModulus,
  explainIPow,
  explainDeMoivre,
} from './complex/index.js';
// trigonometry: the unit-circle signs (CAST) lab + the trig teaching kernel (as `trig`)
export { TrigSignsLab, type TrigSignsProps, trig, TRIG_RULES } from './trig/index.js';
// authorable fraction (part-whole + equivalent + fraction-of-quantity) and ratio (share-in-ratio) engines
export { FractionBarLab, type FractionBarProps } from './fraction-bar/index.js';
export { RatioShareLab, type RatioShareProps } from './ratio-share/index.js';

// ── transformations (translate/reflect/rotate/enlarge) + worded-totals scene ──
export {
  TransformLab,
  applyTf,
  type TransformProps,
  type Transform,
  type TransformKind,
  type ReflectAxis,
} from './transform/index.js';
export { ReceiptLab, type ReceiptProps } from './receipt/index.js';
// systems of equations by elimination, with a swappable concrete scene (receipt/balance/tiles)
export { SystemSolveLab, type SystemSolveProps } from './system-solve/index.js';

// ── coordinate-geometry kit (shared by straight-line / circle / conic labs) ──
export {
  CoordPlane,
  GradientTriangle,
  lineThrough,
  lineFrom,
  parallelThrough,
  perpThrough,
  intersectLines,
  distance,
  midpoint,
  lineTex,
  interceptTex,
  circleTex,
  circleExpandedTex,
  snapTo,
  snapPoint,
  num,
  type Lin,
  type CoordPlaneProps,
} from '../kit/coords.js';
export {
  roots,
  intersections,
  tangentAt,
  normalAt,
  integrate,
  areaBetween,
  type Fn1,
  type Line,
} from '../kit/expr-analysis.js';
export { solvePoly, polyCoeffs, solutionTex, type PolySolution } from '../kit/solve.js';
// canonical polynomial engine: any-degree roots (Durand–Kerner) + factored form,
// plus the step-by-step factor/solve TOOL (school method, client-side, no CAS dep)
export {
  solveEquation,
  factorTex,
  factorSteps,
  solveSteps,
  PolynomialSolverLab,
  poly,
  type PolyRoots,
  type PolynomialSolverProps,
} from './poly/index.js';
export {
  checkAnswer,
  checkNumber,
  checkExpression,
  parseValue,
  type AnswerSpec,
  type ExprCheckOpts,
} from '../kit/answer-check.js';

// ── math/ is fully migrated to @classytic/stage (SVG + CanvasLayer). No canvas legacy. ──
export {
  MeasurementLab,
  measurementState,
  MEASUREMENT_MODES,
  type MeasurementMode,
  type MeasurementState,
  type MeasurementLabProps,
} from './measurement/index.js';
export {
  GeometryFoundationsLab,
  geometryFoundationState,
  GEOMETRY_FOUNDATION_MODES,
  type GeometryFoundationMode,
  type GeometryFoundationState,
  type GeometryFoundationsLabProps,
} from './geometry-foundations/index.js';
export {
  SolidNetLab,
  solidPieces,
  readout as solidReadout,
  type SolidNetProps,
  type SolidMode,
} from './solid-net/index.js';
export {
  AreaRearrangeLab,
  rearrange,
  areaOf as rearrangedAreaOf,
  type AreaRearrangeProps,
  type RearrangeMode,
} from './area-rearrange/index.js';
export {
  SlideRuleLab,
  alignFor,
  isAligned,
  logOffset,
  productOf,
  readingAt,
  snapOffset,
  valueAt as slideRuleValueAt,
  type SlideRuleProps,
  type Product as SlideRuleProduct,
} from './slide-rule/index.js';
export {
  RadianWrapLab,
  bands as radianBands,
  radianReadout,
  wholeRadii,
  TAU,
  DEG_PER_RAD,
  type RadianWrapProps,
  type Band as RadianBand,
} from './radian-wrap/index.js';
