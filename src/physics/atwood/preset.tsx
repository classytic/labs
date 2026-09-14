'use client';

/**
 * AtwoodLab, "Which way, and how fast?", two masses over a pulley.
 *
 * The classic Atwood machine: link two masses over a frictionless pulley and the
 * WHOLE system shares one acceleration. Gravity pulls each side (m·g), but only
 * the DIFFERENCE drives the motion while the TOTAL mass resists it:
 *
 *     a = (m₁ − m₂)·g / (m₁ + m₂)        tension  T = 2·m₁·m₂·g / (m₁ + m₂)
 *
 * Equal masses → balance (a = 0). A tiny difference on big masses → a gentle a,
 * which is exactly how Atwood measured g. Predict which side drops, then release.
 *
 * Tokenized SVG; time-dependent integrator here; honours reduced-motion.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polyline, Circle, Label, useInView } from '@classytic/stage';
import { Slider, StatusPill } from '../../kit/controls.js';
import { Field, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { clamp } from '../../core/util.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import {
  MechanicsMassBlock,
  MechanicsVector,
  SceneSurface,
  SimulationTransport,
} from '../mechanics/presentation.js';
import { atwoodState } from '../mechanics/core.js';

const ATWOOD_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Atwood machine: difference drives, total resists',
  objectives: [
    'Predict the direction of acceleration',
    'Relate mass difference and total mass to acceleration',
    'Explain rope tension in a coupled system',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the driver',
      lead: 'Identify which combination of masses creates acceleration.',
      success: 'driver-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Release the masses',
      lead: 'Run the machine and watch both masses share one acceleration.',
      controls: true,
      reveal: ['model'],
      success: 'run-finished',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the coupled motion',
      lead: 'Compare acceleration, rope tension, and current speed.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain slow acceleration',
      lead: 'Separate the driving weight difference from the total inertia.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Find equilibrium',
      lead: 'Make the two masses equal and explain why motion stops.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'balanced',
    },
  ],
  questions: [
    {
      id: 'driver',
      prompt: 'In an ideal Atwood machine, what provides the net driving force?',
      choices: [
        { value: 'difference', label: 'The difference in the two weights' },
        { value: 'total', label: 'The total weight' },
        { value: 'tension', label: 'The rope tension alone' },
      ],
      answer: 'difference',
      explain: 'The opposing weights partly cancel; their difference drives the combined mass.',
    },
  ],
  success: [
    {
      id: 'driver-answer',
      source: 'answer',
      key: 'driver',
      operator: 'eq',
      value: 'difference',
      pendingLabel: 'Choose the source of the driving force.',
    },
    {
      id: 'run-finished',
      source: 'metric',
      key: 'finished',
      operator: 'eq',
      value: true,
      pendingLabel: 'Release the machine until a mass reaches its limit.',
    },
    {
      id: 'balanced',
      source: 'metric',
      key: 'balanced',
      operator: 'eq',
      value: true,
      pendingLabel: 'Set both masses equal.',
    },
  ],
};

export interface AtwoodProps {
  m1?: number;
  m2?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ lock: ['m₁ (left)'] }`. */
  controlConfig?: ControlConfig;
  activity?: string | AuthoredActivity;
}

const G = 9.8;
const Y0 = 0.6; // initial top-of-mass height
const TRAVEL = 2.6; // max travel before a mass hits floor/pulley

