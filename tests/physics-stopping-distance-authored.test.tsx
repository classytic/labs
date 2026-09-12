import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { AuthoredActivity } from '../src/kit/activity-authoring.js';
import { assessLabExperience } from '../src/authoring/quality.js';
import { StoppingDistanceLab } from '../src/physics/stopping-distance/preset.js';
import { CollisionTrackLab } from '../src/physics/collision-track/preset.js';
import { ImpulseLab } from '../src/physics/impulse/preset.js';
import { AtwoodLab } from '../src/physics/atwood/preset.js';
import { RampForcesLab } from '../src/physics/ramp-forces/preset.js';
import { WorkEnergyLab } from '../src/physics/work-energy/preset.js';
import { GravityDrop } from '../src/physics/gravity-drop.js';
import { GravitationLab } from '../src/physics/gravitation/preset.js';
import { OrbitLab } from '../src/physics/orbit-lab.js';
import { KeplerLab } from '../src/physics/kepler/preset.js';
import { WaveLab } from '../src/physics/waves/preset.js';
import { RippleTankLab } from '../src/physics/waves/ripple.js';
import { DopplerLab } from '../src/physics/waves/doppler.js';
import { StringReflectionLab } from '../src/physics/waves/string.js';
import { SimpleHarmonicLab } from '../src/physics/shm/preset.js';
import { VectorBoardLab } from '../src/physics/vector-board/preset.js';
import { VectorTypesLab } from '../src/physics/vector-types/preset.js';
import { RainRelativeLab } from '../src/physics/rain-relative/preset.js';
import { RiverBoat } from '../src/physics/river-boat.js';
import { ElectricFieldLab } from '../src/physics/electric-field/preset.js';
import { ElectricFluxLab } from '../src/physics/electric-flux/preset.js';
import { GaussLab } from '../src/physics/gauss-law/preset.js';
import { MagnetismLab } from '../src/physics/magnetism/preset.js';
import { LorentzForceLab } from '../src/physics/lorentz/preset.js';
import { OpticsLab } from '../src/physics/optics/preset.js';
import { RefractionLab } from '../src/physics/optics/refraction.js';
import { LensImagingLab } from '../src/physics/optics/lens.js';
import { MirrorImagingLab } from '../src/physics/optics/mirror.js';
import { HeatTransferLab } from '../src/physics/heat-transfer/preset.js';
import { TemperatureScalesLab } from '../src/physics/temperature-scales/preset.js';
import { ThermalExpansionLab } from '../src/physics/expansion/preset.js';
import { GasProcessLab } from '../src/physics/gas-process/preset.js';
import { EntropyLab } from '../src/physics/entropy/preset.js';
import { CarnotCycleLab } from '../src/physics/carnot/preset.js';
import { EfficiencyLab } from '../src/physics/efficiency/preset.js';
import { WaterDensityLab } from '../src/physics/water-density/preset.js';
import { BulletWallsLab } from '../src/physics/bullet-walls/preset.js';
import { CircularMotionLab } from '../src/physics/circular-motion/preset.js';
import { EnergySkateLab } from '../src/physics/energy-skate/preset.js';
import { LeverBalanceLab } from '../src/physics/lever/preset.js';
import { TerminalVelocityLab } from '../src/physics/terminal-velocity/preset.js';
import { WorkPotentialLab } from '../src/physics/work-potential/preset.js';
import stoppingDistanceManifest from '../src/domains/physics/stopping-distance/manifest.js';
import collisionTrackManifest from '../src/domains/physics/collision-track/manifest.js';
import impulseManifest from '../src/domains/physics/impulse/manifest.js';
import atwoodManifest from '../src/domains/physics/atwood/manifest.js';
import rampForcesManifest from '../src/domains/physics/ramp-forces/manifest.js';
import workEnergyManifest from '../src/domains/physics/work-energy/manifest.js';
import gravityDropManifest from '../src/domains/physics/gravity-drop/manifest.js';
import gravitationManifest from '../src/domains/physics/gravitation/manifest.js';
import orbitLabManifest from '../src/domains/physics/orbit-lab/manifest.js';
import keplerManifest from '../src/domains/physics/kepler/manifest.js';
import waveLabManifest from '../src/domains/physics/wave-lab/manifest.js';
import rippleTankManifest from '../src/domains/physics/ripple-tank/manifest.js';
import dopplerManifest from '../src/domains/physics/doppler/manifest.js';
import stringReflectionManifest from '../src/domains/physics/string-reflection/manifest.js';
import shmManifest from '../src/domains/physics/shm/manifest.js';
import vectorBoardManifest from '../src/domains/physics/vector-board/manifest.js';
import vectorTypesManifest from '../src/domains/physics/vector-types/manifest.js';
import rainRelativeManifest from '../src/domains/physics/rain-relative/manifest.js';
import riverBoatManifest from '../src/domains/physics/river-boat/manifest.js';
import electricFieldManifest from '../src/domains/physics/electric-field/manifest.js';
import electricFluxManifest from '../src/domains/physics/electric-flux/manifest.js';
import gaussLawManifest from '../src/domains/physics/gauss-law/manifest.js';
import magnetismManifest from '../src/domains/physics/magnetism/manifest.js';
import lorentzManifest from '../src/domains/physics/lorentz/manifest.js';
import opticsManifest from '../src/domains/physics/optics/manifest.js';
import refractionManifest from '../src/domains/physics/refraction/manifest.js';
import lensImagingManifest from '../src/domains/physics/lens-imaging/manifest.js';
import mirrorImagingManifest from '../src/domains/physics/mirror-imaging/manifest.js';
import heatTransferManifest from '../src/domains/physics/heat-transfer/manifest.js';
import temperatureScalesManifest from '../src/domains/physics/temperature-scales/manifest.js';
import thermalExpansionManifest from '../src/domains/physics/thermal-expansion/manifest.js';
import gasProcessManifest from '../src/domains/physics/gas-process/manifest.js';
import entropyManifest from '../src/domains/physics/entropy/manifest.js';
import carnotManifest from '../src/domains/physics/carnot/manifest.js';
import efficiencyManifest from '../src/domains/physics/efficiency/manifest.js';
import waterDensityManifest from '../src/domains/physics/water-density/manifest.js';
import bulletWallsManifest from '../src/domains/physics/bullet-walls/manifest.js';
import circularMotionManifest from '../src/domains/physics/circular-motion/manifest.js';
import energySkateManifest from '../src/domains/physics/energy-skate/manifest.js';
import leverManifest from '../src/domains/physics/lever/manifest.js';
import terminalVelocityManifest from '../src/domains/physics/terminal-velocity/manifest.js';
import workPotentialManifest from '../src/domains/physics/work-potential/manifest.js';

