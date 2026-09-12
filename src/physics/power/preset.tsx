'use client';

/**
 * PowerLab, power as the GRADIENT of the energy–time graph.
 *
 * Its sibling `work-energy` teaches work as an AREA under force–distance. This is the other
 * half of the same picture: energy against time, where the slope of the line IS the power. The
 * symmetry is the point, and it is what makes P = W/t stop being a formula to memorise.
 *
 * Two situations on one figure, both drawn on the same axes:
 *   • LIFT  — a pump raising water to a rooftop tank. The job is a fixed W = mgh, so a bigger
 *             power is a steeper line that reaches the same target sooner. This is P = W/t.
 *   • DRIVE — a bus at steady speed on a level road. Drag balances the drive force, so no
 *             kinetic energy accumulates and every joule goes against drag. The line never
 *             ends and its gradient is P = Fv.
 *
 * The two modes are deliberately the same graph: a learner who sees that "reaches the target
 * sooner" and "climbs faster forever" are one gradient has understood power.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Segment, Polygon, Dot, Label, type Vec2 } from '@classytic/stage';
import { Field } from '../../kit/frame.js';
import { Slider, Segmented } from '../../kit/controls.js';
import { Tex } from '../../core/tex.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { SceneSurface } from '../mechanics/presentation.js';

const G = 9.81;
const ACCENT = 'var(--stage-accent)';

export type PowerMode = 'lift' | 'drive';

const POWER_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Power is a gradient, not an amount',
  objectives: [
    'Read power as the gradient of an energy-time graph',
    'Use P = W / t for a fixed job',
    'Use P = Fv for a steady speed',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the effect of doubling power',
      lead: 'Commit before you move the slider.',
      success: 'halving-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Change the power',
      lead: 'Watch the gradient of the line, not its end point.',
      controls: true,
      reveal: ['model'],
      success: 'power-changed',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the gradient',
      lead: 'The same energy arrives sooner. The job did not get smaller.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain why the target line does not move',
      lead: 'Separate the size of the job from the rate of doing it.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Switch to a steady speed',
      lead: 'At constant speed the drag force sets the power. Compare P = Fv with P = W / t.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'mode-changed',
    },
  ],
  questions: [
    {
      id: 'halving',
      prompt: 'A pump lifts the same tank of water, but you double its power. The time taken…',
      choices: [
        { value: 'half', label: 'halves' },
        { value: 'double', label: 'doubles' },
        { value: 'same', label: 'does not change' },
      ],
      answer: 'half',
      explain:
        'The job is a fixed W = mgh, so t = W / P. Doubling P halves t. The energy delivered is the same; only the rate changed.',
    },
  ],
  success: [
    {
      id: 'halving-answer',
      source: 'answer',
      key: 'halving',
      operator: 'eq',
      value: 'half',
      pendingLabel: 'Predict what doubling the power does to the time.',
    },
    {
      id: 'power-changed',
      source: 'metric',
      key: 'powerChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change the power.',
    },
    {
      id: 'mode-changed',
      source: 'metric',
      key: 'modeChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Switch to the steady-speed situation.',
    },
  ],
};

export interface PowerProps {
  /** Which situation opens first. */
  mode?: PowerMode;
  /** Lift: mass raised, kg. */
  massKg?: number;
  /** Lift: height raised, m. */
  heightM?: number;
  /** Lift: pump power, W. */
  powerW?: number;
  /** Drive: steady driving force, N (equal to drag at constant speed). */
  forceN?: number;
  /** Drive: steady speed, m/s. */
  speedMs?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

