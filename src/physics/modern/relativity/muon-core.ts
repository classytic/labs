import { SPEED_OF_LIGHT } from '../constants.js';
import { lorentzGamma, validBeta } from './core.js';
export const MUON_MEAN_LIFETIME = 2.1969811e-6;
export interface MuonSurvivalState {
  beta: number;
  gamma: number;
  altitudeM: number;
  properTravelTimeS: number;
  earthTravelTimeS: number;
  survivalProbability: number;
  classicalSurvivalProbability: number;
  expectedSurvivors: number;
  expectedClassicalSurvivors: number;
}

export interface MuonParticle {
  id: number;
  restLifetimeS: number;
  laneOffset: number;
}

export interface MuonParticleState extends MuonParticle {
  decayProgress: number;
  progress: number;
  survived: boolean;
}

export interface MuonExperimentState {
  progress: number;
  earthElapsedS: number;
  properElapsedS: number;
  relativistic: MuonParticleState[];
  withoutDilation: MuonParticleState[];
  relativisticArrivals: number;
  withoutDilationArrivals: number;
}
export function exponentialSurvival(elapsedS: number, meanLifetimeS = MUON_MEAN_LIFETIME): number {
  if (!Number.isFinite(elapsedS) || elapsedS < 0)
    throw new RangeError('elapsed time must be finite and non-negative');
  if (!Number.isFinite(meanLifetimeS) || meanLifetimeS <= 0)
    throw new RangeError('mean lifetime must be finite and positive');
  return Math.exp(-elapsedS / meanLifetimeS);
}
export function muonSurvivalState(beta: number, altitudeM = 10_000, population = 1000): MuonSurvivalState {
  const b = Math.abs(validBeta(beta));
  if (b === 0) throw new RangeError('muon speed must be greater than zero');
  if (!Number.isFinite(altitudeM) || altitudeM < 0)
    throw new RangeError('altitude must be finite and non-negative');
  if (!Number.isFinite(population) || population < 0)
    throw new RangeError('population must be finite and non-negative');
  const gamma = lorentzGamma(b),
    earthTravelTimeS = altitudeM / (b * SPEED_OF_LIGHT),
    properTravelTimeS = earthTravelTimeS / gamma,
    survivalProbability = exponentialSurvival(properTravelTimeS),
    classicalSurvivalProbability = exponentialSurvival(earthTravelTimeS);
  return {
    beta: b,
    gamma,
    altitudeM,
    properTravelTimeS,
    earthTravelTimeS,
    survivalProbability,
    classicalSurvivalProbability,
    expectedSurvivors: population * survivalProbability,
    expectedClassicalSurvivors: population * classicalSurvivalProbability,
  };
}

/** Stable stratified samples make both comparison lanes use the exact same muons. */
export function createMuonCohort(count = 24): MuonParticle[] {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('cohort size must be a positive integer');
  return Array.from({ length: count }, (_, id) => {
    const quantile = (id + 0.5) / count;
    return {
      id,
      restLifetimeS: -MUON_MEAN_LIFETIME * Math.log(1 - quantile),
      laneOffset: ((id * 17) % count) / Math.max(1, count - 1),
    };
  });
}

function particleAt(
  particle: MuonParticle,
  journeyProgress: number,
  earthTravelTimeS: number,
  dilation: number,
): MuonParticleState {
  const decayProgress = Math.min(1, (particle.restLifetimeS * dilation) / earthTravelTimeS);
  return {
    ...particle,
    decayProgress,
    progress: Math.min(journeyProgress, decayProgress),
    survived: decayProgress >= 1,
  };
}

export function muonExperimentAt(
  state: MuonSurvivalState,
  cohort: readonly MuonParticle[],
  progress: number,
): MuonExperimentState {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const relativistic = cohort.map((particle) => particleAt(particle, p, state.earthTravelTimeS, state.gamma));
  const withoutDilation = cohort.map((particle) => particleAt(particle, p, state.earthTravelTimeS, 1));
  return {
    progress: p,
    earthElapsedS: state.earthTravelTimeS * p,
    properElapsedS: state.properTravelTimeS * p,
    relativistic,
    withoutDilation,
    relativisticArrivals: relativistic.filter((particle) => particle.survived && p >= 1).length,
    withoutDilationArrivals: withoutDilation.filter((particle) => particle.survived && p >= 1).length,
  };
}
