'use client';

/**
 * TransistorLab — an NMOS as the thing that lets a tiny input steer a big current.
 * Drawn with the shared electronics glyphs (CellGlyph / BulbGlyph / MosfetGlyph) on
 * a real schematic: a supply lights a lamp through the transistor, and the GATE
 * voltage decides whether the channel conducts. Below the threshold the lamp is
 * dark; past it the gate opens a much larger drain current and the lamp glows. The
 * transfer curve and operating point are swept straight from the circuit engine.
 */

import { useState, type ReactNode } from 'react';
import { Polyline, Dot, Segment, Label, useFrameLoop } from '@classytic/stage';
import { solveDC, type Elem } from '@classytic/stage/circuit';
import { CoordPlane } from '../../kit/coords.js';
import {
  CellGlyph,
  BulbGlyph,
  MosfetGlyph,
  Wire,
  FlowDots,
  Tag,
  SupplyRail,
  VoltagePort,
} from '../../kit/electronics/index.js';
import { useReducedMotion } from '../../kit/anim.js';
import { Field, StatList, Stat } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Slider, StatusPill } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { transistorActivity } from './activity-plan.js';

export interface TransistorProps {
  supply?: number;
  vth?: number;
  loadK?: number;
  /** which panels to show: the schematic, the transfer graph, or both (default). */
  show?: 'both' | 'circuit' | 'graph';
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

const K = 0.02;
const C_OK = 'var(--stage-good)';
const C_BAD = 'var(--stage-danger, #e03131)';

// schematic layout (pixel space)
const W = 520,
  H = 210,
  xL = 55,
  xR = 430,
  yT = 48,
  yB = 172,
  HALF = 28;
const CELL_X = 120,
  LAMP_X = 250;
const MCX = xR - 9,
  MCY = (yT + yB) / 2,
  MHALF = (yB - yT) / 2;
const GATE_TERM = MCX - 13 - 24;
const LOOP: [number, number][] = [
  [xL, yT],
  [xR, yT],
  [xR, yB],
  [xL, yB],
  [xL, yT],
];

export function TransistorLab({
  supply = 5,
  vth = 2,
  loadK = 1,
  show = 'both',
  title = 'A gate electric field controls a separate drain current',
  prompt = 'Raise the gate–source voltage. The insulated gate draws approximately zero steady DC current, but its electric field forms a channel that lets the supply drive current through the load.',
  ask,
  activity = 'transistor',
}: TransistorProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'transistor';
  const authoredActivity = typeof activity === 'string' ? transistorActivity : activity;
  const [Vg, setVg] = useState(0);
  const [Rk, setRk] = useState(loadK);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();

  const R = Rk * 1000;
  const mk = (vg: number): Elem[] => [
    { kind: 'V', n1: 1, n2: 0, value: supply },
    { kind: 'V', n1: 3, n2: 0, value: vg },
    { kind: 'R', n1: 1, n2: 2, value: R, id: 'load' },
    { kind: 'M', n1: 2, n2: 0, n3: 3, value: 0, vth, k: K, id: 'q' },
  ];
  const sol = solveDC(mk(Vg));
  const Id = (sol.current['q'] ?? 0) * 1000;
  const Vdrain = sol.nodeV[2] ?? 0;
  const maxId = (supply / R) * 1000;
  const channelFormed = Vg >= vth;
  const on = Id > 0.05;
  const region = !channelFormed ? 'cutoff' : on ? 'conducting' : 'near threshold';
  useCheckpoint({ solved: channelFormed, activity: `${activityId}:channel` });
  const ratedCurrent = (supply / (loadK * 1000)) * 1000;
  const brightness = Math.max(0, Math.min(1, Id / ratedCurrent));

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * (0.1 + 0.4 * brightness)) % 1), {
    running: on && !reduce,
  });

  const scene = (
    <div className="electronics-scene">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`NMOS circuit, ${on ? 'on, lamp lit' : 'off, lamp dark'}`}
      >
        <Wire
          points={[
            [xL, yT],
            [xL, yB],
          ]}
          live={on}
        />
        <Wire
          points={[
            [xR, yT],
            [xR, yB],
          ]}
          live={on}
        />
        <SupplyRail
          from={[xL, yT]}
          to={[xR, yT]}
          label={`VDD ${supply} V`}
          live={on}
          labelAt={[xL, yT - 12]}
        />
        <SupplyRail from={[xL, yB]} to={[xR, yB]} label="GND · return" live={on} labelAt={[xL, yB + 17]} />
        {on && <FlowDots points={LOOP} phase={phase} />}
        <CellGlyph cx={CELL_X} cy={yT} half={HALF} live={on} label={`${supply} V`} />
        <BulbGlyph cx={LAMP_X} cy={yT} half={HALF} live={on} brightness={brightness} label="lamp" />
        <MosfetGlyph
          cx={MCX}
          cy={MCY}
          half={MHALF}
          on={channelFormed}
          live={on}
          label="Q1 · NMOS"
          labelPos="top"
        />
        {/* Gate voltage is a node potential; the open test point distinguishes it from drain current. */}
        <Wire
          points={[
            [GATE_TERM - 48, MCY],
            [GATE_TERM, MCY],
          ]}
        />
        <VoltagePort
          x={GATE_TERM - 48}
          y={MCY}
          name="gate · VGS"
          reading={`${Vg.toFixed(1)} V`}
          side="left"
          color={channelFormed ? C_OK : 'var(--stage-charge)'}
        />
        <Tag
          x={(xL + xR) / 2}
          y={yB - 10}
          text={on ? `drain current ${Id.toFixed(2)} mA →` : 'drain current ≈ 0 mA'}
          color={on ? 'var(--stage-accent)' : 'var(--stage-muted)'}
          size={10}
          weight={700}
        />
      </svg>
    </div>
  );

  // transfer curve Id vs gate, swept through the engine
  const pts: { x: number; y: number }[] = [];
  for (let vg = 0; vg <= 5.0001; vg += 0.1)
    pts.push({ x: vg, y: (solveDC(mk(vg)).current['q'] ?? 0) * 1000 });
  const gview = { xMin: 0, xMax: 5, yMin: 0, yMax: Math.max(2, Math.ceil(maxId * 1.1)) };
  const graph = (
    <CoordPlane view={gview} height={150} preserveAspect={false} step={1} ariaLabel="NMOS transfer curve">
      <Segment
        from={{ x: vth, y: 0 }}
        to={{ x: vth, y: gview.yMax }}
        color="var(--stage-muted)"
        weight={1}
        dashed
      />
      <Label
        x={vth}
        y={gview.yMax}
        text={`Vₜₕ = ${vth} V`}
        color="var(--stage-muted)"
        size={10}
        dy={-4}
        dx={4}
        anchor="start"
      />
      <Polyline points={pts} color="var(--stage-accent)" weight={2.5} />
      <Dot x={Vg} y={Math.max(0, Math.min(gview.yMax, Id))} r={5} color={on ? C_OK : C_BAD} />
      <Label
        x={5}
        y={gview.yMax * 0.95}
        text="loaded circuit response · ID vs VGS"
        color="var(--stage-muted)"
        size={10}
        anchor="end"
      />
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
      <Field label="gate voltage" value={`${Vg.toFixed(1)} V`}>
        <Slider value={Vg} min={0} max={5} step={0.1} onChange={setVg} ariaLabel="gate voltage" />
      </Field>
      <Field label="load R" value={`${Rk.toFixed(1)} kΩ`}>
        <Slider value={Rk} min={0.5} max={5} step={0.1} onChange={setRk} ariaLabel="load resistance" />
      </Field>
    </>
  );

  const aside = (
    <div className="electronics-inspector">
      <StatusPill ok={on}>
        {on ? `Conducting · lamp ${Math.round(brightness * 100)}%` : 'Cutoff · lamp dark'}
      </StatusPill>
      <StatList>
        <Stat
          label={
            <>
              gate V<sub>gs</sub> (threshold {vth} V)
            </>
          }
          value={`${Vg.toFixed(1)} V`}
        />
        <Stat label="steady gate current" value="≈ 0 A" />
        <Stat label="drain current" value={Math.abs(Id) < 0.001 ? '≈ 0' : `${Id.toFixed(2)} mA`} />
        <Stat label="drain voltage" value={`${Vdrain.toFixed(2)} V`} />
        <span className="electronics-explanation">
          the gate field controls the channel; the supply provides the load current
        </span>
      </StatList>
    </div>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={authoredActivity}
      activityId={activityId}
      eyebrow="Semiconductor devices"
      title={title}
      description={prompt}
      status={
        <>
          <span>{region}</span>
          <span>{Id.toFixed(2)} mA</span>
          <span>Vd {Vdrain.toFixed(2)} V</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        on
          ? 'Above threshold this model forms an inversion channel; the load now limits drain current and sets drain voltage.'
          : 'Below threshold this switch-level model treats drain current as negligible.'
      }
      transcript={
        <p>
          Gate voltage {Vg.toFixed(1)} volts with threshold {vth} volts. Drain current {Id.toFixed(2)}{' '}
          milliamps; lamp {on ? 'lit' : 'dark'}.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="channel-formed"
            met={channelFormed}
            complete={complete}
            outcome={`${Vg.toFixed(1)} V gate`}
          />
          <AuthoredMetricGate
            conditionId="load-compared"
            met={sequence.current.id === 'transfer' && Math.abs(Rk - loadK) >= 0.5}
            complete={complete}
            outcome={`${Rk.toFixed(1)} kΩ load`}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
