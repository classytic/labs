// @classytic/labs/physics — interactive physics labs.

// ── On the @classytic/stage engine ──────────────────────────────────────────
export { leverBalanceDoc, LeverBalanceLab, BALANCE_LEVER_ASSET, type LeverBalanceProps, type LeverItemSpec } from './lever/index.js';
export { opticsDoc, OpticsLab, OPTICS_RAY_ASSET, type OpticsProps } from './optics/index.js';
// SVG <Stage>: vectors/diagrams + simple animated sims (accessible, themed):
export { ProjectileLab, type ProjectileLabProps } from './projectile-lab.js';
export { GravityDrop, type GravityDropProps } from './gravity-drop.js';
export { RiverBoat, type RiverBoatProps } from './river-boat.js';
export { VectorScene, type VectorSceneProps, type SceneVector } from './vector-scene.js';
// General authorable vector lab (resultant / relative-velocity / drag-to-match):
export { VectorBoardLab, type VectorBoardProps, type BoardVector } from './vector-board/index.js';
export { VectorTypesLab, type VectorTypesProps, type TypePanel } from './vector-types/index.js';
// Animated relative-velocity simulation (CanvasLayer particles + SVG overlay):
export { RainRelativeLab, type RainRelativeProps } from './rain-relative/index.js';
// 1-D kinematics — accelerate→brake stopping distance with synced v–t / s–t graphs:
export { StoppingDistanceLab, type StoppingDistanceProps } from './stopping-distance/index.js';
// Newton's 2nd law on an incline — weight decomposition + friction → acceleration:
export { RampForcesLab, type RampForcesProps } from './ramp-forces/index.js';
// Momentum & collisions — elasticity morph, conserved-p bar + constant-velocity COM:
export { CollisionTrackLab, type CollisionTrackProps } from './collision-track/index.js';
// Impulse — J=F·Δt=Δp: half-sine pulse, equal area as Δt stretches → peak force drops (catch the egg):
export { ImpulseLab, type ImpulseProps } from './impulse/index.js';
// Bullet through N planks — predict-first penetration; fixed Δ(v²) per plank (v²=u²−2as):
export { BulletWallsLab, type BulletWallsProps } from './bullet-walls/index.js';
// Circular motion — centripetal F=mv²/r (v tangent, F inward); cut the string → tangent fly-off:
export { CircularMotionLab, type CircularMotionProps } from './circular-motion/index.js';
// Energy skate — KE⇄PE conversion bars summing to a constant total; friction leaks to heat:
export { EnergySkateLab, type EnergySkateProps } from './energy-skate/index.js';
// SHM — spring & pendulum on one a=−ω²x kernel; x(t) traces a sine (the wave link); PE⇄KE:
export { SimpleHarmonicLab, type SimpleHarmonicProps, type SHMMode } from './shm/index.js';
// Atwood machine — two masses over a pulley; a=(m₁−m₂)g/(m₁+m₂), tension T=2m₁m₂g/(m₁+m₂):
export { AtwoodLab, type AtwoodProps } from './atwood/index.js';
// Terminal velocity — quadratic drag mg−bv²; v(t)=v_t·tanh(gt/v_t); parachute crashes v_t:
export { TerminalVelocityLab, type TerminalVelocityProps } from './terminal-velocity/index.js';
// Kepler — true ellipse (focus=star), equal-area wedges via Kepler's eqn, T²∝a³:
export { KeplerLab, type KeplerProps } from './kepler/index.js';
// Gravitation — inverse-square F=GMm/r² (drag the satellite) + live F–r curve:
export { GravitationLab, type GravitationProps } from './gravitation/index.js';
// On stage's <CanvasLayer> (zero-dep raw Canvas2D) — high-element trail animation:
export { OrbitLab } from './orbit-lab.js';
// Waves — travelling / superposition+beats / standing (nodes & antinodes) + Web Audio:
export { WaveLab, type WaveLabProps, type WaveMode } from './waves/index.js';
// Ripple tank — 2-D two-source interference (live ripples + static fringes) on CanvasLayer:
export { RippleTankLab, type RippleTankProps, type RippleView } from './waves/index.js';
// Doppler — moving source, bunched/stretched wavefronts, Mach cone + drive-by siren:
export { DopplerLab, type DopplerProps } from './waves/index.js';
// Reflection on a string — pulse inversion (fixed/free) + standing waves & resonance:
export { StringReflectionLab, type StringReflectionProps, type StringMode, type EndType } from './waves/index.js';

// Magnetism — field lines (bar magnet / current wire) + a compass, on the field kernel:
export { MagnetismLab, type MagnetismProps } from './magnetism/index.js';
// Electric field — two charges + a test charge feeling F = qE (same field kernel):
export { ElectricFieldLab, type ElectricFieldProps } from './electric-field/index.js';
// Lorentz force — F=qv×B: a charge curving in a field (cyclotron); right-hand rule, resultant force:
export { LorentzForceLab, type LorentzProps } from './lorentz/index.js';
// Exponential decay & cooling — one `rate` ODE, two skins (atoms / thermometer):
export { DecayCoolingLab, type DecayCoolingProps } from './exponential/index.js';
// Work done = area under the force–distance graph (spring ½kx² / constant Fx):
export { WorkEnergyLab, type WorkEnergyProps } from './work-energy/index.js';
// Heat & temperature — the heating curve (q=mcΔθ runs + q=mL plateaus) on the `thermal` core:
export { HeatingCurveLab, type HeatingCurveProps } from './thermal/index.js';
// Heat transfer — conduction (Fourier) / convection (currents) / radiation (Stefan–Boltzmann T⁴):
export { HeatTransferLab, type HeatTransferProps } from './heat-transfer/index.js';
// Thermal expansion — ΔL=αLΔT / ΔA=2αAΔT / ΔV=3αVΔT + bimetallic-strip thermostat:
export { ThermalExpansionLab, type ThermalExpansionProps } from './expansion/index.js';
// Temperature scales — °C/°F/K read off one mercury column; F=9/5·C+32, K=C+273.15, absolute zero:
export { TemperatureScalesLab, type TemperatureScalesProps } from './temperature-scales/index.js';
// Water density anomaly — densest at 4 °C, ice floats, lakes freeze top-down (fish survive):
export { WaterDensityLab, type WaterDensityProps } from './water-density/index.js';
// Thermodynamics (advanced) — on the @classytic/stage/thermo ideal-gas kernel:
// Gas processes — isothermal/adiabatic/isobaric/isochoric on a P–V diagram, W=∫P dV, first law:
export { GasProcessLab, type GasProcessProps } from './gas-process/index.js';
// Carnot cycle — P–V loop + T–S rectangle, efficiency η=1−Tc/Th, entropy bookkeeping:
export { CarnotCycleLab, type CarnotProps } from './carnot/index.js';
// Entropy & the 2nd law — irreversible heat flow (ΔS_total>0) + free expansion (nR·ln Vf/Vi):
export { EntropyLab, type EntropyProps } from './entropy/index.js';
// Efficiency — input→output ratio η = useful/input as a Sankey energy flow (authorable devices):
export { EfficiencyLab, type EfficiencyProps, type EffStream } from './efficiency/index.js';

// ── physics/ is fully migrated to @classytic/stage (SVG + CanvasLayer). No canvas legacy. ──
