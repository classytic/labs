'use client';

/**
 * CollisionTrackLab, "Sticky or Bouncy?", momentum always survives, KE doesn't.
 *
 * Two carts collide on a frictionless track. ONE elasticity slider morphs
 * continuously from perfectly inelastic (e=0, stick + KE drops) to perfectly
 * elastic (e=1, bounce, KE held). A momentum bar stays FULL through the collision
 * while the KE bar visibly leaks when e<1, and a constant-velocity centre-of-mass
 * marker sails dead-straight through the impact, the single-image proof that
 * momentum is conserved no matter what. Kills the "momentum is lost" misconception.
 *
 * Tokenized SVG; time-dependent so the integrator lives here; honours reduced-motion.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Dot, Label } from '@classytic/stage';
import { Slider, StatusPill, Chip } from '../../kit/controls.js';
import { Field, MeterBar, LiveRegion } from '../../kit/frame.js';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { MechanicsVector, SceneSurface } from '../mechanics/presentation.js';
import { collisionResult } from '../mechanics/core.js';

export interface CollisionTrackProps {
  m1?: number;
  m2?: number;
  u1?: number;
  u2?: number;
  elasticity?: number;
  showCenterOfMass?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

const CART_W = 1.8,
  CART_H = 1.2,
  X0 = -9,
  X1 = 9;

const COLLISION_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Sticky or bouncy: what survives a collision?',
  objectives: [
    'Distinguish momentum conservation from kinetic-energy conservation',
    'Connect restitution to collision outcome',
    'Use centre-of-mass motion as conservation evidence',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict what survives',
      lead: 'Commit before launching the carts.',
      success: 'conservation-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Launch the carts',
      lead: 'Run the collision and follow both carts through impact.',
      controls: true,
      reveal: ['model'],
      success: 'impact-seen',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Compare the ledgers',
      lead: 'Read momentum, kinetic energy, and centre-of-mass evidence.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the energy loss',
      lead: 'Identify where kinetic energy goes without claiming momentum disappears.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Make the carts sticky',
      lead: 'Change elasticity and compare a second collision.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'elasticity-changed',
    },
  ],
  questions: [
    {
      id: 'conservation',
      prompt: 'For a perfectly elastic collision in an isolated system, what is conserved?',
      choices: [
        { value: 'momentum', label: 'Momentum only' },
        { value: 'both', label: 'Momentum and kinetic energy' },
        { value: 'energy', label: 'Kinetic energy only' },
      ],
      answer: 'both',
      explain:
        'Total momentum is conserved in every isolated collision; kinetic energy is also conserved when restitution is one.',
    },
  ],
  success: [
    {
      id: 'conservation-answer',
      source: 'answer',
      key: 'conservation',
      operator: 'eq',
      value: 'both',
      pendingLabel: 'Choose the conserved quantities.',
    },
    {
      id: 'impact-seen',
      source: 'metric',
      key: 'collided',
      operator: 'eq',
      value: true,
      pendingLabel: 'Launch the carts through impact.',
    },
    {
      id: 'elasticity-changed',
      source: 'metric',
      key: 'elasticityChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change elasticity from its starting value.',
    },
  ],
};

export function CollisionTrackLab({
  m1 = 1,
  m2 = 1,
  u1 = 4,
  u2 = -2,
  elasticity = 1,
  showCenterOfMass = true,
  title = 'Sticky or Bouncy?: momentum always survives',
  prompt = 'Set the elasticity, launch, and watch: the momentum bar stays full; the KE bar leaks when sticky.',
  objectives,
  activity = 'collision-track',
}: CollisionTrackProps): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'collision-track';
  const authoredActivity = typeof activity === 'string' ? COLLISION_ACTIVITY : activity;
  const [ma, setMa] = useState(m1);
  const [mb, setMb] = useState(m2);
  const [ua, setUa] = useState(u1);
  const [ub, setUb] = useState(u2);
  const [e, setE] = useState(elasticity);
  const [running, setRunning] = useState(false);
  const [collided, setCollided] = useState(false);
  const [stopped, setStopped] = useState(false);

  const xa = useRef(-6),
    xb = useRef(2);
  const phase = useRef<'approach' | 'after'>('approach');
  const startedRef = useRef(false);
  const reduce = useReducedMotion();

  const M = ma + mb;
  const collision = collisionResult(ma, mb, ua, ub, e);
  const va = collision.velocity1;
  const vb = collision.velocity2;
  const vcom = (ma * ua + mb * ub) / M;
  const pInit = collision.momentumBefore;
  const keInit = collision.kineticBefore;

  const after = collided;
  const v1 = after ? va : ua,
    v2 = after ? vb : ub;
  const pNow = ma * v1 + mb * v2;
  const keNow = 0.5 * ma * v1 * v1 + 0.5 * mb * v2 * v2;
  const keFrac = keInit > 1e-9 ? keNow / keInit : 1;

  // This is a short, user-triggered run. Do not gate it on IntersectionObserver:
  // embedded/scrolling lesson hosts can report a visible lab as offscreen.
  useFrameTick(running, (f) => {
    const dt = Math.min(0.05, f.dtMs / 1000);
    if (phase.current === 'approach') {
      xa.current += ua * dt;
      xb.current += ub * dt;
      if (xb.current - xa.current <= CART_W) {
        // snap to contact, switch to post-collision velocities
        const overlap = CART_W - (xb.current - xa.current);
        xa.current -= overlap / 2;
        xb.current += overlap / 2;
        phase.current = 'after';
        setCollided(true);
      }
    } else {
      xa.current += va * dt;
      xb.current += vb * dt;
      if (e < 0.02) {
        const mid = (xa.current + xb.current) / 2;
        xa.current = mid - CART_W / 2;
        xb.current = mid + CART_W / 2;
      }
    }
    // stop when a cart runs off the track
    if (
      xa.current <= X0 + CART_W / 2 ||
      xb.current >= X1 - CART_W / 2 ||
      (phase.current === 'after' && Math.abs(va) < 1e-3 && Math.abs(vb) < 1e-3)
    ) {
      setRunning(false);
      setStopped(true);
    }
  });

  const reset = (): void => {
    xa.current = -6;
    xb.current = 2;
    phase.current = 'approach';
    setCollided(false);
    setStopped(false);
  };
  const launch = (): void => {
    reset();
    if (reduce) {
      phase.current = 'after';
      setCollided(true);
      return;
    }
    startedRef.current = true;
    setRunning(true);
  };
  const onParam =
    (set: (n: number) => void) =>
    (n: number): void => {
      set(n);
      setRunning(false);
      reset();
    };

  const xcom = (ma * xa.current + mb * xb.current) / M;
  const view = { xMin: X0, xMax: X1, yMin: -2, yMax: 5 };

  const Cart = (x: number, w: number, vel: number, tint: string, name: string): ReactNode => {
    const hw = CART_W / 2;
    return (
      <>
        <Polygon
          points={[
            { x: x - hw, y: 0.15 },
            { x: x + hw, y: 0.15 },
            { x: x + hw, y: 0.15 + CART_H },
            { x: x - hw, y: 0.15 + CART_H },
          ]}
          color={`color-mix(in oklab, ${tint} 60%, black)`}
          fill={tint}
          fillOpacity={0.85}
          weight={1.5}
        />
        <Dot x={x - hw * 0.55} y={0.15} r={4} color="var(--stage-metal)" />
        <Dot x={x + hw * 0.55} y={0.15} r={4} color="var(--stage-metal)" />
        <Segment
          from={{ x: x + Math.sign(vel || 1) * hw, y: 0.35 }}
          to={{ x: x + Math.sign(vel || 1) * (hw + 0.16), y: 0.35 }}
          color="var(--stage-metal)"
          weight={3}
        />
        <Label
          x={x}
          y={0.15 + CART_H + 0.25}
          text={`${name} · ${w} kg`}
          color="var(--stage-fg)"
          size={14}
          dy={-8}
        />
        {Math.abs(vel) > 0.05 && (
          <MechanicsVector
            tail={{ x, y: 0.15 + CART_H + 0.6 }}
            tip={{ x: x + vel * 0.5, y: 0.15 + CART_H + 0.6 }}
            color={tint}
            weight={3}
            label={`${vel > 0 ? '+' : ''}${vel.toFixed(1)} m/s`}
            labelDy={-9}
            labelSize={11}
            active={running}
          />
        )}
      </>
    );
  };

  const figure = (
    <SceneSurface tone="grid" data-state={running ? 'moving' : after ? 'after-impact' : 'ready'}>
      <Stage
        view={view}
        height={210}
        preserveAspect={false}
        ariaLabel={`Two carts colliding, elasticity ${e.toFixed(2)}`}
      >
        {/* track */}
        <Segment
          from={{ x: X0, y: 0 }}
          to={{ x: X1, y: 0 }}
          color="var(--stage-fg)"
          opacity={0.5}
          weight={2}
        />
        {[-8, -4, 0, 4, 8].map((mk) => (
          <Segment
            key={mk}
            from={{ x: mk, y: -0.2 }}
            to={{ x: mk, y: 0 }}
            color="var(--stage-fg)"
            opacity={0.3}
            weight={1}
          />
        ))}
        {Cart(xa.current, ma, v1, 'var(--stage-accent)', 'A')}
        {Cart(xb.current, mb, v2, 'var(--stage-accent-2)', 'B')}
        {/* centre-of-mass marker, glides dead-straight at constant velocity through the impact */}
        {showCenterOfMass && (
          <>
            <Segment
              from={{ x: xcom, y: -1.4 }}
              to={{ x: xcom, y: 4.4 }}
              color="var(--stage-good)"
              weight={1.5}
              dashed
              opacity={0.8}
            />
            <Dot x={xcom} y={4.4} r={5} color="var(--stage-good)" />
            <Label x={xcom} y={4.4} text="centre of mass" color="var(--stage-good)" size={14} dy={-12} />
          </>
        )}
      </Stage>
    </SceneSurface>
  );

  const aside = (
    <>
      <MeterBar
        label="momentum p"
        frac={pInit !== 0 ? pNow / pInit : Math.abs(pNow) < 1e-6 ? 1 : 0}
        color="var(--stage-good)"
        value={`${pNow.toFixed(1)} kg·m/s`}
      />
      <MeterBar
        label="kinetic energy"
        frac={keFrac}
        color={keFrac > 0.99 ? 'var(--stage-good)' : 'var(--stage-warn)'}
        value={`${keNow.toFixed(1)} J${after && keFrac < 0.99 ? ` · ${Math.round((1 - keFrac) * 100)}% → heat 🔥` : ''}`}
      />
      <LiveRegion>{`Elasticity ${e.toFixed(2)}. Momentum ${pNow.toFixed(1)} conserved; kinetic energy ${after ? `${Math.round(keFrac * 100)} percent remaining` : 'full before impact'}.`}</LiveRegion>
    </>
  );

  const controls = (
    <>
      <Chip selected={running} onClick={running ? () => setRunning(false) : launch}>
        {running ? 'Pause' : collided ? 'Run again' : 'Launch'}
      </Chip>
      <Chip
        selected={false}
        onClick={() => {
          setRunning(false);
          reset();
        }}
      >
        Reset
      </Chip>
      <StatusPill ok={e > 0.98}>
        {e > 0.98
          ? 'elastic · KE conserved'
          : e < 0.02
            ? 'perfectly inelastic · stick'
            : 'inelastic · KE lost'}
      </StatusPill>
      <Field label="elasticity e" value={e.toFixed(2)}>
        <Slider
          value={e}
          min={0}
          max={1}
          step={0.05}
          onChange={onParam(setE)}
          ariaLabel="coefficient of restitution"
        />
      </Field>
      <Field label="m₁" value={`${ma}kg`}>
        <Slider
          value={ma}
          min={1}
          max={6}
          step={0.5}
          onChange={onParam(setMa)}
          ariaLabel="mass of cart A (kg)"
        />
      </Field>
      <Field label="u₁" value={`${ua}m/s`}>
        <Slider
          value={ua}
          min={0}
          max={8}
          step={0.5}
          onChange={onParam(setUa)}
          ariaLabel="initial velocity of cart A (m/s)"
        />
      </Field>
      <Field label="m₂" value={`${mb}kg`}>
        <Slider
          value={mb}
          min={1}
          max={6}
          step={0.5}
          onChange={onParam(setMb)}
          ariaLabel="mass of cart B (kg)"
        />
      </Field>
      <Field label="u₂" value={`${ub}m/s`}>
        <Slider
          value={ub}
          min={-8}
          max={0}
          step={0.5}
          onChange={onParam(setUb)}
          ariaLabel="initial velocity of cart B (m/s)"
        />
      </Field>
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Mechanics"
      title={title}
      description={prompt}
      status={
        <>
          <span>
            {running
              ? collided
                ? 'After impact'
                : 'Approaching'
              : stopped
                ? 'Complete'
                : collided
                  ? 'Impact observed'
                  : 'Ready'}
          </span>
          <span>e {e.toFixed(2)}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        after && keFrac < 0.99
          ? `Momentum remains constant while ${Math.round((1 - keFrac) * 100)}% of kinetic energy becomes heat and deformation.`
          : 'The centre of mass continues uniformly; at e = 1 both momentum and kinetic energy survive the impact.'
      }
      transcript={
        <p>{`Cart A moves at ${v1.toFixed(1)} metres per second and cart B at ${v2.toFixed(1)}. Total momentum is ${pNow.toFixed(1)} kilogram metres per second; ${Math.round(keFrac * 100)} percent of initial kinetic energy remains.`}</p>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="impact-seen" met={collided} complete={complete} />
          <AuthoredMetricGate conditionId="elasticity-changed" met={e !== elasticity} complete={complete} />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
