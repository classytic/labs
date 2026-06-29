// @classytic/labs/math, interactive math labs.

// ── On the @classytic/stage engine (SVG, accessible, SceneDoc-portable) ──────
export { Grapher, type GrapherProps, type GraphEquation, type GraphParam } from './grapher/index.js';
export { DerivativeExplorer, type DerivativeExplorerProps } from './derivative-explorer/index.js';
export { IntegralExplorer, type IntegralExplorerProps } from './integral-explorer/index.js';
export { LimitExplorer, type LimitExplorerProps } from './limit-explorer/index.js';
export { LinearSystemLab, type LinearSystemProps, type SystemLine } from './linear-system/index.js';
export { NumberLineLab, type NumberLineProps } from './number-line/index.js';
export { areaModelDoc, AreaModelLab, AREA_MODEL_ASSET, type AreaModelProps } from './area-model/index.js';
export { growingPatternDoc, GrowingPatternLab, PATTERN_FIGURE_ASSET, type GrowingPatternProps } from './pattern/index.js';
export { mysteryBucketDoc, MysteryBucketLab, MYSTERY_BUCKET_ASSET, type MysteryBucketProps } from './mystery-bucket/index.js';
export { balanceAlgebraDoc, BalanceAlgebraLab, BALANCE_ALGEBRA_ASSET, type BalanceEquation, type BalanceAlgebraProps } from './balance-algebra/index.js';
export { VertexParabolaLab, type ParabolaProps } from './parabola/index.js';
export { HarmonicFormLab, type HarmonicFormProps } from './harmonic-form/index.js';
export { FunctionMachineLab, type FunctionMachineProps } from './function-machine/index.js';
export { TrigExplorer, TRIG_FNS, type TrigFn } from './trig-explorer.js';
export { Derivation, type DerivationProps, type DerivationStep } from './derivation.js';
// On stage's <CanvasLayer> (zero-dep raw Canvas2D), a genuine high-element heatmap:
export { GradientDescent, type GradientDescentProps } from './gradient-descent.js';

// ── interactive-problem engine: a creator authors a config, the engine plots,
//    derives (roots/intersections/tangent/normal/area), and checks the answer ──
export { InteractiveProblem, type InteractiveProblemProps, type ProblemParam, type ProblemEquation, type Derived, type ProblemAsk } from './interactive/index.js';
export { TriangleTrig, type TriangleTrigProps } from './triangle-trig/index.js';
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
export { ComplexPlaneLab, type ComplexPlaneProps, type ComplexMode, complex, type Complex, COMPLEX_RULES } from './complex/index.js';
// trigonometry: the unit-circle signs (CAST) lab + the trig teaching kernel (as `trig`)
export { TrigSignsLab, type TrigSignsProps, trig, TRIG_RULES } from './trig/index.js';
// authorable fraction (part-whole + equivalent + fraction-of-quantity) and ratio (share-in-ratio) engines
export { FractionBarLab, type FractionBarProps } from './fraction-bar/index.js';
export { RatioShareLab, type RatioShareProps } from './ratio-share/index.js';

// ── transformations (translate/reflect/rotate/enlarge) + worded-totals scene ──
export { TransformLab, applyTf, type TransformProps, type Transform, type TransformKind, type ReflectAxis } from './transform/index.js';
export { ReceiptLab, type ReceiptProps } from './receipt/index.js';
// systems of equations by elimination, with a swappable concrete scene (receipt/balance/tiles)
export { SystemSolveLab, type SystemSolveProps } from './system-solve/index.js';

// ── coordinate-geometry kit (shared by straight-line / circle / conic labs) ──
export {
  CoordPlane, GradientTriangle, lineThrough, lineFrom, parallelThrough, perpThrough,
  intersectLines, distance, midpoint, lineTex, interceptTex, circleTex, circleExpandedTex,
  snapTo, snapPoint, num, type Lin, type CoordPlaneProps,
} from '../kit/coords.js';
export { roots, intersections, tangentAt, normalAt, integrate, areaBetween, type Fn1, type Line } from '../kit/expr-analysis.js';
export { solvePoly, polyCoeffs, solutionTex, type PolySolution } from '../kit/solve.js';
// canonical polynomial engine: any-degree roots (Durand–Kerner) + factored form,
// plus the step-by-step factor/solve TOOL (school method, client-side, no CAS dep)
export { solveEquation, factorTex, factorSteps, solveSteps, PolynomialSolverLab, poly, type PolyRoots, type PolynomialSolverProps } from './poly/index.js';
export { checkAnswer, checkNumber, checkExpression, parseValue, type AnswerSpec, type ExprCheckOpts } from '../kit/answer-check.js';

// ── math/ is fully migrated to @classytic/stage (SVG + CanvasLayer). No canvas legacy. ──
