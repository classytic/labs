'use client';

/**
 * Projectile lab — RUNTIME entry (default export). Orchestration only: learner controls,
 * animation state, and renderer selection. It owns NO physics — every number comes from
 * core/model (computeProjectile / sampleArc / projectileAt / landing), and drawing is
 * delegated to the SVG renderer. This is the layering the architecture mandates:
 *   core/  = formulas (pure)   ·   runtime/svg = drawing   ·   runtime/index = glue.
 */

import { useRef, useState, type ReactNode } from 'react';
import { useFrameLoop, useInView } from '@classytic/stage';
import { Slider, CheckButton, StatusPill } from '../../../../kit/controls.js';
import { Field, StatList, Stat } from '../../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../../kit/activity-authoring.js';
import { useReducedMotionDeferred } from '../../../../kit/anim.js';
import { num } from '../../../../core/util.js';
import { computeProjectile, sampleArc, projectileAt, landing } from '../core/model.js';
import type { ProjectileInput } from '../core/types.js';
import { ProjectileSvg } from './svg.js';

const PROJECTILE_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Projectile lab',
  objectives: [
    'Predict whether a launch will hit a target',
    'Connect launch variables to range, peak, and flight time',
    'Transfer the model to a new launch setup',
  ],
  success: [
    {
      id: 'prediction-made',
      source: 'reflection',
      key: 'prediction',
      pendingLabel: 'Commit to a prediction before firing.',
    },
    { id: 'launched', source: 'action', key: 'launch', pendingLabel: 'Fire one launch to continue.' },
    {
      id: 'transfer-claim',
      source: 'reflection',
      key: 'transfer',
      pendingLabel: 'Explain how you would adjust the next launch.',
    },
  ],
  questions: [
    {
      kind: 'reflection',
      id: 'prediction',
      prompt: 'Will this setup hit the target? Record your prediction and why.',
      rubric: ['Names hit or miss', 'Uses angle, speed, or predicted range as evidence'],
    },
    {
      kind: 'reflection',
      id: 'transfer',
      prompt: 'For a farther target, what would you change first and why?',
      rubric: ['Changes a launch variable', 'Connects the change to range or flight time'],
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the landing',
      lead: 'Commit before launching so the result tests your model.',
      success: 'prediction-made',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Launch and measure',
      lead: 'Fire the projectile, then compare the landing with your prediction.',
      controls: true,
      success: 'launched',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the evidence',
      lead: 'Use range, peak, and time together—not the animation alone.',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the trajectory',
      lead: 'Relate the horizontal and vertical components to the curved path.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Plan a new launch',
      lead: 'Apply the relationship to a farther target.',
      success: 'transfer-claim',
    },
  ],
};

export default function ProjectileLab(props: { targetMeters?: number; g?: number }): ReactNode {
  const target = num(props.targetMeters, 70);
  const G = num(props.g, 9.8);
  const [angle, setAngle] = useState(45);
  const [speed, setSpeed] = useState(28);
  const [phase, setPhase] = useState<'idle' | 'flying' | 'hit' | 'miss'>('idle');
  const [t, setT] = useState(0);
  const reduceMotion = useReducedMotionDeferred();
  const startRef = useRef<number | null>(null);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const input: ProjectileInput = { angleDeg: angle, speed, g: G };
  const { range, peak, timeOfFlight: tof } = computeProjectile(input);

  useFrameLoop(
    (f) => {
      if (startRef.current === null) startRef.current = f.timeMs;
      const tt = (f.timeMs - startRef.current) / 1000;
      setT(tt);
      if (tt >= tof) setPhase(landing(input, target).hit ? 'hit' : 'miss');
    },
    { running: phase === 'flying' && inView },
  );

  const fire = (complete?: AuthoredActivityContext['complete']): void => {
    startRef.current = null;
    complete?.('launched');
    if (reduceMotion) {
      setT(tof);
      setPhase(landing(input, target).hit ? 'hit' : 'miss');
      return;
    }
    setT(0);
    setPhase('flying');
  };
  const reset =
    (set: (v: number) => void): ((v: number) => void) =>
    (v) => {
      set(v);
      setPhase('idle');
      setT(0);
    };

  const arc = sampleArc(input);
  const ball = projectileAt(input, t);

  const figure = (
    <div ref={viewRef}>
      <ProjectileSvg angle={angle} target={target} peak={peak} arc={arc} ball={ball} />
    </div>
  );

  const controls = (context: AuthoredActivityContext) => (
    <div className="lab-activity-fields">
      <Field label="angle" value={`${angle}°`}>
        <Slider
          value={angle}
          min={10}
          max={80}
          step={1}
          onChange={reset(setAngle)}
          ariaLabel="launch angle"
          style={{ width: 110 }}
        />
      </Field>
      <Field label="speed" value={`${speed} m/s`}>
        <Slider
          value={speed}
          min={10}
          max={36}
          step={1}
          onChange={reset(setSpeed)}
          ariaLabel="launch speed"
          style={{ width: 110 }}
        />
      </Field>
      <CheckButton onClick={() => fire(context.complete)}>Fire</CheckButton>
    </div>
  );

  const aside = (
    <>
      {(phase === 'hit' || phase === 'miss') && (
        <StatusPill ok={phase === 'hit'}>
          {phase === 'hit' ? '🎯 Direct hit!' : 'So close, adjust and retry'}
        </StatusPill>
      )}
      <StatList>
        <Stat label="range" value={`${range.toFixed(0)} m`} />
        <Stat label="peak" value={`${peak.toFixed(0)} m`} />
        <Stat label="time" value={`${tof.toFixed(1)} s`} />
      </StatList>
      <small className="lab-control-hint">
        target at {target} m · g = {G} m/s²
      </small>
    </>
  );

  return (
    <AuthoredActivityRuntime
      activity={PROJECTILE_ACTIVITY}
      activityId="projectile-lab"
      eyebrow="Mechanics"
      title="Projectile lab"
      description="Tune the angle and speed, predict the landing, then test the model."
      status={
        <>
          <span>{phase}</span>
          <span>{range.toFixed(0)} m range</span>
        </>
      }
      inspector={(context) => (
        <>
          {aside}
          {controls(context)}
        </>
      )}
      transcript={
        <p>
          Angle {angle} degrees, speed {speed} metres per second, predicted range {range.toFixed(1)} metres,
          peak {peak.toFixed(1)} metres, flight time {tof.toFixed(1)} seconds. Current result: {phase}.
        </p>
      }
    >
      {figure}
    </AuthoredActivityRuntime>
  );
}
