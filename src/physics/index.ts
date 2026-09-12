// @classytic/labs/physics, interactive physics labs.

// ── On the @classytic/stage engine ──────────────────────────────────────────
export {
  leverBalanceDoc,
  LeverBalanceLab,
  BALANCE_LEVER_ASSET,
  type LeverBalanceProps,
  type LeverItemSpec,
} from './lever/index.js';
export { opticsDoc, OpticsLab, OPTICS_RAY_ASSET, type OpticsProps } from './optics/index.js';
export {
  RefractionLab,
  refract,
  criticalAngle,
  thinOptic,
  MEDIA,
  type RefractionProps,
  type Medium,
  type OpticImage,
} from './optics/index.js';
export { LensImagingLab, type LensImagingProps, type LensType } from './optics/index.js';
export { MirrorImagingLab, type MirrorImagingProps, type MirrorType } from './optics/index.js';
// SVG <Stage>: vectors/diagrams + simple animated sims (accessible, themed):
export { GravityDrop, type GravityDropProps } from './gravity-drop.js';
export {
  MovingLauncherLab,
  FallingTargetLab,
  type MovingLauncherProps,
  type FallingTargetProps,
  type LauncherMode,
} from './projectiles/index.js';
export { InterceptLab, type InterceptProps } from './intercept/index.js';
export {
  LinearPursuitLab,
  firstLinearMeeting,
  linearPositionAt,
  type LinearPursuitProps,
  type LinearPursuitScenario,
  type LinearBody,
  type LinearPursuitState,
} from './linear-pursuit/index.js';
export { VenturiLab, type VenturiProps } from './venturi/index.js';
export { RiverBoat, type RiverBoatProps } from './river-boat.js';
export { VectorScene, type VectorSceneProps, type SceneVector } from './vector-scene.js';
// General authorable vector lab (resultant / relative-velocity / drag-to-match):
export { VectorBoardLab, type VectorBoardProps, type BoardVector } from './vector-board/index.js';
export { VectorTypesLab, type VectorTypesProps, type TypePanel } from './vector-types/index.js';
// Animated relative-velocity simulation (CanvasLayer particles + SVG overlay):
export { RainRelativeLab, type RainRelativeProps } from './rain-relative/index.js';
// 1-D kinematics, accelerate→brake stopping distance with synced v–t / s–t graphs:
export { StoppingDistanceLab, type StoppingDistanceProps } from './stopping-distance/index.js';
// Newton's 2nd law on an incline, weight decomposition + friction → acceleration:
export { RampForcesLab, type RampForcesProps } from './ramp-forces/index.js';
// Momentum & collisions, elasticity morph, conserved-p bar + constant-velocity COM:
export { CollisionTrackLab, type CollisionTrackProps } from './collision-track/index.js';
// Impulse, J=F·Δt=Δp: half-sine pulse, equal area as Δt stretches → peak force drops (catch the egg):
export { ImpulseLab, type ImpulseProps } from './impulse/index.js';
// Bullet through N planks, predict-first penetration; fixed Δ(v²) per plank (v²=u²−2as):
export { BulletWallsLab, type BulletWallsProps } from './bullet-walls/index.js';
// Circular motion, centripetal F=mv²/r (v tangent, F inward); cut the string → tangent fly-off:
export { CircularMotionLab, type CircularMotionProps } from './circular-motion/index.js';
// Energy skate, KE⇄PE conversion bars summing to a constant total; friction leaks to heat:
export { EnergySkateLab, type EnergySkateProps } from './energy-skate/index.js';
export {
  atwoodState,
  circularMotionState,
  collisionResult,
  energySnapshot,
  halfSinePeakForce,
  halfSinePulse,
  parabolicTrackHeight,
  penetrationResult,
  rampForceState,
  stoppingMetrics,
  stoppingPositionAt,
  stoppingSpeedAt,
  terminalVelocityState,
  type AtwoodState,
  type CircularMotionState,
  type CollisionResult,
  type EnergySnapshot,
  type ForceTimePoint,
  type PenetrationResult,
  type RampForceState,
  type StoppingMetrics,
  type TerminalVelocityState,
} from './mechanics/core.js';
// SHM, spring & pendulum on one a=−ω²x kernel; x(t) traces a sine (the wave link); PE⇄KE:
export { SimpleHarmonicLab, type SimpleHarmonicProps, type SHMMode } from './shm/index.js';
// Atwood machine, two masses over a pulley; a=(m₁−m₂)g/(m₁+m₂), tension T=2m₁m₂g/(m₁+m₂):
export { AtwoodLab, type AtwoodProps } from './atwood/index.js';
// Terminal velocity, quadratic drag mg−bv²; v(t)=v_t·tanh(gt/v_t); parachute crashes v_t:
export { TerminalVelocityLab, type TerminalVelocityProps } from './terminal-velocity/index.js';
// Kepler, true ellipse (focus=star), equal-area wedges via Kepler's eqn, T²∝a³:
export { KeplerLab, type KeplerProps } from './kepler/index.js';
// Gravitation, inverse-square F=GMm/r² (drag the satellite) + live F–r curve:
export { GravitationLab, type GravitationProps } from './gravitation/index.js';
export {
  circularOrbitSpeed,
  ellipseStateAtMeanAnomaly,
  gravitationalAcceleration,
  inverseSquareForce,
  keplerPeriod,
  launchState,
  solveEccentricAnomaly,
  specificOrbitalEnergy,
  stepTwoBody,
  type EllipseState,
  type TwoBodyState,
} from './orbital/core.js';
// On stage's <CanvasLayer> (zero-dep raw Canvas2D), high-element trail animation:
export { OrbitLab, type OrbitLabProps } from './orbit-lab.js';
// Waves, travelling / superposition+beats / standing (nodes & antinodes) + Web Audio:
export { WaveLab, type WaveLabProps, type WaveMode } from './waves/index.js';
// Ripple tank, 2-D two-source interference (live ripples + static fringes) on CanvasLayer:
export { RippleTankLab, type RippleTankProps, type RippleView } from './waves/index.js';
// Doppler, moving source, bunched/stretched wavefronts, Mach cone + drive-by siren:
export { DopplerLab, type DopplerProps } from './waves/index.js';
// Reflection on a string, pulse inversion (fixed/free) + standing waves & resonance:
export {
  StringReflectionLab,
  type StringReflectionProps,
  type StringMode,
  type EndType,
} from './waves/index.js';

