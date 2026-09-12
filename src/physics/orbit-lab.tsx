'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CanvasLayer, useFrameLoop, useInView, type CoordinateSystem } from '@classytic/stage';
import { Slider, StatusPill, Chip } from '../kit/controls.js';
import { Field, LiveRegion, type ControlConfig } from '../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../kit/activity-authoring.js';
import { SceneSurface } from './mechanics/presentation.js';
import { launchState, specificOrbitalEnergy, stepTwoBody, type TwoBodyState } from './orbital/core.js';

const MU = 1,
  INITIAL_RADIUS = 1,
  PLANET_RADIUS = 0.16,
  ESCAPE_RADIUS = 2.5,
  VIEW_RADIUS = 2.7;
const STEP = 0.006,
  SUBSTEPS = 6;
type Phase = 'idle' | 'running' | 'paused' | 'crashed' | 'escaped';
interface Sim extends TwoBodyState {
  trail: Array<[number, number]>;
}
export interface OrbitLabProps {
  launchSpeedRatio?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  controlConfig?: ControlConfig;
  activity?: string | AuthoredActivity;
}
const initialSim = (ratio: number): Sim => ({ ...launchState(INITIAL_RADIUS, ratio, MU), trail: [] });

const ORBIT_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Fall sideways: crash, orbit, or escape',
  objectives: [
    'Predict trajectory from launch speed',
    'Connect orbital energy to bound and unbound paths',
    'Tune a launch into a sustained orbit',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict escape speed',
      lead: 'Decide what positive orbital energy means.',
      success: 'energy-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Launch sideways',
      lead: 'Run one trajectory and follow its trail.',
      controls: true,
      reveal: ['model'],
      success: 'launched',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read path and energy',
      lead: 'Compare radius, speed, energy, and trajectory shape.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain continuous falling',
      lead: 'Explain how gravity turns velocity without reaching the surface.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Tune a different outcome',
      lead: 'Change launch speed and produce a different energy regime.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'speed-changed',
    },
  ],
  questions: [
    {
      id: 'energy',
      prompt: 'A trajectory with positive specific orbital energy is…',
      choices: [
        { value: 'unbound', label: 'unbound and able to escape' },
        { value: 'circle', label: 'necessarily circular' },
        { value: 'crash', label: 'guaranteed to crash' },
      ],
      answer: 'unbound',
      explain: 'Positive orbital energy corresponds to an unbound trajectory.',
    },
  ],
  success: [
    {
      id: 'energy-answer',
      source: 'answer',
      key: 'energy',
      operator: 'eq',
      value: 'unbound',
      pendingLabel: 'Choose the positive-energy outcome.',
    },
    {
      id: 'launched',
      source: 'metric',
      key: 'launched',
      operator: 'eq',
      value: true,
      pendingLabel: 'Launch the satellite.',
    },
    {
      id: 'speed-changed',
      source: 'metric',
      key: 'speedChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change the launch-speed ratio.',
    },
  ],
};

