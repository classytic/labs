// @classytic/labs/math — interactive math labs.

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
// On stage's <CanvasLayer> (zero-dep raw Canvas2D) — a genuine high-element heatmap:
export { GradientDescent, type GradientDescentProps } from './gradient-descent.js';

// ── interactive-problem engine: a creator authors a config, the engine plots,
//    derives (roots/intersections/tangent/normal/area), and checks the answer ──
export { InteractiveProblem, type InteractiveProblemProps, type ProblemParam, type ProblemEquation, type Derived, type ProblemAsk } from './interactive/index.js';
export { TriangleTrig, type TriangleTrigProps } from './triangle-trig/index.js';
export { roots, intersections, tangentAt, normalAt, integrate, areaBetween, type Fn1, type Line } from '../kit/expr-analysis.js';
export { checkAnswer, checkNumber, checkExpression, parseValue, type AnswerSpec, type ExprCheckOpts } from '../kit/answer-check.js';

// ── math/ is fully migrated to @classytic/stage (SVG + CanvasLayer). No canvas legacy. ──
