'use client';

/**
 * DiodeLab — a diode as a ONE-WAY VALVE you can watch, drawn with the SHARED
 * electronics glyph library (CellGlyph / DiodeGlyph / BulbGlyph) on a real
 * schematic, not hand-rolled shapes. A battery pushes current around the loop
 * through the diode to a lamp: forward, the valve opens, current flows and the
 * lamp glows; reverse, the symbol flips, the flow stops, the lamp goes dark. The
 * small I-V curve below is the same story as a graph, with the live operating
 * point from the engine's nonlinear (Shockley) solver.
 */

import { useState, type ReactNode } from 'react';
import { Plot, Dot, Label, Segment, useFrameLoop } from '@classytic/stage';
import { solveDC, type Elem } from '@classytic/stage/circuit';
import { CoordPlane } from '../../kit/coords.js';
import {
  CellGlyph,
  DiodeGlyph,
  BulbGlyph,
  Wire,
  FlowDots,
  Tag,
  VoltagePort,
} from '../../kit/electronics/index.js';
import { useReducedMotion } from '../../kit/anim.js';
import { Field, StatList, Stat } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { diodeActivity } from './activity-plan.js';
import { Slider, Segmented, StatusPill } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';

export interface DiodeProps {
  volts?: number;
  resistanceK?: number;
  /** which panels to show: the schematic, the I-V graph, or both (default). */
  show?: 'both' | 'circuit' | 'graph';
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

/** Top of the current axis, in mA. */
const I_TOP = 10;
const VT = 0.025852,
  IS = 1e-12;
const C_OK = 'var(--stage-good)';
const C_BAD = 'var(--stage-danger, #e03131)';

// schematic layout (pixel space), a rectangular loop with devices on the top wire
const W = 520,
  H = 188,
  xL = 45,
  xR = 475,
  yT = 56,
  yB = 150,
  HALF = 28;
const CELL_X = 110,
  DIODE_X = 250,
  BULB_X = 400;
const LOOP: [number, number][] = [
  [xL, yT],
  [xR, yT],
  [xR, yB],
  [xL, yB],
  [xL, yT],
];

export function DiodeLab({
  volts = 2,
  resistanceK = 1,
  show = 'both',
  title = 'The diode: a one-way valve',
  prompt = 'The battery pushes current around the loop. Forward, the valve opens and the lamp lights; reverse it and the flow is blocked.',
  ask,
  activity = 'diode',
}: DiodeProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'diode';
  const authoredActivity = typeof activity === 'string' ? diodeActivity : activity;
  const [Vs, setVs] = useState(volts);
  const [Rk, setRk] = useState(resistanceK);
  const [reversed, setReversed] = useState(false);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();

  const R = Rk * 1000;
  const elems: Elem[] = [
    { kind: 'V', n1: 1, n2: 0, value: Vs },
    { kind: 'R', n1: 1, n2: 2, value: R },
    reversed
      ? { kind: 'D', n1: 0, n2: 2, value: 0, id: 'd' }
      : { kind: 'D', n1: 2, n2: 0, value: 0, id: 'd' },
  ];
  const sol = solveDC(elems);
  const V2 = sol.nodeV[2] ?? 0;
  const Vd = reversed ? -V2 : V2;
  const Ima = (sol.current['d'] ?? 0) * 1000;
  const conducting = Ima > 0.05;
  const brightness = Math.max(0, Math.min(1, Ima / ((Vs / R) * 1000 || 1)));

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * (0.1 + 0.4 * brightness)) % 1), {
    running: conducting && !reduce,
  });

  const scene = (
    <div className="electronics-scene">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Diode circuit, ${conducting ? 'conducting, lamp lit' : 'blocked, lamp dark'}`}
      >
        <Wire points={LOOP} live={conducting} />
        {conducting && <FlowDots points={LOOP} phase={phase} />}
        <CellGlyph cx={CELL_X} cy={yT} half={HALF} live={conducting} label={`${Vs} V`} />
        {/* the diode symbol; mirror it when wired in reverse so the triangle points back */}
        <g transform={reversed ? `translate(${2 * DIODE_X} 0) scale(-1 1)` : undefined}>
          <DiodeGlyph
            cx={DIODE_X}
            cy={yT}
            half={HALF}
            live={conducting}
            conducting={conducting}
            label={reversed ? 'reverse' : 'forward'}
          />
        </g>
        <BulbGlyph cx={BULB_X} cy={yT} half={HALF} live={conducting} brightness={brightness} label="lamp" />
        <VoltagePort
          x={DIODE_X - HALF}
          y={yT}
          name="diode voltage"
          reading={`${Vd.toFixed(2)} V`}
          side="left"
        />
        <Tag
          x={(xL + xR) / 2}
          y={yB - 10}
          text={conducting ? `current ${Ima.toFixed(2)} mA →` : 'current ≈ 0 mA · blocked'}
          color={conducting ? 'var(--stage-accent)' : 'var(--stage-muted)'}
          size={10}
          weight={700}
        />
      </svg>
    </div>
  );

  const ivCurve = (vd: number): number => IS * (Math.exp(Math.min(vd / VT, 80)) - 1) * 1000;
  // Stop the curve where it leaves the top of the axis, rather than letting it run up the frame.
  const vTop = VT * Math.log(I_TOP / (IS * 1000) + 1);
  const graph = (
    <CoordPlane
      view={{ xMin: -0.7, xMax: 0.75, yMin: -1.5, yMax: I_TOP }}
      height={160}
      preserveAspect={false}
      stepX={0.2}
      stepY={5}
      ariaLabel="Diode I-V curve"
    >
      <Plot.OfX y={ivCurve} domain={[-0.7, vTop]} color="var(--stage-accent)" weight={2.5} />
      <Dot
        x={Math.max(-0.7, Math.min(0.72, Vd))}
        y={Math.max(-1.5, Math.min(I_TOP, ivCurve(Vd)))}
        r={5}
        color={conducting ? C_OK : C_BAD}
      />
      <Segment
        from={{ x: 0.6, y: 0 }}
        to={{ x: 0.6, y: I_TOP }}
        color="var(--stage-muted)"
        weight={1}
        dashed
      />
      {/* The reverse half of the plot is flat, so its upper left is the one corner the curve and
          the 0.6 V line never reach. At the right the caption sat on both. */}
      <Label
        x={-0.66}
        y={8.6}
        text="I (mA) vs V across the diode"
        color="var(--stage-muted)"
        size={11}
        anchor="start"
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
      <Field label="orientation">
        <Segmented
          ariaLabel="orientation"
          value={reversed ? 'reverse' : 'forward'}
          onChange={(v) => setReversed(v === 'reverse')}
          options={[
            { value: 'forward', label: 'forward ▶|' },
            { value: 'reverse', label: 'reverse |◀' },
          ]}
        />
      </Field>
      <Field label="battery" value={`${Vs} V`}>
        <Slider value={Vs} min={0} max={5} step={0.1} onChange={setVs} ariaLabel="battery voltage" />
      </Field>
      <Field label="R" value={`${Rk} kΩ`}>
        <Slider value={Rk} min={0.2} max={10} step={0.1} onChange={setRk} ariaLabel="series resistance" />
      </Field>
    </>
  );

  const aside = (
    <div className="electronics-inspector">
      <StatusPill ok={conducting}>
        {conducting ? '✓ valve OPEN, current flows, lamp lit' : '✗ valve SHUT, blocked, lamp dark'}
      </StatusPill>
      <StatList>
        <Stat label="V across diode" value={`${Vd.toFixed(2)} V`} />
        <Stat label="current" value={Math.abs(Ima) < 0.001 ? '≈ 0' : `${Ima.toFixed(2)} mA`} />
        <span className="electronics-explanation">
          silicon forward voltage is often around 0.6–0.7 V at common currents, but changes logarithmically
          with current and also with temperature
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
          <span>{reversed ? 'reverse bias' : 'forward bias'}</span>
          <span>{Math.abs(Ima) < 0.001 ? '≈ 0 mA' : `${Ima.toFixed(2)} mA`}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        conducting
          ? 'The operating point lies on the steep forward region; current flows and the lamp responds.'
          : 'Reverse bias places the operating point near zero current in this model.'
      }
      transcript={
        <p>
          The diode is {reversed ? 'reverse' : 'forward'} biased. Diode voltage {Vd.toFixed(2)} volts; current{' '}
          {Ima.toFixed(3)} milliamps; lamp {conducting ? 'lit' : 'dark'}.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="orientation-tested"
            met={reversed}
            complete={complete}
            outcome="reverse bias tested"
          />
          <AuthoredMetricGate
            conditionId="resistance-compared"
            met={sequence.current.id === 'transfer' && !reversed && Math.abs(Rk - resistanceK) >= 0.05}
            complete={complete}
            outcome={`${Rk.toFixed(1)} kΩ`}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
