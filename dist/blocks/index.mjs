import { coerceArray } from "./authoring.mjs";
import { LabConfig } from "./lab-config.mjs";
import { AtwoodBlock, BulletWallsBlock, CarnotBlock, CircularMotionBlock, CollisionTrackBlock, DopplerBlock, EfficiencyBlock, ElectricFieldBlock, ElectricFluxBlock, EnergySkateBlock, EntropyBlock, GasProcessBlock, GaussLawBlock, GravitationBlock, GravityDropBlock, HeatTransferBlock, HeatingCurveBlock, ImpulseBlock, KeplerBlock, LeverBlock, LeverPuzzle, LorentzBlock, MagnetismBlock, OpticsBlock, OrbitLabBlock, ProjectileLabBlock, RainRelativeBlock, RampForcesBlock, RippleTankBlock, RiverBoatBlock, SimpleHarmonicBlock, StoppingDistanceBlock, StringReflectionBlock, TemperatureScalesBlock, TerminalVelocityBlock, ThermalExpansionBlock, VectorBoardBlock, VectorTypesBlock, WaterDensityBlock, WaveBlock, WorkEnergyBlock, WorkPotentialBlock, physicsBlocks, physicsComponents } from "./physics.mjs";
import { AreaModelBlock, BalanceAlgebraBlock, CircleBlock, ComplexPlaneBlock, ConicBlock, CustomSceneBlock, DerivationBlock, DerivativeExplorerBlock, DomainRangeBlock, FractionBarBlock, GeoTransformBlock, GradientDescentBlock, GraphBlock, GrowingPatternBlock, IntegralExplorerBlock, InteractiveProblemBlock, LimitExplorerBlock, LinearModelBlock, LinearSystemBlock, LinearSystemView, MysteryBucketBlock, NumberLineBlock, PercentBarBlock, PolynomialSolverBlock, RateMachineBlock, RatioShareBlock, ReceiptBlock, SequencePredictBlock, StraightLineBlock, SystemSolveBlock, TriangleTrigBlock, TrigExplorerBlock, TrigSignsBlock, VertexParabolaBlock, mathBlocks, mathComponents } from "./math.mjs";
import { BatteryBlock, BohrAtomBlock, DilutionBlock, ElectrochemBlock, GasBoxBlock, KineticsBlock, LeChatelierBlock, PeriodicTrendsBlock, ReactionLabBlock, ReactionProfileBlock, SolutionBoxBlock, StoichiometryBlock, TitrationBlock, chemBlocks, chemComponents } from "./chem.mjs";
import { BjtInsideBlock, BrownoutBlock, CapacitorLeakBlock, CircuitBlock, CircuitBuilderBlock, CircuitLabBlock, CircuitPuzzle, CircuitSceneBlock, CircuitSceneView, CmosInverterBlock, CmosNandBlock, CmosNorBlock, ConductionBlock, DiodeBlock, HallEffectBlock, MosfetInsideBlock, PnJunctionBlock, RCChargingBlock, RNmosNotBlock, SiliconLatticeBlock, TransistorBlock, circuitsBlocks, circuitsComponents } from "./circuits.mjs";
import { GeometryBoardBlock, IntersectingCirclesBlock, geometryBlocks, geometryComponents } from "./geometry.mjs";
import { BaseOdometerBlock, BinaryDisplayBlock, BitGrouperBlock, LogicBuilderBlock, LogicGateBlock, PlaceValueDialBlock, ictBlocks, ictComponents } from "./ict.mjs";
import { AgreementBlock, ArticleLensBlock, PrepositionBlock, SentenceBuilderBlock, TransformBlock, WordMatchBlock, languageBlocks, languageComponents } from "./language.mjs";
import { EquationBalanceBlock, JournalPosterBlock, StatementSorterBlock, accountingBlocks, accountingComponents } from "./accounting.mjs";
import { DemandShiftVsMoveBlock, ElasticityRevenueBlock, MarketEquilibriumBlock, economicsBlocks, economicsComponents } from "./economics.mjs";
import { CentralDogmaBlock, EnzymeRateBlock, GeneticCrossBlock, PhotosynthesisFactorsBlock, PunnettCrossBlock, RespirationBlock, SequenceBlock, SexLinkedCrossBlock, biologyBlocks, biologyComponents } from "./biology.mjs";
import { CycleBlock, geographyBlocks, geographyComponents } from "./geography.mjs";
import { ClassifierThresholdBlock, DecisionBoundaryBlock, KMeansBlock, KnnBoundaryBlock, RegressionBlock, mlBlocks, mlComponents } from "./ml.mjs";
import { ArrangementsBlock, BayesBlock, BinomialBlock, BooleanCircuitBlock, CombinationStudioBlock, CountingSlotsBlock, CountingTreeBlock, ExpectedValueBlock, HypergeometricBlock, KarnaughBlock, LawOfLargeNumbersBlock, MonteCarloBlock, MontyHallBlock, OutcomeBuilderBlock, PascalBlock, RuleCardBlock, SampleSpaceBlock, SelectionBlock, TruthTableBlock, VennBlock, discreteBlocks, discreteComponents } from "./discrete.mjs";
import { CenterSpreadBlock, GaltonBlock, HistogramBlock, NormalBlock, SamplingBlock, SeriesBlock, ZTableBlock, statisticsBlocks, statisticsComponents } from "./statistics.mjs";
import { PredictBlock, PredictWidget, lessonBlocks, lessonComponents } from "./lesson.mjs";
import { LabGallery } from "./lab-gallery.mjs";

