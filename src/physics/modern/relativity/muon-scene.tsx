import type { ReactNode } from 'react';
import { Ball, Block, FigText, Figure, HUE, Particle, Track, tint } from '../../../kit/figure/index.js';
import type { MuonExperimentState, MuonParticleState, MuonSurvivalState } from './muon-core.js';
import { ClockFace } from './scene-primitives.js';

const W = 720;
const H = 340;
const LANE_X0 = 54;
const LANE_X1 = 662;
const DETECTOR_X = 662;

function ParticleLane({
  label,
  detail,
  particles,
  y,
  progress,
}: {
  label: string;
  detail: string;
  particles: readonly MuonParticleState[];
  y: number;
  progress: number;
}): ReactNode {
  return (
    <g>
      <FigText x={40} y={y - 38} size="eyebrow" tone="soft">
        {label}
      </FigText>
      <FigText x={680} y={y - 38} anchor="end">
        {detail}
      </FigText>
      <Track
        points={[
          [LANE_X0, y],
          [LANE_X1, y],
        ]}
        color={HUE.soft}
        weight="hair"
      />
      {particles.map((particle) => {
        const x = LANE_X0 + particle.progress * (LANE_X1 - LANE_X0 - 4);
        const py = y + (particle.laneOffset - 0.5) * 24;
        const decayed = progress >= particle.decayProgress && !particle.survived;
        if (!decayed) return <Particle key={particle.id} x={x} y={py} r={5} color={HUE[1]} />;
        const burst = Math.max(0, 1 - (progress - particle.decayProgress) * 6);
        return <Ball key={particle.id} cx={x} cy={py} r={5} color={tint(HUE.warn, 35)} flash={burst} />;
      })}
      <Block x={DETECTOR_X} y={y - 22} w={16} h={44} color={HUE.good} radius={5} />
      <FigText x={DETECTOR_X + 8} y={y + 38} anchor="middle" size="note" tone="soft">
        detector
      </FigText>
    </g>
  );
}

function Clock({
  x,
  label,
  elapsedS,
  turns,
}: {
  x: number;
  label: string;
  elapsedS: number;
  turns: number;
}): ReactNode {
  return (
    <g>
      <ClockFace cx={x} cy={300} r={13} turns={turns} />
      <FigText x={x + 22} y={294} size="eyebrow" tone="soft">
        {label}
      </FigText>
      <FigText x={x + 22} y={314} size="measure">
        {(elapsedS * 1e6).toFixed(1)} μs
      </FigText>
    </g>
  );
}

export function MuonAtmosphereScene({
  state,
  population,
  experiment,
}: {
  state: MuonSurvivalState;
  population: number;
  experiment: MuonExperimentState;
}): ReactNode {
  const cohortSize = experiment.relativistic.length;
  void population;
  return (
    <Figure
      viewBox={[W, H]}
      domain="physics"
      label={`A cohort of ${cohortSize} muons compares decay with and without relativistic time dilation`}
    >
      <FigText x={40} y={26} size="note" tone="soft">
        same sampled rest lifetimes · atmosphere → detector
      </FigText>
      <ParticleLane
        label="without dilation · prediction"
        detail={`${experiment.withoutDilationArrivals}/${cohortSize} detected`}
        particles={experiment.withoutDilation}
        y={104}
        progress={experiment.progress}
      />
      <ParticleLane
        label="relativistic model"
        detail={`${experiment.relativisticArrivals}/${cohortSize} detected`}
        particles={experiment.relativistic}
        y={224}
        progress={experiment.progress}
      />
      <Clock
        x={54}
        label="Earth clock"
        elapsedS={experiment.earthElapsedS}
        turns={(experiment.earthElapsedS / state.earthTravelTimeS) * 0.5}
      />
      <Clock
        x={300}
        label="muon clock"
        elapsedS={experiment.properElapsedS}
        turns={(experiment.properElapsedS / state.earthTravelTimeS) * 0.5}
      />
    </Figure>
  );
}