export function OrbitLab({
  launchSpeedRatio = 1,
  title = 'Orbit lab: fall sideways and keep missing',
  prompt = 'Choose a launch speed. Too slow intersects the planet, circular speed closes the path, and speed above escape carries the satellite away.',
  objectives,
  controlConfig,
  activity = 'orbit-lab',
}: OrbitLabProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'orbit-lab';
  const authoredActivity = typeof activity === 'string' ? ORBIT_ACTIVITY : activity;
  const [speed, setSpeed] = useState(Math.min(1.5, Math.max(0.5, launchSpeedRatio)));
  const [phase, setPhase] = useState<Phase>('idle');
  const [, repaint] = useState(0);
  const sim = useRef<Sim>(initialSim(speed));
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  const resetSim = useCallback(() => {
    sim.current = initialSim(speed);
    repaint((value) => value + 1);
  }, [speed]);
  useEffect(() => {
    if (phase !== 'running') resetSim();
  }, [speed, resetSim]);

  useFrameLoop(
    () => {
      let next: TwoBodyState = sim.current;
      for (let index = 0; index < SUBSTEPS; index++) next = stepTwoBody(next, MU, STEP);
      Object.assign(sim.current, next);
      sim.current.trail.push([next.x, next.y]);
      if (sim.current.trail.length > 320) sim.current.trail.shift();
      const radius = Math.hypot(next.x, next.y);
      if (radius <= PLANET_RADIUS) setPhase('crashed');
      else if (radius >= ESCAPE_RADIUS && next.x * next.vx + next.y * next.vy > 0) setPhase('escaped');
      repaint((value) => value + 1);
    },
    { running: phase === 'running' && inView },
  );

  const draw = useCallback((ctx: CanvasRenderingContext2D, coordinates: CoordinateSystem) => {
    const width = coordinates.width,
      height = coordinates.height,
      cx = width / 2,
      cy = height / 2;
    const tokens =
      typeof Element !== 'undefined' && ctx.canvas instanceof Element ? getComputedStyle(ctx.canvas) : null;
    const accent = tokens?.getPropertyValue('--stage-accent').trim() || '#3b82f6';
    const warn = tokens?.getPropertyValue('--stage-warn').trim() || '#f59e0b';
    const good = tokens?.getPropertyValue('--stage-good').trim() || '#22c55e';
    const muted = tokens?.getPropertyValue('--stage-muted').trim() || '#64748b';
    const scale = Math.min(width, height) / (VIEW_RADIUS * 2);
    const point = (x: number, y: number): [number, number] => [cx + x * scale, cy + y * scale];
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = muted;
    ctx.globalAlpha = 0.28;
    for (let index = 0; index < 32; index++) {
      const angle = index * 2.39996;
      const radius = 24 + ((index * 47) % Math.max(30, Math.min(width, height) / 2 - 24));
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(angle) * radius,
        cy + Math.sin(angle) * radius,
        index % 7 === 0 ? 1.25 : 0.7,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (sim.current.trail.length === 0) {
      ctx.strokeStyle = 'rgba(96,165,250,.38)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, INITIAL_RADIUS * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (sim.current.trail.length > 1) {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.moveTo(...point(...sim.current.trail[0]!));
      for (let index = 1; index < sim.current.trail.length; index++)
        ctx.lineTo(...point(...sim.current.trail[index]!));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const planetRadius = Math.max(15, PLANET_RADIUS * scale);
    const glow = ctx.createRadialGradient(cx, cy, planetRadius * 0.4, cx, cy, planetRadius * 2.5);
    glow.addColorStop(0, 'rgba(59,130,246,.42)');
    glow.addColorStop(1, 'rgba(59,130,246,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, planetRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();
    const ocean = ctx.createRadialGradient(
      cx - planetRadius * 0.35,
      cy - planetRadius * 0.4,
      planetRadius * 0.1,
      cx,
      cy,
      planetRadius,
    );
    ocean.addColorStop(0, '#67e8f9');
    ocean.addColorStop(0.5, '#2563eb');
    ocean.addColorStop(1, '#172554');
    ctx.fillStyle = ocean;
    ctx.beginPath();
    ctx.arc(cx, cy, planetRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, planetRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.ellipse(
      cx - planetRadius * 0.25,
      cy - planetRadius * 0.18,
      planetRadius * 0.42,
      planetRadius * 0.2,
      -0.45,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      cx + planetRadius * 0.24,
      cy + planetRadius * 0.28,
      planetRadius * 0.3,
      planetRadius * 0.17,
      0.7,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
    const [sx, sy] = point(sim.current.x, sim.current.y);
    ctx.fillStyle = 'rgba(245,158,11,.22)';
    ctx.beginPath();
    ctx.arc(sx, sy, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = warn;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - 7, sy);
    ctx.lineTo(sx + 7, sy);
    ctx.moveTo(sx, sy - 4);
    ctx.lineTo(sx, sy + 4);
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(sx - 3, sy - 3, 6, 6);

    const arrow = (fromX: number, fromY: number, toX: number, toY: number, color: string, label: string) => {
      const angle = Math.atan2(toY - fromY, toX - fromX);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - Math.cos(angle - 0.5) * 9, toY - Math.sin(angle - 0.5) * 9);
      ctx.lineTo(toX - Math.cos(angle + 0.5) * 9, toY - Math.sin(angle + 0.5) * 9);
      ctx.closePath();
      ctx.fill();
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText(label, toX + 8, toY - 7);
    };
    const velocityLength = Math.min(72, 38 + Math.hypot(sim.current.vx, sim.current.vy) * 18);
    const velocityAngle = Math.atan2(-sim.current.vy, sim.current.vx);
    arrow(
      sx,
      sy,
      sx + Math.cos(velocityAngle) * velocityLength,
      sy + Math.sin(velocityAngle) * velocityLength,
      good,
      'velocity v',
    );
    const gravityAngle = Math.atan2(cy - sy, cx - sx);
    arrow(sx, sy, sx + Math.cos(gravityAngle) * 50, sy + Math.sin(gravityAngle) * 50, warn, 'gravity');
  }, []);

  const reset = (): void => {
    setPhase('idle');
    resetSim();
  };
  const launch = (): void => {
    resetSim();
    setPhase('running');
  };
  const radius = Math.hypot(sim.current.x, sim.current.y),
    velocity = Math.hypot(sim.current.vx, sim.current.vy),
    energy = specificOrbitalEnergy(sim.current, MU);
  const predicted = energy < 0 ? 'bound orbit' : 'escape trajectory';
  const verdict =
    phase === 'crashed'
      ? 'Launch path intersected the planet'
      : phase === 'escaped'
        ? 'Satellite escaped the gravity well'
        : phase === 'running'
          ? predicted
          : 'Choose a launch speed';
  const figure = (
    <SceneSurface ref={viewRef} tone="space" className="physics-orbit-simulator">
      <CanvasLayer
        view={{ xMin: -VIEW_RADIUS, xMax: VIEW_RADIUS, yMin: -VIEW_RADIUS, yMax: VIEW_RADIUS }}
        height={420}
        draw={draw}
        ariaLabel={`Satellite at radius ${radius.toFixed(2)}, launch speed ${speed.toFixed(2)} times circular speed; ${verdict}`}
      />
    </SceneSurface>
  );
  const instruments = (
    <>
      <StatusPill ok={phase !== 'crashed' && phase !== 'escaped'}>{verdict}</StatusPill>
      <div className="physics-probe">
        <span>Model-space state</span>
        <strong>{predicted}</strong>
        <small>
          r {radius.toFixed(2)} · v {velocity.toFixed(2)} · energy {energy.toFixed(2)}
        </small>
      </div>
      <LiveRegion>
        {verdict}. Radius {radius.toFixed(2)}, speed {velocity.toFixed(2)}.
      </LiveRegion>
    </>
  );
  const controls = (
    <>
      <div className="lab-field-row">
        <Chip
          selected={phase === 'running'}
          onClick={
            phase === 'running'
              ? () => setPhase('paused')
              : phase === 'paused'
                ? () => setPhase('running')
                : launch
          }
        >
          {phase === 'running' ? 'Pause' : phase === 'paused' ? 'Resume' : 'Launch'}
        </Chip>
        <Chip selected={false} onClick={reset}>
          Reset
        </Chip>
      </div>
      <Field label="launch speed" value={`${speed.toFixed(2)}× circular`}>
        <Slider
          value={speed}
          min={0.5}
          max={1.5}
          step={0.02}
          onChange={(value) => {
            setSpeed(value);
            setPhase('idle');
          }}
          ariaLabel="launch speed relative to circular speed"
        />
      </Field>
    </>
  );
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Orbital mechanics"
      title={title}
      description={prompt}
      status={
        <>
          <span>{verdict}</span>
          <span>r {radius.toFixed(2)}</span>
          <span>ε {energy.toFixed(2)}</span>
        </>
      }
      evidence={instruments}
      controls={controls}
      observation="Circular speed continuously turns the velocity just enough to miss the planet. Lower speeds make a tighter ellipse that may collide; above escape speed the path is unbound."
      transcript={
        <p>{`The satellite is at radius ${radius.toFixed(2)} with speed ${velocity.toFixed(2)} and specific orbital energy ${energy.toFixed(2)}. The predicted path is ${predicted}.`}</p>
      }
      controlConfig={controlConfig}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="launched" met={phase !== 'idle'} complete={complete} />
          <AuthoredMetricGate
            conditionId="speed-changed"
            met={Math.abs(speed - launchSpeedRatio) > 0.01}
            complete={complete}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
