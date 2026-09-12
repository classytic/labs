'use client';

import { useState, type ReactNode } from 'react';
import { useFrameLoop } from '@classytic/stage';
import { MosfetGlyph, Wire, FlowDots, Tag, SupplyRail, LogicPort } from '../../kit/electronics/index.js';
import { useReducedMotion } from '../../kit/anim.js';
import { Field } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Segmented, StatusPill } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { C_HI, C_LO } from './shared.js';
import { nandElements, solveOutput } from './model.js';
import { nandActivity } from './activity-plans.js';

export interface CmosNandProps {
  vdd?: number;
  vth?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string | AuthoredActivity;
}

const NAND_W = 480,
  NAND_H = 300;

export function CmosNandLab({
  vdd = 5,
  vth = 2,
  title = 'NAND from four transistors: the universal gate',
  prompt = 'Toggle A and B. The top PMOS pair pulls the output HIGH unless both inputs are HIGH; only then does the bottom NMOS pair connect it to ground. That is a NAND, and a NAND can build every other gate.',
  ask,
  activity = 'cmos-nand',
}: CmosNandProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'cmos-nand';
  const authoredActivity = typeof activity === 'string' ? nandActivity : activity;
  const [A, setA] = useState(0);
  const [B, setB] = useState(0);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();

  const Va = A ? vdd : 0,
    Vb = B ? vdd : 0;
  const Y = solveOutput(nandElements(Va, Vb, vdd, vth));
  const pA = vdd - Va > vth,
    pB = vdd - Vb > vth; // PMOS conducts when its gate is LOW
  const nA = Va > vth,
    nB = Vb > vth; // NMOS conducts when its gate is HIGH
  const pullDown = nA && nB; // series: needs BOTH
  const yHi = Y > vdd / 2;

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * 0.4) % 1), {
    running: (pA || pB || pullDown) && !reduce,
  });

  // layout: VDD rail → parallel PMOS pair → Y bus → series NMOS pair → GND rail
  const VDD_Y = 30,
    GND_Y = 290,
    Y_Y = 145;
  const PAt = 180,
    PBt = 300,
    Nt = 240,
    OUTx = 440; // terminal x's (glyph cx = term − 9)
  const wire = (a: [number, number], b: [number, number]): [number, number][] => [a, b];

  const scene = (
    <div className="cmos-scene cmos-scene-centered">
      <svg
        viewBox={`0 0 ${NAND_W} ${NAND_H}`}
        width="100%"
        role="img"
        aria-label={`CMOS NAND, A ${A}, B ${B}, output ${yHi ? 'high' : 'low'}`}
      >
        <SupplyRail from={[120, VDD_Y]} to={[360, VDD_Y]} live={pA || pB} label={`VDD ${vdd} V`} />
        <SupplyRail from={[120, GND_Y]} to={[360, GND_Y]} live={pullDown} label="GND" />
        <Wire points={wire([PAt, VDD_Y], [PAt, 55])} live={pA} />
        <Wire points={wire([PAt, 115], [PAt, Y_Y])} live={pA} />
        <Wire points={wire([PBt, VDD_Y], [PBt, 55])} live={pB} />
        <Wire points={wire([PBt, 115], [PBt, Y_Y])} live={pB} />
        <Wire
          points={[
            [PAt, Y_Y],
            [OUTx, Y_Y],
          ]}
          live={yHi}
        />
        <Wire points={wire([Nt, Y_Y], [Nt, 160])} live={pullDown} />
        <Wire points={wire([Nt, 280], [Nt, GND_Y])} live={pullDown} />
        {pA && (
          <FlowDots
            points={
              [
                [PAt, VDD_Y],
                [PAt, Y_Y],
              ] as [number, number][]
            }
            phase={phase}
          />
        )}
        {pB && (
          <FlowDots
            points={
              [
                [PBt, VDD_Y],
                [PBt, Y_Y],
              ] as [number, number][]
            }
            phase={phase}
          />
        )}
        {pullDown && (
          <FlowDots
            points={
              [
                [Nt, Y_Y],
                [Nt, GND_Y],
              ] as [number, number][]
            }
            phase={phase}
          />
        )}
        <MosfetGlyph cx={PAt - 9} cy={85} half={30} pmos on={pA} live={pA} label="A" />
        <MosfetGlyph cx={PBt - 9} cy={85} half={30} pmos on={pB} live={pB} label="B" />
        <MosfetGlyph cx={Nt - 9} cy={190} half={30} on={nA} live={pullDown} label="A" />
        <MosfetGlyph cx={Nt - 9} cy={250} half={30} on={nB} live={pullDown} label="B" />
        <Tag
          x={92}
          y={66}
          text="PMOS pull-up"
          color="var(--stage-muted)"
          size={11}
          weight={700}
          anchor="start"
        />
        <Tag
          x={92}
          y={222}
          text="NMOS pull-down"
          color="var(--stage-muted)"
          size={11}
          weight={700}
          anchor="start"
        />
        <LogicPort x={OUTx + 4} y={Y_Y} name="Y" value={yHi ? '1' : '0'} color={yHi ? C_HI : C_LO} />
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
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 0],
  ];
  const aside = (
    <div className="cmos-inspector-stack">
      <StatusPill ok={(pA || pB) !== pullDown}>
        {pullDown ? 'Both inputs HIGH · NMOS path pulls Y LOW' : 'PMOS path active · Y HIGH'}
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
          output = {Y.toFixed(2)} V ({yHi ? 'logic 1' : 'logic 0'}), so Y = (A·B)′
        </div>
      </div>
      <div>
        <div className="cmos-explanation">
          <strong>NAND is universal.</strong> Tie both inputs together → a NOT. A NAND then a NOT → AND. By De
          Morgan, NANDs make OR too. So these four transistors are the one building block every gate, and an
          entire CPU, is made from.
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
      observation="Only two HIGH inputs complete the series NMOS pull-down path. Every other input leaves at least one PMOS pull-up path available."
      transcript={
        <p>
          NAND inputs are A {A} and B {B}; output Y is logic {yHi ? 1 : 0}.
        </p>
      }
      support={ask ? <LabAsk ask={ask} activity={activityId} /> : undefined}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="both-high-tested"
            met={A === 1 && B === 1}
            complete={complete}
            outcome={`${A}${B} → ${yHi ? 1 : 0}`}
          />
          {scene}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
