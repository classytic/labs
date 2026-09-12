'use client';

import { useState, type ReactNode } from 'react';
import { useFrameLoop } from '@classytic/stage';
import { MosfetGlyph, Wire, FlowDots, Tag } from '../../kit/electronics/index.js';
import { useReducedMotion } from '../../kit/anim.js';
import { Field } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Segmented, StatusPill } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { C_HI, C_LO } from './shared.js';
import { norElements, solveOutput } from './model.js';
import { norActivity } from './activity-plans.js';

export interface CmosNorProps {
  vdd?: number;
  vth?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

const NOR_W = 480,
  NOR_H = 300;

export function CmosNorLab({
  vdd = 5,
  vth = 2,
  title = 'NOR: the De Morgan twin of NAND',
  prompt = 'Toggle A and B. The networks are flipped from the NAND: a series PMOS pair pulls the output HIGH only when both inputs are LOW, and a parallel NMOS pair pulls it LOW the moment either input goes HIGH. NOR is the other universal gate.',
  ask,
  activity = 'cmos-nor',
}: CmosNorProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'cmos-nor';
  const authoredActivity = typeof activity === 'string' ? norActivity : activity;
  const [A, setA] = useState(0);
  const [B, setB] = useState(0);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();

  const Va = A ? vdd : 0,
    Vb = B ? vdd : 0;
  const Y = solveOutput(norElements(Va, Vb, vdd, vth));
  const pA = vdd - Va > vth,
    pB = vdd - Vb > vth; // PMOS conducts when its gate is LOW
  const nA = Va > vth,
    nB = Vb > vth; // NMOS conducts when its gate is HIGH
  const pullUp = pA && pB; // series: needs BOTH low
  const yHi = Y > vdd / 2;

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * 0.4) % 1), {
    running: (pullUp || nA || nB) && !reduce,
  });

  // layout: VDD rail → series PMOS pair → Y bus → parallel NMOS pair → GND rail
  const VDD_Y = 30,
    GND_Y = 290,
    Y_Y = 200;
  const Px = 240; // series PMOS stack terminal x
  const NAt = 180,
    NBt = 300,
    OUTx = 440;
  const wire = (a: [number, number], b: [number, number]): [number, number][] => [a, b];

  const scene = (
    <div className="cmos-scene cmos-scene-centered">
      <svg
        viewBox={`0 0 ${NOR_W} ${NOR_H}`}
        width="100%"
        role="img"
        aria-label={`CMOS NOR, A ${A}, B ${B}, output ${yHi ? 'high' : 'low'}`}
      >
        <Wire
          points={[
            [120, VDD_Y],
            [360, VDD_Y],
          ]}
          live={pullUp}
        />
        <Wire
          points={[
            [120, GND_Y],
            [360, GND_Y],
          ]}
          live={nA || nB}
        />
        <Wire points={wire([Px, VDD_Y], [Px, 55])} live={pullUp} />
        <Wire points={wire([Px, 115], [Px, 119])} live={pullUp} />
        <Wire points={wire([Px, 179], [Px, Y_Y])} live={pullUp} />
        <Wire
          points={[
            [NAt, Y_Y],
            [OUTx, Y_Y],
          ]}
          live={yHi}
        />
        <Wire points={wire([NAt, Y_Y], [NAt, 210])} live={nA} />
        <Wire points={wire([NAt, 270], [NAt, GND_Y])} live={nA} />
        <Wire points={wire([NBt, Y_Y], [NBt, 210])} live={nB} />
        <Wire points={wire([NBt, 270], [NBt, GND_Y])} live={nB} />
        {pullUp && (
          <FlowDots
            points={
              [
                [Px, VDD_Y],
                [Px, Y_Y],
              ] as [number, number][]
            }
            phase={phase}
          />
        )}
        {nA && (
          <FlowDots
            points={
              [
                [NAt, Y_Y],
                [NAt, GND_Y],
              ] as [number, number][]
            }
            phase={phase}
          />
        )}
        {nB && (
          <FlowDots
            points={
              [
                [NBt, Y_Y],
                [NBt, GND_Y],
              ] as [number, number][]
            }
            phase={phase}
          />
        )}
        <MosfetGlyph cx={Px - 9} cy={85} half={30} pmos on={pA} live={pullUp} label="A" />
        <MosfetGlyph cx={Px - 9} cy={149} half={30} pmos on={pB} live={pullUp} label="B" />
        <MosfetGlyph cx={NAt - 9} cy={240} half={30} on={nA} live={nA} label="A" />
        <MosfetGlyph cx={NBt - 9} cy={240} half={30} on={nB} live={nB} label="B" />
        <Tag
          x={364}
          y={VDD_Y + 4}
          text={`VDD ${vdd}V`}
          color="var(--stage-fg)"
          size={12}
          weight={700}
          anchor="start"
        />
        <Tag
          x={364}
          y={GND_Y + 4}
          text="GND"
          color="var(--stage-muted)"
          size={12}
          weight={700}
          anchor="start"
        />
        <Tag
          x={92}
          y={118}
          text="PMOS pull-up"
          color="var(--stage-muted)"
          size={11}
          weight={700}
          anchor="start"
        />
        <Tag
          x={92}
          y={244}
          text="NMOS pull-down"
          color="var(--stage-muted)"
          size={11}
          weight={700}
          anchor="start"
        />
        <circle cx={OUTx + 4} cy={Y_Y} r={4.5} fill={yHi ? C_HI : C_LO} />
        <Tag
          x={OUTx + 12}
          y={Y_Y - 8}
          text="Y"
          color="var(--stage-fg)"
          size={12}
          weight={700}
          anchor="start"
        />
        <Tag
          x={OUTx + 12}
          y={Y_Y + 11}
          text={yHi ? '1' : '0'}
          color={yHi ? C_HI : C_LO}
          size={13}
          weight={800}
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
            { value: '0', label: '0' },
            { value: '1', label: '1' },
          ]}
        />
      </Field>
      <Field label="input B">
        <Segmented
          ariaLabel="input b"
          value={B === 1 ? '1' : '0'}
          onChange={(v) => setB(v === '1' ? 1 : 0)}
          options={[
            { value: '0', label: '0' },
            { value: '1', label: '1' },
          ]}
        />
      </Field>
    </>
  );

  const rows: [number, number, number][] = [
    [0, 0, 1],
    [0, 1, 0],
    [1, 0, 0],
    [1, 1, 0],
  ];
  const aside = (
    <div className="cmos-inspector-stack">
      <StatusPill ok={pullUp !== (nA || nB)}>
        {pullUp ? 'Both inputs LOW · PMOS path pulls Y HIGH' : 'NMOS path active · Y LOW'}
      </StatusPill>
      <div>
        <table className="cmos-truth-table">
          <thead>
            <tr>
              <th>A</th>
              <th>B</th>
              <th>Y</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([a, b, y]) => (
              <tr key={`${a}${b}`} data-current={a === A && b === B}>
                <td>{a}</td>
                <td>{b}</td>
                <td data-high={!!y}>{y}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="cmos-output-readout">
          output = {Y.toFixed(2)} V ({yHi ? 'logic 1' : 'logic 0'}), so Y = (A + B)′
        </div>
      </div>
      <div>
        <div className="cmos-explanation">
          <strong>NOR is universal too.</strong> Compare with the NAND: swapping series for parallel in each
          network turns AND-logic into OR-logic (De Morgan in silicon). NAND and NOR are the two single bricks
          any digital circuit, from a gate to a CPU, can be built from.
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
          <span>A {A}</span>
          <span>B {B}</span>
          <span>Y {yHi ? 1 : 0}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation="Both LOW inputs complete the series PMOS pull-up. Either HIGH input opens a parallel NMOS route to ground."
      transcript={
        <p>
          NOR inputs are A {A} and B {B}; output Y is logic {yHi ? 1 : 0}.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="zero-row-tested"
            met={A === 0 && B === 0}
            complete={complete}
            outcome={`${A}${B} → ${yHi ? 1 : 0}`}
          />
          {scene}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
