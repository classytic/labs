'use client';

/**
 * ElectrochemLab, a galvanic (voltaic) cell with a live voltmeter, on the shared
 * `@classytic/stage/chem` Nernst engine. Two metal/metal-ion half-cells joined by a
 * salt bridge: the metal that's easier to oxidise (lower E°) becomes the ANODE (−),
 * the other the CATHODE (+), and electrons stream anode→cathode through the wire.
 *
 * The voltmeter reads the Nernst EMF  E = E°cell − (RT/nF)·ln Q, so dragging an ion
 * concentration moves the needle in real time, dilute the cathode ion and the
 * voltage drops; pick the SAME metal both sides for a concentration cell (E° = 0,
 * driven purely by the concentration difference). Pick the two electrodes (Daniell
 * Zn/Cu by default), fully authorable. Play-gated electron flow; pure SVG.
 */

import { useRef, useState, type ReactNode } from 'react';
import { galvanicCell, type HalfCell } from '@classytic/stage/chem';
import { ActivitySelect, Slider } from '../../kit/controls.js';
import { Field, Readout, SceneViewport } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { Tex } from '../../core/tex.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import {
  Figure,
  FigText,
  FigTag,
  Glass,
  Ball,
  Particle,
  Block,
  Arrow,
  Track,
  HUE,
  STROKE,
  tint,
  shade,
} from '../../kit/figure/index.js';

interface Metal {
  z: number;
  E0: number;
  ion: string;
  /** Colour role of the ion solution: Cu²⁺ is blue, Ni²⁺/Fe²⁺ green, the rest colourless. */
  liquid: string;
}
const METALS: Record<string, Metal> = {
  Mg: { z: 2, E0: -2.37, ion: 'Mg²⁺', liquid: HUE.liquid },
  Al: { z: 3, E0: -1.66, ion: 'Al³⁺', liquid: HUE.liquid },
  Zn: { z: 2, E0: -0.76, ion: 'Zn²⁺', liquid: HUE.liquid },
  Fe: { z: 2, E0: -0.44, ion: 'Fe²⁺', liquid: tint(HUE.good, 55) },
  Ni: { z: 2, E0: -0.25, ion: 'Ni²⁺', liquid: HUE.good },
  Pb: { z: 2, E0: -0.13, ion: 'Pb²⁺', liquid: HUE.liquid },
  Cu: { z: 2, E0: 0.34, ion: 'Cu²⁺', liquid: HUE[1] },
  Ag: { z: 1, E0: 0.8, ion: 'Ag⁺', liquid: HUE.liquid },
};
const ORDER = ['Mg', 'Al', 'Zn', 'Fe', 'Ni', 'Pb', 'Cu', 'Ag'];

export interface ElectrochemProps {
  metalA?: string;
  metalB?: string;
  concA?: number;
  concB?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}
const ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Galvanic cell: voltage from a reaction',
  objectives: [
    'Identify oxidation and reduction electrodes',
    'Use concentration to interpret the Nernst voltage',
  ],
  steps: [
    {
      id: 'observe',
      phase: 'observe',
      title: 'Trace the electron path',
      lead: 'Identify where oxidation and reduction occur.',
      reveal: ['model'],
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Build and tune a cell',
      lead: 'Choose electrodes and vary ion concentrations.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the voltage',
      lead: 'Use E°, Q, and the Nernst equation as evidence.',
    },
  ],
};

const W = 720,
  H = 396;
const hc = (m: string, conc: number): HalfCell => ({ metal: m, z: METALS[m]!.z, E0: METALS[m]!.E0, conc });

