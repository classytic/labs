import { EnzymeRateLab } from "../biology/enzyme-rate/preset.mjs";
import { PhotosynthesisFactorsLab } from "../biology/photosynthesis-factors/preset.mjs";
import { PunnettCrossLab } from "../biology/punnett-cross/preset.mjs";
import { RespirationLab } from "../biology/respiration/preset.mjs";
import { GeneticCrossLab } from "../biology/genetic-cross/preset.mjs";
import { SexLinkedCrossLab } from "../biology/genetic-cross/sex-linked.mjs";
import { SequenceLab } from "../biology/sequence/preset.mjs";
import { CentralDogmaLab } from "../biology/sequence/central-dogma.mjs";
import { EquationBalanceLab } from "../commerce/accounting/equation-balance.mjs";
import { JournalPosterLab } from "../commerce/accounting/journal-poster.mjs";
import { StatementSorterLab } from "../commerce/accounting/statement-sorter.mjs";
import { MarketEquilibriumLab } from "../commerce/economics/market-equilibrium.mjs";
import { ElasticityRevenueLab } from "../commerce/economics/elasticity-revenue.mjs";
import { DemandShiftVsMoveLab } from "../commerce/economics/demand-shift-vs-move.mjs";
import { EquationBalanceBlock, JournalPosterBlock, StatementSorterBlock, accountingBlocks, accountingComponents } from "./accounting.mjs";
import { CentralDogmaBlock, EnzymeRateBlock, GeneticCrossBlock, PhotosynthesisFactorsBlock, PunnettCrossBlock, RespirationBlock, SequenceBlock, SexLinkedCrossBlock, biologyBlocks, biologyComponents } from "./biology.mjs";
import { LabBlock } from "./lab-block.mjs";
import { GasBoxLab } from "../chem/gas-box/preset.mjs";
import { SolutionBoxLab } from "../chem/solution/solution-box.mjs";
import { DilutionLab } from "../chem/solution/dilution.mjs";
import { BohrAtom } from "../chem/bohr-atom.mjs";
import { ReactionProfile } from "../chem/reaction-profile.mjs";
import { ReactionLab } from "../chem/reaction-lab.mjs";
import { Battery } from "../chem/battery.mjs";
import { LeChatelierLab } from "../chem/equilibrium/preset.mjs";
import { TitrationLab } from "../chem/titration/preset.mjs";
import { ElectrochemLab } from "../chem/electrochem/preset.mjs";
import { KineticsLab } from "../chem/kinetics/preset.mjs";
import { StoichiometryLab } from "../chem/stoichiometry/preset.mjs";
import { PeriodicTrendsLab } from "../chem/periodic-trends/preset.mjs";
import { BatteryBlock, BohrAtomBlock, DilutionBlock, ElectrochemBlock, GasBoxBlock, KineticsBlock, LeChatelierBlock, PeriodicTrendsBlock, ReactionLabBlock, ReactionProfileBlock, SolutionBoxBlock, StoichiometryBlock, TitrationBlock, chemBlocks, chemComponents } from "./chem.mjs";
import { CircuitLab } from "../circuits/circuit-lab.mjs";
import { CircuitBuilder } from "../circuits/circuit-builder.mjs";
import { CapacitorLeakLab } from "../circuits/capacitor-leak/preset.mjs";
import { RCChargingLab } from "../circuits/rc-charging/preset.mjs";
import { DiodeLab } from "../circuits/diode/preset.mjs";
import { TransistorLab } from "../circuits/transistor/preset.mjs";
import { CmosInverterLab, CmosNandLab, CmosNorLab, RNmosNotLab } from "../circuits/cmos-gate/preset.mjs";
import { BrownoutLab } from "../circuits/brownout/preset.mjs";
import { BjtInsideLab, ConductionLab, HallEffectLab, MosfetInsideLab, PnJunctionLab, SiliconLatticeLab } from "../circuits/semiconductor/preset.mjs";
import { BjtInsideBlock, BrownoutBlock, CapacitorLeakBlock, CircuitBlock, CircuitBuilderBlock, CircuitLabBlock, CircuitPuzzle, CircuitSceneBlock, CircuitSceneView, CmosInverterBlock, CmosNandBlock, CmosNorBlock, ConductionBlock, DiodeBlock, HallEffectBlock, MosfetInsideBlock, PnJunctionBlock, RCChargingBlock, RNmosNotBlock, SiliconLatticeBlock, TransistorBlock, circuitsBlocks, circuitsComponents } from "./circuits.mjs";
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
import { ArrangementsBlock, BayesBlock, BinomialBlock, BooleanCircuitBlock, CombinationStudioBlock, CountingSlotsBlock, CountingTreeBlock, ExpectedValueBlock, HypergeometricBlock, KarnaughBlock, LawOfLargeNumbersBlock, MonteCarloBlock, MontyHallBlock, OutcomeBuilderBlock, PascalBlock, RuleCardBlock, SampleSpaceBlock, SelectionBlock, TruthTableBlock, VennBlock, discreteBlocks, discreteComponents } from "./discrete.mjs";
import { DemandShiftVsMoveBlock, ElasticityRevenueBlock, MarketEquilibriumBlock, economicsBlocks, economicsComponents } from "./economics.mjs";
import { CycleLab } from "../geography/cycle-lab/preset.mjs";
import { CycleBlock, geographyBlocks, geographyComponents } from "./geography.mjs";
import { GeometryBoard } from "../geometry/board/preset.mjs";
import { IntersectingCircles } from "../geometry/intersecting-circles.mjs";
import { GeometryBoardBlock, IntersectingCirclesBlock, geometryBlocks, geometryComponents } from "./geometry.mjs";
import { PlaceValueDialLab } from "../ict/number-systems/place-value-dial.mjs";
import { BitGrouperLab } from "../ict/number-systems/bit-grouper.mjs";
import { BaseOdometerLab } from "../ict/number-systems/base-odometer.mjs";
import { LogicGateLab } from "../logic/lab.mjs";
import { BinaryDisplayLab } from "../logic/display.mjs";
import { LogicBuildLab } from "../logic/LogicBuildLab.mjs";
import { BaseOdometerBlock, BinaryDisplayBlock, BitGrouperBlock, LogicBuilderBlock, LogicGateBlock, PlaceValueDialBlock, ictBlocks, ictComponents } from "./ict.mjs";
import { CenterSpreadLab } from "../statistics/center-spread/preset.mjs";
import { SequenceLab as SequenceLab$1 } from "../statistics/sequence/preset.mjs";
import { GaltonBoardLab } from "../statistics/galton/preset.mjs";
import { HistogramBoxLab } from "../statistics/histogram/preset.mjs";
import { NormalDistributionLab } from "../statistics/normal/preset.mjs";
import { ZTableLab } from "../statistics/z-table/preset.mjs";
import { SamplingDistributionLab } from "../statistics/sampling/preset.mjs";
import { RegressionLab } from "../ml/regression/preset.mjs";
import { KMeansLab } from "../ml/kmeans/preset.mjs";
import { ClassifierThresholdLab } from "../ml/classifier/preset.mjs";
import { DecisionBoundaryLab } from "../ml/boundary/preset.mjs";
import { KNNBoundaryLab } from "../ml/knn/preset.mjs";
import { Grapher } from "../math/grapher/preset.mjs";
import { DerivativeExplorer } from "../math/derivative-explorer/preset.mjs";
import { IntegralExplorer } from "../math/integral-explorer/preset.mjs";
import { LimitExplorer } from "../math/limit-explorer/preset.mjs";
import { NumberLineLab } from "../math/number-line/preset.mjs";
import { AreaModelLab } from "../math/area-model/preset.mjs";
import { GrowingPatternLab } from "../math/pattern/preset.mjs";
import { MysteryBucketLab } from "../math/mystery-bucket/preset.mjs";
import { BalanceAlgebraLab } from "../math/balance-algebra/preset.mjs";
import { VertexParabolaLab } from "../math/parabola/preset.mjs";
import { FunctionMachineLab } from "../math/function-machine/preset.mjs";
import { TrigExplorer } from "../math/trig-explorer.mjs";
import { Derivation } from "../math/derivation.mjs";
import { GradientDescent } from "../math/gradient-descent.mjs";
import { InteractiveProblem } from "../math/interactive/preset.mjs";
import { TriangleTrig } from "../math/triangle-trig/preset.mjs";
import { StraightLineLab } from "../math/straight-line/preset.mjs";
import { CircleLab } from "../math/circle/preset.mjs";
import { ConicLab } from "../math/conic/preset.mjs";
import { DomainRangeLab } from "../math/domain-range/preset.mjs";
import { LinearModelLab } from "../math/linear-model/preset.mjs";
import { RateMachineLab } from "../math/rate-machine/preset.mjs";
import { SequencePredict } from "../math/sequence-predict/preset.mjs";
import { PercentBarLab } from "../math/percent-bar/preset.mjs";
import { ComplexPlaneLab } from "../math/complex/preset.mjs";
import { TrigSignsLab } from "../math/trig/preset.mjs";
import { FractionBarLab } from "../math/fraction-bar/preset.mjs";
import { RatioShareLab } from "../math/ratio-share/preset.mjs";
import { TransformLab } from "../math/transform/preset.mjs";
import { ReceiptLab } from "../math/receipt/preset.mjs";
import { SystemSolveLab } from "../math/system-solve/preset.mjs";
import { PolynomialSolverLab } from "../math/poly/preset.mjs";
import { AreaModelBlock, BalanceAlgebraBlock, CircleBlock, ComplexPlaneBlock, ConicBlock, CustomSceneBlock, DerivationBlock, DerivativeExplorerBlock, DomainRangeBlock, FractionBarBlock, GeoTransformBlock, GradientDescentBlock, GraphBlock, GrowingPatternBlock, IntegralExplorerBlock, InteractiveProblemBlock, LimitExplorerBlock, LinearModelBlock, LinearSystemBlock, LinearSystemView, MysteryBucketBlock, NumberLineBlock, PercentBarBlock, PolynomialSolverBlock, RateMachineBlock, RatioShareBlock, ReceiptBlock, SequencePredictBlock, StraightLineBlock, SystemSolveBlock, TriangleTrigBlock, TrigExplorerBlock, TrigSignsBlock, VertexParabolaBlock, mathBlocks, mathComponents } from "./math.mjs";
import { VectorBoardView } from "../physics/vector-board/view.mjs";
import { OpticsLab } from "../physics/optics/preset.mjs";
import { ProjectileLab } from "../physics/projectile-lab.mjs";
import { GravityDrop } from "../physics/gravity-drop.mjs";
import { RiverBoat } from "../physics/river-boat.mjs";
import { VectorTypesLab } from "../physics/vector-types/preset.mjs";
import { RainRelativeLab } from "../physics/rain-relative/preset.mjs";
import { StoppingDistanceLab } from "../physics/stopping-distance/preset.mjs";
import { RampForcesLab } from "../physics/ramp-forces/preset.mjs";
import { CollisionTrackLab } from "../physics/collision-track/preset.mjs";
import { OrbitLab } from "../physics/orbit-lab.mjs";
import { AtwoodBlock, BulletWallsBlock, CarnotBlock, CircularMotionBlock, CollisionTrackBlock, DopplerBlock, EfficiencyBlock, ElectricFieldBlock, ElectricFluxBlock, EnergySkateBlock, EntropyBlock, GasProcessBlock, GaussLawBlock, GravitationBlock, GravityDropBlock, HeatTransferBlock, HeatingCurveBlock, ImpulseBlock, KeplerBlock, LeverBlock, LeverPuzzle, LorentzBlock, MagnetismBlock, OpticsBlock, OrbitLabBlock, ProjectileLabBlock, RainRelativeBlock, RampForcesBlock, RippleTankBlock, RiverBoatBlock, SimpleHarmonicBlock, StoppingDistanceBlock, StringReflectionBlock, TemperatureScalesBlock, TerminalVelocityBlock, ThermalExpansionBlock, VectorBoardBlock, VectorTypesBlock, WaterDensityBlock, WaveBlock, WorkEnergyBlock, WorkPotentialBlock, physicsBlocks, physicsComponents } from "./physics.mjs";
import { SentenceBuilderLab } from "../language/sentence-builder/preset.mjs";
import { WordMatchLab } from "../language/word-match/preset.mjs";
import { ArticleLensLab } from "../language/article-lens/preset.mjs";
import { AgreementLab } from "../language/agreement/preset.mjs";
import { TransformLab as TransformLab$1 } from "../language/transform/preset.mjs";
import { PrepositionSceneLab } from "../language/preposition-scene/preset.mjs";
import { PredictBlock, PredictWidget, lessonBlocks, lessonComponents } from "./lesson.mjs";
import { AgreementBlock, ArticleLensBlock, PrepositionBlock, SentenceBuilderBlock, TransformBlock, WordMatchBlock, languageBlocks, languageComponents } from "./language.mjs";
import { ClassifierThresholdBlock, DecisionBoundaryBlock, KMeansBlock, KnnBoundaryBlock, RegressionBlock, mlBlocks, mlComponents } from "./ml.mjs";
import { CenterSpreadBlock, GaltonBlock, HistogramBlock, NormalBlock, SamplingBlock, SeriesBlock, ZTableBlock, statisticsBlocks, statisticsComponents } from "./statistics.mjs";
import { LabConfig, LabConfigProps } from "./lab-config.mjs";
import { coerceArray } from "./authoring.mjs";
import { LabGallery, LabGalleryProps, LabPickItem } from "./lab-gallery.mjs";