afterEach(cleanup);

const activity: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Author-defined road-safety lesson',
  objectives: ['Inspect stopping distance'],
  steps: [{ id: 'observe', phase: 'observe', title: 'Author-defined stopping step' }],
};

describe('stopping-distance authored convergence', () => {
  for (const [name, view] of [
    ['stopping distance', <StoppingDistanceLab activity={activity} />],
    ['collision track', <CollisionTrackLab activity={activity} />],
    ['impulse', <ImpulseLab activity={activity} />],
    ['Atwood machine', <AtwoodLab activity={activity} />],
    ['ramp forces', <RampForcesLab activity={activity} />],
    ['work energy', <WorkEnergyLab activity={activity} />],
    ['gravity drop', <GravityDrop activity={activity} />],
    ['gravitation', <GravitationLab activity={activity} />],
    ['orbit lab', <OrbitLab activity={activity} />],
    ['Kepler', <KeplerLab activity={activity} />],
    ['travelling waves', <WaveLab activity={activity} />],
    ['ripple tank', <RippleTankLab activity={activity} />],
    ['Doppler effect', <DopplerLab activity={activity} />],
    ['string reflection', <StringReflectionLab activity={activity} />],
    ['simple harmonic motion', <SimpleHarmonicLab activity={activity} />],
    ['vector board', <VectorBoardLab vectors={[{ comp: { x: 2, y: 1 }, drag: true }]} activity={activity} />],
    ['vector types', <VectorTypesLab activity={activity} />],
    ['rain relative velocity', <RainRelativeLab activity={activity} />],
    ['river boat', <RiverBoat activity={activity} />],
    ['electric field', <ElectricFieldLab activity={activity} />],
    ['electric flux', <ElectricFluxLab activity={activity} />],
    ['Gauss law', <GaussLab activity={activity} />],
    ['magnetism', <MagnetismLab activity={activity} />],
    ['Lorentz force', <LorentzForceLab activity={activity} />],
    ['reflection puzzle', <OpticsLab activity={activity} />],
    ['refraction', <RefractionLab activity={activity} />],
    ['lens imaging', <LensImagingLab activity={activity} />],
    ['mirror imaging', <MirrorImagingLab activity={activity} />],
    ['heat transfer', <HeatTransferLab activity={activity} />],
    ['temperature scales', <TemperatureScalesLab activity={activity} />],
    ['thermal expansion', <ThermalExpansionLab activity={activity} />],
    ['gas process', <GasProcessLab activity={activity} />],
    ['entropy', <EntropyLab activity={activity} />],
    ['Carnot cycle', <CarnotCycleLab activity={activity} />],
    ['efficiency', <EfficiencyLab activity={activity} />],
    ['water density', <WaterDensityLab activity={activity} />],
    ['bullet walls', <BulletWallsLab activity={activity} />],
    ['circular motion', <CircularMotionLab activity={activity} />],
    ['energy skate', <EnergySkateLab activity={activity} />],
    ['lever', <LeverBalanceLab activity={activity} />],
    ['terminal velocity', <TerminalVelocityLab activity={activity} />],
    ['work and potential', <WorkPotentialLab activity={activity} />],
  ] as const)
    it(`uses the canonical authored runtime for ${name}`, () => {
      const result = render(view);
      expect(result.container.querySelector('.lab-authored-activity')).not.toBeNull();
      expect(result.getByText('Author-defined stopping step')).toBeTruthy();
    });

  it('publishes bounded author inputs and a complete teaching contract', () => {
    for (const manifest of [
      stoppingDistanceManifest,
      collisionTrackManifest,
      impulseManifest,
      atwoodManifest,
      rampForcesManifest,
      workEnergyManifest,
      gravityDropManifest,
      gravitationManifest,
      orbitLabManifest,
      keplerManifest,
      waveLabManifest,
      rippleTankManifest,
      dopplerManifest,
      stringReflectionManifest,
      shmManifest,
      vectorBoardManifest,
      vectorTypesManifest,
      rainRelativeManifest,
      riverBoatManifest,
      electricFieldManifest,
      electricFluxManifest,
      gaussLawManifest,
      magnetismManifest,
      lorentzManifest,
      opticsManifest,
      refractionManifest,
      lensImagingManifest,
      mirrorImagingManifest,
      heatTransferManifest,
      temperatureScalesManifest,
      thermalExpansionManifest,
      gasProcessManifest,
      entropyManifest,
      carnotManifest,
      efficiencyManifest,
      waterDensityManifest,
      bulletWallsManifest,
      circularMotionManifest,
      energySkateManifest,
      leverManifest,
      terminalVelocityManifest,
      workPotentialManifest,
    ]) {
      expect(assessLabExperience(manifest)).toEqual({ ready: true, issues: [] });
      expect(manifest.schema.safeParse({ activity }).success).toBe(true);
    }
    expect(stoppingDistanceManifest.schema.safeParse({ speed: 41 }).success).toBe(false);
    expect(stoppingDistanceManifest.schema.safeParse({ speed: 30, maxSpeed: 20 }).success).toBe(false);
    expect(collisionTrackManifest.schema.safeParse({ elasticity: 1.1 }).success).toBe(false);
    expect(impulseManifest.schema.safeParse({ contact: 0.5 }).success).toBe(false);
    expect(atwoodManifest.schema.safeParse({ m1: 9 }).success).toBe(false);
    expect(rampForcesManifest.schema.safeParse({ friction: 0.2, frictionKinetic: 0.4 }).success).toBe(false);
    expect(gravityDropManifest.schema.safeParse({ height: 101 }).success).toBe(false);
    expect(gravitationManifest.schema.safeParse({ planetMass: 10 }).success).toBe(false);
    expect(orbitLabManifest.schema.safeParse({ launchSpeedRatio: 1.6 }).success).toBe(false);
    expect(keplerManifest.schema.safeParse({ eccentricity: 0.8 }).success).toBe(false);
    expect(waveLabManifest.schema.safeParse({ frequency: 3.1 }).success).toBe(false);
    expect(rippleTankManifest.schema.safeParse({ wavelength: 0.3 }).success).toBe(false);
    expect(dopplerManifest.schema.safeParse({ mach: 2 }).success).toBe(false);
    expect(stringReflectionManifest.schema.safeParse({ frequency: 2 }).success).toBe(false);
    expect(shmManifest.schema.safeParse({ amplitude: 13 }).success).toBe(false);
    expect(
      vectorBoardManifest.schema.safeParse({ vectors: Array.from({ length: 13 }, () => ({ x: 1, y: 1 })) })
        .success,
    ).toBe(false);
    expect(vectorTypesManifest.schema.safeParse({ types: [] }).success).toBe(false);
    expect(rainRelativeManifest.schema.safeParse({ maxSpeed: 10, start: 12 }).success).toBe(false);
    expect(riverBoatManifest.schema.safeParse({ riverWidth: 20 }).success).toBe(false);
    expect(electricFluxManifest.schema.safeParse({ angleDeg: 100 }).success).toBe(false);
    expect(gaussLawManifest.schema.safeParse({ height: 100 }).success).toBe(false);
    expect(lorentzManifest.schema.safeParse({ B: 4 }).success).toBe(false);
    expect(opticsManifest.schema.safeParse({ height: 200 }).success).toBe(false);
    expect(refractionManifest.schema.safeParse({ angle: 90 }).success).toBe(false);
    expect(lensImagingManifest.schema.safeParse({ focalLength: 20 }).success).toBe(false);
    expect(mirrorImagingManifest.schema.safeParse({ objectDistance: 40 }).success).toBe(false);
    expect(temperatureScalesManifest.schema.safeParse({ initialC: -274 }).success).toBe(false);
    expect(gasProcessManifest.schema.safeParse({ tempK: 0 }).success).toBe(false);
    expect(carnotManifest.schema.safeParse({ hotK: 400, coldK: 500 }).success).toBe(false);
    expect(efficiencyManifest.schema.safeParse({ streams: [] }).success).toBe(false);
    expect(bulletWallsManifest.schema.safeParse({ speed: 100 }).success).toBe(false);
    expect(circularMotionManifest.schema.safeParse({ radius: 0 }).success).toBe(false);
    expect(energySkateManifest.schema.safeParse({ startHeight: 6 }).success).toBe(false);
    expect(
      leverManifest.schema.safeParse({
        items: [
          { side: 'L', dist: 2, weight: 4 },
          { side: 'R', dist: 2, weight: 5 },
        ],
      }).success,
    ).toBe(false);
    expect(terminalVelocityManifest.schema.safeParse({ drag: 2 }).success).toBe(false);
    expect(workPotentialManifest.schema.safeParse({ charge: 0 }).success).toBe(false);
  });
});
