'use client';

import { useState, type ReactNode } from 'react';
import { useFrameLoop } from '@classytic/stage';
import { MosfetGlyph, ResistorGlyph, Wire, FlowDots, Tag } from '../../kit/electronics/index.js';
import { useReducedMotion } from '../../kit/anim.js';
import { Field } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Segmented, StatusPill } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { C_HI, C_LO } from './shared.js';
import { rnmosNotElements, solveOutput } from './model.js';
import { rnmosActivity } from './activity-plans.js';

export interface RNmosNotProps {
  vdd?: number;
  vth?: number;
  /** pull-up resistance (Ω). */
  rpull?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

const RN_W = 460,
  RN_H = 250;

export function RNmosNotLab({
  vdd = 5,
  vth = 2,
  rpull = 2000,
  title = 'A NOT gate from a single transistor',
  prompt = 'Flip the input. HIGH turns the transistor on and pulls the output LOW; LOW leaves it off, so the resistor pulls the output HIGH. One transistor inverts, that is a NOT gate.',
  ask,
  activity = 'rnmos-not',
}: RNmosNotProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'rnmos-not';
  const authoredActivity = typeof activity === 'string' ? rnmosActivity : activity;
  const [A, setA] = useState(0);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();

  const Va = A ? vdd : 0;
  const Y = solveOutput(rnmosNotElements(Va, vdd, vth, rpull));
  const nmosOn = Va > vth;
  const yHi = Y > vdd / 2;
  const Iload = (vdd - Y) / rpull; // current through the pull-up resistor
  const Pres = Math.max(0, Iload * (vdd - Y)); // power wasted in the resistor

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * 0.4) % 1), { running: nmosOn && !reduce });

  // layout: VDD rail (top) → pull-up R → Y node → NMOS → GND rail (bottom); input A on the left.
  const SX = 250,
    VDD_Y = 30,
    GND_Y = 220,
    Y_Y = 125;
  const RCY = 72,
    NCY = 168,
    NHALF = 32;
  const vddRail: [number, number][] = [
    [170, VDD_Y],
    [330, VDD_Y],
  ];
  const gndRail: [number, number][] = [
    [170, GND_Y],
    [330, GND_Y],
  ];
  const rTopWire: [number, number][] = [
    [SX, VDD_Y],
    [SX, RCY - 30],
  ];
  const rBotWire: [number, number][] = [
    [SX, RCY + 30],
    [SX, Y_Y],
  ];
  const yToDrain: [number, number][] = [
    [SX, Y_Y],
    [SX, NCY - NHALF],
  ];
  const srcToGnd: [number, number][] = [
    [SX, NCY + NHALF],
    [SX, GND_Y],
  ];
  const outWire: [number, number][] = [
    [SX, Y_Y],
    [392, Y_Y],
  ];
  const gateWire: [number, number][] = [
    [96, NCY],
    [SX - 37, NCY],
  ];

  const scene = (
    <div className="cmos-scene cmos-scene-centered">
      <svg
        viewBox={`0 0 ${RN_W} ${RN_H}`}
        width="100%"
        role="img"
        aria-label={`resistor-NMOS NOT gate, input ${A ? 'high' : 'low'}, output ${yHi ? 'high' : 'low'}`}
      >
        <Wire points={vddRail} live={nmosOn} />
        <Wire points={gndRail} live={nmosOn} />
        <Wire points={rTopWire} live={nmosOn} />
        <Wire points={rBotWire} live={nmosOn} />
        <Wire points={yToDrain} live={nmosOn} />
        <Wire points={srcToGnd} live={nmosOn} />
        <Wire points={outWire} live={yHi} />
        <Wire points={gateWire} />
        {nmosOn && (
          <FlowDots
            points={
              [
                [SX, VDD_Y],
                [SX, RCY],
                [SX, Y_Y],
                [SX, NCY],
                [SX, GND_Y],
              ] as [number, number][]
            }
            phase={phase}
          />
        )}
        <g transform={`rotate(90 ${SX} ${RCY})`}>
          <ResistorGlyph cx={SX} cy={RCY} half={30} live={nmosOn} />
        </g>
        <MosfetGlyph cx={SX} cy={NCY} half={NHALF} on={nmosOn} live={nmosOn} label="NMOS" />
        <Tag
          x={335}
          y={VDD_Y + 4}
          text={`VDD ${vdd}V`}
          color="var(--stage-fg)"
          size={12}
          weight={700}
          anchor="start"
        />
        <Tag
          x={335}
          y={GND_Y + 4}
          text="GND"
          color="var(--stage-muted)"
          size={12}
          weight={700}
          anchor="start"
        />
        <Tag x={90} y={NCY - 8} text="A (in)" color="var(--stage-fg)" size={12} weight={700} anchor="end" />
        <Tag
          x={90}
          y={NCY + 11}
          text={A ? '1' : '0'}
          color={A ? C_HI : C_LO}
          size={13}
          weight={800}
          anchor="end"
        />
        <circle cx={396} cy={Y_Y} r={4.5} fill={yHi ? C_HI : C_LO} />
        <Tag
          x={404}
          y={Y_Y - 8}
          text="Y (out)"
          color="var(--stage-fg)"
          size={12}
          weight={700}
          anchor="start"
        />
        <Tag
          x={404}
          y={Y_Y + 11}
          text={yHi ? '1' : '0'}
          color={yHi ? C_HI : C_LO}
          size={13}
          weight={800}
          anchor="start"
        />
        <Tag
          x={SX + 22}
          y={RCY + 4}
          text={`${(rpull / 1000).toFixed(rpull % 1000 ? 1 : 0)}kΩ`}
          color="var(--stage-muted)"
          size={11}
          weight={700}
          anchor="start"
        />
      </svg>
    </div>
  );

  const controls = (
    <>
      <Field label="input A">
        <Segmented
          ariaLabel="input a"
          value={A === 1 ? '1' : '0'}
          onChange={(v) => setA(v === '1' ? 1 : 0)}
          options={[
            { value: '0', label: 'A = 0' },
            { value: '1', label: 'A = 1' },
          ]}
        />
      </Field>
    </>
  );

  const aside = (
    <div className="cmos-inspector-stack">
      <StatusPill ok={yHi !== !!A}>
        {A ? 'transistor ON → output pulled LOW' : 'transistor OFF → resistor pulls output HIGH'}
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
            <tr data-current={!A}>
              <td>0</td>
              <td>1</td>
            </tr>
            <tr data-current={!!A}>
              <td>1</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
        <div className="cmos-output-readout">
          output = {Y.toFixed(2)} V ({yHi ? 'logic 1' : 'logic 0'})
        </div>
      </div>
      <div>
        <div className="cmos-explanation">
          <strong>The catch:</strong> while the output is LOW,{' '}
          {Pres > 1e-4 ? `${(Pres * 1000).toFixed(1)} mW` : '~0 mW'} of steady current wastes power in the
          resistor. CMOS replaces the resistor with a second transistor so only one path ever conducts, that
          is why chips use CMOS.
        </div>
      </div>
    </div>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={authoredActivity}
      activityId={activityId}
      eyebrow="Logic families"
      title={title}
      description={prompt}
      status={
        <>
          <span>A {A}</span>
          <span>Y {yHi ? 1 : 0}</span>
          <span>{nmosOn ? `${(Pres * 1000).toFixed(1)} mW static` : 'no static path'}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation="The circuit inverts, but a HIGH input creates a steady path from VDD through the resistor and NMOS to ground. Complementary CMOS avoids that normal-state static path."
      transcript={
        <p>
          Input A is {A}; output Y is logic {yHi ? 1 : 0}. Resistor dissipation is {(Pres * 1000).toFixed(2)}{' '}
          milliwatts.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="high-tested"
            met={A === 1}
            complete={complete}
            outcome={`A ${A} → Y ${yHi ? 1 : 0}`}
          />
          {scene}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