// Magnetism, field lines (bar magnet / current wire) + a compass, on the field kernel:
export { MagnetismLab, type MagnetismProps } from './magnetism/index.js';
// Electric field, two charges + a test charge feeling F = qE (same field kernel):
export { ElectricFieldLab, type ElectricFieldProps } from './electric-field/index.js';
// Electric flux Φ = E·A·cosθ, field lines threading a tilted area; medium (permittivity):
export { ElectricFluxLab, type ElectricFluxProps } from './electric-flux/index.js';
// Gauss's law, flux through a closed loop depends only on the charge enclosed:
export { GaussLab, type GaussProps } from './gauss-law/index.js';
// Potential & work, equipotential rings and W = qΔV (path-independent):
export { WorkPotentialLab, type WorkPotentialProps } from './work-potential/index.js';
// Lorentz force, F=qv×B: a charge curving in a field (cyclotron); right-hand rule, resultant force:
export {
  LorentzForceLab,
  lorentzForce2D,
  cyclotronSense,
  cyclotronRadius,
  type LorentzProps,
  type Vec2Value,
} from './lorentz/index.js';
export {
  SpatialLorentzLab,
  SpatialLorentzProjectedScene,
  spatialLorentzActivity,
  traceLorentz,
  lorentzForce3D,
  fieldsFor,
  type SpatialLorentzProps,
  type SpatialLorentzSceneProps,
  type SpatialLorentzSceneRenderer,
  type SpatialFieldMode,
  type Vec3Value,
} from './fields/index.js';
// Exponential decay & cooling, one `rate` ODE, two skins (atoms / thermometer):
export { DecayCoolingLab, type DecayCoolingProps } from './exponential/index.js';
// Work done = area under the force–distance graph (spring ½kx² / constant Fx):
export { WorkEnergyLab, type WorkEnergyProps } from './work-energy/index.js';
export { PowerLab, type PowerProps, type PowerMode } from './power/index.js';
// Deformation of solids (9702 ch. 6): F–x has gradient k (this wire), σ–ε has gradient E (the material):
export {
  StressStrainLab,
  MATERIALS as DEFORMATION_MATERIALS,
  areaOf,
  energyDensity,
  limitStrain,
  material as deformationMaterial,
  strainAt,
  stressAt,
  stressStrainCurve,
  wireState,
  type StressStrainProps,
  type StressStrainGraph,
  type Material as DeformationMaterial,
  type MaterialId as DeformationMaterialId,
  type WireState,
} from './stress-strain/index.js';
// Alternating currents (9702 ch. 21): T = 1/f, V_rms = √(mean of v²) = V₀/√2, and rectifying:
export {
  AlternatingCurrentLab,
  acCurrentAt,
  acPeriodS,
  acRectifiedTrace,
  acState,
  acVoltageAt,
  acWaveTrace,
  integrateSquareOverPeriod,
  meanAcPowerW,
  meanRectifiedVoltage,
  meanSquareByIntegration,
  meanSquareFromPeak,
  rectify,
  rippleFrequencyHz,
  rmsFromPeak,
  type AlternatingCurrentProps,
  type AcView,
  type AcState,
  type AcSupply,
  type RectifiedTrace,
  type RectifierMode,
  type WavePoint,
} from './alternating-current/index.js';
export { FluidPressureLab, type FluidPressureProps, type FluidId } from './fluid-pressure/index.js';
export { ForcePairsLab, type ForcePairsProps, type ForcePairsScenario } from './force-pairs/index.js';
export { CoupleTorqueLab, type CoupleTorqueProps } from './couple-torque/index.js';
// Heat & temperature, the heating curve (q=mcΔθ runs + q=mL plateaus) on the `thermal` core:
export {
  HeatingCurveLab,
  ThermalActivity,
  type HeatingCurveProps,
  type ThermalActivityProps,
} from './thermal/index.js';
// Heat transfer, conduction (Fourier) / convection (currents) / radiation (Stefan–Boltzmann T⁴):
export { HeatTransferLab, type HeatTransferProps } from './heat-transfer/index.js';
// Thermal expansion, ΔL=αLΔT / ΔA=2αAΔT / ΔV=3αVΔT + bimetallic-strip thermostat:
export { ThermalExpansionLab, type ThermalExpansionProps } from './expansion/index.js';
// Temperature scales, °C/°F/K read off one mercury column; F=9/5·C+32, K=C+273.15, absolute zero:
export {
  TemperatureScalesLab,
  type TemperatureScalesProps,
  type TemperaturePreset,
} from './temperature-scales/index.js';
// Water density anomaly, densest at 4 °C, ice floats, lakes freeze top-down (fish survive):
export { WaterDensityLab, type WaterDensityProps } from './water-density/index.js';
// Thermodynamics (advanced), on the @classytic/stage/thermo ideal-gas kernel:
// Gas processes, isothermal/adiabatic/isobaric/isochoric on a P–V diagram, W=∫P dV, first law:
export { GasProcessLab, type GasProcessProps } from './gas-process/index.js';
// Carnot cycle, P–V loop + T–S rectangle, efficiency η=1−Tc/Th, entropy bookkeeping:
export { CarnotCycleLab, type CarnotProps } from './carnot/index.js';
// Entropy & the 2nd law, irreversible heat flow (ΔS_total>0) + free expansion (nR·ln Vf/Vi):
export { EntropyLab, type EntropyProps } from './entropy/index.js';
// Efficiency, input→output ratio η = useful/input as a Sankey energy flow (authorable devices):
export { EfficiencyLab, type EfficiencyProps, type EffStream } from './efficiency/index.js';

// ── physics/ is fully migrated to @classytic/stage (SVG + CanvasLayer). No canvas legacy. ──
export {
  RelativityLightClockLab,
  LightClockScene,
  SpacetimeDiagram,
  lightClockActivity,
  MuonSurvivalLab,
  MuonAtmosphereScene,
  muonSurvivalActivity,
  muonSurvivalState,
  exponentialSurvival,
  MUON_MEAN_LIFETIME,
  NuclearBindingEnergyLab,
  bindingEnergyActivity,
  bindingState,
  NUCLIDES,
  lorentzGamma,
  lorentzTransform,
  inverseLorentzTransform,
  spacetimeInterval,
  lightClockState,
  lightClockEvents,
  type RelativityLightClockProps,
  type MuonSurvivalLabProps,
  type MuonSurvivalState,
  type NuclearBindingEnergyLabProps,
  type Nuclide,
  type NuclideId,
  type BindingState,
  type LightClockState,
  type SpacetimeEvent,
} from './modern/index.js';