//#region src/blocks/index.d.ts
/** Every lab block, pass to `<CmsBlockEditor blocks={labsBlocks}>` (slash menu). */
declare const labsBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  prompt: import("zod").ZodDefault<import("zod").ZodString>;
  choices: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
    label: import("zod").ZodString;
    correct: import("zod").ZodBoolean;
  }, import("zod/v4/core").$strip>>>;
  explain: import("zod").ZodOptional<import("zod").ZodString>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  tiles: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
    text: import("zod").ZodString;
    pos: import("zod").ZodOptional<import("zod").ZodEnum<{
      noun: "noun";
      verb: "verb";
      article: "article";
      adjective: "adjective";
      preposition: "preposition";
      pronoun: "pronoun";
      conjunction: "conjunction";
      adverb: "adverb";
      other: "other";
    }>>;
    gloss: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  promptDir: import("zod").ZodDefault<import("zod").ZodEnum<{
    ltr: "ltr";
    rtl: "rtl";
  }>>;
  targetDir: import("zod").ZodDefault<import("zod").ZodEnum<{
    ltr: "ltr";
    rtl: "rtl";
  }>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  deck: import("zod").ZodDefault<import("zod").ZodObject<{
    title: import("zod").ZodOptional<import("zod").ZodString>;
    termLang: import("zod").ZodString;
    transLang: import("zod").ZodString;
    items: import("zod").ZodArray<import("zod").ZodObject<{
      term: import("zod").ZodString;
      translation: import("zod").ZodString;
      transliteration: import("zod").ZodOptional<import("zod").ZodString>;
      audioUrl: import("zod").ZodOptional<import("zod").ZodString>;
      icon: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodObject<{
        kind: import("zod").ZodEnum<{
          emoji: "emoji";
          svg: "svg";
          image: "image";
        }>;
        id: import("zod").ZodOptional<import("zod").ZodString>;
        src: import("zod").ZodOptional<import("zod").ZodString>;
        alt: import("zod").ZodString;
      }, import("zod/v4/core").$strip>]>>;
      example: import("zod").ZodOptional<import("zod").ZodString>;
      tags: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    }, import("zod/v4/core").$strip>>;
  }, import("zod/v4/core").$strip>>;
  count: import("zod").ZodOptional<import("zod").ZodNumber>;
  show: import("zod").ZodDefault<import("zod").ZodEnum<{
    translation: "translation";
    icon: "icon";
  }>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  items: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
    before: import("zod").ZodString;
    noun: import("zod").ZodString;
    after: import("zod").ZodOptional<import("zod").ZodString>;
    answer: import("zod").ZodEnum<{
      a: "a";
      an: "an";
      the: "the";
      ", ": ", ";
    }>;
    why: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>>;
  objectives: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
  hints: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  items: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
    subject: import("zod").ZodString;
    options: import("zod").ZodArray<import("zod").ZodString>;
    correct: import("zod").ZodString;
    tail: import("zod").ZodOptional<import("zod").ZodString>;
    note: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  from: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
    text: import("zod").ZodString;
    pos: import("zod").ZodOptional<import("zod").ZodEnum<{
      noun: "noun";
      verb: "verb";
      article: "article";
      adjective: "adjective";
      preposition: "preposition";
      pronoun: "pronoun";
      conjunction: "conjunction";
      adverb: "adverb";
      other: "other";
    }>>;
    gloss: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>>;
  to: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
    text: import("zod").ZodString;
    pos: import("zod").ZodOptional<import("zod").ZodEnum<{
      noun: "noun";
      verb: "verb";
      article: "article";
      adjective: "adjective";
      preposition: "preposition";
      pronoun: "pronoun";
      conjunction: "conjunction";
      adverb: "adverb";
      other: "other";
    }>>;
    gloss: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>>;
  instruction: import("zod").ZodOptional<import("zod").ZodString>;
  note: import("zod").ZodOptional<import("zod").ZodString>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  items: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
    before: import("zod").ZodString;
    noun: import("zod").ZodString;
    answer: import("zod").ZodString;
    options: import("zod").ZodArray<import("zod").ZodString>;
    scene: import("zod").ZodEnum<{
      in: "in";
      on: "on";
      over: "over";
      above: "above";
      under: "under";
      below: "below";
      beside: "beside";
      between: "between";
      behind: "behind";
      infront: "infront";
      at: "at";
    }>;
    figure: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodObject<{
      kind: import("zod").ZodEnum<{
        emoji: "emoji";
        svg: "svg";
        image: "image";
      }>;
      id: import("zod").ZodOptional<import("zod").ZodString>;
      src: import("zod").ZodOptional<import("zod").ZodString>;
      alt: import("zod").ZodString;
    }, import("zod/v4/core").$strip>]>>;
    landmark: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodObject<{
      kind: import("zod").ZodEnum<{
        emoji: "emoji";
        svg: "svg";
        image: "image";
      }>;
      id: import("zod").ZodOptional<import("zod").ZodString>;
      src: import("zod").ZodOptional<import("zod").ZodString>;
      alt: import("zod").ZodString;
    }, import("zod/v4/core").$strip>]>>;
    note: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  targetMeters: import("zod").ZodOptional<import("zod").ZodNumber>;
  g: import("zod").ZodOptional<import("zod").ZodNumber>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  height: import("zod").ZodOptional<import("zod").ZodNumber>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  boatSpeed: import("zod").ZodOptional<import("zod").ZodNumber>;
  current: import("zod").ZodOptional<import("zod").ZodNumber>;
  riverWidth: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  knownWeight: import("zod").ZodDefault<import("zod").ZodNumber>;
  knownDist: import("zod").ZodDefault<import("zod").ZodNumber>;
  unknownDist: import("zod").ZodDefault<import("zod").ZodNumber>;
  controlId: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  vectors: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
    label: import("zod").ZodOptional<import("zod").ZodString>;
    dx: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
    dy: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
    color: import("zod").ZodOptional<import("zod").ZodString>;
    drag: import("zod").ZodOptional<import("zod").ZodBoolean>;
  }, import("zod/v4/core").$strip>>>;
  combine: import("zod").ZodDefault<import("zod").ZodEnum<{
    sum: "sum";
    diff: "diff";
    none: "none";
  }>>;
  goalX: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
  goalY: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
  components: import("zod").ZodOptional<import("zod").ZodBoolean>;
  angle: import("zod").ZodDefault<import("zod").ZodBoolean>;
  objectives: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
  hints: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  title: import("zod").ZodOptional<import("zod").ZodString>;
  types: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    name: import("zod").ZodString;
    caption: import("zod").ZodString;
    vectors: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      tail: import("zod").ZodOptional<import("zod").ZodObject<{
        x: import("zod").ZodNumber;
        y: import("zod").ZodNumber;
      }, import("zod/v4/core").$strip>>;
      comp: import("zod").ZodObject<{
        x: import("zod").ZodNumber;
        y: import("zod").ZodNumber;
      }, import("zod/v4/core").$strip>;
      color: import("zod").ZodOptional<import("zod").ZodString>;
      label: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    origin: import("zod").ZodOptional<import("zod").ZodBoolean>;
  }, import("zod/v4/core").$strip>>>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  maxSpeed: import("zod").ZodDefault<import("zod").ZodNumber>;
  start: import("zod").ZodDefault<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  speed: import("zod").ZodDefault<import("zod").ZodNumber>;
  reactionTime: import("zod").ZodDefault<import("zod").ZodNumber>;
  deceleration: import("zod").ZodDefault<import("zod").ZodNumber>;
  predict: import("zod").ZodDefault<import("zod").ZodBoolean>;
  showGraphs: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  angleDeg: import("zod").ZodDefault<import("zod").ZodNumber>;
  mass: import("zod").ZodDefault<import("zod").ZodNumber>;
  friction: import("zod").ZodDefault<import("zod").ZodNumber>;
  showComponents: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  controls: import("zod").ZodOptional<import("zod").ZodObject<{
    hide: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    lock: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
  }, import("zod/v4/core").$strip>>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  m1: import("zod").ZodDefault<import("zod").ZodNumber>;
  m2: import("zod").ZodDefault<import("zod").ZodNumber>;
  u1: import("zod").ZodDefault<import("zod").ZodNumber>;
  u2: import("zod").ZodDefault<import("zod").ZodNumber>;
  elasticity: import("zod").ZodDefault<import("zod").ZodNumber>;
  showCenterOfMass: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  functions: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEnum<{
    sin: "sin";
    cos: "cos";
  }>>>;
  startDeg: import("zod").ZodOptional<import("zod").ZodNumber>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  equations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodObject<{
    expr: import("zod").ZodString;
    color: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>]>>>;
  params: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    name: import("zod").ZodString;
    min: import("zod").ZodNumber;
    max: import("zod").ZodNumber;
    step: import("zod").ZodOptional<import("zod").ZodNumber>;
    value: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>>;
  xRange: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
  yScale: import("zod").ZodOptional<import("zod").ZodEnum<{
    linear: "linear";
    log: "log";
  }>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  equation: import("zod").ZodOptional<import("zod").ZodString>;
  xRange: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
  startX: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  equation: import("zod").ZodOptional<import("zod").ZodString>;
  range: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
  learningRate: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  equation: import("zod").ZodOptional<import("zod").ZodString>;
  xRange: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
  a: import("zod").ZodOptional<import("zod").ZodNumber>;
  b: import("zod").ZodOptional<import("zod").ZodNumber>;
  n: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  equation: import("zod").ZodOptional<import("zod").ZodString>;
  xRange: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
  c: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  steps: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodObject<{
    tex: import("zod").ZodString;
    note: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>]>>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  m1: import("zod").ZodDefault<import("zod").ZodNumber>;
  b1: import("zod").ZodDefault<import("zod").ZodNumber>;
  m2: import("zod").ZodDefault<import("zod").ZodNumber>;
  b2: import("zod").ZodDefault<import("zod").ZodNumber>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  min: import("zod").ZodDefault<import("zod").ZodNumber>;
  max: import("zod").ZodDefault<import("zod").ZodNumber>;
  start: import("zod").ZodDefault<import("zod").ZodNumber>;
  target: import("zod").ZodOptional<import("zod").ZodNumber>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  bucketWeight: import("zod").ZodDefault<import("zod").ZodNumber>;
  bucketCount: import("zod").ZodDefault<import("zod").ZodNumber>;
  maxWeights: import("zod").ZodDefault<import("zod").ZodNumber>;
  start: import("zod").ZodDefault<import("zod").ZodNumber>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  coef: import("zod").ZodDefault<import("zod").ZodNumber>;
  addend: import("zod").ZodDefault<import("zod").ZodNumber>;
  rhs: import("zod").ZodDefault<import("zod").ZodNumber>;
  answer: import("zod").ZodDefault<import("zod").ZodNumber>;
  controlId: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  a: import("zod").ZodDefault<import("zod").ZodNumber>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  a: import("zod").ZodDefault<import("zod").ZodNumber>;
  b: import("zod").ZodDefault<import("zod").ZodNumber>;
  mode: import("zod").ZodDefault<import("zod").ZodEnum<{
    factor: "factor";
    expand: "expand";
  }>>;
  controlId: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  a: import("zod").ZodDefault<import("zod").ZodNumber>;
  b: import("zod").ZodDefault<import("zod").ZodNumber>;
  steps: import("zod").ZodDefault<import("zod").ZodNumber>;
  controlId: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  equations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodObject<{
    expr: import("zod").ZodString;
    color: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>]>>>;
  params: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    name: import("zod").ZodString;
    min: import("zod").ZodNumber;
    max: import("zod").ZodNumber;
    step: import("zod").ZodOptional<import("zod").ZodNumber>;
    value: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>>;
  xRange: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
  yRange: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>, import("zod").ZodLiteral<"auto">]>>;
  derive: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    kind: import("zod").ZodEnum<{
      area: "area";
      roots: "roots";
      intersections: "intersections";
      tangent: "tangent";
      normal: "normal";
    }>;
    of: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>]>>;
    at: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
    between: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
    from: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
    to: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
    label: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>>;
  ask: import("zod").ZodOptional<import("zod").ZodObject<{
    prompt: import("zod").ZodString;
    answer: import("zod").ZodUnion<readonly [import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"number">;
      value: import("zod").ZodNumber;
      tol: import("zod").ZodOptional<import("zod").ZodNumber>;
    }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"expression">;
      value: import("zod").ZodString;
    }, import("zod/v4/core").$strip>]>;
    placeholder: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  activity: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  angleDeg: import("zod").ZodOptional<import("zod").ZodNumber>;
  leg: import("zod").ZodOptional<import("zod").ZodNumber>;
  legKind: import("zod").ZodOptional<import("zod").ZodEnum<{
    opposite: "opposite";
    adjacent: "adjacent";
  }>>;
  mode: import("zod").ZodOptional<import("zod").ZodEnum<{
    elevation: "elevation";
    depression: "depression";
    plain: "plain";
  }>>;
  labels: import("zod").ZodOptional<import("zod").ZodObject<{
    opposite: import("zod").ZodOptional<import("zod").ZodString>;
    adjacent: import("zod").ZodOptional<import("zod").ZodString>;
    hypotenuse: import("zod").ZodOptional<import("zod").ZodString>;
    angle: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>;
  drive: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEnum<{
    angle: "angle";
    leg: "leg";
  }>>>;
  ask: import("zod").ZodOptional<import("zod").ZodObject<{
    prompt: import("zod").ZodString;
    answer: import("zod").ZodUnion<readonly [import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"number">;
      value: import("zod").ZodNumber;
      tol: import("zod").ZodOptional<import("zod").ZodNumber>;
    }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"expression">;
      value: import("zod").ZodString;
    }, import("zod/v4/core").$strip>]>;
    placeholder: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  activity: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  mode: import("zod").ZodOptional<import("zod").ZodEnum<{
    "two-point": "two-point";
    "gradient-intercept": "gradient-intercept";
    "intercept-form": "intercept-form";
    parallel: "parallel";
    perpendicular: "perpendicular";
  }>>;
  pointA: import("zod").ZodOptional<import("zod").ZodObject<{
    x: import("zod").ZodNumber;
    y: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>;
  pointB: import("zod").ZodOptional<import("zod").ZodObject<{
    x: import("zod").ZodNumber;
    y: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>;
  given: import("zod").ZodOptional<import("zod").ZodObject<{
    m: import("zod").ZodNumber;
    c: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>;
  through: import("zod").ZodOptional<import("zod").ZodObject<{
    x: import("zod").ZodNumber;
    y: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>;
  showDistance: import("zod").ZodOptional<import("zod").ZodBoolean>;
  snap: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  ask: import("zod").ZodOptional<import("zod").ZodObject<{
    prompt: import("zod").ZodString;
    placeholder: import("zod").ZodOptional<import("zod").ZodString>;
    answer: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"number">;
      value: import("zod").ZodNumber;
      tol: import("zod").ZodOptional<import("zod").ZodNumber>;
    }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"expression">;
      value: import("zod").ZodString;
    }, import("zod/v4/core").$strip>]>>;
    choices: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      value: import("zod").ZodString;
      label: import("zod").ZodString;
    }, import("zod/v4/core").$strip>>>;
    correct: import("zod").ZodOptional<import("zod").ZodString>;
    explain: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>;
  activity: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  center: import("zod").ZodOptional<import("zod").ZodObject<{
    x: import("zod").ZodNumber;
    y: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>;
  radius: import("zod").ZodOptional<import("zod").ZodNumber>;
  showTangent: import("zod").ZodOptional<import("zod").ZodBoolean>;
  showExpanded: import("zod").ZodOptional<import("zod").ZodBoolean>;
  tangentAngleDeg: import("zod").ZodOptional<import("zod").ZodNumber>;
  snap: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  ask: import("zod").ZodOptional<import("zod").ZodObject<{
    prompt: import("zod").ZodString;
    placeholder: import("zod").ZodOptional<import("zod").ZodString>;
    answer: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"number">;
      value: import("zod").ZodNumber;
      tol: import("zod").ZodOptional<import("zod").ZodNumber>;
    }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"expression">;
      value: import("zod").ZodString;
    }, import("zod/v4/core").$strip>]>>;
    choices: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      value: import("zod").ZodString;
      label: import("zod").ZodString;
    }, import("zod/v4/core").$strip>>>;
    correct: import("zod").ZodOptional<import("zod").ZodString>;
    explain: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>;
  activity: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  kind: import("zod").ZodOptional<import("zod").ZodEnum<{
    parabola: "parabola";
    ellipse: "ellipse";
    hyperbola: "hyperbola";
    rectangular: "rectangular";
  }>>;
  a: import("zod").ZodOptional<import("zod").ZodNumber>;
  b: import("zod").ZodOptional<import("zod").ZodNumber>;
  c: import("zod").ZodOptional<import("zod").ZodNumber>;
  showFocusDirectrix: import("zod").ZodOptional<import("zod").ZodBoolean>;
  showAsymptotes: import("zod").ZodOptional<import("zod").ZodBoolean>;
  snap: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  ask: import("zod").ZodOptional<import("zod").ZodObject<{
    prompt: import("zod").ZodString;
    placeholder: import("zod").ZodOptional<import("zod").ZodString>;
    answer: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"number">;
      value: import("zod").ZodNumber;
      tol: import("zod").ZodOptional<import("zod").ZodNumber>;
    }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"expression">;
      value: import("zod").ZodString;
    }, import("zod/v4/core").$strip>]>>;
    choices: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      value: import("zod").ZodString;
      label: import("zod").ZodString;
    }, import("zod/v4/core").$strip>>>;
    correct: import("zod").ZodOptional<import("zod").ZodString>;
    explain: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>;
  activity: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  equation: import("zod").ZodOptional<import("zod").ZodString>;
  xRange: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
  restrict: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
  probe: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  ask: import("zod").ZodOptional<import("zod").ZodObject<{
    prompt: import("zod").ZodString;
    placeholder: import("zod").ZodOptional<import("zod").ZodString>;
    answer: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"number">;
      value: import("zod").ZodNumber;
      tol: import("zod").ZodOptional<import("zod").ZodNumber>;
    }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"expression">;
      value: import("zod").ZodString;
    }, import("zod/v4/core").$strip>]>>;
    choices: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      value: import("zod").ZodString;
      label: import("zod").ZodString;
    }, import("zod/v4/core").$strip>>>;
    correct: import("zod").ZodOptional<import("zod").ZodString>;
    explain: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>;
  activity: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  slope: import("zod").ZodDefault<import("zod").ZodNumber>;
  intercept: import("zod").ZodDefault<import("zod").ZodNumber>;
  predictX: import("zod").ZodDefault<import("zod").ZodNumber>;
  xMax: import("zod").ZodDefault<import("zod").ZodNumber>;
  yMax: import("zod").ZodDefault<import("zod").ZodNumber>;
  yStep: import("zod").ZodDefault<import("zod").ZodNumber>;
  xLabel: import("zod").ZodDefault<import("zod").ZodString>;
  yLabel: import("zod").ZodDefault<import("zod").ZodString>;
  unit: import("zod").ZodDefault<import("zod").ZodString>;
  scene: import("zod").ZodDefault<import("zod").ZodString>;
  vesselObjects: import("zod").ZodDefault<import("zod").ZodBoolean>;
  vesselBinds: import("zod").ZodDefault<import("zod").ZodEnum<{
    guess: "guess";
    truth: "truth";
  }>>;
  objectLabel: import("zod").ZodOptional<import("zod").ZodString>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  ask: import("zod").ZodOptional<import("zod").ZodObject<{
    prompt: import("zod").ZodString;
    placeholder: import("zod").ZodOptional<import("zod").ZodString>;
    answer: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"number">;
      value: import("zod").ZodNumber;
      tol: import("zod").ZodOptional<import("zod").ZodNumber>;
    }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
      kind: import("zod").ZodLiteral<"expression">;
      value: import("zod").ZodString;
    }, import("zod/v4/core").$strip>]>>;
    choices: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      value: import("zod").ZodString;
      label: import("zod").ZodString;
    }, import("zod/v4/core").$strip>>>;
    correct: import("zod").ZodOptional<import("zod").ZodString>;
    explain: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>;
  activity: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, LabBlock, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  start: import("zod").ZodDefault<import("zod").ZodNumber>;
  rule: import("zod").ZodDefault<import("zod").ZodEnum<{
    geometric: "geometric";
    arithmetic: "arithmetic";
  }>>;
  factor: import("zod").ZodDefault<import("zod").ZodNumber>;
  shown: import("zod").ZodDefault<import("zod").ZodNumber>;
  predict: import("zod").ZodDefault<import("zod").ZodNumber>;
  stepLabel: import("zod").ZodDefault<import("zod").ZodString>;
  highlightNew: import("zod").ZodDefault<import("zod").ZodBoolean>;
  scene: import("zod").ZodDefault<import("zod").ZodString>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  activity: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  kind: import("zod").ZodDefault<import("zod").ZodEnum<{
    translate: "translate";
    reflect: "reflect";
    rotate: "rotate";
    enlarge: "enlarge";
  }>>;
  byX: import("zod").ZodDefault<import("zod").ZodNumber>;
  byY: import("zod").ZodDefault<import("zod").ZodNumber>;
  axis: import("zod").ZodDefault<import("zod").ZodEnum<{
    x: "x";
    y: "y";
    "y=x": "y=x";
    "y=-x": "y=-x";
  }>>;
  deg: import("zod").ZodDefault<import("zod").ZodNumber>;
  k: import("zod").ZodDefault<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  activity: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  store: import("zod").ZodDefault<import("zod").ZodString>;
  currency: import("zod").ZodDefault<import("zod").ZodString>;
  items: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    qty: import("zod").ZodNumber;
    name: import("zod").ZodString;
    unit: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>>;
  askItems: import("zod").ZodDefault<import("zod").ZodBoolean>;
  askCost: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  activity: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  scene: import("zod").ZodDefault<import("zod").ZodString>;
  symA: import("zod").ZodDefault<import("zod").ZodString>;
  labelA: import("zod").ZodDefault<import("zod").ZodString>;
  answerA: import("zod").ZodDefault<import("zod").ZodNumber>;
  symB: import("zod").ZodDefault<import("zod").ZodString>;
  labelB: import("zod").ZodDefault<import("zod").ZodString>;
  answerB: import("zod").ZodDefault<import("zod").ZodNumber>;
  a0: import("zod").ZodDefault<import("zod").ZodNumber>;
  b0: import("zod").ZodDefault<import("zod").ZodNumber>;
  a1: import("zod").ZodDefault<import("zod").ZodNumber>;
  b1: import("zod").ZodDefault<import("zod").ZodNumber>;
  currency: import("zod").ZodOptional<import("zod").ZodString>;
  unit: import("zod").ZodOptional<import("zod").ZodString>;
  store: import("zod").ZodOptional<import("zod").ZodString>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
  activity: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  name: import("zod").ZodDefault<import("zod").ZodString>;
  label: import("zod").ZodOptional<import("zod").ZodString>;
  variant: import("zod").ZodDefault<import("zod").ZodEnum<{
    count: "count";
    icons: "icons";
    shape: "shape";
  }>>;
  icon: import("zod").ZodDefault<import("zod").ZodString>;
  slots: import("zod").ZodDefault<import("zod").ZodNumber>;
  shape: import("zod").ZodDefault<import("zod").ZodEnum<{
    box: "box";
    cup: "cup";
    circle: "circle";
  }>>;
  color: import("zod").ZodDefault<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  holdConstant: import("zod").ZodDefault<import("zod").ZodEnum<{
    none: "none";
    volume: "volume";
    temperature: "temperature";
    pressure: "pressure";
  }>>;
  particleCount: import("zod").ZodDefault<import("zod").ZodNumber>;
  temperature: import("zod").ZodDefault<import("zod").ZodNumber>;
  volume: import("zod").ZodDefault<import("zod").ZodNumber>;
  showGauge: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  moles: import("zod").ZodDefault<import("zod").ZodNumber>;
  volume: import("zod").ZodDefault<import("zod").ZodNumber>;
  showProbe: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  stockConcentration: import("zod").ZodDefault<import("zod").ZodNumber>;
  aliquotVolume: import("zod").ZodDefault<import("zod").ZodNumber>;
  finalVolume: import("zod").ZodDefault<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  protons: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  deltaH: import("zod").ZodOptional<import("zod").ZodNumber>;
  activationEnergy: import("zod").ZodOptional<import("zod").ZodNumber>;
  catalyst: import("zod").ZodOptional<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  a: import("zod").ZodOptional<import("zod").ZodString>;
  b: import("zod").ZodOptional<import("zod").ZodString>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  emf: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, LabBlock, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  voltage: import("zod").ZodOptional<import("zod").ZodNumber>;
  r1: import("zod").ZodOptional<import("zod").ZodNumber>;
  r2: import("zod").ZodOptional<import("zod").ZodNumber>;
  mode: import("zod").ZodOptional<import("zod").ZodEnum<{
    parallel: "parallel";
    series: "series";
  }>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  battery: import("zod").ZodOptional<import("zod").ZodNumber>;
  components: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  doc: import("zod").ZodOptional<import("zod").ZodObject<{
    parts: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
      id: import("zod").ZodString;
      kind: import("zod").ZodString;
      at: import("zod").ZodObject<{
        x: import("zod").ZodNumber;
        y: import("zod").ZodNumber;
      }, import("zod/v4/core").$strip>;
      orient: import("zod").ZodOptional<import("zod").ZodEnum<{
        h: "h";
        v: "v";
      }>>;
      props: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString, import("zod").ZodBoolean]>>>;
      pins: import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    nodes: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
      id: import("zod").ZodString;
      at: import("zod").ZodObject<{
        x: import("zod").ZodNumber;
        y: import("zod").ZodNumber;
      }, import("zod/v4/core").$strip>;
    }, import("zod/v4/core").$strip>>>;
    size: import("zod").ZodOptional<import("zod").ZodObject<{
      w: import("zod").ZodNumber;
      h: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>;
  }, import("zod/v4/core").$strip>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  emf: import("zod").ZodDefault<import("zod").ZodNumber>;
  bulbOhms: import("zod").ZodDefault<import("zod").ZodNumber>;
  withSwitch: import("zod").ZodDefault<import("zod").ZodBoolean>;
  controlId: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  mode: import("zod").ZodDefault<import("zod").ZodEnum<{
    n: "n";
    intrinsic: "intrinsic";
    p: "p";
  }>>;
  temperature: import("zod").ZodDefault<import("zod").ZodNumber>;
  lockDoping: import("zod").ZodDefault<import("zod").ZodBoolean>;
  showTemperature: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  pmos: import("zod").ZodDefault<import("zod").ZodBoolean>;
  vth: import("zod").ZodDefault<import("zod").ZodNumber>;
  k: import("zod").ZodDefault<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  pnp: import("zod").ZodDefault<import("zod").ZodBoolean>;
  beta: import("zod").ZodDefault<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  emf: import("zod").ZodDefault<import("zod").ZodNumber>;
  rK: import("zod").ZodDefault<import("zod").ZodNumber>;
  capU: import("zod").ZodDefault<import("zod").ZodNumber>;
  leakK: import("zod").ZodDefault<import("zod").ZodNumber>;
  startCharged: import("zod").ZodOptional<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  volts: import("zod").ZodOptional<import("zod").ZodNumber>;
  resistanceK: import("zod").ZodOptional<import("zod").ZodNumber>;
  capacitanceU: import("zod").ZodOptional<import("zod").ZodNumber>;
  show: import("zod").ZodOptional<import("zod").ZodEnum<{
    graph: "graph";
    circuit: "circuit";
    both: "both";
  }>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  volts: import("zod").ZodOptional<import("zod").ZodNumber>;
  resistanceK: import("zod").ZodOptional<import("zod").ZodNumber>;
  show: import("zod").ZodOptional<import("zod").ZodEnum<{
    graph: "graph";
    circuit: "circuit";
    both: "both";
  }>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  supply: import("zod").ZodOptional<import("zod").ZodNumber>;
  vth: import("zod").ZodOptional<import("zod").ZodNumber>;
  loadK: import("zod").ZodOptional<import("zod").ZodNumber>;
  show: import("zod").ZodOptional<import("zod").ZodEnum<{
    graph: "graph";
    circuit: "circuit";
    both: "both";
  }>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  vdd: import("zod").ZodOptional<import("zod").ZodNumber>;
  vth: import("zod").ZodOptional<import("zod").ZodNumber>;
  rpull: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  vdd: import("zod").ZodOptional<import("zod").ZodNumber>;
  vth: import("zod").ZodOptional<import("zod").ZodNumber>;
  show: import("zod").ZodOptional<import("zod").ZodEnum<{
    graph: "graph";
    circuit: "circuit";
    both: "both";
  }>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  vdd: import("zod").ZodOptional<import("zod").ZodNumber>;
  vth: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  vdd: import("zod").ZodOptional<import("zod").ZodNumber>;
  vth: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  vth: import("zod").ZodOptional<import("zod").ZodNumber>;
  vmax: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  scene: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  r1: import("zod").ZodOptional<import("zod").ZodNumber>;
  r2: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  base: import("zod").ZodDefault<import("zod").ZodNumber>;
  width: import("zod").ZodDefault<import("zod").ZodNumber>;
  start: import("zod").ZodDefault<import("zod").ZodNumber>;
  target: import("zod").ZodOptional<import("zod").ZodNumber>;
  showWeights: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  width: import("zod").ZodDefault<import("zod").ZodNumber>;
  groupSize: import("zod").ZodDefault<import("zod").ZodNumber>;
  start: import("zod").ZodDefault<import("zod").ZodNumber>;
  showColor: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  max: import("zod").ZodDefault<import("zod").ZodNumber>;
  start: import("zod").ZodDefault<import("zod").ZodNumber>;
  race: import("zod").ZodDefault<import("zod").ZodBoolean>;
  speed: import("zod").ZodDefault<import("zod").ZodNumber>;
  highlightBase: import("zod").ZodOptional<import("zod").ZodNumber>;
  target: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  preset: import("zod").ZodDefault<import("zod").ZodEnum<{
    and: "and";
    or: "or";
    xor: "xor";
    "nand-not": "nand-not";
    "nand-and": "nand-and";
    "nand-or": "nand-or";
    "xor-nand": "xor-nand";
    "half-adder": "half-adder";
    "full-adder": "full-adder";
  }>>;
  mode: import("zod").ZodDefault<import("zod").ZodEnum<{
    predict: "predict";
    explore: "explore";
  }>>;
  steps: import("zod").ZodDefault<import("zod").ZodBoolean>;
  showTable: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  bits: import("zod").ZodDefault<import("zod").ZodNumber>;
  start: import("zod").ZodDefault<import("zod").ZodNumber>;
  target: import("zod").ZodOptional<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  goal: import("zod").ZodDefault<import("zod").ZodEnum<{
    and: "and";
    or: "or";
    xor: "xor";
    "nand-not": "nand-not";
    "nand-and": "nand-and";
    "nand-or": "nand-or";
    "half-adder": "half-adder";
    "full-adder": "full-adder";
    sandbox: "sandbox";
  }>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  accounts: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
    id: import("zod").ZodString;
    name: import("zod").ZodString;
    category: import("zod").ZodEnum<{
      Asset: "Asset";
      Liability: "Liability";
      Equity: "Equity";
      Income: "Income";
      Expense: "Expense";
    }>;
  }, import("zod/v4/core").$strip>>>;
  transactions: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
    id: import("zod").ZodString;
    label: import("zod").ZodString;
    effects: import("zod").ZodArray<import("zod").ZodObject<{
      account: import("zod").ZodString;
      delta: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>;
  }, import("zod/v4/core").$strip>>>;
  freePost: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  accounts: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    id: import("zod").ZodString;
    name: import("zod").ZodString;
    category: import("zod").ZodEnum<{
      Asset: "Asset";
      Liability: "Liability";
      Equity: "Equity";
      Income: "Income";
      Expense: "Expense";
    }>;
  }, import("zod/v4/core").$strip>>>;
  transactions: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    id: import("zod").ZodString;
    prompt: import("zod").ZodString;
    debit: import("zod").ZodString;
    credit: import("zod").ZodString;
    amount: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>>;
  showTrialBalance: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  accounts: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    id: import("zod").ZodString;
    name: import("zod").ZodString;
    category: import("zod").ZodEnum<{
      Asset: "Asset";
      Liability: "Liability";
      Equity: "Equity";
      Income: "Income";
      Expense: "Expense";
    }>;
    balance: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>>;
  asOfLabel: import("zod").ZodOptional<import("zod").ZodString>;
  showClosing: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  demandIntercept: import("zod").ZodDefault<import("zod").ZodNumber>;
  demandSlope: import("zod").ZodDefault<import("zod").ZodNumber>;
  supplyIntercept: import("zod").ZodDefault<import("zod").ZodNumber>;
  supplySlope: import("zod").ZodDefault<import("zod").ZodNumber>;
  shiftDemand: import("zod").ZodDefault<import("zod").ZodBoolean>;
  shiftSupply: import("zod").ZodDefault<import("zod").ZodBoolean>;
  goodLabel: import("zod").ZodOptional<import("zod").ZodString>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  pivotP: import("zod").ZodDefault<import("zod").ZodNumber>;
  pivotQ: import("zod").ZodDefault<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  askPrediction: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  factor: import("zod").ZodDefault<import("zod").ZodEnum<{
    temperature: "temperature";
    pH: "pH";
  }>>;
  optimum: import("zod").ZodDefault<import("zod").ZodNumber>;
  factorMin: import("zod").ZodDefault<import("zod").ZodNumber>;
  factorMax: import("zod").ZodDefault<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  light: import("zod").ZodDefault<import("zod").ZodNumber>;
  co2: import("zod").ZodDefault<import("zod").ZodNumber>;
  temperature: import("zod").ZodDefault<import("zod").ZodNumber>;
  tempOptimum: import("zod").ZodDefault<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  parent1: import("zod").ZodDefault<import("zod").ZodString>;
  parent2: import("zod").ZodDefault<import("zod").ZodString>;
  alleleLetter: import("zod").ZodDefault<import("zod").ZodString>;
  dominantLabel: import("zod").ZodDefault<import("zod").ZodString>;
  recessiveLabel: import("zod").ZodDefault<import("zod").ZodString>;
  predictFirst: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  mode: import("zod").ZodDefault<import("zod").ZodEnum<{
    day: "day";
    night: "night";
  }>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  preset: import("zod").ZodDefault<import("zod").ZodEnum<{
    custom: "custom";
    monohybrid: "monohybrid";
    "blood-type": "blood-type";
    incomplete: "incomplete";
    dihybrid: "dihybrid";
  }>>;
  spec: import("zod").ZodOptional<import("zod").ZodObject<{
    trait: import("zod").ZodOptional<import("zod").ZodString>;
    alleles: import("zod").ZodArray<import("zod").ZodObject<{
      symbol: import("zod").ZodString;
      rank: import("zod").ZodNumber;
      trait: import("zod").ZodString;
    }, import("zod/v4/core").$strip>>;
    blends: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      pair: import("zod").ZodTuple<[import("zod").ZodString, import("zod").ZodString], null>;
      label: import("zod").ZodString;
      color: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    colors: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>>;
  }, import("zod/v4/core").$strip>>;
  parent1: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
  parent2: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
  predictFirst: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  kind: import("zod").ZodDefault<import("zod").ZodEnum<{
    translation: "translation";
    replication: "replication";
    transcription: "transcription";
  }>>;
  template: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  allele: import("zod").ZodDefault<import("zod").ZodString>;
  dominant: import("zod").ZodDefault<import("zod").ZodString>;
  recessive: import("zod").ZodDefault<import("zod").ZodString>;
  mother: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodString, import("zod").ZodString], null>>;
  father: import("zod").ZodOptional<import("zod").ZodString>;
  predictFirst: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  dna: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  preset: import("zod").ZodDefault<import("zod").ZodEnum<{
    custom: "custom";
    water: "water";
    rock: "rock";
    carbon: "carbon";
  }>>;
  challenge: import("zod").ZodDefault<import("zod").ZodEnum<{
    trace: "trace";
    "label-process": "label-process";
  }>>;
  nodes: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    id: import("zod").ZodString;
    label: import("zod").ZodString;
    tone: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>>;
  edges: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    from: import("zod").ZodString;
    to: import("zod").ZodString;
    label: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  data: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    x: import("zod").ZodNumber;
    y: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>>;
  showSquares: import("zod").ZodDefault<import("zod").ZodBoolean>;
  learnRate: import("zod").ZodDefault<import("zod").ZodNumber>;
  m0: import("zod").ZodDefault<import("zod").ZodNumber>;
  b0: import("zod").ZodDefault<import("zod").ZodNumber>;
  span: import("zod").ZodDefault<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  points: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    x: import("zod").ZodNumber;
    y: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>>;
  k: import("zod").ZodDefault<import("zod").ZodNumber>;
  seeds: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
    x: import("zod").ZodNumber;
    y: import("zod").ZodNumber;
  }, import("zod/v4/core").$strip>>>;
  span: import("zod").ZodDefault<import("zod").ZodNumber>;
  showLines: import("zod").ZodDefault<import("zod").ZodBoolean>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  positives: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodNumber>>;
  negatives: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodNumber>>;
  threshold: import("zod").ZodDefault<import("zod").ZodNumber>;
  span: import("zod").ZodDefault<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  dataset: import("zod").ZodDefault<import("zod").ZodEnum<{
    xor: "xor";
    separable: "separable";
    overlap: "overlap";
  }>>;
  seed: import("zod").ZodDefault<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodObject<{
  dataset: import("zod").ZodDefault<import("zod").ZodEnum<{
    xor: "xor";
    blobs: "blobs";
    circles: "circles";
  }>>;
  k: import("zod").ZodDefault<import("zod").ZodNumber>;
  seed: import("zod").ZodDefault<import("zod").ZodNumber>;
  title: import("zod").ZodOptional<import("zod").ZodString>;
  prompt: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>, import("@classytic/cms-ui/contract").CmsBlock<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>>];