export function AtwoodLab({
  m1 = 3,
  m2 = 2,
  title = 'Atwood machine: which way, and how fast?',
  prompt = 'Two masses share one rope over a pulley. Only the difference in weight drives them, while the total mass resists: a = (m₁ − m₂)g / (m₁ + m₂). Predict which side falls, then release.',
  objectives,
  controlConfig,
  activity = 'atwood',
}: AtwoodProps): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'atwood';
  const authoredActivity = typeof activity === 'string' ? ATWOOD_ACTIVITY : activity;
  const [ma, setMa] = useState(m1);
  const [mb, setMb] = useState(m2);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const tRef = useRef(0);
  const reduce = useReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const model = atwoodState(ma, mb, G);
  const a = model.acceleration;
  const tension = model.tension;
  const balanced = Math.abs(ma - mb) < 1e-9;

  const repaint = useFrameTick(running && inView && !balanced, (f) => {
    tRef.current += Math.min(0.05, f.dtMs / 1000);
    const s = 0.5 * Math.abs(a) * tRef.current * tRef.current;
    if (s >= TRAVEL) {
      setRunning(false);
      setFinished(true);
    }
  });

  const release = (): void => {
    tRef.current = 0;
    setFinished(false);
    if (reduce) {
      tRef.current = Math.sqrt((2 * TRAVEL) / Math.max(0.01, Math.abs(a)));
      setFinished(true);
      repaint();
      return;
    }
    setRunning(true);
  };
  const onParam =
    (set: (n: number) => void) =>
    (n: number): void => {
      set(n);
      setRunning(false);
      setFinished(false);
      tRef.current = 0;
    };

  const t = tRef.current;
  const s = clamp(0.5 * Math.abs(a) * t * t, 0, TRAVEL);
  const v = Math.abs(a) * t;
  const dirL = a > 0 ? -1 : 1; // left mass direction (down if a>0)
  const yL = Y0 + dirL * s;
  const yR = Y0 - dirL * s;

  const PY = 3.4,
    PR = 0.95; // pulley
  const LX = -PR,
    RX = PR; // rope tangent x-offsets at the pulley
  const ropeArc = Array.from({ length: 17 }, (_, index) => {
    const theta = Math.PI - (Math.PI * index) / 16;
    return { x: Math.cos(theta) * PR, y: PY + Math.sin(theta) * PR };
  });
  const wheelAngle = s / PR;
  const spoke = (offset: number): ReactNode => {
    const angle = wheelAngle + offset;
    return (
      <Segment
        from={{ x: 0, y: PY }}
        to={{ x: Math.cos(angle) * PR * 0.72, y: PY + Math.sin(angle) * PR * 0.72 }}
        color="var(--stage-fg)"
        opacity={0.42}
        weight={1.5}
      />
    );
  };

  const view = { xMin: -3.4, xMax: 3.4, yMin: -3, yMax: 4.6 };

  /**
   * The forces, drawn symbolically and to scale against each other.
   *
   * Each block is pulled down by its own weight and up by the ONE rope tension, and it is the
   * difference that accelerates the pair. Arrow lengths are proportional to the forces, so
   * "T sits between the two weights" is something the learner can SEE; the numbers stay in the
   * readout, where they do not crowd the drawing.
   */
  const FORCE_SCALE = 0.04; // newtons → scene units (kept off the clamp at everyday masses)
  const armOf = (mass: number): number => clamp(mass * G * FORCE_SCALE, 0.45, 1.5);
  const blockHeight = (mass: number): number => 0.76 + Math.min(mass, 10) * 0.045;
  const tensionArm = clamp(tension * FORCE_SCALE, 0.45, 1.5);
  const leftBottom = yL - blockHeight(ma);
  const rightBottom = yR - blockHeight(mb);
  const moving = Math.abs(a) > 0.05;

  const figure = (
    <SceneSurface ref={viewRef} tone="grid">
      <Stage
        view={view}
        height={270}
        preserveAspect
        ariaLabel={`Atwood machine, ${ma} kg versus ${mb} kg, acceleration ${Math.abs(a).toFixed(2)} m/s²`}
      >
        {/* support, wheel, and a rope that actually wraps around the pulley */}
        <Segment
          from={{ x: -2, y: 4.1 }}
          to={{ x: 2, y: 4.1 }}
          color="var(--stage-fg)"
          opacity={0.6}
          weight={3}
        />
        <Segment
          from={{ x: 0, y: 4.1 }}
          to={{ x: 0, y: PY + PR }}
          color="var(--stage-fg)"
          opacity={0.5}
          weight={2}
        />
        <Circle
          center={{ x: 0, y: PY }}
          r={PR}
          color="var(--stage-fg)"
          fill="var(--stage-muted)"
          fillOpacity={0.22}
          weight={2.5}
        />
        <Circle center={{ x: 0, y: PY }} r={PR * 0.78} color="var(--stage-fg)" opacity={0.24} weight={1} />
        {spoke(0)}
        {spoke(Math.PI / 2)}
        {spoke(Math.PI)}
        {spoke((3 * Math.PI) / 2)}
        <Circle
          center={{ x: 0, y: PY }}
          r={0.12}
          color="var(--stage-fg)"
          fill="var(--stage-fg)"
          fillOpacity={0.7}
          weight={0}
        />
        <Polyline points={ropeArc} color="var(--stage-fg)" opacity={0.72} weight={2.2} />
        <Segment
          from={{ x: LX, y: PY }}
          to={{ x: LX, y: yL }}
          color="var(--stage-fg)"
          opacity={0.72}
          weight={2.2}
        />
        <Segment
          from={{ x: RX, y: PY }}
          to={{ x: RX, y: yR }}
          color="var(--stage-fg)"
          opacity={0.72}
          weight={2.2}
        />
        <MechanicsMassBlock x={LX} top={yL} massKg={ma} color="var(--stage-accent)" />
        <MechanicsMassBlock x={RX} top={yR} massKg={mb} color="var(--stage-accent-2)" />
        {/* Keep force vectors outside the blocks. The mass plates carry values;
            the arrows carry roles, so neither layer has to compete for ink. */}
        <MechanicsVector
          tail={{ x: LX + 0.78, y: leftBottom + 0.12 }}
          tip={{ x: LX + 0.78, y: leftBottom + 0.12 - armOf(ma) }}
          color="var(--stage-accent)"
          label="W₁"
          labelDx={12}
          labelDy={2}
          labelSize={11}
        />
        <MechanicsVector
          tail={{ x: RX - 0.78, y: rightBottom + 0.12 }}
          tip={{ x: RX - 0.78, y: rightBottom + 0.12 - armOf(mb) }}
          color="var(--stage-accent-2)"
          label="W₂"
          labelDx={-12}
          labelDy={2}
          labelSize={11}
        />
        {/* the one tension, up each side of the rope, beside it so the rope stays readable */}
        <MechanicsVector
          tail={{ x: LX - 0.78, y: yL - 0.1 }}
          tip={{ x: LX - 0.78, y: yL - 0.1 + tensionArm }}
          color="var(--stage-good)"
          label="T"
          labelDx={-12}
          labelDy={-2}
        />
        <MechanicsVector
          tail={{ x: RX + 0.78, y: yR - 0.1 }}
          tip={{ x: RX + 0.78, y: yR - 0.1 + tensionArm }}
          color="var(--stage-good)"
          label="T"
          labelDx={12}
          labelDy={-2}
        />
        {/* which way the pair actually goes, beside the falling block */}
        {moving && (
          <MechanicsVector
            tail={{ x: dirL < 0 ? LX - 1.05 : RX + 1.05, y: dirL < 0 ? yL - 0.15 : yR - 0.15 }}
            tip={{
              x: dirL < 0 ? LX - 1.05 : RX + 1.05,
              y: (dirL < 0 ? yL - 0.15 : yR - 0.15) - 0.82,
            }}
            color="var(--stage-warn)"
            // Symbol only. The magnitude is already in the readout at full precision, and this
            // canvas is dense enough that a second, rounder copy of it just crowds the drawing.
            label="a"
            labelDx={dirL < 0 ? -18 : 18}
            labelDy={8}
            labelSize={10}
            weight={2.4}
          />
        )}
        {/* floor */}
        <Segment
          from={{ x: -3.4, y: -2.6 }}
          to={{ x: 3.4, y: -2.6 }}
          color="var(--stage-fg)"
          opacity={0.35}
          weight={1.2}
        />
      </Stage>
    </SceneSurface>
  );

  const aside = (
    <>
      <div className="physics-dynamics-ledger">
        <div data-highlight>
          <span>Acceleration · a</span>
          <strong>{Math.abs(a).toFixed(2)} m/s²</strong>
        </div>
        <div>
          <span>Rope tension · T</span>
          <strong>{tension.toFixed(1)} N</strong>
        </div>
        <div>
          <span>Speed now</span>
          <strong>{v.toFixed(1)} m/s</strong>
        </div>
      </div>
      <StatusPill ok={!balanced}>
        {balanced ? 'balanced, no motion' : `${ma > mb ? 'left' : 'right'} side falls`}
      </StatusPill>
      <p className="physics-explain">
        Only the <strong>difference</strong> (m₁−m₂)g drives it; the <strong>total</strong> (m₁+m₂) resists.
        Big equal masses with a tiny difference give a slow, measurable a, how Atwood weighed gravity.
      </p>
      <LiveRegion>
        {balanced
          ? 'Balanced, no motion.'
          : `${ma > mb ? 'Left' : 'Right'} side falls at ${Math.abs(a).toFixed(2)} metres per second squared.`}
      </LiveRegion>
    </>
  );

  const controls = (
    <>
      <Field label="m₁ (left)" value={`${ma} kg`}>
        <Slider value={ma} min={1} max={8} step={0.5} onChange={onParam(setMa)} ariaLabel="left mass (kg)" />
      </Field>
      <Field label="m₂ (right)" value={`${mb} kg`}>
        <Slider value={mb} min={1} max={8} step={0.5} onChange={onParam(setMb)} ariaLabel="right mass (kg)" />
      </Field>
      <SimulationTransport
        running={running}
        onReset={() => {
          setRunning(false);
          setFinished(false);
          tRef.current = 0;
          repaint();
        }}
        onToggle={running ? () => setRunning(false) : release}
        state={balanced ? 'Balanced' : running ? 'Moving' : finished ? 'Complete' : 'Ready'}
        detail={balanced ? 'equal masses' : `${ma > mb ? 'left' : 'right'} side falls`}
        startLabel={finished ? 'Release again' : 'Release'}
        disabled={balanced}
        resetLabel="Reset Atwood machine"
      />
    </>
  );

  return (
    <AuthoredActivityRuntime
      className="physics-atwood-activity"
      focusLayout="compact"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Mechanics"
      title={title}
      description={prompt}
      status={
        <>
          <span>{balanced ? 'Balanced' : running ? 'Moving' : finished ? 'Complete' : 'Ready'}</span>
          <span>a {Math.abs(a).toFixed(2)} m/s²</span>
          <span>T {tension.toFixed(1)} N</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        balanced
          ? 'Equal weights produce zero driving force, so the system remains at rest.'
          : 'The difference in weight drives both masses while their combined inertia limits the acceleration.'
      }
      transcript={
        <p>{`The left mass is ${ma.toFixed(1)} kilograms and the right mass is ${mb.toFixed(1)} kilograms. ${balanced ? 'The system is balanced.' : `The ${ma > mb ? 'left' : 'right'} side accelerates downward at ${Math.abs(a).toFixed(2)} metres per second squared.`} Rope tension is ${tension.toFixed(1)} newtons.`}</p>
      }
      controlConfig={controlConfig}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="run-finished" met={finished} complete={complete} />
          <AuthoredMetricGate
            conditionId="balanced"
            met={balanced && (ma !== m1 || mb !== m2)}
            complete={complete}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