/** The situation itself: a pump filling a roof tank, or a bus held at steady speed by its engine. */
function Picture({ mode, frac }: { mode: PowerMode; frac: number }): ReactNode {
  const W = 420;
  const H = 78;
  if (mode === 'lift') {
    const tankY = 10;
    const tankH = 30;
    const fill = Math.max(0, Math.min(1, frac));
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="A pump raising water to a roof tank">
        <rect
          x={302}
          y={tankY}
          width={106}
          height={tankH}
          rx={3}
          fill="none"
          stroke="var(--stage-metal)"
          strokeWidth={2}
        />
        <rect
          x={304}
          y={tankY + tankH - 2 - (tankH - 4) * fill}
          width={102}
          height={(tankH - 4) * fill}
          fill="var(--stage-accent)"
          opacity={0.55}
        />
        <line x1={355} y1={tankY + tankH} x2={355} y2={H - 20} stroke="var(--stage-metal)" strokeWidth={3} />
        <rect x={24} y={H - 32} width={60} height={22} rx={4} fill="var(--stage-accent)" opacity={0.35} />
        <line x1={84} y1={H - 21} x2={355} y2={H - 21} stroke="var(--stage-metal)" strokeWidth={3} />
        <text x={24} y={H - 38} fontSize={11} fontWeight={700} fill="var(--stage-fg)">
          pump
        </text>
        <text x={302} y={tankY - 3} fontSize={11} fontWeight={700} fill="var(--stage-fg)">
          roof tank
        </text>
      </svg>
    );
  }
  // drive: the bus, with drag balancing the drive force
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="A bus at steady speed, drive force balanced by drag"
    >
      <line x1={0} y1={H - 10} x2={W} y2={H - 10} stroke="var(--stage-fg)" strokeWidth={2} />
      <path
        d="M148 26 Q148 16 160 16 H274 Q286 18 290 30 L294 56 H148 Z"
        fill="var(--stage-accent)"
        opacity={0.28}
        stroke="var(--stage-accent)"
        strokeWidth={2}
      />
      <circle cx={178} cy={58} r={9} fill="var(--stage-fg)" />
      <circle cx={268} cy={58} r={9} fill="var(--stage-fg)" />
      <line
        x1={296}
        y1={36}
        x2={392}
        y2={36}
        stroke="var(--stage-good)"
        strokeWidth={3}
        markerEnd="url(#stage-arrow)"
      />
      <text x={344} y={30} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--stage-good)">
        drive F
      </text>
      <line
        x1={146}
        y1={36}
        x2={50}
        y2={36}
        stroke="var(--stage-warn)"
        strokeWidth={3}
        markerEnd="url(#stage-arrow)"
      />
      <text x={98} y={30} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--stage-warn)">
        drag
      </text>
    </svg>
  );
}