export function ElectrochemLab({
  metalA = 'Zn',
  metalB = 'Cu',
  concA = 1,
  concB = 1,
  title = 'Galvanic cell: the voltage from a reaction',
  prompt = 'Two metals in their salt solutions, joined by a wire and a salt bridge. The voltmeter reads the cell EMF from the Nernst equation, change a concentration and watch it move.',
  objectives = [
    'Identify the anode (oxidation, −) and cathode (reduction, +) from E°',
    'Read the standard cell EMF E°cell = E°cathode − E°anode',
    'Use the Nernst equation E = E°cell − (RT/nF)·ln Q to see concentration shift the voltage',
  ],
  activity = ACTIVITY,
}: ElectrochemProps = {}): ReactNode {
  const runtimeActivity = activity === ACTIVITY ? { ...activity, objectives } : activity;
  const [mA, setMA] = useState(metalA);
  const [mB, setMB] = useState(metalB);
  const [cA, setCA] = useState(concA);
  const [cB, setCB] = useState(concB);
  const tRef = useRef(0);
  const gate = usePlayGate();
  useFrameTick(gate.running, (f) => {
    tRef.current += Math.min(0.05, f.dtMs / 1000);
  });
  const t = tRef.current;

  const cell = galvanicCell(hc(mA, cA), hc(mB, cB));
  const { anode, cathode, E0cell, n, Q, E } = cell;
  // which UI side each picked electrode maps to (anode drawn left, cathode right)
  const aMetal = METALS[anode.metal]!,
    cMetal = METALS[cathode.metal]!;

  // ── geometry ──
  const wireY = 50,
    Vx = 360,
    Vy = wireY,
    Vr = 36;
  const Lx = 175,
    Rx = 545,
    elecTopY = 112,
    elecW = 18,
    beakTop = 170,
    beakBot = 330,
    beakW = 180;
  // electron path anode(left)→cathode(right) through the voltmeter
  const path: [number, number][] = [
    [Lx, elecTopY],
    [Lx, wireY],
    [Vx - Vr - 3, wireY],
    [Vx + Vr + 3, wireY],
    [Rx, wireY],
    [Rx, elecTopY],
  ];
  const alongPolyline = (pts: [number, number][]): ((u: number) => [number, number]) => {
    const segLen = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i]![0], p[1] - pts[i]![1]));
    const totLen = segLen.reduce((a, b) => a + b, 0);
    return (u: number): [number, number] => {
      let d = u * totLen;
      for (let i = 0; i < segLen.length; i++) {
        if (d <= segLen[i]!) {
          const f = d / segLen[i]!;
          return [
            pts[i]![0] + (pts[i + 1]![0] - pts[i]![0]) * f,
            pts[i]![1] + (pts[i + 1]![1] - pts[i]![1]) * f,
          ];
        }
        d -= segLen[i]!;
      }
      return pts[pts.length - 1]!;
    };
  };
  const posAt = alongPolyline(path);
  // salt bridge: an inverted U dipping into both solutions
  const bridge: [number, number][] = [
    [Lx + 62, beakTop + 58],
    [Lx + 62, beakTop - 26],
    [Lx + 86, beakTop - 50],
    [Rx - 86, beakTop - 50],
    [Rx - 62, beakTop - 26],
    [Rx - 62, beakTop + 58],
  ];
  const bridgeAt = alongPolyline(bridge);
  const bridgeD = bridge.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');

  // voltmeter dial: needle sweeps 140° for 0 … 3.5 V
  const dialFrac = Math.max(0, Math.min(1, E / 3.5));
  const dialR = Vr - 10;
  const dialAngle = (f: number): number => ((-160 + 140 * f) * Math.PI) / 180;
  const dialPt = (f: number, r: number): [number, number] => [
    Vx + r * Math.cos(dialAngle(f)),
    Vy + 4 + r * Math.sin(dialAngle(f)),
  ];
  const [a0x, a0y] = dialPt(0, dialR);
  const [a1x, a1y] = dialPt(1, dialR);
  const [nx, ny] = dialPt(dialFrac, dialR - 2);

  const halfCell = (
    x: number,
    metal: string,
    m: Metal,
    conc: number,
    role: 'anode' | 'cathode',
  ): ReactNode => {
    const bx = x - beakW / 2;
    const inward = role === 'anode' ? 1 : -1; // the labels sit on the wire-free side of the electrode
    const ionColor = shade(m.liquid, 80);
    return (
      <g>
        <Glass
          x={bx}
          y={beakTop}
          w={beakW}
          h={beakBot - beakTop}
          fill={0.7}
          liquid={m.liquid}
          liquidOpacity={0.75}
        >
          {/* ions in solution: born at the anode, consumed at the cathode */}
          {Array.from({ length: 5 }, (_, i) => {
            const p = (t * 0.08 + i * 0.37) % 1;
            const away = 14 + p * 62;
            const dx = role === 'anode' ? away : 76 - away;
            const side = i % 2 ? 1 : -1;
            return <Particle key={i} x={x + side * dx} y={beakTop + 62 + i * 20} r={3.5} color={ionColor} />;
          })}
        </Glass>
        {/* electrode bar */}
        <Block
          x={x - elecW / 2}
          y={elecTopY}
          w={elecW}
          h={beakBot - elecTopY - 20}
          color={HUE.metal}
          radius={3}
        />
        <FigTag
          x={x + inward * 16}
          y={76}
          anchor={inward > 0 ? 'start' : 'end'}
          color={role === 'anode' ? HUE.danger : HUE.good}
        >
          {role === 'anode' ? 'anode −' : 'cathode +'}
        </FigTag>
        <FigText x={x + inward * 16} y={102} anchor={inward > 0 ? 'start' : 'end'} size="title">
          {metal}
        </FigText>
        <FigText x={x} y={beakBot + 18} anchor="middle">
          {m.ion} · {conc.toFixed(conc < 0.1 ? 3 : 2)} M
        </FigText>
        <FigText x={x} y={beakBot + 34} anchor="middle" size="note" tone="soft">
          {role === 'anode' ? 'oxidation' : 'reduction'}
        </FigText>
      </g>
    );
  };

  const figure = (
    <PlayWrap gate={gate}>
      <SceneViewport
        className="chem-scene chem-electrochem-scene"
        size="wide"
        overflow="scroll"
        label="Galvanic cell diagram. Pan horizontally on a narrow screen."
      >
        <Figure
          viewBox={[W, H]}
          domain="chem"
          label={`${anode.metal} ${cathode.metal} galvanic cell, EMF ${E.toFixed(2)} volts`}
        >
          {/* salt bridge (a tube of electrolyte; ions drift to keep both solutions neutral) */}
          <path
            d={bridgeD}
            fill="none"
            stroke={HUE.glass}
            strokeWidth={14}
            strokeLinejoin="round"
            strokeLinecap="butt"
          />
          <path
            d={bridgeD}
            fill="none"
            stroke={tint(HUE[3], 38)}
            strokeWidth={11}
            strokeLinejoin="round"
            strokeLinecap="butt"
          />
          {Array.from({ length: 4 }, (_, i) => {
            const [px, py] = bridgeAt((t * 0.1 + i / 4) % 1);
            return <Particle key={`c${i}`} x={px} y={py} r={3} color={HUE[3]} />;
          })}
          {Array.from({ length: 3 }, (_, i) => {
            const [px, py] = bridgeAt(1 - ((t * 0.1 + i / 3 + 0.16) % 1));
            return <Particle key={`a${i}`} x={px} y={py} r={3} color={HUE.soft} />;
          })}
          <FigText x={Vx} y={beakTop - 58} anchor="middle" size="note" tone="soft">
            salt bridge
          </FigText>

          {/* half-cells: anode left, cathode right */}
          {halfCell(Lx, anode.metal, aMetal, anode.conc, 'anode')}
          {halfCell(Rx, cathode.metal, cMetal, cathode.conc, 'cathode')}

          {/* wire, with electrons streaming anode → cathode */}
          <Track points={path.slice(0, 3)} color={HUE.metal} weight="edge" dashed={false} />
          <Track points={path.slice(3)} color={HUE.metal} weight="edge" dashed={false} />
          {Array.from({ length: 9 }, (_, i) => {
            const [px, py] = posAt((t * 0.35 + i / 9) % 1);
            return <Particle key={i} x={px} y={py} r={3.5} color={HUE[2]} />;
          })}
          <Arrow
            x1={Lx + 26}
            y1={wireY - 14}
            x2={Vx - Vr - 16}
            y2={wireY - 14}
            color={HUE[2]}
            head={7}
            label="e⁻"
          />
          <Arrow
            x1={Vx + Vr + 16}
            y1={wireY - 14}
            x2={Rx - 26}
            y2={wireY - 14}
            color={HUE[2]}
            head={7}
            label="e⁻"
          />

          {/* voltmeter: a dial whose needle follows the Nernst EMF */}
          <circle cx={Vx} cy={Vy} r={Vr} fill={HUE.paper} stroke={HUE.ink} strokeWidth={STROKE.edge} />
          <path
            d={`M ${a0x} ${a0y} A ${dialR} ${dialR} 0 0 1 ${a1x} ${a1y}`}
            fill="none"
            stroke={HUE.soft}
            strokeWidth={STROKE.hair}
          />
          {[0, 0.5, 1].map((f) => {
            const [tx, ty] = dialPt(f, dialR);
            const [ux, uy] = dialPt(f, dialR - 4);
            return (
              <line key={f} x1={tx} y1={ty} x2={ux} y2={uy} stroke={HUE.soft} strokeWidth={STROKE.hair} />
            );
          })}
          <line
            x1={Vx}
            y1={Vy + 4}
            x2={nx}
            y2={ny}
            stroke={HUE.hot}
            strokeWidth={STROKE.line}
            strokeLinecap="round"
          />
          <Ball cx={Vx} cy={Vy + 4} r={3} color={HUE.ink} />
          <FigText
            className="chem-svg-number"
            x={Vx}
            y={Vy + 25}
            anchor="middle"
            tone={E > 0 ? 'good' : 'hot'}
          >
            {E.toFixed(2)} V
          </FigText>

        </Figure>
      </SceneViewport>
    </PlayWrap>
  );

  const sameMetal = mA === mB;
  const aside = (
    <>
      <Readout
        tone={E > 0 ? 'result' : 'info'}
        value={<>E = {E.toFixed(3)} V</>}
        sub={
          <>
            E°cell {E0cell.toFixed(2)} V · n = {n} · Q ={' '}
            {Q < 0.01 || Q > 99 ? Q.toExponential(1) : Q.toFixed(2)}
          </>
        }
      />
      <div className="chem-explanation">
        <Tex tex={'E = E^\\circ_{cell} - \\dfrac{RT}{nF}\\ln Q'} block />
        <span>
          <strong data-tone="danger">{anode.metal}</strong> is the anode (oxidised, loses e⁻);{' '}
          <strong data-tone="good">{cathode.metal}</strong> is the cathode (reduced).{' '}
          {sameMetal ? (
            <>
              Same metal both sides ⇒ E°cell = 0, this is a <strong>concentration cell</strong>, driven only
              by the concentration difference.
            </>
          ) : (
            <>Diluting the cathode ion raises Q and lowers E; concentrating it raises E.</>
          )}
        </span>
      </div>
    </>
  );

  const picker = (label: string, val: string, set: (m: string) => void): ReactNode => (
    <ActivitySelect
      ariaLabel={label}
      value={val}
      onChange={set}
      options={ORDER.map((m) => ({ value: m, label: m }))}
    />
  );
  const controls = (
    <>
      <div>
        <Field label="electrode 1">{picker('electrode 1', mA, setMA)}</Field>
        <Field label={`[${METALS[mA]!.ion}]`} value={`${cA.toFixed(2)} M`}>
          <Slider
            value={cA}
            min={0.001}
            max={2}
            step={0.01}
            onChange={setCA}
            ariaLabel="electrode 1 ion concentration"
          />
        </Field>
      </div>
      <div>
        <Field label="electrode 2">{picker('electrode 2', mB, setMB)}</Field>
        <Field label={`[${METALS[mB]!.ion}]`} value={`${cB.toFixed(2)} M`}>
          <Slider
            value={cB}
            min={0.001}
            max={2}
            step={0.01}
            onChange={setCB}
            ariaLabel="electrode 2 ion concentration"
          />
        </Field>
      </div>
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtimeActivity}
      activityId="electrochem"
      eyebrow="Electrochemistry"
      title={title}
      description={prompt}
      status={
        <>
          <span>
            {anode.metal} → {cathode.metal}
          </span>
          <span>{E.toFixed(3)} V</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        <>
          Electrons leave the {anode.metal} anode and reach the {cathode.metal} cathode; concentration changes
          Q and therefore the measured EMF.
        </>
      }
      transcript={
        <p>
          {anode.metal} is the anode and {cathode.metal} is the cathode. Cell voltage is {E.toFixed(3)} volts;
          electrons flow anode to cathode.
        </p>
      }
    >
      {figure}
    </AuthoredActivityRuntime>
  );
}