/** MDX render map, merge into the host's `blockComponents` (tag → component).
 *  Tags match each block's `tag` so editor + player render the same component.
 *  Tags are unique across domains, so spread order is irrelevant. */
declare const labsComponents: {
  readonly CenterSpread: typeof CenterSpreadLab;
  readonly Series: typeof SequenceLab$1;
  readonly GaltonBoard: typeof GaltonBoardLab;
  readonly HistogramBox: typeof HistogramBoxLab;
  readonly NormalDistribution: typeof NormalDistributionLab;
  readonly ZTable: typeof ZTableLab;
  readonly SamplingDistribution: typeof SamplingDistributionLab;
  readonly TruthTable: typeof TruthTableLab;
  readonly CountingTree: typeof CountingTreeLab;
  readonly VennSetBoard: typeof VennSetBoardLab;
  readonly SampleSpaceBoard: typeof SampleSpaceBoardLab;
  readonly BooleanCircuit: typeof BooleanCircuitLab;
  readonly KarnaughMap: typeof KarnaughMapLab;
  readonly MonteCarlo: typeof MonteCarloLab;
  readonly MontyHall: typeof MontyHallLab;
  readonly OutcomeBuilder: typeof OutcomeBuilderLab;
  readonly Bayes: typeof BayesLab;
  readonly CountingSlots: typeof CountingSlotsLab;
  readonly Selection: typeof SelectionLab;
  readonly Arrangements: typeof ArrangementsLab;
  readonly PascalTriangle: typeof PascalTriangleLab;
  readonly Binomial: typeof BinomialDistributionLab;
  readonly Hypergeometric: typeof HypergeometricLab;
  readonly ExpectedValue: typeof ExpectedValueLab;
  readonly LawOfLargeNumbers: typeof LawOfLargeNumbersLab;
  readonly CombinationStudio: typeof CombinationStudioLab;
  readonly RuleCard: (a: import("zod").infer<import("zod").ZodObject<{
    preset: import("zod").ZodDefault<import("zod").ZodEnum<{
      none: "none";
      "rule-of-product": "rule-of-product";
      "rule-of-sum": "rule-of-sum";
      factorial: "factorial";
      permutation: "permutation";
      combination: "combination";
      "perm-with-rep": "perm-with-rep";
    }>>;
    name: import("zod").ZodDefault<import("zod").ZodString>;
    formula: import("zod").ZodDefault<import("zod").ZodString>;
    analogy: import("zod").ZodOptional<import("zod").ZodString>;
    tricks: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    derivation: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      tex: import("zod").ZodString;
      note: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>>) => import("react").ReactNode;
  readonly Regression: typeof RegressionLab;
  readonly KMeans: typeof KMeansLab;
  readonly ClassifierThreshold: typeof ClassifierThresholdLab;
  readonly DecisionBoundary: typeof DecisionBoundaryLab;
  readonly KnnBoundary: typeof KNNBoundaryLab;
  readonly Cycle: typeof CycleLab;
  readonly EnzymeRate: typeof EnzymeRateLab;
  readonly PhotosynthesisFactors: typeof PhotosynthesisFactorsLab;
  readonly PunnettCross: typeof PunnettCrossLab;
  readonly Respiration: typeof RespirationLab;
  readonly GeneticCross: typeof GeneticCrossLab;
  readonly Sequence: typeof SequenceLab;
  readonly SexLinkedCross: typeof SexLinkedCrossLab;
  readonly CentralDogma: typeof CentralDogmaLab;
  readonly MarketEquilibrium: typeof MarketEquilibriumLab;
  readonly ElasticityRevenue: typeof ElasticityRevenueLab;
  readonly DemandShiftVsMove: typeof DemandShiftVsMoveLab;
  readonly EquationBalance: typeof EquationBalanceLab;
  readonly JournalPoster: typeof JournalPosterLab;
  readonly StatementSorter: typeof StatementSorterLab;
  readonly PlaceValueDial: typeof PlaceValueDialLab;
  readonly BitGrouper: typeof BitGrouperLab;
  readonly BaseOdometer: typeof BaseOdometerLab;
  readonly LogicGate: typeof LogicGateLab;
  readonly BinaryDisplay: typeof BinaryDisplayLab;
  readonly LogicBuilder: typeof LogicBuildLab;
  readonly GeometryBoard: typeof GeometryBoard;
  readonly IntersectingCircles: typeof IntersectingCircles;
  readonly CapacitorLeak: typeof CapacitorLeakLab;
  readonly Circuit: typeof CircuitPuzzle;
  readonly CircuitBuilder: typeof CircuitBuilder;
  readonly CircuitLab: typeof CircuitLab;
  readonly CircuitScene: typeof CircuitSceneView;
  readonly MosfetInside: typeof MosfetInsideLab;
  readonly PnJunction: typeof PnJunctionLab;
  readonly BjtInside: typeof BjtInsideLab;
  readonly SiliconLattice: typeof SiliconLatticeLab;
  readonly Conduction: typeof ConductionLab;
  readonly HallEffect: typeof HallEffectLab;
  readonly RCCharging: typeof RCChargingLab;
  readonly Diode: typeof DiodeLab;
  readonly Transistor: typeof TransistorLab;
  readonly RNmosNot: typeof RNmosNotLab;
  readonly CmosInverter: typeof CmosInverterLab;
  readonly CmosNand: typeof CmosNandLab;
  readonly CmosNor: typeof CmosNorLab;
  readonly Brownout: typeof BrownoutLab;
  readonly GasBox: typeof GasBoxLab;
  readonly SolutionBox: typeof SolutionBoxLab;
  readonly Dilution: typeof DilutionLab;
  readonly BohrAtom: typeof BohrAtom;
  readonly ReactionProfile: typeof ReactionProfile;
  readonly ReactionLab: typeof ReactionLab;
  readonly Battery: typeof Battery;
  readonly LeChatelier: typeof LeChatelierLab;
  readonly Titration: typeof TitrationLab;
  readonly Electrochem: typeof ElectrochemLab;
  readonly Kinetics: typeof KineticsLab;
  readonly Stoichiometry: typeof StoichiometryLab;
  readonly PeriodicTrends: typeof PeriodicTrendsLab;
  readonly MysteryBucket: typeof MysteryBucketLab;
  readonly NumberLine: typeof NumberLineLab;
  readonly LinearSystem: typeof LinearSystemView;
  readonly BalanceAlgebra: typeof BalanceAlgebraLab;
  readonly VertexParabola: typeof VertexParabolaLab;
  readonly AreaModel: typeof AreaModelLab;
  readonly GrowingPattern: typeof GrowingPatternLab;
  readonly FunctionMachine: typeof FunctionMachineLab;
  readonly Graph: typeof Grapher;
  readonly DerivativeExplorer: typeof DerivativeExplorer;
  readonly IntegralExplorer: typeof IntegralExplorer;
  readonly LimitExplorer: typeof LimitExplorer;
  readonly GradientDescent: typeof GradientDescent;
  readonly Derivation: typeof Derivation;
  readonly TrigExplorer: typeof TrigExplorer;
  readonly InteractiveProblem: typeof InteractiveProblem;
  readonly TriangleTrig: typeof TriangleTrig;
  readonly StraightLine: typeof StraightLineLab;
  readonly CircleLab: typeof CircleLab;
  readonly ConicLab: typeof ConicLab;
  readonly DomainRange: typeof DomainRangeLab;
  readonly LinearModel: typeof LinearModelLab;
  readonly RateMachine: typeof RateMachineLab;
  readonly SequencePredict: typeof SequencePredict;
  readonly PercentBar: typeof PercentBarLab;
  readonly FractionBar: typeof FractionBarLab;
  readonly RatioShare: typeof RatioShareLab;
  readonly ComplexPlane: typeof ComplexPlaneLab;
  readonly TrigSigns: typeof TrigSignsLab;
  readonly PolynomialSolver: typeof PolynomialSolverLab;
  readonly GeoTransform: typeof TransformLab;
  readonly ReceiptTotals: typeof ReceiptLab;
  readonly SystemSolve: typeof SystemSolveLab;
  readonly VectorBoard: typeof VectorBoardView;
  readonly VectorTypes: typeof VectorTypesLab;
  readonly RainRelative: typeof RainRelativeLab;
  readonly StoppingDistance: typeof StoppingDistanceLab;
  readonly RampForces: typeof RampForcesLab;
  readonly CollisionTrack: typeof CollisionTrackLab;
  readonly Optics: typeof OpticsLab;
  readonly Lever: typeof LeverPuzzle;
  readonly ProjectileLab: typeof ProjectileLab;
  readonly RiverBoat: typeof RiverBoat;
  readonly OrbitLab: typeof OrbitLab;
  readonly GravityDrop: typeof GravityDrop;
  readonly SentenceBuilder: typeof SentenceBuilderLab;
  readonly WordMatch: typeof WordMatchLab;
  readonly ArticleLens: typeof ArticleLensLab;
  readonly Agreement: typeof AgreementLab;
  readonly Transform: typeof TransformLab$1;
  readonly Preposition: typeof PrepositionSceneLab;
  readonly Predict: typeof PredictWidget;
};
/** Every lab tagged with its subject group, for `<LabGallery blocks={labGalleryItems}>`. */
declare const labGalleryItems: ({
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    functions: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEnum<{
      sin: "sin";
      cos: "cos";
    }>>>;
    startDeg: import("zod").ZodOptional<import("zod").ZodNumber>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    functions?: ("sin" | "cos")[] | undefined;
    startDeg?: number | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    functions?: ("sin" | "cos")[] | undefined;
    startDeg?: number | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    functions?: ("sin" | "cos")[] | undefined;
    startDeg?: number | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    equations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodObject<{
      expr: import("zod").ZodString;
      color: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>]>>>;
    params: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      name: import("zod").ZodString;
      min: import("zod").ZodNumber;
      max: import("zod").ZodNumber;
      step: import("zod").ZodOptional<import("zod").ZodNumber>;
      value: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>>;
    xRange: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
    yScale: import("zod").ZodOptional<import("zod").ZodEnum<{
      linear: "linear";
      log: "log";
    }>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    equations?: (string | {
      expr: string;
      color?: string | undefined;
    })[] | undefined;
    params?: {
      name: string;
      min: number;
      max: number;
      value: number;
      step?: number | undefined;
    }[] | undefined;
    xRange?: [number, number] | undefined;
    yScale?: "linear" | "log" | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    equations?: (string | {
      expr: string;
      color?: string | undefined;
    })[] | undefined;
    params?: {
      name: string;
      min: number;
      max: number;
      value: number;
      step?: number | undefined;
    }[] | undefined;
    xRange?: [number, number] | undefined;
    yScale?: "linear" | "log" | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    equations?: (string | {
      expr: string;
      color?: string | undefined;
    })[] | undefined;
    params?: {
      name: string;
      min: number;
      max: number;
      value: number;
      step?: number | undefined;
    }[] | undefined;
    xRange?: [number, number] | undefined;
    yScale?: "linear" | "log" | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    equation: import("zod").ZodOptional<import("zod").ZodString>;
    xRange: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
    startX: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    equation?: string | undefined;
    xRange?: [number, number] | undefined;
    startX?: number | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    equation?: string | undefined;
    xRange?: [number, number] | undefined;
    startX?: number | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    equation?: string | undefined;
    xRange?: [number, number] | undefined;
    startX?: number | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    equation: import("zod").ZodOptional<import("zod").ZodString>;
    range: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
    learningRate: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    equation?: string | undefined;
    range?: [number, number] | undefined;
    learningRate?: number | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    equation?: string | undefined;
    range?: [number, number] | undefined;
    learningRate?: number | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    equation?: string | undefined;
    range?: [number, number] | undefined;
    learningRate?: number | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    equation: import("zod").ZodOptional<import("zod").ZodString>;
    xRange: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
    a: import("zod").ZodOptional<import("zod").ZodNumber>;
    b: import("zod").ZodOptional<import("zod").ZodNumber>;
    n: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    equation?: string | undefined;
    xRange?: [number, number] | undefined;
    a?: number | undefined;
    b?: number | undefined;
    n?: number | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    equation?: string | undefined;
    xRange?: [number, number] | undefined;
    a?: number | undefined;
    b?: number | undefined;
    n?: number | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    equation?: string | undefined;
    xRange?: [number, number] | undefined;
    a?: number | undefined;
    b?: number | undefined;
    n?: number | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    equation: import("zod").ZodOptional<import("zod").ZodString>;
    xRange: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
    c: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    equation?: string | undefined;
    xRange?: [number, number] | undefined;
    c?: number | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    equation?: string | undefined;
    xRange?: [number, number] | undefined;
    c?: number | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    equation?: string | undefined;
    xRange?: [number, number] | undefined;
    c?: number | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    steps: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodObject<{
      tex: import("zod").ZodString;
      note: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>]>>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    steps?: (string | {
      tex: string;
      note?: string | undefined;
    })[] | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    steps?: (string | {
      tex: string;
      note?: string | undefined;
    })[] | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    steps?: (string | {
      tex: string;
      note?: string | undefined;
    })[] | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    m1: import("zod").ZodDefault<import("zod").ZodNumber>;
    b1: import("zod").ZodDefault<import("zod").ZodNumber>;
    m2: import("zod").ZodDefault<import("zod").ZodNumber>;
    b2: import("zod").ZodDefault<import("zod").ZodNumber>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    m1: number;
    b1: number;
    m2: number;
    b2: number;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    m1: number;
    b1: number;
    m2: number;
    b2: number;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    m1: number;
    b1: number;
    m2: number;
    b2: number;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    min: import("zod").ZodDefault<import("zod").ZodNumber>;
    max: import("zod").ZodDefault<import("zod").ZodNumber>;
    start: import("zod").ZodDefault<import("zod").ZodNumber>;
    target: import("zod").ZodOptional<import("zod").ZodNumber>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    min: number;
    max: number;
    start: number;
    target?: number | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    min: number;
    max: number;
    start: number;
    target?: number | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    min: number;
    max: number;
    start: number;
    target?: number | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    bucketWeight: import("zod").ZodDefault<import("zod").ZodNumber>;
    bucketCount: import("zod").ZodDefault<import("zod").ZodNumber>;
    maxWeights: import("zod").ZodDefault<import("zod").ZodNumber>;
    start: import("zod").ZodDefault<import("zod").ZodNumber>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    bucketWeight: number;
    bucketCount: number;
    maxWeights: number;
    start: number;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    bucketWeight: number;
    bucketCount: number;
    maxWeights: number;
    start: number;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    bucketWeight: number;
    bucketCount: number;
    maxWeights: number;
    start: number;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    coef: import("zod").ZodDefault<import("zod").ZodNumber>;
    addend: import("zod").ZodDefault<import("zod").ZodNumber>;
    rhs: import("zod").ZodDefault<import("zod").ZodNumber>;
    answer: import("zod").ZodDefault<import("zod").ZodNumber>;
    controlId: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    coef: number;
    addend: number;
    rhs: number;
    answer: number;
    controlId?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    coef: number;
    addend: number;
    rhs: number;
    answer: number;
    controlId?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    coef: number;
    addend: number;
    rhs: number;
    answer: number;
    controlId?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    a: import("zod").ZodDefault<import("zod").ZodNumber>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    a: number;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    a: number;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    a: number;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    a: import("zod").ZodDefault<import("zod").ZodNumber>;
    b: import("zod").ZodDefault<import("zod").ZodNumber>;
    mode: import("zod").ZodDefault<import("zod").ZodEnum<{
      factor: "factor";
      expand: "expand";
    }>>;
    controlId: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    a: number;
    b: number;
    mode: "factor" | "expand";
    controlId?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    a: number;
    b: number;
    mode: "factor" | "expand";
    controlId?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    a: number;
    b: number;
    mode: "factor" | "expand";
    controlId?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    a: import("zod").ZodDefault<import("zod").ZodNumber>;
    b: import("zod").ZodDefault<import("zod").ZodNumber>;
    steps: import("zod").ZodDefault<import("zod").ZodNumber>;
    controlId: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    a: number;
    b: number;
    steps: number;
    controlId?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    a: number;
    b: number;
    steps: number;
    controlId?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    a: number;
    b: number;
    steps: number;
    controlId?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    equations: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodObject<{
      expr: import("zod").ZodString;
      color: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>]>>>;
    params: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      name: import("zod").ZodString;
      min: import("zod").ZodNumber;
      max: import("zod").ZodNumber;
      step: import("zod").ZodOptional<import("zod").ZodNumber>;
      value: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>>;
    xRange: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
    yRange: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>, import("zod").ZodLiteral<"auto">]>>;
    derive: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      kind: import("zod").ZodEnum<{
        area: "area";
        roots: "roots";
        intersections: "intersections";
        tangent: "tangent";
        normal: "normal";
      }>;
      of: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>]>>;
      at: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
      between: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
      from: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
      to: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
      label: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    ask: import("zod").ZodOptional<import("zod").ZodObject<{
      prompt: import("zod").ZodString;
      answer: import("zod").ZodUnion<readonly [import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"number">;
        value: import("zod").ZodNumber;
        tol: import("zod").ZodOptional<import("zod").ZodNumber>;
      }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"expression">;
        value: import("zod").ZodString;
      }, import("zod/v4/core").$strip>]>;
      placeholder: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    activity: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    equations?: (string | {
      expr: string;
      color?: string | undefined;
    })[] | undefined;
    params?: {
      name: string;
      min: number;
      max: number;
      value: number;
      step?: number | undefined;
    }[] | undefined;
    xRange?: [number, number] | undefined;
    yRange?: [number, number] | "auto" | undefined;
    derive?: {
      kind: "area" | "roots" | "intersections" | "tangent" | "normal";
      of?: number | [number, number] | undefined;
      at?: string | number | undefined;
      between?: [number, number] | undefined;
      from?: string | number | undefined;
      to?: string | number | undefined;
      label?: string | undefined;
    }[] | undefined;
    ask?: {
      prompt: string;
      answer: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      };
      placeholder?: string | undefined;
    } | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    equations?: (string | {
      expr: string;
      color?: string | undefined;
    })[] | undefined;
    params?: {
      name: string;
      min: number;
      max: number;
      value: number;
      step?: number | undefined;
    }[] | undefined;
    xRange?: [number, number] | undefined;
    yRange?: [number, number] | "auto" | undefined;
    derive?: {
      kind: "area" | "roots" | "intersections" | "tangent" | "normal";
      of?: number | [number, number] | undefined;
      at?: string | number | undefined;
      between?: [number, number] | undefined;
      from?: string | number | undefined;
      to?: string | number | undefined;
      label?: string | undefined;
    }[] | undefined;
    ask?: {
      prompt: string;
      answer: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      };
      placeholder?: string | undefined;
    } | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    equations?: (string | {
      expr: string;
      color?: string | undefined;
    })[] | undefined;
    params?: {
      name: string;
      min: number;
      max: number;
      value: number;
      step?: number | undefined;
    }[] | undefined;
    xRange?: [number, number] | undefined;
    yRange?: [number, number] | "auto" | undefined;
    derive?: {
      kind: "area" | "roots" | "intersections" | "tangent" | "normal";
      of?: number | [number, number] | undefined;
      at?: string | number | undefined;
      between?: [number, number] | undefined;
      from?: string | number | undefined;
      to?: string | number | undefined;
      label?: string | undefined;
    }[] | undefined;
    ask?: {
      prompt: string;
      answer: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      };
      placeholder?: string | undefined;
    } | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    angleDeg: import("zod").ZodOptional<import("zod").ZodNumber>;
    leg: import("zod").ZodOptional<import("zod").ZodNumber>;
    legKind: import("zod").ZodOptional<import("zod").ZodEnum<{
      opposite: "opposite";
      adjacent: "adjacent";
    }>>;
    mode: import("zod").ZodOptional<import("zod").ZodEnum<{
      elevation: "elevation";
      depression: "depression";
      plain: "plain";
    }>>;
    labels: import("zod").ZodOptional<import("zod").ZodObject<{
      opposite: import("zod").ZodOptional<import("zod").ZodString>;
      adjacent: import("zod").ZodOptional<import("zod").ZodString>;
      hypotenuse: import("zod").ZodOptional<import("zod").ZodString>;
      angle: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>;
    drive: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodEnum<{
      angle: "angle";
      leg: "leg";
    }>>>;
    ask: import("zod").ZodOptional<import("zod").ZodObject<{
      prompt: import("zod").ZodString;
      answer: import("zod").ZodUnion<readonly [import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"number">;
        value: import("zod").ZodNumber;
        tol: import("zod").ZodOptional<import("zod").ZodNumber>;
      }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"expression">;
        value: import("zod").ZodString;
      }, import("zod/v4/core").$strip>]>;
      placeholder: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    activity: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    angleDeg?: number | undefined;
    leg?: number | undefined;
    legKind?: "opposite" | "adjacent" | undefined;
    mode?: "elevation" | "depression" | "plain" | undefined;
    labels?: {
      opposite?: string | undefined;
      adjacent?: string | undefined;
      hypotenuse?: string | undefined;
      angle?: string | undefined;
    } | undefined;
    drive?: ("angle" | "leg")[] | undefined;
    ask?: {
      prompt: string;
      answer: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      };
      placeholder?: string | undefined;
    } | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    angleDeg?: number | undefined;
    leg?: number | undefined;
    legKind?: "opposite" | "adjacent" | undefined;
    mode?: "elevation" | "depression" | "plain" | undefined;
    labels?: {
      opposite?: string | undefined;
      adjacent?: string | undefined;
      hypotenuse?: string | undefined;
      angle?: string | undefined;
    } | undefined;
    drive?: ("angle" | "leg")[] | undefined;
    ask?: {
      prompt: string;
      answer: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      };
      placeholder?: string | undefined;
    } | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    angleDeg?: number | undefined;
    leg?: number | undefined;
    legKind?: "opposite" | "adjacent" | undefined;
    mode?: "elevation" | "depression" | "plain" | undefined;
    labels?: {
      opposite?: string | undefined;
      adjacent?: string | undefined;
      hypotenuse?: string | undefined;
      angle?: string | undefined;
    } | undefined;
    drive?: ("angle" | "leg")[] | undefined;
    ask?: {
      prompt: string;
      answer: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      };
      placeholder?: string | undefined;
    } | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    mode: import("zod").ZodOptional<import("zod").ZodEnum<{
      "two-point": "two-point";
      "gradient-intercept": "gradient-intercept";
      "intercept-form": "intercept-form";
      parallel: "parallel";
      perpendicular: "perpendicular";
    }>>;
    pointA: import("zod").ZodOptional<import("zod").ZodObject<{
      x: import("zod").ZodNumber;
      y: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>;
    pointB: import("zod").ZodOptional<import("zod").ZodObject<{
      x: import("zod").ZodNumber;
      y: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>;
    given: import("zod").ZodOptional<import("zod").ZodObject<{
      m: import("zod").ZodNumber;
      c: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>;
    through: import("zod").ZodOptional<import("zod").ZodObject<{
      x: import("zod").ZodNumber;
      y: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>;
    showDistance: import("zod").ZodOptional<import("zod").ZodBoolean>;
    snap: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    ask: import("zod").ZodOptional<import("zod").ZodObject<{
      prompt: import("zod").ZodString;
      placeholder: import("zod").ZodOptional<import("zod").ZodString>;
      answer: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"number">;
        value: import("zod").ZodNumber;
        tol: import("zod").ZodOptional<import("zod").ZodNumber>;
      }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"expression">;
        value: import("zod").ZodString;
      }, import("zod/v4/core").$strip>]>>;
      choices: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
        value: import("zod").ZodString;
        label: import("zod").ZodString;
      }, import("zod/v4/core").$strip>>>;
      correct: import("zod").ZodOptional<import("zod").ZodString>;
      explain: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>;
    activity: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    mode?: "two-point" | "gradient-intercept" | "intercept-form" | "parallel" | "perpendicular" | undefined;
    pointA?: {
      x: number;
      y: number;
    } | undefined;
    pointB?: {
      x: number;
      y: number;
    } | undefined;
    given?: {
      m: number;
      c: number;
    } | undefined;
    through?: {
      x: number;
      y: number;
    } | undefined;
    showDistance?: boolean | undefined;
    snap?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    mode?: "two-point" | "gradient-intercept" | "intercept-form" | "parallel" | "perpendicular" | undefined;
    pointA?: {
      x: number;
      y: number;
    } | undefined;
    pointB?: {
      x: number;
      y: number;
    } | undefined;
    given?: {
      m: number;
      c: number;
    } | undefined;
    through?: {
      x: number;
      y: number;
    } | undefined;
    showDistance?: boolean | undefined;
    snap?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    mode?: "two-point" | "gradient-intercept" | "intercept-form" | "parallel" | "perpendicular" | undefined;
    pointA?: {
      x: number;
      y: number;
    } | undefined;
    pointB?: {
      x: number;
      y: number;
    } | undefined;
    given?: {
      m: number;
      c: number;
    } | undefined;
    through?: {
      x: number;
      y: number;
    } | undefined;
    showDistance?: boolean | undefined;
    snap?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    center: import("zod").ZodOptional<import("zod").ZodObject<{
      x: import("zod").ZodNumber;
      y: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>;
    radius: import("zod").ZodOptional<import("zod").ZodNumber>;
    showTangent: import("zod").ZodOptional<import("zod").ZodBoolean>;
    showExpanded: import("zod").ZodOptional<import("zod").ZodBoolean>;
    tangentAngleDeg: import("zod").ZodOptional<import("zod").ZodNumber>;
    snap: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    ask: import("zod").ZodOptional<import("zod").ZodObject<{
      prompt: import("zod").ZodString;
      placeholder: import("zod").ZodOptional<import("zod").ZodString>;
      answer: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"number">;
        value: import("zod").ZodNumber;
        tol: import("zod").ZodOptional<import("zod").ZodNumber>;
      }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"expression">;
        value: import("zod").ZodString;
      }, import("zod/v4/core").$strip>]>>;
      choices: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
        value: import("zod").ZodString;
        label: import("zod").ZodString;
      }, import("zod/v4/core").$strip>>>;
      correct: import("zod").ZodOptional<import("zod").ZodString>;
      explain: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>;
    activity: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    center?: {
      x: number;
      y: number;
    } | undefined;
    radius?: number | undefined;
    showTangent?: boolean | undefined;
    showExpanded?: boolean | undefined;
    tangentAngleDeg?: number | undefined;
    snap?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    center?: {
      x: number;
      y: number;
    } | undefined;
    radius?: number | undefined;
    showTangent?: boolean | undefined;
    showExpanded?: boolean | undefined;
    tangentAngleDeg?: number | undefined;
    snap?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    center?: {
      x: number;
      y: number;
    } | undefined;
    radius?: number | undefined;
    showTangent?: boolean | undefined;
    showExpanded?: boolean | undefined;
    tangentAngleDeg?: number | undefined;
    snap?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    kind: import("zod").ZodOptional<import("zod").ZodEnum<{
      parabola: "parabola";
      ellipse: "ellipse";
      hyperbola: "hyperbola";
      rectangular: "rectangular";
    }>>;
    a: import("zod").ZodOptional<import("zod").ZodNumber>;
    b: import("zod").ZodOptional<import("zod").ZodNumber>;
    c: import("zod").ZodOptional<import("zod").ZodNumber>;
    showFocusDirectrix: import("zod").ZodOptional<import("zod").ZodBoolean>;
    showAsymptotes: import("zod").ZodOptional<import("zod").ZodBoolean>;
    snap: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    ask: import("zod").ZodOptional<import("zod").ZodObject<{
      prompt: import("zod").ZodString;
      placeholder: import("zod").ZodOptional<import("zod").ZodString>;
      answer: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"number">;
        value: import("zod").ZodNumber;
        tol: import("zod").ZodOptional<import("zod").ZodNumber>;
      }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"expression">;
        value: import("zod").ZodString;
      }, import("zod/v4/core").$strip>]>>;
      choices: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
        value: import("zod").ZodString;
        label: import("zod").ZodString;
      }, import("zod/v4/core").$strip>>>;
      correct: import("zod").ZodOptional<import("zod").ZodString>;
      explain: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>;
    activity: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    kind?: "parabola" | "ellipse" | "hyperbola" | "rectangular" | undefined;
    a?: number | undefined;
    b?: number | undefined;
    c?: number | undefined;
    showFocusDirectrix?: boolean | undefined;
    showAsymptotes?: boolean | undefined;
    snap?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    kind?: "parabola" | "ellipse" | "hyperbola" | "rectangular" | undefined;
    a?: number | undefined;
    b?: number | undefined;
    c?: number | undefined;
    showFocusDirectrix?: boolean | undefined;
    showAsymptotes?: boolean | undefined;
    snap?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    kind?: "parabola" | "ellipse" | "hyperbola" | "rectangular" | undefined;
    a?: number | undefined;
    b?: number | undefined;
    c?: number | undefined;
    showFocusDirectrix?: boolean | undefined;
    showAsymptotes?: boolean | undefined;
    snap?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    equation: import("zod").ZodOptional<import("zod").ZodString>;
    xRange: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
    restrict: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodNumber, import("zod").ZodNumber], null>>;
    probe: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    ask: import("zod").ZodOptional<import("zod").ZodObject<{
      prompt: import("zod").ZodString;
      placeholder: import("zod").ZodOptional<import("zod").ZodString>;
      answer: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"number">;
        value: import("zod").ZodNumber;
        tol: import("zod").ZodOptional<import("zod").ZodNumber>;
      }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"expression">;
        value: import("zod").ZodString;
      }, import("zod/v4/core").$strip>]>>;
      choices: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
        value: import("zod").ZodString;
        label: import("zod").ZodString;
      }, import("zod/v4/core").$strip>>>;
      correct: import("zod").ZodOptional<import("zod").ZodString>;
      explain: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>;
    activity: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    equation?: string | undefined;
    xRange?: [number, number] | undefined;
    restrict?: [number, number] | undefined;
    probe?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    equation?: string | undefined;
    xRange?: [number, number] | undefined;
    restrict?: [number, number] | undefined;
    probe?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    equation?: string | undefined;
    xRange?: [number, number] | undefined;
    restrict?: [number, number] | undefined;
    probe?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    slope: import("zod").ZodDefault<import("zod").ZodNumber>;
    intercept: import("zod").ZodDefault<import("zod").ZodNumber>;
    predictX: import("zod").ZodDefault<import("zod").ZodNumber>;
    xMax: import("zod").ZodDefault<import("zod").ZodNumber>;
    yMax: import("zod").ZodDefault<import("zod").ZodNumber>;
    yStep: import("zod").ZodDefault<import("zod").ZodNumber>;
    xLabel: import("zod").ZodDefault<import("zod").ZodString>;
    yLabel: import("zod").ZodDefault<import("zod").ZodString>;
    unit: import("zod").ZodDefault<import("zod").ZodString>;
    scene: import("zod").ZodDefault<import("zod").ZodString>;
    vesselObjects: import("zod").ZodDefault<import("zod").ZodBoolean>;
    vesselBinds: import("zod").ZodDefault<import("zod").ZodEnum<{
      guess: "guess";
      truth: "truth";
    }>>;
    objectLabel: import("zod").ZodOptional<import("zod").ZodString>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    ask: import("zod").ZodOptional<import("zod").ZodObject<{
      prompt: import("zod").ZodString;
      placeholder: import("zod").ZodOptional<import("zod").ZodString>;
      answer: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"number">;
        value: import("zod").ZodNumber;
        tol: import("zod").ZodOptional<import("zod").ZodNumber>;
      }, import("zod/v4/core").$strip>, import("zod").ZodObject<{
        kind: import("zod").ZodLiteral<"expression">;
        value: import("zod").ZodString;
      }, import("zod/v4/core").$strip>]>>;
      choices: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
        value: import("zod").ZodString;
        label: import("zod").ZodString;
      }, import("zod/v4/core").$strip>>>;
      correct: import("zod").ZodOptional<import("zod").ZodString>;
      explain: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>;
    activity: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    slope: number;
    intercept: number;
    predictX: number;
    xMax: number;
    yMax: number;
    yStep: number;
    xLabel: string;
    yLabel: string;
    unit: string;
    scene: string;
    vesselObjects: boolean;
    vesselBinds: "guess" | "truth";
    objectLabel?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    slope: number;
    intercept: number;
    predictX: number;
    xMax: number;
    yMax: number;
    yStep: number;
    xLabel: string;
    yLabel: string;
    unit: string;
    scene: string;
    vesselObjects: boolean;
    vesselBinds: "guess" | "truth";
    objectLabel?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    slope: number;
    intercept: number;
    predictX: number;
    xMax: number;
    yMax: number;
    yStep: number;
    xLabel: string;
    yLabel: string;
    unit: string;
    scene: string;
    vesselObjects: boolean;
    vesselBinds: "guess" | "truth";
    objectLabel?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    ask?: {
      prompt: string;
      placeholder?: string | undefined;
      answer?: {
        kind: "number";
        value: number;
        tol?: number | undefined;
      } | {
        kind: "expression";
        value: string;
      } | undefined;
      choices?: {
        value: string;
        label: string;
      }[] | undefined;
      correct?: string | undefined;
      explain?: string | undefined;
    } | undefined;
    activity?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    start: import("zod").ZodDefault<import("zod").ZodNumber>;
    rule: import("zod").ZodDefault<import("zod").ZodEnum<{
      geometric: "geometric";
      arithmetic: "arithmetic";
    }>>;
    factor: import("zod").ZodDefault<import("zod").ZodNumber>;
    shown: import("zod").ZodDefault<import("zod").ZodNumber>;
    predict: import("zod").ZodDefault<import("zod").ZodNumber>;
    stepLabel: import("zod").ZodDefault<import("zod").ZodString>;
    highlightNew: import("zod").ZodDefault<import("zod").ZodBoolean>;
    scene: import("zod").ZodDefault<import("zod").ZodString>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    activity: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    start: number;
    rule: "geometric" | "arithmetic";
    factor: number;
    shown: number;
    predict: number;
    stepLabel: string;
    highlightNew: boolean;
    scene: string;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    start: number;
    rule: "geometric" | "arithmetic";
    factor: number;
    shown: number;
    predict: number;
    stepLabel: string;
    highlightNew: boolean;
    scene: string;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    start: number;
    rule: "geometric" | "arithmetic";
    factor: number;
    shown: number;
    predict: number;
    stepLabel: string;
    highlightNew: boolean;
    scene: string;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    kind: import("zod").ZodDefault<import("zod").ZodEnum<{
      translate: "translate";
      reflect: "reflect";
      rotate: "rotate";
      enlarge: "enlarge";
    }>>;
    byX: import("zod").ZodDefault<import("zod").ZodNumber>;
    byY: import("zod").ZodDefault<import("zod").ZodNumber>;
    axis: import("zod").ZodDefault<import("zod").ZodEnum<{
      x: "x";
      y: "y";
      "y=x": "y=x";
      "y=-x": "y=-x";
    }>>;
    deg: import("zod").ZodDefault<import("zod").ZodNumber>;
    k: import("zod").ZodDefault<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    activity: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    kind: "translate" | "reflect" | "rotate" | "enlarge";
    byX: number;
    byY: number;
    axis: "x" | "y" | "y=x" | "y=-x";
    deg: number;
    k: number;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    kind: "translate" | "reflect" | "rotate" | "enlarge";
    byX: number;
    byY: number;
    axis: "x" | "y" | "y=x" | "y=-x";
    deg: number;
    k: number;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    kind: "translate" | "reflect" | "rotate" | "enlarge";
    byX: number;
    byY: number;
    axis: "x" | "y" | "y=x" | "y=-x";
    deg: number;
    k: number;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    store: import("zod").ZodDefault<import("zod").ZodString>;
    currency: import("zod").ZodDefault<import("zod").ZodString>;
    items: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      qty: import("zod").ZodNumber;
      name: import("zod").ZodString;
      unit: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>>;
    askItems: import("zod").ZodDefault<import("zod").ZodBoolean>;
    askCost: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    activity: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    store: string;
    currency: string;
    askItems: boolean;
    askCost: boolean;
    items?: {
      qty: number;
      name: string;
      unit: number;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    store: string;
    currency: string;
    askItems: boolean;
    askCost: boolean;
    items?: {
      qty: number;
      name: string;
      unit: number;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    store: string;
    currency: string;
    askItems: boolean;
    askCost: boolean;
    items?: {
      qty: number;
      name: string;
      unit: number;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    scene: import("zod").ZodDefault<import("zod").ZodString>;
    symA: import("zod").ZodDefault<import("zod").ZodString>;
    labelA: import("zod").ZodDefault<import("zod").ZodString>;
    answerA: import("zod").ZodDefault<import("zod").ZodNumber>;
    symB: import("zod").ZodDefault<import("zod").ZodString>;
    labelB: import("zod").ZodDefault<import("zod").ZodString>;
    answerB: import("zod").ZodDefault<import("zod").ZodNumber>;
    a0: import("zod").ZodDefault<import("zod").ZodNumber>;
    b0: import("zod").ZodDefault<import("zod").ZodNumber>;
    a1: import("zod").ZodDefault<import("zod").ZodNumber>;
    b1: import("zod").ZodDefault<import("zod").ZodNumber>;
    currency: import("zod").ZodOptional<import("zod").ZodString>;
    unit: import("zod").ZodOptional<import("zod").ZodString>;
    store: import("zod").ZodOptional<import("zod").ZodString>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    activity: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    scene: string;
    symA: string;
    labelA: string;
    answerA: number;
    symB: string;
    labelB: string;
    answerB: number;
    a0: number;
    b0: number;
    a1: number;
    b1: number;
    currency?: string | undefined;
    unit?: string | undefined;
    store?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    scene: string;
    symA: string;
    labelA: string;
    answerA: number;
    symB: string;
    labelB: string;
    answerB: number;
    a0: number;
    b0: number;
    a1: number;
    b1: number;
    currency?: string | undefined;
    unit?: string | undefined;
    store?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    scene: string;
    symA: string;
    labelA: string;
    answerA: number;
    symB: string;
    labelB: string;
    answerB: number;
    a0: number;
    b0: number;
    a1: number;
    b1: number;
    currency?: string | undefined;
    unit?: string | undefined;
    store?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
    activity?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    name: import("zod").ZodDefault<import("zod").ZodString>;
    label: import("zod").ZodOptional<import("zod").ZodString>;
    variant: import("zod").ZodDefault<import("zod").ZodEnum<{
      count: "count";
      icons: "icons";
      shape: "shape";
    }>>;
    icon: import("zod").ZodDefault<import("zod").ZodString>;
    slots: import("zod").ZodDefault<import("zod").ZodNumber>;
    shape: import("zod").ZodDefault<import("zod").ZodEnum<{
      box: "box";
      cup: "cup";
      circle: "circle";
    }>>;
    color: import("zod").ZodDefault<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    name: string;
    variant: "count" | "icons" | "shape";
    icon: string;
    slots: number;
    shape: "box" | "cup" | "circle";
    color: string;
    label?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    name: string;
    variant: "count" | "icons" | "shape";
    icon: string;
    slots: number;
    shape: "box" | "cup" | "circle";
    color: string;
    label?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    name: string;
    variant: "count" | "icons" | "shape";
    icon: string;
    slots: number;
    shape: "box" | "cup" | "circle";
    color: string;
    label?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    targetMeters: import("zod").ZodOptional<import("zod").ZodNumber>;
    g: import("zod").ZodOptional<import("zod").ZodNumber>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    targetMeters?: number | undefined;
    g?: number | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    targetMeters?: number | undefined;
    g?: number | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    targetMeters?: number | undefined;
    g?: number | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{}, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<Record<string, never>>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: Record<string, never>) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<Record<string, never>>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    height: import("zod").ZodOptional<import("zod").ZodNumber>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    height?: number | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    height?: number | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    height?: number | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    boatSpeed: import("zod").ZodOptional<import("zod").ZodNumber>;
    current: import("zod").ZodOptional<import("zod").ZodNumber>;
    riverWidth: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    boatSpeed?: number | undefined;
    current?: number | undefined;
    riverWidth?: number | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    boatSpeed?: number | undefined;
    current?: number | undefined;
    riverWidth?: number | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    boatSpeed?: number | undefined;
    current?: number | undefined;
    riverWidth?: number | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    knownWeight: import("zod").ZodDefault<import("zod").ZodNumber>;
    knownDist: import("zod").ZodDefault<import("zod").ZodNumber>;
    unknownDist: import("zod").ZodDefault<import("zod").ZodNumber>;
    controlId: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    knownWeight: number;
    knownDist: number;
    unknownDist: number;
    controlId?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    knownWeight: number;
    knownDist: number;
    unknownDist: number;
    controlId?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    knownWeight: number;
    knownDist: number;
    unknownDist: number;
    controlId?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    vectors: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
      label: import("zod").ZodOptional<import("zod").ZodString>;
      dx: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
      dy: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
      color: import("zod").ZodOptional<import("zod").ZodString>;
      drag: import("zod").ZodOptional<import("zod").ZodBoolean>;
    }, import("zod/v4/core").$strip>>>;
    combine: import("zod").ZodDefault<import("zod").ZodEnum<{
      sum: "sum";
      diff: "diff";
      none: "none";
    }>>;
    goalX: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
    goalY: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString]>>;
    components: import("zod").ZodOptional<import("zod").ZodBoolean>;
    angle: import("zod").ZodDefault<import("zod").ZodBoolean>;
    objectives: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    hints: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    vectors: {
      label?: string | undefined;
      dx?: string | number | undefined;
      dy?: string | number | undefined;
      color?: string | undefined;
      drag?: boolean | undefined;
    }[];
    combine: "sum" | "diff" | "none";
    angle: boolean;
    goalX?: string | number | undefined;
    goalY?: string | number | undefined;
    components?: boolean | undefined;
    objectives?: string[] | undefined;
    hints?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    vectors: {
      label?: string | undefined;
      dx?: string | number | undefined;
      dy?: string | number | undefined;
      color?: string | undefined;
      drag?: boolean | undefined;
    }[];
    combine: "sum" | "diff" | "none";
    angle: boolean;
    goalX?: string | number | undefined;
    goalY?: string | number | undefined;
    components?: boolean | undefined;
    objectives?: string[] | undefined;
    hints?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    vectors: {
      label?: string | undefined;
      dx?: string | number | undefined;
      dy?: string | number | undefined;
      color?: string | undefined;
      drag?: boolean | undefined;
    }[];
    combine: "sum" | "diff" | "none";
    angle: boolean;
    goalX?: string | number | undefined;
    goalY?: string | number | undefined;
    components?: boolean | undefined;
    objectives?: string[] | undefined;
    hints?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    title: import("zod").ZodOptional<import("zod").ZodString>;
    types: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      name: import("zod").ZodString;
      caption: import("zod").ZodString;
      vectors: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
        tail: import("zod").ZodOptional<import("zod").ZodObject<{
          x: import("zod").ZodNumber;
          y: import("zod").ZodNumber;
        }, import("zod/v4/core").$strip>>;
        comp: import("zod").ZodObject<{
          x: import("zod").ZodNumber;
          y: import("zod").ZodNumber;
        }, import("zod/v4/core").$strip>;
        color: import("zod").ZodOptional<import("zod").ZodString>;
        label: import("zod").ZodOptional<import("zod").ZodString>;
      }, import("zod/v4/core").$strip>>>;
      origin: import("zod").ZodOptional<import("zod").ZodBoolean>;
    }, import("zod/v4/core").$strip>>>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    title?: string | undefined;
    types?: {
      name: string;
      caption: string;
      vectors?: {
        comp: {
          x: number;
          y: number;
        };
        tail?: {
          x: number;
          y: number;
        } | undefined;
        color?: string | undefined;
        label?: string | undefined;
      }[] | undefined;
      origin?: boolean | undefined;
    }[] | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    title?: string | undefined;
    types?: {
      name: string;
      caption: string;
      vectors?: {
        comp: {
          x: number;
          y: number;
        };
        tail?: {
          x: number;
          y: number;
        } | undefined;
        color?: string | undefined;
        label?: string | undefined;
      }[] | undefined;
      origin?: boolean | undefined;
    }[] | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    title?: string | undefined;
    types?: {
      name: string;
      caption: string;
      vectors?: {
        comp: {
          x: number;
          y: number;
        };
        tail?: {
          x: number;
          y: number;
        } | undefined;
        color?: string | undefined;
        label?: string | undefined;
      }[] | undefined;
      origin?: boolean | undefined;
    }[] | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    maxSpeed: import("zod").ZodDefault<import("zod").ZodNumber>;
    start: import("zod").ZodDefault<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    maxSpeed: number;
    start: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    maxSpeed: number;
    start: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    maxSpeed: number;
    start: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    speed: import("zod").ZodDefault<import("zod").ZodNumber>;
    reactionTime: import("zod").ZodDefault<import("zod").ZodNumber>;
    deceleration: import("zod").ZodDefault<import("zod").ZodNumber>;
    predict: import("zod").ZodDefault<import("zod").ZodBoolean>;
    showGraphs: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    speed: number;
    reactionTime: number;
    deceleration: number;
    predict: boolean;
    showGraphs: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    speed: number;
    reactionTime: number;
    deceleration: number;
    predict: boolean;
    showGraphs: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    speed: number;
    reactionTime: number;
    deceleration: number;
    predict: boolean;
    showGraphs: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    angleDeg: import("zod").ZodDefault<import("zod").ZodNumber>;
    mass: import("zod").ZodDefault<import("zod").ZodNumber>;
    friction: import("zod").ZodDefault<import("zod").ZodNumber>;
    showComponents: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    controls: import("zod").ZodOptional<import("zod").ZodObject<{
      hide: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
      lock: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    }, import("zod/v4/core").$strip>>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    angleDeg: number;
    mass: number;
    friction: number;
    showComponents: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
    controls?: {
      hide?: string[] | undefined;
      lock?: string[] | undefined;
    } | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    angleDeg: number;
    mass: number;
    friction: number;
    showComponents: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
    controls?: {
      hide?: string[] | undefined;
      lock?: string[] | undefined;
    } | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    angleDeg: number;
    mass: number;
    friction: number;
    showComponents: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
    controls?: {
      hide?: string[] | undefined;
      lock?: string[] | undefined;
    } | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    m1: import("zod").ZodDefault<import("zod").ZodNumber>;
    m2: import("zod").ZodDefault<import("zod").ZodNumber>;
    u1: import("zod").ZodDefault<import("zod").ZodNumber>;
    u2: import("zod").ZodDefault<import("zod").ZodNumber>;
    elasticity: import("zod").ZodDefault<import("zod").ZodNumber>;
    showCenterOfMass: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    m1: number;
    m2: number;
    u1: number;
    u2: number;
    elasticity: number;
    showCenterOfMass: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    m1: number;
    m2: number;
    u1: number;
    u2: number;
    elasticity: number;
    showCenterOfMass: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    m1: number;
    m2: number;
    u1: number;
    u2: number;
    elasticity: number;
    showCenterOfMass: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    holdConstant: import("zod").ZodDefault<import("zod").ZodEnum<{
      none: "none";
      volume: "volume";
      temperature: "temperature";
      pressure: "pressure";
    }>>;
    particleCount: import("zod").ZodDefault<import("zod").ZodNumber>;
    temperature: import("zod").ZodDefault<import("zod").ZodNumber>;
    volume: import("zod").ZodDefault<import("zod").ZodNumber>;
    showGauge: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    holdConstant: "none" | "volume" | "temperature" | "pressure";
    particleCount: number;
    temperature: number;
    volume: number;
    showGauge: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    holdConstant: "none" | "volume" | "temperature" | "pressure";
    particleCount: number;
    temperature: number;
    volume: number;
    showGauge: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    holdConstant: "none" | "volume" | "temperature" | "pressure";
    particleCount: number;
    temperature: number;
    volume: number;
    showGauge: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    moles: import("zod").ZodDefault<import("zod").ZodNumber>;
    volume: import("zod").ZodDefault<import("zod").ZodNumber>;
    showProbe: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    moles: number;
    volume: number;
    showProbe: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    moles: number;
    volume: number;
    showProbe: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    moles: number;
    volume: number;
    showProbe: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    stockConcentration: import("zod").ZodDefault<import("zod").ZodNumber>;
    aliquotVolume: import("zod").ZodDefault<import("zod").ZodNumber>;
    finalVolume: import("zod").ZodDefault<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    stockConcentration: number;
    aliquotVolume: number;
    finalVolume: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    stockConcentration: number;
    aliquotVolume: number;
    finalVolume: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    stockConcentration: number;
    aliquotVolume: number;
    finalVolume: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    protons: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    protons?: number | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    protons?: number | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    protons?: number | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    deltaH: import("zod").ZodOptional<import("zod").ZodNumber>;
    activationEnergy: import("zod").ZodOptional<import("zod").ZodNumber>;
    catalyst: import("zod").ZodOptional<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    deltaH?: number | undefined;
    activationEnergy?: number | undefined;
    catalyst?: boolean | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    deltaH?: number | undefined;
    activationEnergy?: number | undefined;
    catalyst?: boolean | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    deltaH?: number | undefined;
    activationEnergy?: number | undefined;
    catalyst?: boolean | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    a: import("zod").ZodOptional<import("zod").ZodString>;
    b: import("zod").ZodOptional<import("zod").ZodString>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    a?: string | undefined;
    b?: string | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    a?: string | undefined;
    b?: string | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    a?: string | undefined;
    b?: string | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    emf: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    emf?: number | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    emf?: number | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    emf?: number | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    factor: import("zod").ZodDefault<import("zod").ZodEnum<{
      temperature: "temperature";
      pH: "pH";
    }>>;
    optimum: import("zod").ZodDefault<import("zod").ZodNumber>;
    factorMin: import("zod").ZodDefault<import("zod").ZodNumber>;
    factorMax: import("zod").ZodDefault<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    factor: "temperature" | "pH";
    optimum: number;
    factorMin: number;
    factorMax: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    factor: "temperature" | "pH";
    optimum: number;
    factorMin: number;
    factorMax: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    factor: "temperature" | "pH";
    optimum: number;
    factorMin: number;
    factorMax: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    light: import("zod").ZodDefault<import("zod").ZodNumber>;
    co2: import("zod").ZodDefault<import("zod").ZodNumber>;
    temperature: import("zod").ZodDefault<import("zod").ZodNumber>;
    tempOptimum: import("zod").ZodDefault<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    light: number;
    co2: number;
    temperature: number;
    tempOptimum: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    light: number;
    co2: number;
    temperature: number;
    tempOptimum: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    light: number;
    co2: number;
    temperature: number;
    tempOptimum: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    parent1: import("zod").ZodDefault<import("zod").ZodString>;
    parent2: import("zod").ZodDefault<import("zod").ZodString>;
    alleleLetter: import("zod").ZodDefault<import("zod").ZodString>;
    dominantLabel: import("zod").ZodDefault<import("zod").ZodString>;
    recessiveLabel: import("zod").ZodDefault<import("zod").ZodString>;
    predictFirst: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    parent1: string;
    parent2: string;
    alleleLetter: string;
    dominantLabel: string;
    recessiveLabel: string;
    predictFirst: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    parent1: string;
    parent2: string;
    alleleLetter: string;
    dominantLabel: string;
    recessiveLabel: string;
    predictFirst: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    parent1: string;
    parent2: string;
    alleleLetter: string;
    dominantLabel: string;
    recessiveLabel: string;
    predictFirst: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    mode: import("zod").ZodDefault<import("zod").ZodEnum<{
      day: "day";
      night: "night";
    }>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    mode: "day" | "night";
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    mode: "day" | "night";
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    mode: "day" | "night";
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    preset: import("zod").ZodDefault<import("zod").ZodEnum<{
      custom: "custom";
      monohybrid: "monohybrid";
      "blood-type": "blood-type";
      incomplete: "incomplete";
      dihybrid: "dihybrid";
    }>>;
    spec: import("zod").ZodOptional<import("zod").ZodObject<{
      trait: import("zod").ZodOptional<import("zod").ZodString>;
      alleles: import("zod").ZodArray<import("zod").ZodObject<{
        symbol: import("zod").ZodString;
        rank: import("zod").ZodNumber;
        trait: import("zod").ZodString;
      }, import("zod/v4/core").$strip>>;
      blends: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
        pair: import("zod").ZodTuple<[import("zod").ZodString, import("zod").ZodString], null>;
        label: import("zod").ZodString;
        color: import("zod").ZodOptional<import("zod").ZodString>;
      }, import("zod/v4/core").$strip>>>;
      colors: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>>;
    }, import("zod/v4/core").$strip>>;
    parent1: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    parent2: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    predictFirst: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    preset: "custom" | "monohybrid" | "blood-type" | "incomplete" | "dihybrid";
    predictFirst: boolean;
    spec?: {
      alleles: {
        symbol: string;
        rank: number;
        trait: string;
      }[];
      trait?: string | undefined;
      blends?: {
        pair: [string, string];
        label: string;
        color?: string | undefined;
      }[] | undefined;
      colors?: Record<string, string> | undefined;
    } | undefined;
    parent1?: string[] | undefined;
    parent2?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    preset: "custom" | "monohybrid" | "blood-type" | "incomplete" | "dihybrid";
    predictFirst: boolean;
    spec?: {
      alleles: {
        symbol: string;
        rank: number;
        trait: string;
      }[];
      trait?: string | undefined;
      blends?: {
        pair: [string, string];
        label: string;
        color?: string | undefined;
      }[] | undefined;
      colors?: Record<string, string> | undefined;
    } | undefined;
    parent1?: string[] | undefined;
    parent2?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    preset: "custom" | "monohybrid" | "blood-type" | "incomplete" | "dihybrid";
    predictFirst: boolean;
    spec?: {
      alleles: {
        symbol: string;
        rank: number;
        trait: string;
      }[];
      trait?: string | undefined;
      blends?: {
        pair: [string, string];
        label: string;
        color?: string | undefined;
      }[] | undefined;
      colors?: Record<string, string> | undefined;
    } | undefined;
    parent1?: string[] | undefined;
    parent2?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    kind: import("zod").ZodDefault<import("zod").ZodEnum<{
      translation: "translation";
      replication: "replication";
      transcription: "transcription";
    }>>;
    template: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    kind: "translation" | "replication" | "transcription";
    template?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    kind: "translation" | "replication" | "transcription";
    template?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    kind: "translation" | "replication" | "transcription";
    template?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    allele: import("zod").ZodDefault<import("zod").ZodString>;
    dominant: import("zod").ZodDefault<import("zod").ZodString>;
    recessive: import("zod").ZodDefault<import("zod").ZodString>;
    mother: import("zod").ZodOptional<import("zod").ZodTuple<[import("zod").ZodString, import("zod").ZodString], null>>;
    father: import("zod").ZodOptional<import("zod").ZodString>;
    predictFirst: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    allele: string;
    dominant: string;
    recessive: string;
    predictFirst: boolean;
    mother?: [string, string] | undefined;
    father?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    allele: string;
    dominant: string;
    recessive: string;
    predictFirst: boolean;
    mother?: [string, string] | undefined;
    father?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    allele: string;
    dominant: string;
    recessive: string;
    predictFirst: boolean;
    mother?: [string, string] | undefined;
    father?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    dna: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    dna?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    dna?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    dna?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    voltage: import("zod").ZodOptional<import("zod").ZodNumber>;
    r1: import("zod").ZodOptional<import("zod").ZodNumber>;
    r2: import("zod").ZodOptional<import("zod").ZodNumber>;
    mode: import("zod").ZodOptional<import("zod").ZodEnum<{
      parallel: "parallel";
      series: "series";
    }>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    voltage?: number | undefined;
    r1?: number | undefined;
    r2?: number | undefined;
    mode?: "parallel" | "series" | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    voltage?: number | undefined;
    r1?: number | undefined;
    r2?: number | undefined;
    mode?: "parallel" | "series" | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    voltage?: number | undefined;
    r1?: number | undefined;
    r2?: number | undefined;
    mode?: "parallel" | "series" | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    battery: import("zod").ZodOptional<import("zod").ZodNumber>;
    components: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    battery?: number | undefined;
    components?: Record<string, unknown>[] | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    battery?: number | undefined;
    components?: Record<string, unknown>[] | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    battery?: number | undefined;
    components?: Record<string, unknown>[] | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    doc: import("zod").ZodOptional<import("zod").ZodObject<{
      parts: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
        id: import("zod").ZodString;
        kind: import("zod").ZodString;
        at: import("zod").ZodObject<{
          x: import("zod").ZodNumber;
          y: import("zod").ZodNumber;
        }, import("zod/v4/core").$strip>;
        orient: import("zod").ZodOptional<import("zod").ZodEnum<{
          h: "h";
          v: "v";
        }>>;
        props: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnion<readonly [import("zod").ZodNumber, import("zod").ZodString, import("zod").ZodBoolean]>>>;
        pins: import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>;
      }, import("zod/v4/core").$strip>>>;
      nodes: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
        id: import("zod").ZodString;
        at: import("zod").ZodObject<{
          x: import("zod").ZodNumber;
          y: import("zod").ZodNumber;
        }, import("zod/v4/core").$strip>;
      }, import("zod/v4/core").$strip>>>;
      size: import("zod").ZodOptional<import("zod").ZodObject<{
        w: import("zod").ZodNumber;
        h: import("zod").ZodNumber;
      }, import("zod/v4/core").$strip>>;
    }, import("zod/v4/core").$strip>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    doc?: {
      parts: {
        id: string;
        kind: string;
        at: {
          x: number;
          y: number;
        };
        pins: Record<string, string>;
        orient?: "h" | "v" | undefined;
        props?: Record<string, string | number | boolean> | undefined;
      }[];
      nodes: {
        id: string;
        at: {
          x: number;
          y: number;
        };
      }[];
      size?: {
        w: number;
        h: number;
      } | undefined;
    } | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    doc?: {
      parts: {
        id: string;
        kind: string;
        at: {
          x: number;
          y: number;
        };
        pins: Record<string, string>;
        orient?: "h" | "v" | undefined;
        props?: Record<string, string | number | boolean> | undefined;
      }[];
      nodes: {
        id: string;
        at: {
          x: number;
          y: number;
        };
      }[];
      size?: {
        w: number;
        h: number;
      } | undefined;
    } | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    doc?: {
      parts: {
        id: string;
        kind: string;
        at: {
          x: number;
          y: number;
        };
        pins: Record<string, string>;
        orient?: "h" | "v" | undefined;
        props?: Record<string, string | number | boolean> | undefined;
      }[];
      nodes: {
        id: string;
        at: {
          x: number;
          y: number;
        };
      }[];
      size?: {
        w: number;
        h: number;
      } | undefined;
    } | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    emf: import("zod").ZodDefault<import("zod").ZodNumber>;
    bulbOhms: import("zod").ZodDefault<import("zod").ZodNumber>;
    withSwitch: import("zod").ZodDefault<import("zod").ZodBoolean>;
    controlId: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    emf: number;
    bulbOhms: number;
    withSwitch: boolean;
    controlId?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    emf: number;
    bulbOhms: number;
    withSwitch: boolean;
    controlId?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    emf: number;
    bulbOhms: number;
    withSwitch: boolean;
    controlId?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    mode: import("zod").ZodDefault<import("zod").ZodEnum<{
      n: "n";
      intrinsic: "intrinsic";
      p: "p";
    }>>;
    temperature: import("zod").ZodDefault<import("zod").ZodNumber>;
    lockDoping: import("zod").ZodDefault<import("zod").ZodBoolean>;
    showTemperature: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    mode: "n" | "intrinsic" | "p";
    temperature: number;
    lockDoping: boolean;
    showTemperature: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    mode: "n" | "intrinsic" | "p";
    temperature: number;
    lockDoping: boolean;
    showTemperature: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    mode: "n" | "intrinsic" | "p";
    temperature: number;
    lockDoping: boolean;
    showTemperature: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    pmos: import("zod").ZodDefault<import("zod").ZodBoolean>;
    vth: import("zod").ZodDefault<import("zod").ZodNumber>;
    k: import("zod").ZodDefault<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    pmos: boolean;
    vth: number;
    k: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    pmos: boolean;
    vth: number;
    k: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    pmos: boolean;
    vth: number;
    k: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    pnp: import("zod").ZodDefault<import("zod").ZodBoolean>;
    beta: import("zod").ZodDefault<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    pnp: boolean;
    beta: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    pnp: boolean;
    beta: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    pnp: boolean;
    beta: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    emf: import("zod").ZodDefault<import("zod").ZodNumber>;
    rK: import("zod").ZodDefault<import("zod").ZodNumber>;
    capU: import("zod").ZodDefault<import("zod").ZodNumber>;
    leakK: import("zod").ZodDefault<import("zod").ZodNumber>;
    startCharged: import("zod").ZodOptional<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    emf: number;
    rK: number;
    capU: number;
    leakK: number;
    startCharged?: boolean | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    emf: number;
    rK: number;
    capU: number;
    leakK: number;
    startCharged?: boolean | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    emf: number;
    rK: number;
    capU: number;
    leakK: number;
    startCharged?: boolean | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    volts: import("zod").ZodOptional<import("zod").ZodNumber>;
    resistanceK: import("zod").ZodOptional<import("zod").ZodNumber>;
    capacitanceU: import("zod").ZodOptional<import("zod").ZodNumber>;
    show: import("zod").ZodOptional<import("zod").ZodEnum<{
      graph: "graph";
      circuit: "circuit";
      both: "both";
    }>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    volts?: number | undefined;
    resistanceK?: number | undefined;
    capacitanceU?: number | undefined;
    show?: "graph" | "circuit" | "both" | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    volts?: number | undefined;
    resistanceK?: number | undefined;
    capacitanceU?: number | undefined;
    show?: "graph" | "circuit" | "both" | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    volts?: number | undefined;
    resistanceK?: number | undefined;
    capacitanceU?: number | undefined;
    show?: "graph" | "circuit" | "both" | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    volts: import("zod").ZodOptional<import("zod").ZodNumber>;
    resistanceK: import("zod").ZodOptional<import("zod").ZodNumber>;
    show: import("zod").ZodOptional<import("zod").ZodEnum<{
      graph: "graph";
      circuit: "circuit";
      both: "both";
    }>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    volts?: number | undefined;
    resistanceK?: number | undefined;
    show?: "graph" | "circuit" | "both" | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    volts?: number | undefined;
    resistanceK?: number | undefined;
    show?: "graph" | "circuit" | "both" | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    volts?: number | undefined;
    resistanceK?: number | undefined;
    show?: "graph" | "circuit" | "both" | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    supply: import("zod").ZodOptional<import("zod").ZodNumber>;
    vth: import("zod").ZodOptional<import("zod").ZodNumber>;
    loadK: import("zod").ZodOptional<import("zod").ZodNumber>;
    show: import("zod").ZodOptional<import("zod").ZodEnum<{
      graph: "graph";
      circuit: "circuit";
      both: "both";
    }>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    supply?: number | undefined;
    vth?: number | undefined;
    loadK?: number | undefined;
    show?: "graph" | "circuit" | "both" | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    supply?: number | undefined;
    vth?: number | undefined;
    loadK?: number | undefined;
    show?: "graph" | "circuit" | "both" | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    supply?: number | undefined;
    vth?: number | undefined;
    loadK?: number | undefined;
    show?: "graph" | "circuit" | "both" | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    vdd: import("zod").ZodOptional<import("zod").ZodNumber>;
    vth: import("zod").ZodOptional<import("zod").ZodNumber>;
    rpull: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    vdd?: number | undefined;
    vth?: number | undefined;
    rpull?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    vdd?: number | undefined;
    vth?: number | undefined;
    rpull?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    vdd?: number | undefined;
    vth?: number | undefined;
    rpull?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    vdd: import("zod").ZodOptional<import("zod").ZodNumber>;
    vth: import("zod").ZodOptional<import("zod").ZodNumber>;
    show: import("zod").ZodOptional<import("zod").ZodEnum<{
      graph: "graph";
      circuit: "circuit";
      both: "both";
    }>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    vdd?: number | undefined;
    vth?: number | undefined;
    show?: "graph" | "circuit" | "both" | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    vdd?: number | undefined;
    vth?: number | undefined;
    show?: "graph" | "circuit" | "both" | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    vdd?: number | undefined;
    vth?: number | undefined;
    show?: "graph" | "circuit" | "both" | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    vdd: import("zod").ZodOptional<import("zod").ZodNumber>;
    vth: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    vdd?: number | undefined;
    vth?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    vdd?: number | undefined;
    vth?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    vdd?: number | undefined;
    vth?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    vth: import("zod").ZodOptional<import("zod").ZodNumber>;
    vmax: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    vth?: number | undefined;
    vmax?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    vth?: number | undefined;
    vmax?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    vth?: number | undefined;
    vmax?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    scene: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodUnknown>>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    scene?: Record<string, unknown>[] | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    scene?: Record<string, unknown>[] | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    scene?: Record<string, unknown>[] | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    r1: import("zod").ZodOptional<import("zod").ZodNumber>;
    r2: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    r1?: number | undefined;
    r2?: number | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    r1?: number | undefined;
    r2?: number | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    r1?: number | undefined;
    r2?: number | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<unknown>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: unknown) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<unknown>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    base: import("zod").ZodDefault<import("zod").ZodNumber>;
    width: import("zod").ZodDefault<import("zod").ZodNumber>;
    start: import("zod").ZodDefault<import("zod").ZodNumber>;
    target: import("zod").ZodOptional<import("zod").ZodNumber>;
    showWeights: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    base: number;
    width: number;
    start: number;
    showWeights: boolean;
    target?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    base: number;
    width: number;
    start: number;
    showWeights: boolean;
    target?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    base: number;
    width: number;
    start: number;
    showWeights: boolean;
    target?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    width: import("zod").ZodDefault<import("zod").ZodNumber>;
    groupSize: import("zod").ZodDefault<import("zod").ZodNumber>;
    start: import("zod").ZodDefault<import("zod").ZodNumber>;
    showColor: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    width: number;
    groupSize: number;
    start: number;
    showColor: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    width: number;
    groupSize: number;
    start: number;
    showColor: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    width: number;
    groupSize: number;
    start: number;
    showColor: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    max: import("zod").ZodDefault<import("zod").ZodNumber>;
    start: import("zod").ZodDefault<import("zod").ZodNumber>;
    race: import("zod").ZodDefault<import("zod").ZodBoolean>;
    speed: import("zod").ZodDefault<import("zod").ZodNumber>;
    highlightBase: import("zod").ZodOptional<import("zod").ZodNumber>;
    target: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    max: number;
    start: number;
    race: boolean;
    speed: number;
    highlightBase?: number | undefined;
    target?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    max: number;
    start: number;
    race: boolean;
    speed: number;
    highlightBase?: number | undefined;
    target?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    max: number;
    start: number;
    race: boolean;
    speed: number;
    highlightBase?: number | undefined;
    target?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    preset: import("zod").ZodDefault<import("zod").ZodEnum<{
      and: "and";
      or: "or";
      xor: "xor";
      "nand-not": "nand-not";
      "nand-and": "nand-and";
      "nand-or": "nand-or";
      "xor-nand": "xor-nand";
      "half-adder": "half-adder";
      "full-adder": "full-adder";
    }>>;
    mode: import("zod").ZodDefault<import("zod").ZodEnum<{
      predict: "predict";
      explore: "explore";
    }>>;
    steps: import("zod").ZodDefault<import("zod").ZodBoolean>;
    showTable: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    preset: "and" | "or" | "xor" | "nand-not" | "nand-and" | "nand-or" | "xor-nand" | "half-adder" | "full-adder";
    mode: "predict" | "explore";
    steps: boolean;
    showTable: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    preset: "and" | "or" | "xor" | "nand-not" | "nand-and" | "nand-or" | "xor-nand" | "half-adder" | "full-adder";
    mode: "predict" | "explore";
    steps: boolean;
    showTable: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    preset: "and" | "or" | "xor" | "nand-not" | "nand-and" | "nand-or" | "xor-nand" | "half-adder" | "full-adder";
    mode: "predict" | "explore";
    steps: boolean;
    showTable: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    bits: import("zod").ZodDefault<import("zod").ZodNumber>;
    start: import("zod").ZodDefault<import("zod").ZodNumber>;
    target: import("zod").ZodOptional<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    bits: number;
    start: number;
    target?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    bits: number;
    start: number;
    target?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    bits: number;
    start: number;
    target?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    goal: import("zod").ZodDefault<import("zod").ZodEnum<{
      and: "and";
      or: "or";
      xor: "xor";
      "nand-not": "nand-not";
      "nand-and": "nand-and";
      "nand-or": "nand-or";
      "half-adder": "half-adder";
      "full-adder": "full-adder";
      sandbox: "sandbox";
    }>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    goal: "and" | "or" | "xor" | "nand-not" | "nand-and" | "nand-or" | "half-adder" | "full-adder" | "sandbox";
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    goal: "and" | "or" | "xor" | "nand-not" | "nand-and" | "nand-or" | "half-adder" | "full-adder" | "sandbox";
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    goal: "and" | "or" | "xor" | "nand-not" | "nand-and" | "nand-or" | "half-adder" | "full-adder" | "sandbox";
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    tiles: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
      text: import("zod").ZodString;
      pos: import("zod").ZodOptional<import("zod").ZodEnum<{
        noun: "noun";
        verb: "verb";
        article: "article";
        adjective: "adjective";
        preposition: "preposition";
        pronoun: "pronoun";
        conjunction: "conjunction";
        adverb: "adverb";
        other: "other";
      }>>;
      gloss: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
    promptDir: import("zod").ZodDefault<import("zod").ZodEnum<{
      ltr: "ltr";
      rtl: "rtl";
    }>>;
    targetDir: import("zod").ZodDefault<import("zod").ZodEnum<{
      ltr: "ltr";
      rtl: "rtl";
    }>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    tiles: {
      text: string;
      pos?: "noun" | "verb" | "article" | "adjective" | "preposition" | "pronoun" | "conjunction" | "adverb" | "other" | undefined;
      gloss?: string | undefined;
    }[];
    promptDir: "ltr" | "rtl";
    targetDir: "ltr" | "rtl";
    prompt?: string | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    tiles: {
      text: string;
      pos?: "noun" | "verb" | "article" | "adjective" | "preposition" | "pronoun" | "conjunction" | "adverb" | "other" | undefined;
      gloss?: string | undefined;
    }[];
    promptDir: "ltr" | "rtl";
    targetDir: "ltr" | "rtl";
    prompt?: string | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    tiles: {
      text: string;
      pos?: "noun" | "verb" | "article" | "adjective" | "preposition" | "pronoun" | "conjunction" | "adverb" | "other" | undefined;
      gloss?: string | undefined;
    }[];
    promptDir: "ltr" | "rtl";
    targetDir: "ltr" | "rtl";
    prompt?: string | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    deck: import("zod").ZodDefault<import("zod").ZodObject<{
      title: import("zod").ZodOptional<import("zod").ZodString>;
      termLang: import("zod").ZodString;
      transLang: import("zod").ZodString;
      items: import("zod").ZodArray<import("zod").ZodObject<{
        term: import("zod").ZodString;
        translation: import("zod").ZodString;
        transliteration: import("zod").ZodOptional<import("zod").ZodString>;
        audioUrl: import("zod").ZodOptional<import("zod").ZodString>;
        icon: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodObject<{
          kind: import("zod").ZodEnum<{
            emoji: "emoji";
            svg: "svg";
            image: "image";
          }>;
          id: import("zod").ZodOptional<import("zod").ZodString>;
          src: import("zod").ZodOptional<import("zod").ZodString>;
          alt: import("zod").ZodString;
        }, import("zod/v4/core").$strip>]>>;
        example: import("zod").ZodOptional<import("zod").ZodString>;
        tags: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
      }, import("zod/v4/core").$strip>>;
    }, import("zod/v4/core").$strip>>;
    count: import("zod").ZodOptional<import("zod").ZodNumber>;
    show: import("zod").ZodDefault<import("zod").ZodEnum<{
      translation: "translation";
      icon: "icon";
    }>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    deck: {
      termLang: string;
      transLang: string;
      items: {
        term: string;
        translation: string;
        transliteration?: string | undefined;
        audioUrl?: string | undefined;
        icon?: string | {
          kind: "emoji" | "svg" | "image";
          alt: string;
          id?: string | undefined;
          src?: string | undefined;
        } | undefined;
        example?: string | undefined;
        tags?: string[] | undefined;
      }[];
      title?: string | undefined;
    };
    show: "translation" | "icon";
    count?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    deck: {
      termLang: string;
      transLang: string;
      items: {
        term: string;
        translation: string;
        transliteration?: string | undefined;
        audioUrl?: string | undefined;
        icon?: string | {
          kind: "emoji" | "svg" | "image";
          alt: string;
          id?: string | undefined;
          src?: string | undefined;
        } | undefined;
        example?: string | undefined;
        tags?: string[] | undefined;
      }[];
      title?: string | undefined;
    };
    show: "translation" | "icon";
    count?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    deck: {
      termLang: string;
      transLang: string;
      items: {
        term: string;
        translation: string;
        transliteration?: string | undefined;
        audioUrl?: string | undefined;
        icon?: string | {
          kind: "emoji" | "svg" | "image";
          alt: string;
          id?: string | undefined;
          src?: string | undefined;
        } | undefined;
        example?: string | undefined;
        tags?: string[] | undefined;
      }[];
      title?: string | undefined;
    };
    show: "translation" | "icon";
    count?: number | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    items: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
      before: import("zod").ZodString;
      noun: import("zod").ZodString;
      after: import("zod").ZodOptional<import("zod").ZodString>;
      answer: import("zod").ZodEnum<{
        a: "a";
        an: "an";
        the: "the";
        ", ": ", ";
      }>;
      why: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    objectives: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    hints: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    items: {
      before: string;
      noun: string;
      answer: "a" | "an" | "the" | ", ";
      after?: string | undefined;
      why?: string | undefined;
    }[];
    objectives?: string[] | undefined;
    hints?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    items: {
      before: string;
      noun: string;
      answer: "a" | "an" | "the" | ", ";
      after?: string | undefined;
      why?: string | undefined;
    }[];
    objectives?: string[] | undefined;
    hints?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    items: {
      before: string;
      noun: string;
      answer: "a" | "an" | "the" | ", ";
      after?: string | undefined;
      why?: string | undefined;
    }[];
    objectives?: string[] | undefined;
    hints?: string[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    items: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
      subject: import("zod").ZodString;
      options: import("zod").ZodArray<import("zod").ZodString>;
      correct: import("zod").ZodString;
      tail: import("zod").ZodOptional<import("zod").ZodString>;
      note: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    items: {
      subject: string;
      options: string[];
      correct: string;
      tail?: string | undefined;
      note?: string | undefined;
    }[];
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    items: {
      subject: string;
      options: string[];
      correct: string;
      tail?: string | undefined;
      note?: string | undefined;
    }[];
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    items: {
      subject: string;
      options: string[];
      correct: string;
      tail?: string | undefined;
      note?: string | undefined;
    }[];
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    from: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
      text: import("zod").ZodString;
      pos: import("zod").ZodOptional<import("zod").ZodEnum<{
        noun: "noun";
        verb: "verb";
        article: "article";
        adjective: "adjective";
        preposition: "preposition";
        pronoun: "pronoun";
        conjunction: "conjunction";
        adverb: "adverb";
        other: "other";
      }>>;
      gloss: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    to: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
      text: import("zod").ZodString;
      pos: import("zod").ZodOptional<import("zod").ZodEnum<{
        noun: "noun";
        verb: "verb";
        article: "article";
        adjective: "adjective";
        preposition: "preposition";
        pronoun: "pronoun";
        conjunction: "conjunction";
        adverb: "adverb";
        other: "other";
      }>>;
      gloss: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    instruction: import("zod").ZodOptional<import("zod").ZodString>;
    note: import("zod").ZodOptional<import("zod").ZodString>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    from: {
      text: string;
      pos?: "noun" | "verb" | "article" | "adjective" | "preposition" | "pronoun" | "conjunction" | "adverb" | "other" | undefined;
      gloss?: string | undefined;
    }[];
    to: {
      text: string;
      pos?: "noun" | "verb" | "article" | "adjective" | "preposition" | "pronoun" | "conjunction" | "adverb" | "other" | undefined;
      gloss?: string | undefined;
    }[];
    instruction?: string | undefined;
    note?: string | undefined;
    title?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    from: {
      text: string;
      pos?: "noun" | "verb" | "article" | "adjective" | "preposition" | "pronoun" | "conjunction" | "adverb" | "other" | undefined;
      gloss?: string | undefined;
    }[];
    to: {
      text: string;
      pos?: "noun" | "verb" | "article" | "adjective" | "preposition" | "pronoun" | "conjunction" | "adverb" | "other" | undefined;
      gloss?: string | undefined;
    }[];
    instruction?: string | undefined;
    note?: string | undefined;
    title?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    from: {
      text: string;
      pos?: "noun" | "verb" | "article" | "adjective" | "preposition" | "pronoun" | "conjunction" | "adverb" | "other" | undefined;
      gloss?: string | undefined;
    }[];
    to: {
      text: string;
      pos?: "noun" | "verb" | "article" | "adjective" | "preposition" | "pronoun" | "conjunction" | "adverb" | "other" | undefined;
      gloss?: string | undefined;
    }[];
    instruction?: string | undefined;
    note?: string | undefined;
    title?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    items: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
      before: import("zod").ZodString;
      noun: import("zod").ZodString;
      answer: import("zod").ZodString;
      options: import("zod").ZodArray<import("zod").ZodString>;
      scene: import("zod").ZodEnum<{
        in: "in";
        on: "on";
        over: "over";
        above: "above";
        under: "under";
        below: "below";
        beside: "beside";
        between: "between";
        behind: "behind";
        infront: "infront";
        at: "at";
      }>;
      figure: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodObject<{
        kind: import("zod").ZodEnum<{
          emoji: "emoji";
          svg: "svg";
          image: "image";
        }>;
        id: import("zod").ZodOptional<import("zod").ZodString>;
        src: import("zod").ZodOptional<import("zod").ZodString>;
        alt: import("zod").ZodString;
      }, import("zod/v4/core").$strip>]>>;
      landmark: import("zod").ZodOptional<import("zod").ZodUnion<readonly [import("zod").ZodString, import("zod").ZodObject<{
        kind: import("zod").ZodEnum<{
          emoji: "emoji";
          svg: "svg";
          image: "image";
        }>;
        id: import("zod").ZodOptional<import("zod").ZodString>;
        src: import("zod").ZodOptional<import("zod").ZodString>;
        alt: import("zod").ZodString;
      }, import("zod/v4/core").$strip>]>>;
      note: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    items: {
      before: string;
      noun: string;
      answer: string;
      options: string[];
      scene: "in" | "on" | "over" | "above" | "under" | "below" | "beside" | "between" | "behind" | "infront" | "at";
      figure?: string | {
        kind: "emoji" | "svg" | "image";
        alt: string;
        id?: string | undefined;
        src?: string | undefined;
      } | undefined;
      landmark?: string | {
        kind: "emoji" | "svg" | "image";
        alt: string;
        id?: string | undefined;
        src?: string | undefined;
      } | undefined;
      note?: string | undefined;
    }[];
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    items: {
      before: string;
      noun: string;
      answer: string;
      options: string[];
      scene: "in" | "on" | "over" | "above" | "under" | "below" | "beside" | "between" | "behind" | "infront" | "at";
      figure?: string | {
        kind: "emoji" | "svg" | "image";
        alt: string;
        id?: string | undefined;
        src?: string | undefined;
      } | undefined;
      landmark?: string | {
        kind: "emoji" | "svg" | "image";
        alt: string;
        id?: string | undefined;
        src?: string | undefined;
      } | undefined;
      note?: string | undefined;
    }[];
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    items: {
      before: string;
      noun: string;
      answer: string;
      options: string[];
      scene: "in" | "on" | "over" | "above" | "under" | "below" | "beside" | "between" | "behind" | "infront" | "at";
      figure?: string | {
        kind: "emoji" | "svg" | "image";
        alt: string;
        id?: string | undefined;
        src?: string | undefined;
      } | undefined;
      landmark?: string | {
        kind: "emoji" | "svg" | "image";
        alt: string;
        id?: string | undefined;
        src?: string | undefined;
      } | undefined;
      note?: string | undefined;
    }[];
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    accounts: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
      id: import("zod").ZodString;
      name: import("zod").ZodString;
      category: import("zod").ZodEnum<{
        Asset: "Asset";
        Liability: "Liability";
        Equity: "Equity";
        Income: "Income";
        Expense: "Expense";
      }>;
    }, import("zod/v4/core").$strip>>>;
    transactions: import("zod").ZodDefault<import("zod").ZodArray<import("zod").ZodObject<{
      id: import("zod").ZodString;
      label: import("zod").ZodString;
      effects: import("zod").ZodArray<import("zod").ZodObject<{
        account: import("zod").ZodString;
        delta: import("zod").ZodNumber;
      }, import("zod/v4/core").$strip>>;
    }, import("zod/v4/core").$strip>>>;
    freePost: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    accounts: {
      id: string;
      name: string;
      category: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
    }[];
    transactions: {
      id: string;
      label: string;
      effects: {
        account: string;
        delta: number;
      }[];
    }[];
    freePost: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    accounts: {
      id: string;
      name: string;
      category: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
    }[];
    transactions: {
      id: string;
      label: string;
      effects: {
        account: string;
        delta: number;
      }[];
    }[];
    freePost: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    accounts: {
      id: string;
      name: string;
      category: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
    }[];
    transactions: {
      id: string;
      label: string;
      effects: {
        account: string;
        delta: number;
      }[];
    }[];
    freePost: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    accounts: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      id: import("zod").ZodString;
      name: import("zod").ZodString;
      category: import("zod").ZodEnum<{
        Asset: "Asset";
        Liability: "Liability";
        Equity: "Equity";
        Income: "Income";
        Expense: "Expense";
      }>;
    }, import("zod/v4/core").$strip>>>;
    transactions: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      id: import("zod").ZodString;
      prompt: import("zod").ZodString;
      debit: import("zod").ZodString;
      credit: import("zod").ZodString;
      amount: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>>;
    showTrialBalance: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    showTrialBalance: boolean;
    accounts?: {
      id: string;
      name: string;
      category: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
    }[] | undefined;
    transactions?: {
      id: string;
      prompt: string;
      debit: string;
      credit: string;
      amount: number;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    showTrialBalance: boolean;
    accounts?: {
      id: string;
      name: string;
      category: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
    }[] | undefined;
    transactions?: {
      id: string;
      prompt: string;
      debit: string;
      credit: string;
      amount: number;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    showTrialBalance: boolean;
    accounts?: {
      id: string;
      name: string;
      category: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
    }[] | undefined;
    transactions?: {
      id: string;
      prompt: string;
      debit: string;
      credit: string;
      amount: number;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    accounts: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      id: import("zod").ZodString;
      name: import("zod").ZodString;
      category: import("zod").ZodEnum<{
        Asset: "Asset";
        Liability: "Liability";
        Equity: "Equity";
        Income: "Income";
        Expense: "Expense";
      }>;
      balance: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>>;
    asOfLabel: import("zod").ZodOptional<import("zod").ZodString>;
    showClosing: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    showClosing: boolean;
    accounts?: {
      id: string;
      name: string;
      category: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
      balance: number;
    }[] | undefined;
    asOfLabel?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    showClosing: boolean;
    accounts?: {
      id: string;
      name: string;
      category: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
      balance: number;
    }[] | undefined;
    asOfLabel?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    showClosing: boolean;
    accounts?: {
      id: string;
      name: string;
      category: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
      balance: number;
    }[] | undefined;
    asOfLabel?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    demandIntercept: import("zod").ZodDefault<import("zod").ZodNumber>;
    demandSlope: import("zod").ZodDefault<import("zod").ZodNumber>;
    supplyIntercept: import("zod").ZodDefault<import("zod").ZodNumber>;
    supplySlope: import("zod").ZodDefault<import("zod").ZodNumber>;
    shiftDemand: import("zod").ZodDefault<import("zod").ZodBoolean>;
    shiftSupply: import("zod").ZodDefault<import("zod").ZodBoolean>;
    goodLabel: import("zod").ZodOptional<import("zod").ZodString>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    demandIntercept: number;
    demandSlope: number;
    supplyIntercept: number;
    supplySlope: number;
    shiftDemand: boolean;
    shiftSupply: boolean;
    goodLabel?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    demandIntercept: number;
    demandSlope: number;
    supplyIntercept: number;
    supplySlope: number;
    shiftDemand: boolean;
    shiftSupply: boolean;
    goodLabel?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    demandIntercept: number;
    demandSlope: number;
    supplyIntercept: number;
    supplySlope: number;
    shiftDemand: boolean;
    shiftSupply: boolean;
    goodLabel?: string | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    pivotP: import("zod").ZodDefault<import("zod").ZodNumber>;
    pivotQ: import("zod").ZodDefault<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    pivotP: number;
    pivotQ: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    pivotP: number;
    pivotQ: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    pivotP: number;
    pivotQ: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    askPrediction: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    askPrediction: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    askPrediction: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    askPrediction: boolean;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    preset: import("zod").ZodDefault<import("zod").ZodEnum<{
      custom: "custom";
      water: "water";
      rock: "rock";
      carbon: "carbon";
    }>>;
    challenge: import("zod").ZodDefault<import("zod").ZodEnum<{
      trace: "trace";
      "label-process": "label-process";
    }>>;
    nodes: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      id: import("zod").ZodString;
      label: import("zod").ZodString;
      tone: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    edges: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      from: import("zod").ZodString;
      to: import("zod").ZodString;
      label: import("zod").ZodOptional<import("zod").ZodString>;
    }, import("zod/v4/core").$strip>>>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    preset: "custom" | "water" | "rock" | "carbon";
    challenge: "trace" | "label-process";
    nodes?: {
      id: string;
      label: string;
      tone?: string | undefined;
    }[] | undefined;
    edges?: {
      from: string;
      to: string;
      label?: string | undefined;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    preset: "custom" | "water" | "rock" | "carbon";
    challenge: "trace" | "label-process";
    nodes?: {
      id: string;
      label: string;
      tone?: string | undefined;
    }[] | undefined;
    edges?: {
      from: string;
      to: string;
      label?: string | undefined;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    preset: "custom" | "water" | "rock" | "carbon";
    challenge: "trace" | "label-process";
    nodes?: {
      id: string;
      label: string;
      tone?: string | undefined;
    }[] | undefined;
    edges?: {
      from: string;
      to: string;
      label?: string | undefined;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    data: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      x: import("zod").ZodNumber;
      y: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>>;
    showSquares: import("zod").ZodDefault<import("zod").ZodBoolean>;
    learnRate: import("zod").ZodDefault<import("zod").ZodNumber>;
    m0: import("zod").ZodDefault<import("zod").ZodNumber>;
    b0: import("zod").ZodDefault<import("zod").ZodNumber>;
    span: import("zod").ZodDefault<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    showSquares: boolean;
    learnRate: number;
    m0: number;
    b0: number;
    span: number;
    data?: {
      x: number;
      y: number;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    showSquares: boolean;
    learnRate: number;
    m0: number;
    b0: number;
    span: number;
    data?: {
      x: number;
      y: number;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    showSquares: boolean;
    learnRate: number;
    m0: number;
    b0: number;
    span: number;
    data?: {
      x: number;
      y: number;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    points: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      x: import("zod").ZodNumber;
      y: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>>;
    k: import("zod").ZodDefault<import("zod").ZodNumber>;
    seeds: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
      x: import("zod").ZodNumber;
      y: import("zod").ZodNumber;
    }, import("zod/v4/core").$strip>>>;
    span: import("zod").ZodDefault<import("zod").ZodNumber>;
    showLines: import("zod").ZodDefault<import("zod").ZodBoolean>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    k: number;
    span: number;
    showLines: boolean;
    points?: {
      x: number;
      y: number;
    }[] | undefined;
    seeds?: {
      x: number;
      y: number;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    k: number;
    span: number;
    showLines: boolean;
    points?: {
      x: number;
      y: number;
    }[] | undefined;
    seeds?: {
      x: number;
      y: number;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    k: number;
    span: number;
    showLines: boolean;
    points?: {
      x: number;
      y: number;
    }[] | undefined;
    seeds?: {
      x: number;
      y: number;
    }[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    positives: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodNumber>>;
    negatives: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodNumber>>;
    threshold: import("zod").ZodDefault<import("zod").ZodNumber>;
    span: import("zod").ZodDefault<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    threshold: number;
    span: number;
    positives?: number[] | undefined;
    negatives?: number[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    threshold: number;
    span: number;
    positives?: number[] | undefined;
    negatives?: number[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    threshold: number;
    span: number;
    positives?: number[] | undefined;
    negatives?: number[] | undefined;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    dataset: import("zod").ZodDefault<import("zod").ZodEnum<{
      xor: "xor";
      separable: "separable";
      overlap: "overlap";
    }>>;
    seed: import("zod").ZodDefault<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    dataset: "xor" | "separable" | "overlap";
    seed: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    dataset: "xor" | "separable" | "overlap";
    seed: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    dataset: "xor" | "separable" | "overlap";
    seed: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
} | {
  group: string;
  key: string;
  label: string;
  icon?: import("react").ComponentType<{
    className?: string;
  }>;
  description?: string;
  category?: import("@classytic/cms-ui/contract").BlockCategory;
  slash?: boolean;
  schema: import("zod").ZodObject<{
    dataset: import("zod").ZodDefault<import("zod").ZodEnum<{
      xor: "xor";
      blobs: "blobs";
      circles: "circles";
    }>>;
    k: import("zod").ZodDefault<import("zod").ZodNumber>;
    seed: import("zod").ZodDefault<import("zod").ZodNumber>;
    title: import("zod").ZodOptional<import("zod").ZodString>;
    prompt: import("zod").ZodOptional<import("zod").ZodString>;
  }, import("zod/v4/core").$strip>;
  Component: import("react").ComponentType<import("@classytic/cms-ui/contract").BlockComponentProps<{
    dataset: "xor" | "blobs" | "circles";
    k: number;
    seed: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>>;
  tag?: string;
  void?: boolean;
  toAttrs?: ((props: {
    dataset: "xor" | "blobs" | "circles";
    k: number;
    seed: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }) => Record<string, unknown>) | undefined;
  fromAttrs?: ((raw: Record<string, unknown>) => Partial<{
    dataset: "xor" | "blobs" | "circles";
    k: number;
    seed: number;
    title?: string | undefined;
    prompt?: string | undefined;
  }>) | undefined;
})[];
//#endregion
export { AgreementBlock, AreaModelBlock, ArrangementsBlock, ArticleLensBlock, AtwoodBlock, BalanceAlgebraBlock, BaseOdometerBlock, BatteryBlock, BayesBlock, BinaryDisplayBlock, BinomialBlock, BitGrouperBlock, BjtInsideBlock, BohrAtomBlock, BooleanCircuitBlock, BrownoutBlock, BulletWallsBlock, CapacitorLeakBlock, CarnotBlock, CenterSpreadBlock, CentralDogmaBlock, CircleBlock, CircuitBlock, CircuitBuilderBlock, CircuitLabBlock, CircuitPuzzle, CircuitSceneBlock, CircuitSceneView, CircularMotionBlock, ClassifierThresholdBlock, CmosInverterBlock, CmosNandBlock, CmosNorBlock, CollisionTrackBlock, CombinationStudioBlock, ComplexPlaneBlock, ConductionBlock, ConicBlock, CountingSlotsBlock, CountingTreeBlock, CustomSceneBlock, CycleBlock, DecisionBoundaryBlock, DemandShiftVsMoveBlock, DerivationBlock, DerivativeExplorerBlock, DilutionBlock, DiodeBlock, DomainRangeBlock, DopplerBlock, EfficiencyBlock, ElasticityRevenueBlock, ElectricFieldBlock, ElectricFluxBlock, ElectrochemBlock, EnergySkateBlock, EntropyBlock, EnzymeRateBlock, EquationBalanceBlock, ExpectedValueBlock, FractionBarBlock, GaltonBlock, GasBoxBlock, GasProcessBlock, GaussLawBlock, GeneticCrossBlock, GeoTransformBlock, GeometryBoardBlock, GradientDescentBlock, GraphBlock, GravitationBlock, GravityDropBlock, GrowingPatternBlock, HallEffectBlock, HeatTransferBlock, HeatingCurveBlock, HistogramBlock, HypergeometricBlock, ImpulseBlock, IntegralExplorerBlock, InteractiveProblemBlock, IntersectingCirclesBlock, JournalPosterBlock, KMeansBlock, KarnaughBlock, KeplerBlock, KineticsBlock, KnnBoundaryBlock, LabConfig, type LabConfigProps, LabGallery, type LabGalleryProps, type LabPickItem, LawOfLargeNumbersBlock, LeChatelierBlock, LeverBlock, LeverPuzzle, LimitExplorerBlock, LinearModelBlock, LinearSystemBlock, LinearSystemView, LogicBuilderBlock, LogicGateBlock, LorentzBlock, MagnetismBlock, MarketEquilibriumBlock, MonteCarloBlock, MontyHallBlock, MosfetInsideBlock, MysteryBucketBlock, NormalBlock, NumberLineBlock, OpticsBlock, OrbitLabBlock, OutcomeBuilderBlock, PascalBlock, PercentBarBlock, PeriodicTrendsBlock, PhotosynthesisFactorsBlock, PlaceValueDialBlock, PnJunctionBlock, PolynomialSolverBlock, PredictBlock, PredictWidget, PrepositionBlock, ProjectileLabBlock, PunnettCrossBlock, RCChargingBlock, RNmosNotBlock, RainRelativeBlock, RampForcesBlock, RateMachineBlock, RatioShareBlock, ReactionLabBlock, ReactionProfileBlock, ReceiptBlock, RegressionBlock, RespirationBlock, RippleTankBlock, RiverBoatBlock, RuleCardBlock, SampleSpaceBlock, SamplingBlock, SelectionBlock, SentenceBuilderBlock, SequenceBlock, SequencePredictBlock, SeriesBlock, SexLinkedCrossBlock, SiliconLatticeBlock, SimpleHarmonicBlock, SolutionBoxBlock, StatementSorterBlock, StoichiometryBlock, StoppingDistanceBlock, StraightLineBlock, StringReflectionBlock, SystemSolveBlock, TemperatureScalesBlock, TerminalVelocityBlock, ThermalExpansionBlock, TitrationBlock, TransformBlock, TransistorBlock, TriangleTrigBlock, TrigExplorerBlock, TrigSignsBlock, TruthTableBlock, VectorBoardBlock, VectorTypesBlock, VennBlock, VertexParabolaBlock, WaterDensityBlock, WaveBlock, WordMatchBlock, WorkEnergyBlock, WorkPotentialBlock, ZTableBlock, accountingBlocks, accountingComponents, biologyBlocks, biologyComponents, chemBlocks, chemComponents, circuitsBlocks, circuitsComponents, coerceArray, discreteBlocks, discreteComponents, economicsBlocks, economicsComponents, geographyBlocks, geographyComponents, geometryBlocks, geometryComponents, ictBlocks, ictComponents, labGalleryItems, labsBlocks, labsComponents, languageBlocks, languageComponents, lessonBlocks, lessonComponents, mathBlocks, mathComponents, mlBlocks, mlComponents, physicsBlocks, physicsComponents, statisticsBlocks, statisticsComponents };