export function PowerLab({
  mode: mode0 = 'lift',
  massKg = 500,
  heightM = 20,
  powerW = 2450,
  forceN = 600,
  speedMs = 30,
  title = 'Power: the gradient of the energy-time graph',
  prompt = 'Work is an area under force against distance. Power is a gradient of energy against time. Raise the power and the same job finishes sooner.',
  objectives,
  activity = 'power',
}: PowerProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'power';
  const authoredActivity = typeof activity === 'string' ? POWER_ACTIVITY : activity;
  const [mode, setMode] = useState<PowerMode>(mode0);
  const [mass, setMass] = useState(massKg);
  const [height, setHeight] = useState(heightM);
  const [power, setPower] = useState(powerW);
  const [force, setForce] = useState(forceN);
  const [speed, setSpeed] = useState(speedMs);

  const lift = mode === 'lift';
  // LIFT: a fixed job W = mgh, delivered at P, so it lands at t = W / P.
  const workJ = mass * G * height;
  const tFinish = workJ / power;
  // DRIVE: no target, energy accrues at P = Fv for as long as you drive.
  const drivePower = force * speed;
  const P = lift ? power : drivePower;

  // Plotted in KILOJOULES, not joules: a gradient lab is useless if the learner cannot read a
  // value off the axis, and 98100 on a tick is unreadable where 98.1 is not.
  const workKJ = workJ / 1000;
  const powerKW = P / 1000;
  const tMax = lift ? Math.max(tFinish * 1.3, 4) : 60;
  const eMax = lift ? workKJ * 1.3 : powerKW * 60 * 1.15;
  const view = { xMin: -tMax * 0.1, xMax: tMax * 1.02, yMin: -eMax * 0.13, yMax: eMax };
  const eAt = (t: number): number => Math.min(powerKW * t, lift ? workKJ : Infinity);
  const tEnd = lift ? Math.min(tFinish, tMax) : tMax;

  const under: Vec2[] = [
    { x: 0, y: 0 },
    { x: tEnd, y: 0 },
    { x: tEnd, y: eAt(tEnd) },
  ];

  const figure = (
    <SceneSurface className="physics-power-scene">
      <div className="physics-power-context">
        <Picture mode={mode} frac={lift ? 1 : 0} />
        <span>
          {lift
            ? 'A fixed job: lift this water to that height'
            : 'Steady speed: the drive force only has to balance drag'}
        </span>
      </div>
      <Stage
        view={view}
        height={300}
        preserveAspect={false}
        ariaLabel="Energy transferred against time; the gradient of the line is the power"
      >
        <Grid />
        {/* `labels`: the learner must be able to READ the finishing time off the axis, since
            that is the quantity the whole lesson is about. */}
        <Axes ticks labels />
        <Polygon
          points={under}
          fill="color-mix(in oklab, var(--stage-accent) 14%, transparent)"
          color="transparent"
        />
        {/* the energy line: its GRADIENT is the power */}
        <Segment from={{ x: 0, y: 0 }} to={{ x: tEnd, y: eAt(tEnd) }} color={ACCENT} weight={3} />
        {lift && (
          <>
            {/* the job never changes size; only the time to reach it does */}
            <Segment
              from={{ x: 0, y: workKJ }}
              to={{ x: tMax, y: workKJ }}
              color="var(--stage-warn)"
              weight={2}
              dashed
            />
            {/* anchored at the LEFT, inside the plot: at the right edge it was clipped */}
            <Label
              x={tMax * 0.03}
              y={workKJ * 1.09}
              text={`the job: mgh = ${workKJ.toFixed(1)} kJ`}
              color="var(--stage-warn)"
              anchor="start"
            />
            <Segment
              from={{ x: tFinish, y: 0 }}
              to={{ x: tFinish, y: workKJ }}
              color="var(--stage-grid)"
              weight={1}
              dashed
            />
            <Dot x={tFinish} y={workKJ} r={5} color={ACCENT} />
          </>
        )}
        {!lift && <Dot x={tEnd} y={eAt(tEnd)} r={5} color={ACCENT} />}
        {/* axis title sits BELOW the tick numbers: at their level it collided with a tick, and
            at the far right it ran into the last one. */}
        <Label x={tMax / 2} y={-eMax * 0.105} text="time t (s)" color="var(--stage-muted)" />
        <Label
          x={tMax * 0.03}
          y={eMax * 0.96}
          text="energy transferred (kJ)"
          color="var(--stage-muted)"
          anchor="start"
        />
      </Stage>
    </SceneSurface>
  );

  const instruments = (
    <>
      <div className="physics-probe">
        <span>Power</span>
        <strong className="physics-equation-result">
          <Tex
            tex={
              lift
                ? `P=\\frac{W}{t}=\\frac{${(workJ / 1000).toFixed(1)}\\,\\mathrm{kJ}}{${tFinish.toFixed(1)}\\,\\mathrm{s}}=${(P / 1000).toFixed(2)}\\,\\mathrm{kW}`
                : `P=Fv=${force}\\times${speed}=${(P / 1000).toFixed(2)}\\,\\mathrm{kW}`
            }
          />
        </strong>
        <small>
          {lift
            ? 'Gradient of the line: joules delivered per second'
            : 'At steady speed there is no gain in kinetic energy, so every joule goes against drag'}
        </small>
      </div>
      <p className="physics-explain">
        {lift ? (
          <>
            The dashed target is the job. It does not move when you change the power. Only the gradient
            changes, so the line meets the target at a different time.
          </>
        ) : (
          <>
            The line has no end here. The bus is not gaining energy, it is spending it against drag at a
            steady rate. That rate is <Tex tex="P=Fv" />.
          </>
        )}
      </p>
    </>
  );

  const controls = (
    <>
      <Field label="situation">
        <Segmented
          ariaLabel="situation"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'lift', label: 'pump a roof tank' },
            { value: 'drive', label: 'bus at steady speed' },
          ]}
        />
      </Field>
      {lift ? (
        <>
          <Field label="power" value={`${(power / 1000).toFixed(2)} kW`}>
            <Slider
              value={power}
              min={500}
              max={12000}
              step={50}
              onChange={setPower}
              ariaLabel="pump power"
            />
          </Field>
          <Field label="mass of water" value={`${mass} kg`}>
            <Slider value={mass} min={100} max={2000} step={50} onChange={setMass} ariaLabel="mass lifted" />
          </Field>
          <Field label="height" value={`${height} m`}>
            <Slider value={height} min={4} max={40} step={1} onChange={setHeight} ariaLabel="height raised" />
          </Field>
        </>
      ) : (
        <>
          <Field label="drive force" value={`${force} N`}>
            <Slider
              value={force}
              min={100}
              max={2000}
              step={50}
              onChange={setForce}
              ariaLabel="driving force"
            />
          </Field>
          <Field label="steady speed" value={`${speed} m/s`}>
            <Slider value={speed} min={5} max={40} step={1} onChange={setSpeed} ariaLabel="steady speed" />
          </Field>
        </>
      )}
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
          <span>{lift ? 'Fixed job' : 'Steady speed'}</span>
          <span>P {(P / 1000).toFixed(2)} kW</span>
          {lift ? <span>t {tFinish.toFixed(1)} s</span> : <span>v {speed} m/s</span>}
        </>
      }
      evidence={instruments}
      controls={controls}
      observation={
        lift
          ? 'The target line stays where it is. A steeper line reaches the same energy sooner, which is all that more power buys you.'
          : 'At a steady speed the drive force equals the drag, so the power is force times speed and the energy line climbs at a constant rate.'
      }
      transcript={
        <p>
          {lift
            ? `Lifting ${mass} kilograms through ${height} metres needs ${(workJ / 1000).toFixed(1)} kilojoules. At ${(power / 1000).toFixed(2)} kilowatts it takes ${tFinish.toFixed(1)} seconds.`
            : `A drive force of ${force} newtons at ${speed} metres per second is a power of ${(P / 1000).toFixed(2)} kilowatts.`}
        </p>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="power-changed" met={power !== powerW} complete={complete} />
          <AuthoredMetricGate conditionId="mode-changed" met={mode !== mode0} complete={complete} />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
