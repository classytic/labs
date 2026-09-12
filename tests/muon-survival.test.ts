import { describe, expect, it } from 'vitest';
import {
  exponentialSurvival,
  createMuonCohort,
  MUON_MEAN_LIFETIME,
  muonSurvivalState,
  muonExperimentAt,
} from '../src/physics/modern/relativity/muon-core.js';
describe('muon survival model', () => {
  it('uses exponential decay', () =>
    expect(exponentialSurvival(MUON_MEAN_LIFETIME)).toBeCloseTo(Math.exp(-1), 12));
  it('uses proper time', () => {
    const s = muonSurvivalState(0.995, 10_000, 1000);
    expect(s.properTravelTimeS).toBeCloseTo(s.earthTravelTimeS / s.gamma, 14);
    expect(s.survivalProbability).toBeGreaterThan(s.classicalSurvivalProbability);
  });
  it('falls with distance and rises with speed', () => {
    expect(muonSurvivalState(0.995, 5000).survivalProbability).toBeGreaterThan(
      muonSurvivalState(0.995, 10000).survivalProbability,
    );
    expect(muonSurvivalState(0.995, 10000).survivalProbability).toBeGreaterThan(
      muonSurvivalState(0.9, 10000).survivalProbability,
    );
  });
  it('uses one stable cohort for both comparison lanes', () => {
    const cohort = createMuonCohort(24);
    expect(createMuonCohort(24)).toEqual(cohort);
    const experiment = muonExperimentAt(muonSurvivalState(0.995), cohort, 0.5);
    expect(experiment.relativistic.map((particle) => particle.restLifetimeS)).toEqual(
      experiment.withoutDilation.map((particle) => particle.restLifetimeS),
    );
  });
  it('moves particles monotonically and records more relativistic arrivals', () => {
    const state = muonSurvivalState(0.995);
    const cohort = createMuonCohort(48);
    const early = muonExperimentAt(state, cohort, 0.25);
    const late = muonExperimentAt(state, cohort, 0.75);
    late.relativistic.forEach((particle, index) =>
      expect(particle.progress).toBeGreaterThanOrEqual(early.relativistic[index]!.progress),
    );
    const complete = muonExperimentAt(state, cohort, 1);
    expect(complete.relativisticArrivals).toBeGreaterThan(complete.withoutDilationArrivals);
  });
});
