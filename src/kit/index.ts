// @classytic/labs/kit, the lesson-authoring toolkit. The learner-facing pieces a
// host composes into a guided lesson around the lab widgets: predict-first
// challenges, checkpoints that report into the step/learner seam, progressive
// hints, objectives, the reveal escape-hatch, the in-lab stepper, and the shared
// frame/callout chrome. (Stage owns the cross-block StepProgress runtime; this is
// the pedagogy layer over it.)

export {
  useCheckpoint,
  useHints,
  Objectives,
  HintLadder,
  useChallenge,
  ChallengeCard,
  Feedback,
  RevealSolution,
  type CheckpointArgs,
  type Hints,
  type ChallengeChoice,
  type ChallengeQuestion,
  type ChallengeState,
  type RevealSolutionProps,
} from './pedagogy.js';
export { Celebrate, SolvedPill } from './celebrate.js';
export { PredictGate, type PredictGateProps } from './predict-gate.js';
export { useSteps, StepNav, type Steps } from './steps.js';
// guided-lesson engine as a primitive: authors craft the step arc as DATA (lead /
// reveal layers / ask / controls); the lab just reads guide.shows()/showControls/activeAsk
export { useGuide, GuideNav, type GuideStep, type Guide } from './guide.js';
export {
  useLearningSequence,
  LearningSequenceNav,
  type LearningPhase,
  type LearningGate,
  type LearningBranch,
  type LearningSequenceStep,
  type LearningSequence,
} from './learning-sequence.js';
export {
  activitySteps,
  compileAuthoredActivity,
  withAuthoredObjectives,
  defineAuthoredActivity,
  isCompiledAuthoredActivity,
  type ActivityPattern,
  type SuccessOperator,
  type AuthoredChoice,
  type AuthoredQuestion,
  type AuthoredChoiceQuestion,
  type AuthoredNumericQuestion,
  type AuthoredTextQuestion,
  type AuthoredOrderingQuestion,
  type AuthoredReflectionQuestion,
  type AuthoredSuccessCondition,
  type AuthoredDataset,
  type AuthoredActivityStep,
  type AuthoredTransferCase,
  type AuthoredActivity,
  type CompiledAuthoredActivity,
} from './activity-authoring.js';
export {
  AuthoredResponse,
  evaluateAuthoredResponse,
  type AuthoredResponseValue,
  type AuthoredResponseResult,
} from './authored-response.js';
export {
  AuthoredActivityRuntime,
  AuthoredMetricGate,
  type AuthoredActivityRuntimeProps,
  type AuthoredActivityContext,
} from './authored-activity-runtime.js';
export { Field, Readout, Stat, StatList, type ControlConfig } from './frame.js';
export { Activity, type ActivityRootProps } from './activity.js';
export { usePlayGate, PlayWrap, type PlayGate } from './play.js';

// ── the concept engine: turn a bare formula into a smart, authorable rule ──────
//   calc()    : build a worked calculation that SHOWS its working (LaTeX steps)
//   RuleCard  : formula + analogy + live calculator + derivation + tricks, as data
export { calc, Calc, texNum, type CalcStep, type Worked } from './calc.js';
export { RuleCard, RuleLab, RuleFigure, WorkedSteps, type RuleDef, type RuleInput } from './rule.js';

// ── the figure kit: one visual language for every hand-drawn scene (see styles/figure.css) ──
export * from './figure/index.js';

// ── concrete ↔ abstract building blocks (compose your own data→rule labs) ──────
//   PredictPlot : given data points + a draggable ghost the learner plots
//   Vessel      : a beaker whose liquid level binds to a value (the physical twin)
//   DotCluster  : N items packed in a dish, the crowd you watch grow
//   SlotFill    : tap number/word tiles into blanks (self-grading answer tray)
export { PredictPlot, type PredictPlotProps } from './predict.js';
export { Vessel, VesselGlyph, type VesselProps, type VesselGlyphProps, type GuessTone } from './vessel.js';
export { DotCluster, type DotClusterProps } from './cluster.js';
export {
  DiceGlyph,
  CoinGlyph,
  ProbabilityContributionBoard,
  type ProbabilityBoardOutcome,
} from './probability.js';
export {
  SlotFill,
  useSlotFill,
  Blank,
  SlotTray,
  type FillSlot,
  type SlotFillProps,
  type SlotFillState,
} from './slot-fill.js';
export { ReceiptScene, type ReceiptItem, type ReceiptSceneProps } from './receipt.js';
// finance / ops visual primitives (compose your own cost/stock scenarios)
//   ApportionBar  : split a pool by a weight (cost by area/hours/headcount, profit by capital)
//   StockTimeline : a level-vs-time chart with guide lines (the reorder sawtooth & kin)
//   TradeoffCurve : two opposing costs → U-shaped total with the sweet-spot minimum (EOQ)
export {
  PlotChart,
  ApportionBar,
  StockTimeline,
  TradeoffCurve,
  type PlotChartProps,
  type PlotGuide,
  type PlotLegendItem,
  type PlotGeom,
  type ApportionSegment,
  type ApportionBarProps,
  type StockGuide,
  type StockTimelineProps,
  type TradeoffCurveProps,
} from './finance-viz/index.js';
export {
  ClueScene,
  ClueTiles,
  ClueReceipt,
  ClueBalance,
  ClueBar,
  ClueCoins,
  UnknownChip,
  clueTotal,
  registerClueScene,
  getClueScene,
  listClueScenes,
  type Unknown,
  type Clue,
  type ClueSceneKind,
  type ClueSceneMeta,
} from './clue-scene.js';
// open registry of universal "concrete twin" scenes (vessel/tank/bar/battery/jar/pie/balloon/thermometer/cluster/grid/coins/blocks); add your own with registerScene
export {
  registerScene,
  getScene,
  listScenes,
  type QuantityScene,
  type QuantityInput,
  type SceneMeta,
} from './scenes.js';
// no-code path: build + register a scene from a small data spec (an emoji or a shape)
export { dataScene, registerDataScene, type DataSceneSpec } from './data-scene.js';
// the no-code authoring form for a data scene (CMS-ready)
export { SceneStudio, type SceneStudioProps } from './scene-studio.js';
// project scene library: persist + bulk-register saved skins, with a polished manager UI
export {
  SceneLibraryManager,
  useSceneLibrary,
  registerScenes,
  loadSceneLibrary,
  saveSceneLibrary,
  type SceneLibrary,
} from './scene-library.js';
