'use client';

import { useState, type ReactNode } from 'react';
import { Polyline, Dot, Label, useFrameLoop } from '@classytic/stage';
import { CoordPlane } from '../../kit/coords.js';
import { MosfetGlyph, Wire, FlowDots, Tag, SupplyRail, LogicPort } from '../../kit/electronics/index.js';
import { useReducedMotion } from '../../kit/anim.js';
import { Field } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Slider, Segmented, StatusPill } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { C_HI, C_LO } from './shared.js';
import { inverterElements, solveOutput } from './model.js';
import { inverterActivity } from './activity-plans.js';

export interface CmosInverterProps {
  vdd?: number;
  vth?: number;
  show?: 'both' | 'circuit' | 'graph';
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

// schematic layout (pixel space)
const W = 460,
  H = 250;
const STK = 300; // the PMOS/NMOS drain-source stack x
const PCX = STK - 9,
  NCX = STK - 9; // glyph centre (terminals sit at cx+9 = STK)
const PCY = 82,
  NCY = 166,
  MHALF = 36;
const VDD_Y = 30,
  GND_Y = 220,
  Y_Y = (PCY + MHALF + NCY - MHALF) / 2;
const GATE_X = PCX - 13 - 24; // gate terminal x

export function CmosInverterLab({
  vdd = 5,
  vth = 2,
  show = 'both',
  title = 'CMOS inverter: two transistors become a NOT gate',
  prompt = 'Drag the input A. Low input: the top (PMOS) opens and pulls the output HIGH; high input: the bottom (NMOS) opens and pulls it LOW. The output is the inverse, a NOT gate.',
  ask,
  activity = 'cmos-inverter',
}: CmosInverterProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'cmos-inverter';
  const authoredActivity = typeof activity === 'string' ? inverterActivity : activity;
  const [A, setA] = useState(0);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();

  const Y = solveOutput(inverterElements(A, vdd, vth));
  const pmosOn = vdd - A > vth; // gate low vs source → PMOS conducts
  const nmosOn = A > vth;
  const aHi = A > vdd / 2,
    yHi = Y > vdd / 2;

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * 0.4) % 1), {
    running: (pmosOn || nmosOn) && !reduce,
  });

  // wires: VDD rail, GND rail, the gate-input bus, the output line
  const pTop: [number, number] = [STK, PCY - MHALF],
    pBot: [number, number] = [STK, PCY + MHALF];
  const nTop: [number, number] = [STK, NCY - MHALF],
    nBot: [number, number] = [STK, NCY + MHALF];
  const vddRail: [number, number][] = [
    [200, VDD_Y],
    [360, VDD_Y],
  ];
  const gndRail: [number, number][] = [
    [200, GND_Y],
    [360, GND_Y],
  ];
  const pullUpWire: [number, number][] = [[STK, VDD_Y], pTop];
  const pullDnWire: [number, number][] = [nBot, [STK, GND_Y]];
  const outWire: [number, number][] = [pBot, [STK, Y_Y], [430, Y_Y]];
  const gateBus: [number, number][] = [
    [GATE_X, PCY],
    [220, PCY],
    [220, NCY],
    [GATE_X, NCY],
  ];
  const inWire: [number, number][] = [
    [110, Y_Y],
    [220, Y_Y],
  ];

  const scene = (
    <div className="cmos-scene">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`CMOS inverter, input ${aHi ? 'high' : 'low'}, output ${yHi ? 'high' : 'low'}`}
      >
        <SupplyRail from={vddRail[0]!} to={vddRail[1]!} live={pmosOn} label={`VDD ${vdd} V`} />
        <SupplyRail from={gndRail[0]!} to={gndRail[1]!} live={nmosOn} label="GND" />
        <Wire points={pullUpWire} live={pmosOn} />
        <Wire points={pullDnWire} live={nmosOn} />
        <Wire points={outWire} live />
        <Wire points={gateBus} />
        <Wire points={inWire} />
        {pmosOn && (
          <FlowDots
            points={[...vddRail.slice(1), pTop, pBot, [STK, Y_Y]] as [number, number][]}
            phase={phase}
          />
        )}
        {nmosOn && (
          <FlowDots points={[[STK, Y_Y], nTop, nBot, [STK, GND_Y]] as [number, number][]} phase={phase} />
        )}
        <MosfetGlyph cx={PCX} cy={PCY} half={MHALF} pmos on={pmosOn} live={pmosOn} label="PMOS" />
        <MosfetGlyph cx={NCX} cy={NCY} half={MHALF} on={nmosOn} live={nmosOn} label="NMOS" />
        <LogicPort x={106} y={Y_Y} name="A" value={aHi ? '1' : '0'} color={aHi ? C_HI : C_LO} side="left" />
        <LogicPort x={434} y={Y_Y} name="Y" value={yHi ? '1' : '0'} color={yHi ? C_HI : C_LO} />
      </svg>
    </div>
  );

  // analog transfer curve Y vs A (the sharp CMOS transition), swept through the engine
  const pts: { x: number; y: number }[] = [];
  for (let a = 0; a <= vdd + 1e-6; a += vdd / 60)
    pts.push({ x: a, y: solveOutput(inverterElements(a, vdd, vth)) });
  const gview = { xMin: 0, xMax: vdd, yMin: 0, yMax: vdd };
  const graph = (
    <CoordPlane view={gview} height={150} preserveAspect={false} step={1} ariaLabel="CMOS transfer curve">
      <Polyline points={pts} color="var(--stage-accent)" weight={2.5} />
      <Dot x={A} y={Math.max(0, Math.min(vdd, Y))} r={5} color={yHi ? C_HI : C_LO} />
      <Label
        x={vdd}
        y={vdd * 0.96}
        text="output Y (V) vs input A (V)"
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
      <div className="cmos-visual-stack">
        {scene}
        {graph}
      </div>
    );

  const controls = (
    <>
      <Field label="input A" value={`${A.toFixed(1)} V`}>
        <Slider value={A} min={0} max={vdd} step={0.1} onChange={setA} ariaLabel="input voltage" />
      </Field>
      <Field label="quick set">
        {/* The slider makes A continuous, so neither end is selected in between: '' is that
            third, unselected state and is deliberately absent from `options`. */}
        <Segmented<'low' | 'high' | ''>
          ariaLabel="quick set"
          value={A === 0 ? 'low' : A === vdd ? 'high' : ''}
          onChange={(v) => setA(v === 'high' ? vdd : 0)}
          options={[
            { value: 'low', label: 'A = 0' },
            { value: 'high', label: 'A = 1' },
          ]}
        />
      </Field>
    </>
  );

  const aside = (
    <div className="cmos-inspector-stack">
      <StatusPill ok={pmosOn !== nmosOn}>
        {pmosOn && !nmosOn
          ? 'PMOS pull-up · output HIGH'
          : nmosOn && !pmosOn
            ? 'NMOS pull-down · output LOW'
            : 'Both networks partly conduct · transition'}
      </StatusPill>
      <div>
        <table className="cmos-truth-table">
          <thead>
            <tr>
              <th>A</th>
              <th>Y = A′</th>
            </tr>
          </thead>
          <tbody>
            <tr data-current={!aHi}>
              <td>0</td>
              <td>1</td>
            </tr>
            <tr data-current={aHi}>
              <td>1</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
        <div className="cmos-output-readout">
          output = {Y.toFixed(2)} V ({yHi ? 'logic 1' : 'logic 0'})
        </div>
      </div>
    </div>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={authoredActivity}
      activityId={activityId}
      eyebrow="CMOS logic"
      title={title}
      description={prompt}
      status={
        <>
          <span>A {aHi ? 1 : 0}</span>
          <span>Y {yHi ? 1 : 0}</span>
          <span>{pmosOn ? 'pull-up' : nmosOn ? 'pull-down' : 'transition'}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation="The complementary pull networks invert the input: PMOS supplies a HIGH output for LOW input, while NMOS drains the output LOW for HIGH input."
      transcript={
        <p>
          Input A is {A.toFixed(1)} volts and output Y is {Y.toFixed(2)} volts. The output is logic{' '}
          {yHi ? 1 : 0}.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="high-tested"
            met={aHi}
            complete={complete}
            outcome={`A ${aHi ? 1 : 0} → Y ${yHi ? 1 : 0}`}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