//#region src/blocks/index.tsx
/** Every lab block, pass to `<CmsBlockEditor blocks={labsBlocks}>` (slash menu). */
const labsBlocks = [
	...lessonBlocks,
	...languageBlocks,
	...physicsBlocks,
	...mathBlocks,
	...chemBlocks,
	...circuitsBlocks,
	...geometryBlocks,
	...ictBlocks,
	...accountingBlocks,
	...economicsBlocks,
	...biologyBlocks,
	...geographyBlocks,
	...mlBlocks,
	...discreteBlocks,
	...statisticsBlocks
];
/** MDX render map, merge into the host's `blockComponents` (tag → component).
*  Tags match each block's `tag` so editor + player render the same component.
*  Tags are unique across domains, so spread order is irrelevant. */
const labsComponents = {
	...lessonComponents,
	...languageComponents,
	...physicsComponents,
	...mathComponents,
	...chemComponents,
	...circuitsComponents,
	...geometryComponents,
	...ictComponents,
	...accountingComponents,
	...economicsComponents,
	...biologyComponents,
	...geographyComponents,
	...mlComponents,
	...discreteComponents,
	...statisticsComponents
};
/** Every lab tagged with its subject group, for `<LabGallery blocks={labGalleryItems}>`. */
const labGalleryItems = [
	...mathBlocks.map((b) => ({
		...b,
		group: "Math"
	})),
	...physicsBlocks.map((b) => ({
		...b,
		group: "Physics"
	})),
	...chemBlocks.map((b) => ({
		...b,
		group: "Chemistry"
	})),
	...biologyBlocks.map((b) => ({
		...b,
		group: "Biology"
	})),
	...circuitsBlocks.map((b) => ({
		...b,
		group: "Circuits"
	})),
	...geometryBlocks.map((b) => ({
		...b,
		group: "Geometry"
	})),
	...discreteBlocks.map((b) => ({
		...b,
		group: "Discrete"
	})),
	...statisticsBlocks.map((b) => ({
		...b,
		group: "Statistics"
	})),
	...ictBlocks.map((b) => ({
		...b,
		group: "ICT"
	})),
	...languageBlocks.map((b) => ({
		...b,
		group: "Language"
	})),
	...accountingBlocks.map((b) => ({
		...b,
		group: "Accounting"
	})),
	...economicsBlocks.map((b) => ({
		...b,
		group: "Economics"
	})),
	...geographyBlocks.map((b) => ({
		...b,
		group: "Geography"
	})),
	...mlBlocks.map((b) => ({
		...b,
		group: "Machine learning"
	}))
];

