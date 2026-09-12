'use client';

/**
 * RCChargingLab — a capacitor filling like a bucket, drawn with the SHARED
 * electronics glyphs (CellGlyph / ResistorGlyph / CapacitorGlyph) and computed by
 * the REAL circuit engine (solveTransient, Backward-Euler), not a faked exponential.
 * The CapacitorGlyph fills to the live charge; current flows around the loop while
 * it fills and stops once full. The V(t) curve below is the actual transient
 * solution, with the time constant τ = R·C and the 63%-at-one-τ mark.
 */

import { useState, type ReactNode } from 'react';
import { Polyline, Segment, Dot, Label, useFrameLoop } from '@classytic/stage';
import { solveTransient, type Elem } from '@classytic/stage/circuit';
import { CoordPlane } from '../../kit/coords.js';
import {
  CellGlyph,
  ResistorGlyph,
  CapacitorGlyph,
  Wire,
  FlowDots,
  Tag,
  VoltagePort,
} from '../../kit/electronics/index.js';
import { useReducedMotion } from '../../kit/anim.js';
import { Field, StatList, Stat } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { rcChargingActivity } from './activity-plan.js';
import { Slider, Segmented } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { useCheckpoint } from '../../kit/pedagogy.js';

export interface RCChargingProps {
  volts?: number;
  resistanceK?: number;
  capacitanceU?: number;
  /** which panels to show: the schematic, the V(t) graph, or both (default). */
  show?: 'both' | 'circuit' | 'graph';
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

const C_CURVE = 'var(--stage-accent)';
const W = 520,
  H = 168,
  xL = 50,
  xR = 470,
  yT = 52,
  yB = 138,
  HALF = 28;
const CELL_X = 120,
  R_X = 255,
  CAP_X = 390;
const LOOP: [number, number][] = [
  [xL, yT],
  [xR, yT],
  [xR, yB],
  [xL, yB],
  [xL, yT],
];

export function RCChargingLab({
  volts = 5,
  resistanceK = 10,
  capacitanceU = 10,
  show = 'both',
  title = 'RC charging: filling the capacitor',
  prompt = 'The resistor is a narrow pipe, the capacitor a bucket. Bigger C or bigger R means slower filling. That product is the time constant τ = R·C.',
  ask,
  activity = 'rc-charging',
}: RCChargingProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'rc-charging';
  const authoredActivity = typeof activity === 'string' ? rcChargingActivity : activity;
  const [Vs, setVs] = useState(volts);
  const [Rk, setRk] = useState(resistanceK);
  const [Cu, setCu] = useState(capacitanceU);
  const [mode, setMode] = useState<'charge' | 'discharge'>('charge');
  const [tFrac, setTFrac] = useState(1);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();

  const R = Rk * 1000,
    C = Cu * 1e-6;
  const tau = R * C;
  const dt = tau / 120,
    steps = 600;
  const charging = mode === 'charge';

  const elems: Elem[] = charging
    ? [
        { kind: 'V', n1: 1, n2: 0, value: Vs },
        { kind: 'R', n1: 1, n2: 2, value: R },
        { kind: 'C', n1: 2, n2: 0, value: C },
      ]
    : [
        { kind: 'R', n1: 1, n2: 0, value: R },
        { kind: 'C', n1: 1, n2: 0, value: C },
      ];
  const capNode = charging ? 2 : 1;
  const trace = solveTransient(elems, { dt, steps, initialV: charging ? undefined : new Map([[1, Vs]]) });

  const pts = trace.map((s) => ({ x: s.t / tau, y: (s.nodeV[capNode] ?? 0) / Vs }));
  const view = { xMin: 0, xMax: 5, yMin: 0, yMax: 1.12 };
  const Vnow = (() => {
    const target = tFrac * tau;
    return (
      trace.reduce((b, s) => (Math.abs(s.t - target) < Math.abs(b.t - target) ? s : b)).nodeV[capNode] ?? 0
    );
  })();
  const frac = Math.max(0, Math.min(1, Vnow / Vs));
  const iMag = charging ? 1 - frac : frac; // current ∝ how far from settled
  const flowing = iMag > 0.03;

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * (0.1 + 0.4 * iMag)) % 1), {
    running: flowing && !reduce,
  });

  // Solved once the learner drives the system to (near) steady state by advancing
  // time toward ~5τ: capacitor essentially full when charging, essentially empty when discharging.
  const solved = charging ? frac >= 0.99 : frac <= 0.01;
  useCheckpoint({ solved, activity: `${activityId}:${mode}` });

  const scene = (
    <div className="electronics-scene">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`RC ${mode}, capacitor at ${Math.round(frac * 100)} percent`}
      >
        <Wire points={LOOP} live={flowing} />
        {flowing && <FlowDots points={LOOP} phase={charging ? phase : -phase} />}
        <CellGlyph cx={CELL_X} cy={yT} half={HALF} live={flowing && charging} label={`${Vs} V`} />
        <ResistorGlyph cx={R_X} cy={yT} half={HALF} live={flowing} label={`${Rk} kΩ`} />
        <CapacitorGlyph cx={CAP_X} cy={yT} half={HALF} charge={frac} live={flowing} label={`${Cu} µF`} />
        <VoltagePort x={CAP_X + HALF} y={yT} name="VC" reading={`${Vnow.toFixed(2)} V`} />
        <Tag
          x={(xL + xR) / 2}
          y={yB - 9}
          text={
            flowing
              ? charging
                ? 'charging current →'
                : '← discharging current'
              : `current ≈ 0 · capacitor ${charging ? 'charged' : 'discharged'}`
          }
          color={flowing ? 'var(--stage-accent)' : 'var(--stage-muted)'}
          size={10}
          weight={700}
        />
      </svg>
    </div>
  );

  const graph = (
    <CoordPlane
      view={view}
      height={168}
      preserveAspect={false}
      stepX={1}
      stepY={0.25}
      ariaLabel={`RC ${mode} curve, V over Vs versus t over tau`}
    >
      <Segment
        from={{ x: 0, y: charging ? 0.632 : 0.368 }}
        to={{ x: 5, y: charging ? 0.632 : 0.368 }}
        color="var(--stage-muted)"
        weight={1}
        dashed
      />
      <Segment from={{ x: 1, y: 0 }} to={{ x: 1, y: 1 }} color="var(--stage-muted)" weight={1} dashed />
      <Label
        x={1}
        y={charging ? 0.632 : 0.368}
        text={charging ? '63% at t=τ' : '37% at t=τ'}
        color="var(--stage-muted)"
        size={10}
        dx={6}
        dy={-4}
        anchor="start"
      />
      <Polyline points={pts} color={C_CURVE} weight={3} />
      <Dot x={tFrac} y={frac} r={6} color={C_CURVE} />
      <Label x={4.9} y={0.18} text="V / Vs  vs  t / τ" color="var(--stage-muted)" size={10} anchor="end" />
    </CoordPlane>
  );

  const figure =
    show === 'circuit' ? (
      scene
    ) : show === 'graph' ? (
      graph
    ) : (
      <div className="electronics-visual-stack">
        {scene}
        {graph}
      </div>
    );

  const controls = (
    <>
      <Field label="mode">
        <Segmented
          ariaLabel="mode"
          value={charging ? 'charge' : 'discharge'}
          onChange={setMode}
          options={[
            { value: 'charge', label: 'charge' },
            { value: 'discharge', label: 'discharge' },
          ]}
        />
      </Field>
      <Field label="battery" value={`${Vs} V`}>
        <Slider value={Vs} min={1} max={12} step={1} onChange={setVs} ariaLabel="battery voltage" />
      </Field>
      <Field label="R" value={`${Rk} kΩ`}>
        <Slider value={Rk} min={1} max={100} step={1} onChange={setRk} ariaLabel="resistance" />
      </Field>
      <Field label="C" value={`${Cu} µF`}>
        <Slider value={Cu} min={1} max={1000} step={1} onChange={setCu} ariaLabel="capacitance" />
      </Field>
      <Field label="time" value={`${tFrac.toFixed(1)} τ`}>
        <Slider
          value={tFrac}
          min={0}
          max={5}
          step={0.1}
          onChange={setTFrac}
          ariaLabel="time in units of tau"
        />
      </Field>
    </>
  );

  const aside = (
    <StatList>
      <Stat label="τ = R·C" value={`${(tau * 1000).toFixed(1)} ms`} />
      <Stat
        label={
          <>
            at t = {tFrac.toFixed(1)}τ: V<sub>C</sub>
          </>
        }
        value={`${Vnow.toFixed(2)} V (${Math.round(frac * 100)}%)`}
      />
      <span className="electronics-explanation">
        {charging
          ? 'one τ reaches 63%, five τ is essentially full'
          : 'one τ drops to 37%, five τ is essentially empty'}
      </span>
    </StatList>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={authoredActivity}
      activityId={activityId}
      eyebrow="Electric circuits"
      title={title}
      description={prompt}
      status={
        <>
          <span>{mode}</span>
          <span>τ {(tau * 1000).toFixed(1)} ms</span>
          <span>{Math.round(frac * 100)}%</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        charging
          ? 'Charging follows 1 − e⁻ᵗ⧸τ: one τ reaches about 63%, while five τ is effectively full.'
          : 'Discharging follows e⁻ᵗ⧸τ: one τ leaves about 37%, while five τ is effectively empty.'
      }
      transcript={
        <p>
          {mode} mode. Resistance {Rk} kilo-ohms, capacitance {Cu} microfarads, time constant{' '}
          {(tau * 1000).toFixed(1)} milliseconds, capacitor {Math.round(frac * 100)} percent.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="time-tested"
            met={tFrac >= 1}
            complete={complete}
            outcome={`${tFrac.toFixed(1)} tau`}
          />
          <AuthoredMetricGate
            conditionId="tau-changed"
            met={
              sequence.current.id === 'transfer' &&
              (Math.abs(Rk - resistanceK) >= 0.5 || Math.abs(Cu - capacitanceU) >= 0.5)
            }
            complete={complete}
            outcome={`${(tau * 1000).toFixed(1)} ms`}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
