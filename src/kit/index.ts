// @classytic/labs/kit, the lesson-authoring toolkit. The learner-facing pieces a
// host composes into a guided lesson around the lab widgets: predict-first
// challenges, checkpoints that report into the step/learner seam, progressive
// hints, objectives, the reveal escape-hatch, the in-lab stepper, and the shared
// frame/callout chrome. (Stage owns the cross-block StepProgress runtime; this is
// the pedagogy layer over it.)

export {
  useCheckpoint, useHints, Objectives, HintLadder, useChallenge, ChallengeCard, Feedback, RevealSolution,
  type CheckpointArgs, type Hints, type ChallengeChoice, type ChallengeQuestion, type ChallengeState, type RevealSolutionProps,
} from './pedagogy.js';
export { useSteps, StepNav, type Steps } from './steps.js';
export { LabFrame, ControlBar, Field, Callout, type ControlConfig } from './frame.js';
export { usePlayGate, PlayWrap, type PlayGate } from './play.js';

// ── the concept engine: turn a bare formula into a smart, authorable rule ──────
//   calc()    : build a worked calculation that SHOWS its working (LaTeX steps)
//   RuleCard  : formula + analogy + live calculator + derivation + tricks, as data
export { calc, Calc, texNum, type CalcStep, type Worked } from './calc.js';
export { RuleCard, RuleLab, WorkedSteps, type RuleDef, type RuleInput } from './rule.js';

// ── concrete ↔ abstract building blocks (compose your own data→rule labs) ──────
//   PredictPlot : given data points + a draggable ghost the learner plots
//   Vessel      : a beaker whose liquid level binds to a value (the physical twin)
//   DotCluster  : N items packed in a dish, the crowd you watch grow
//   SlotFill    : tap number/word tiles into blanks (self-grading answer tray)
export { PredictPlot, type PredictPlotProps } from './predict.js';
export { Vessel, VesselGlyph, type VesselProps, type VesselGlyphProps, type GuessTone } from './vessel.js';
export { DotCluster, type DotClusterProps } from './cluster.js';
export { SlotFill, useSlotFill, Blank, SlotTray, type FillSlot, type SlotFillProps, type SlotFillState } from './slot-fill.js';
export { ReceiptScene, type ReceiptItem, type ReceiptSceneProps } from './receipt.js';
export { ClueScene, ClueTiles, ClueReceipt, ClueBalance, ClueBar, ClueCoins, UnknownChip, clueTotal, registerClueScene, getClueScene, listClueScenes, type Unknown, type Clue, type ClueSceneKind, type ClueSceneMeta } from './clue-scene.js';
// open registry of universal "concrete twin" scenes (vessel/tank/bar/battery/jar/pie/balloon/thermometer/cluster/grid/coins/blocks); add your own with registerScene
export { registerScene, getScene, listScenes, type QuantityScene, type QuantityInput, type SceneMeta } from './scenes.js';
// no-code path: build + register a scene from a small data spec (an emoji or a shape)
export { dataScene, registerDataScene, type DataSceneSpec } from './data-scene.js';
// the no-code authoring form for a data scene (CMS-ready)
export { SceneStudio, type SceneStudioProps } from './scene-studio.js';
// project scene library: persist + bulk-register saved skins, with a polished manager UI
export { SceneLibraryManager, useSceneLibrary, registerScenes, loadSceneLibrary, saveSceneLibrary, type SceneLibrary } from './scene-library.js';