//#endregion
export { AgreementBlock, AreaModelBlock, ArrangementsBlock, ArticleLensBlock, AtwoodBlock, BalanceAlgebraBlock, BaseOdometerBlock, BatteryBlock, BayesBlock, BinaryDisplayBlock, BinomialBlock, BitGrouperBlock, BjtInsideBlock, BohrAtomBlock, BooleanCircuitBlock, BrownoutBlock, BulletWallsBlock, CapacitorLeakBlock, CarnotBlock, CenterSpreadBlock, CentralDogmaBlock, CircleBlock, CircuitBlock, CircuitBuilderBlock, CircuitLabBlock, CircuitPuzzle, CircuitSceneBlock, CircuitSceneView, CircularMotionBlock, ClassifierThresholdBlock, CmosInverterBlock, CmosNandBlock, CmosNorBlock, CollisionTrackBlock, CombinationStudioBlock, ComplexPlaneBlock, ConductionBlock, ConicBlock, CountingSlotsBlock, CountingTreeBlock, CustomSceneBlock, CycleBlock, DecisionBoundaryBlock, DemandShiftVsMoveBlock, DerivationBlock, DerivativeExplorerBlock, DilutionBlock, DiodeBlock, DomainRangeBlock, DopplerBlock, EfficiencyBlock, ElasticityRevenueBlock, ElectricFieldBlock, ElectricFluxBlock, ElectrochemBlock, EnergySkateBlock, EntropyBlock, EnzymeRateBlock, EquationBalanceBlock, ExpectedValueBlock, FractionBarBlock, GaltonBlock, GasBoxBlock, GasProcessBlock, GaussLawBlock, GeneticCrossBlock, GeoTransformBlock, GeometryBoardBlock, GradientDescentBlock, GraphBlock, GravitationBlock, GravityDropBlock, GrowingPatternBlock, HallEffectBlock, HeatTransferBlock, HeatingCurveBlock, HistogramBlock, HypergeometricBlock, ImpulseBlock, IntegralExplorerBlock, InteractiveProblemBlock, IntersectingCirclesBlock, JournalPosterBlock, KMeansBlock, KarnaughBlock, KeplerBlock, KineticsBlock, KnnBoundaryBlock, LabConfig, LabGallery, LawOfLargeNumbersBlock, LeChatelierBlock, LeverBlock, LeverPuzzle, LimitExplorerBlock, LinearModelBlock, LinearSystemBlock, LinearSystemView, LogicBuilderBlock, LogicGateBlock, LorentzBlock, MagnetismBlock, MarketEquilibriumBlock, MonteCarloBlock, MontyHallBlock, MosfetInsideBlock, MysteryBucketBlock, NormalBlock, NumberLineBlock, OpticsBlock, OrbitLabBlock, OutcomeBuilderBlock, PascalBlock, PercentBarBlock, PeriodicTrendsBlock, PhotosynthesisFactorsBlock, PlaceValueDialBlock, PnJunctionBlock, PolynomialSolverBlock, PredictBlock, PredictWidget, PrepositionBlock, ProjectileLabBlock, PunnettCrossBlock, RCChargingBlock, RNmosNotBlock, RainRelativeBlock, RampForcesBlock, RateMachineBlock, RatioShareBlock, ReactionLabBlock, ReactionProfileBlock, ReceiptBlock, RegressionBlock, RespirationBlock, RippleTankBlock, RiverBoatBlock, RuleCardBlock, SampleSpaceBlock, SamplingBlock, SelectionBlock, SentenceBuilderBlock, SequenceBlock, SequencePredictBlock, SeriesBlock, SexLinkedCrossBlock, SiliconLatticeBlock, SimpleHarmonicBlock, SolutionBoxBlock, StatementSorterBlock, StoichiometryBlock, StoppingDistanceBlock, StraightLineBlock, StringReflectionBlock, SystemSolveBlock, TemperatureScalesBlock, TerminalVelocityBlock, ThermalExpansionBlock, TitrationBlock, TransformBlock, TransistorBlock, TriangleTrigBlock, TrigExplorerBlock, TrigSignsBlock, TruthTableBlock, VectorBoardBlock, VectorTypesBlock, VennBlock, VertexParabolaBlock, WaterDensityBlock, WaveBlock, WordMatchBlock, WorkEnergyBlock, WorkPotentialBlock, ZTableBlock, accountingBlocks, accountingComponents, biologyBlocks, biologyComponents, chemBlocks, chemComponents, circuitsBlocks, circuitsComponents, coerceArray, discreteBlocks, discreteComponents, economicsBlocks, economicsComponents, geographyBlocks, geographyComponents, geometryBlocks, geometryComponents, ictBlocks, ictComponents, labGalleryItems, labsBlocks, labsComponents, languageBlocks, languageComponents, lessonBlocks, lessonComponents, mathBlocks, mathComponents, mlBlocks, mlComponents, physicsBlocks, physicsComponents, statisticsBlocks, statisticsComponents };