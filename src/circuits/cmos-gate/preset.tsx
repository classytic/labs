'use client';

/**
 * CmosInverterLab — the moment a pair of transistors BECOMES a logic gate. A PMOS
 * pull-up (to VDD) and an NMOS pull-down (to GND) share one input A and one output
 * Y. Drag the input: when A is LOW the PMOS conducts and pulls Y HIGH; when A is
 * HIGH the NMOS conducts and pulls Y LOW. The output is the inverse of the input —
 * a NOT gate — and the output voltage is SOLVED by the circuit engine (so the
 * transfer curve shows the real, sharp analog-to-digital transition near VDD/2).
 * Exactly one network conducts at the rails, which is why CMOS draws ~no static
 * power. This is the bridge from the silicon to the truth table.
 */

import { useState, type ReactNode } from 'react';
import { Polyline, Dot, Segment, Label, useFrameLoop } from '@classytic/stage';
import { solveDC, type Elem } from '@classytic/stage/circuit';
import { CoordPlane } from '../../kit/coords.js';
import { MosfetGlyph, ResistorGlyph, Wire, FlowDots, Tag } from '../../kit/electronics.js';
import { useReducedMotion } from '../../kit/anim.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';

export interface CmosInverterProps {
  vdd?: number;
  vth?: number;
  show?: 'both' | 'circuit' | 'graph';
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const C_OK = 'var(--stage-good)';
const C_HI = 'var(--stage-good)';
const C_LO = 'var(--stage-danger)';
const K = 0.5;

// Predict-first: commit to the inverter's output before dragging the input.
const PREDICT_Q: ChallengeQuestion[] = [
  {
    id: 'invert-high',
    prompt: 'This is a CMOS inverter (NOT gate). What is the output Y when the input A is HIGH (1)?',
    choices: [{ value: '0', label: 'Y = 0 (LOW)' }, { value: '1', label: 'Y = 1 (HIGH)' }],
    answer: '0',
    explain: 'A HIGH input turns the NMOS pull-down ON and the PMOS pull-up OFF, so Y is pulled to GND: Y = 0. The output is the inverse of the input.',
  },
];

// schematic layout (pixel space)
const W = 460, H = 250;
const STK = 300;                      // the PMOS/NMOS drain-source stack x
const PCX = STK - 9, NCX = STK - 9;   // glyph centre (terminals sit at cx+9 = STK)
const PCY = 82, NCY = 166, MHALF = 36;
const VDD_Y = 30, GND_Y = 220, Y_Y = (PCY + MHALF + NCY - MHALF) / 2;
const GATE_X = PCX - 13 - 24;         // gate terminal x

export function CmosInverterLab({
  vdd = 5, vth = 2, show = 'both',
  title = 'CMOS inverter: two transistors become a NOT gate',
  prompt = 'Drag the input A. Low input: the top (PMOS) opens and pulls the output HIGH; high input: the bottom (NMOS) opens and pulls it LOW. The output is the inverse, a NOT gate.',
  ask, activity = 'cmos-inverter',
}: CmosInverterProps = {}): ReactNode {
  const [A, setA] = useState(0);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();
  const ch = useChallenge(PREDICT_Q);
  useCheckpoint({ solved: ch.allCorrect, activity: 'cmos-gate:predict' });

  const mk = (a: number): Elem[] => [
    { kind: 'V', n1: 1, n2: 0, value: vdd },                       // VDD
    { kind: 'V', n1: 3, n2: 0, value: a },                         // input A
    { kind: 'M', pmos: true, n1: 2, n2: 1, n3: 3, value: 0, vth, k: K }, // PMOS: drain Y, source VDD
    { kind: 'M', n1: 2, n2: 0, n3: 3, value: 0, vth, k: K },             // NMOS: drain Y, source GND
  ];
  const Y = solveDC(mk(A)).nodeV[2] ?? 0;
  const pmosOn = (vdd - A) > vth;     // gate low vs source → PMOS conducts
  const nmosOn = A > vth;
  const aHi = A > vdd / 2, yHi = Y > vdd / 2;

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * 0.4) % 1), { running: (pmosOn || nmosOn) && !reduce });

  // wires: VDD rail, GND rail, the gate-input bus, the output line
  const pTop: [number, number] = [STK, PCY - MHALF], pBot: [number, number] = [STK, PCY + MHALF];
  const nTop: [number, number] = [STK, NCY - MHALF], nBot: [number, number] = [STK, NCY + MHALF];
  const vddRail: [number, number][] = [[200, VDD_Y], [360, VDD_Y]];
  const gndRail: [number, number][] = [[200, GND_Y], [360, GND_Y]];
  const pullUpWire: [number, number][] = [[STK, VDD_Y], pTop];
  const pullDnWire: [number, number][] = [nBot, [STK, GND_Y]];
  const outWire: [number, number][] = [pBot, [STK, Y_Y], [430, Y_Y]];
  const gateBus: [number, number][] = [[GATE_X, PCY], [220, PCY], [220, NCY], [GATE_X, NCY]];
  const inWire: [number, number][] = [[110, Y_Y], [220, Y_Y]];

  const scene = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`CMOS inverter, input ${aHi ? 'high' : 'low'}, output ${yHi ? 'high' : 'low'}`}>
        <Wire points={vddRail} live={pmosOn} />
        <Wire points={gndRail} live={nmosOn} />
        <Wire points={pullUpWire} live={pmosOn} />
        <Wire points={pullDnWire} live={nmosOn} />
        <Wire points={outWire} live />
        <Wire points={gateBus} />
        <Wire points={inWire} />
        {pmosOn && <FlowDots points={[...vddRail.slice(1), pTop, pBot, [STK, Y_Y]] as [number, number][]} phase={phase} />}
        {nmosOn && <FlowDots points={[[STK, Y_Y], nTop, nBot, [STK, GND_Y]] as [number, number][]} phase={phase} />}
        <MosfetGlyph cx={PCX} cy={PCY} half={MHALF} pmos on={pmosOn} live={pmosOn} label="PMOS" />
        <MosfetGlyph cx={NCX} cy={NCY} half={MHALF} on={nmosOn} live={nmosOn} label="NMOS" />
        <Tag x={365} y={VDD_Y + 4} text={`VDD ${vdd}V`} color="var(--stage-fg)" size={12} weight={700} anchor="start" />
        <Tag x={365} y={GND_Y + 4} text="GND" color="var(--stage-muted)" size={12} weight={700} anchor="start" />
        <Tag x={104} y={Y_Y - 8} text="A" color="var(--stage-fg)" size={12} weight={700} anchor="end" />
        <Tag x={104} y={Y_Y + 10} text={aHi ? '1' : '0'} color={aHi ? C_HI : C_LO} size={12} weight={700} anchor="end" />
        <circle cx={434} cy={Y_Y} r={4} fill={yHi ? C_HI : C_LO} />
        <Tag x={442} y={Y_Y - 8} text="Y" color="var(--stage-fg)" size={12} weight={700} anchor="start" />
        <Tag x={442} y={Y_Y + 10} text={yHi ? '1' : '0'} color={yHi ? C_HI : C_LO} size={12} weight={700} anchor="start" />
      </svg>
    </div>
  );

  // analog transfer curve Y vs A (the sharp CMOS transition), swept through the engine
  const pts: { x: number; y: number }[] = [];
  for (let a = 0; a <= vdd + 1e-6; a += vdd / 60) pts.push({ x: a, y: solveDC(mk(a)).nodeV[2] ?? 0 });
  const gview = { xMin: 0, xMax: vdd, yMin: 0, yMax: vdd };
  const graph = (
    <CoordPlane view={gview} height={150} preserveAspect={false} step={1} ariaLabel="CMOS transfer curve">
      <Polyline points={pts} color="var(--stage-accent)" weight={2.5} />
      <Dot x={A} y={Math.max(0, Math.min(vdd, Y))} r={5} color={yHi ? C_HI : C_LO} />
      <Label x={vdd} y={vdd * 0.96} text="output Y (V) vs input A (V)" color="var(--stage-muted)" size={10} anchor="end" />
    </CoordPlane>
  );

  const figure = show === 'circuit' ? scene : show === 'graph' ? graph
    : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{scene}{graph}</div>;

  const controls = (
    <ControlBar>
      <Field label="input A" value={`${A.toFixed(1)} V`}><Slider value={A} min={0} max={vdd} step={0.1} onChange={setA} ariaLabel="input voltage" /></Field>
      <Field label="quick set">
        <span className="lab-field-row">
          <Chip selected={A === 0} onClick={() => setA(0)}>A = 0</Chip>
          <Chip selected={A === vdd} onClick={() => setA(vdd)}>A = 1</Chip>
        </span>
      </Field>
    </ControlBar>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={pmosOn !== nmosOn ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {pmosOn && !nmosOn ? '✓ PMOS conducts, output pulled HIGH' : nmosOn && !pmosOn ? '✓ NMOS conducts, output pulled LOW' : 'both partly on (the transition)'}
      </div>
      <Callout tone="result">
        <table style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', borderCollapse: 'collapse' }}>
          <thead><tr><th style={{ textAlign: 'left', paddingRight: 18 }}>A</th><th style={{ textAlign: 'left' }}>Y = A′</th></tr></thead>
          <tbody>
            <tr style={{ fontWeight: aHi ? 400 : 700 }}><td>0</td><td>1</td></tr>
            <tr style={{ fontWeight: aHi ? 700 : 400 }}><td>1</td><td>0</td></tr>
          </tbody>
        </table>
        <div style={{ marginTop: 6, color: 'var(--stage-muted)', fontSize: 12 }}>output = {Y.toFixed(2)} V ({yHi ? 'logic 1' : 'logic 0'})</div>
      </Callout>
    </div>
  );

  const footer = (
    <>
      <ChallengeCard questions={PREDICT_Q} state={ch} title="Predict first" />
      {ask ? <LabAsk ask={ask} activity={activity} /> : null}
    </>
  );

  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{figure}</LabFrame>;
}

// ── RNmosNotLab — a NOT gate from ONE transistor + a pull-up resistor. The first bridge from a
//    transistor to a logic gate: input HIGH turns the NMOS on and pulls the output LOW; input LOW
//    leaves it off so the resistor pulls the output HIGH. Solved by the real engine. The catch:
//    while the output is LOW a steady current wastes power in the resistor (P shown, on the failure
//    engine) — which is exactly why CMOS (two transistors, no static power) replaced it. ──

export interface RNmosNotProps {
  vdd?: number;
  vth?: number;
  /** pull-up resistance (Ω). */
  rpull?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const RN_W = 460, RN_H = 250;

export function RNmosNotLab({
  vdd = 5, vth = 2, rpull = 2000,
  title = 'A NOT gate from ONE transistor',
  prompt = 'Flip the input. HIGH turns the transistor on and pulls the output LOW; LOW leaves it off, so the resistor pulls the output HIGH. One transistor inverts — that is a NOT gate.',
  ask, activity = 'rnmos-not',
}: RNmosNotProps = {}): ReactNode {
  const [A, setA] = useState(0);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();
  const ch = useChallenge(RN_PREDICT_Q);
  useCheckpoint({ solved: ch.allCorrect, activity: 'rnmos-not:predict' });

  const mk = (a: number): Elem[] => [
    { kind: 'V', n1: 1, n2: 0, value: vdd },                       // VDD (node 1)
    { kind: 'V', n1: 3, n2: 0, value: a },                         // input A → gate (node 3)
    { kind: 'R', n1: 1, n2: 2, value: rpull },                     // pull-up resistor VDD → Y (node 2)
    { kind: 'M', n1: 2, n2: 0, n3: 3, value: 0, vth, k: K },       // NMOS: drain Y, source GND, gate A
  ];
  const Va = A ? vdd : 0;
  const Y = solveDC(mk(Va)).nodeV[2] ?? 0;
  const nmosOn = Va > vth;
  const yHi = Y > vdd / 2;
  const Iload = (vdd - Y) / rpull;          // current through the pull-up resistor
  const Pres = Math.max(0, Iload * (vdd - Y)); // power wasted in the resistor

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * 0.4) % 1), { running: nmosOn && !reduce });

  // layout: VDD rail (top) → pull-up R → Y node → NMOS → GND rail (bottom); input A on the left.
  const SX = 250, VDD_Y = 30, GND_Y = 220, Y_Y = 125;
  const RCY = 72, NCY = 168, NHALF = 32;
  const vddRail: [number, number][] = [[170, VDD_Y], [330, VDD_Y]];
  const gndRail: [number, number][] = [[170, GND_Y], [330, GND_Y]];
  const rTopWire: [number, number][] = [[SX, VDD_Y], [SX, RCY - 30]];
  const rBotWire: [number, number][] = [[SX, RCY + 30], [SX, Y_Y]];
  const yToDrain: [number, number][] = [[SX, Y_Y], [SX, NCY - NHALF]];
  const srcToGnd: [number, number][] = [[SX, NCY + NHALF], [SX, GND_Y]];
  const outWire: [number, number][] = [[SX, Y_Y], [392, Y_Y]];
  const gateWire: [number, number][] = [[96, NCY], [SX - 37, NCY]];

  const scene = (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', maxWidth: RN_W, margin: '0 auto' }}>
      <svg viewBox={`0 0 ${RN_W} ${RN_H}`} width="100%" role="img" aria-label={`resistor-NMOS NOT gate, input ${A ? 'high' : 'low'}, output ${yHi ? 'high' : 'low'}`}>
        <Wire points={vddRail} live={nmosOn} />
        <Wire points={gndRail} live={nmosOn} />
        <Wire points={rTopWire} live={nmosOn} />
        <Wire points={rBotWire} live={nmosOn} />
        <Wire points={yToDrain} live={nmosOn} />
        <Wire points={srcToGnd} live={nmosOn} />
        <Wire points={outWire} live={yHi} />
        <Wire points={gateWire} />
        {nmosOn && <FlowDots points={[[SX, VDD_Y], [SX, RCY], [SX, Y_Y], [SX, NCY], [SX, GND_Y]] as [number, number][]} phase={phase} />}
        <g transform={`rotate(90 ${SX} ${RCY})`}><ResistorGlyph cx={SX} cy={RCY} half={30} live={nmosOn} /></g>
        <MosfetGlyph cx={SX} cy={NCY} half={NHALF} on={nmosOn} live={nmosOn} label="NMOS" />
        <Tag x={335} y={VDD_Y + 4} text={`VDD ${vdd}V`} color="var(--stage-fg)" size={12} weight={700} anchor="start" />
        <Tag x={335} y={GND_Y + 4} text="GND" color="var(--stage-muted)" size={12} weight={700} anchor="start" />
        <Tag x={90} y={NCY - 8} text="A (in)" color="var(--stage-fg)" size={12} weight={700} anchor="end" />
        <Tag x={90} y={NCY + 11} text={A ? '1' : '0'} color={A ? C_HI : C_LO} size={13} weight={800} anchor="end" />
        <circle cx={396} cy={Y_Y} r={4.5} fill={yHi ? C_HI : C_LO} />
        <Tag x={404} y={Y_Y - 8} text="Y (out)" color="var(--stage-fg)" size={12} weight={700} anchor="start" />
        <Tag x={404} y={Y_Y + 11} text={yHi ? '1' : '0'} color={yHi ? C_HI : C_LO} size={13} weight={800} anchor="start" />
        <Tag x={SX + 22} y={RCY + 4} text={`${(rpull / 1000).toFixed(rpull % 1000 ? 1 : 0)}kΩ`} color="var(--stage-muted)" size={11} weight={700} anchor="start" />
      </svg>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label="input A">
        <span className="lab-field-row">
          <Chip selected={A === 0} onClick={() => setA(0)}>A = 0</Chip>
          <Chip selected={A === 1} onClick={() => setA(1)}>A = 1</Chip>
        </span>
      </Field>
    </ControlBar>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={yHi !== !!A ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {A ? 'transistor ON → output pulled LOW' : 'transistor OFF → resistor pulls output HIGH'}
      </div>
      <Callout tone="result">
        <table style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', borderCollapse: 'collapse' }}>
          <thead><tr><th style={{ textAlign: 'left', paddingRight: 18 }}>A</th><th style={{ textAlign: 'left' }}>Y = A′</th></tr></thead>
          <tbody>
            <tr style={{ fontWeight: A ? 400 : 700 }}><td>0</td><td>1</td></tr>
            <tr style={{ fontWeight: A ? 700 : 400 }}><td>1</td><td>0</td></tr>
          </tbody>
        </table>
        <div style={{ marginTop: 6, color: 'var(--stage-muted)', fontSize: 12 }}>output = {Y.toFixed(2)} V ({yHi ? 'logic 1' : 'logic 0'})</div>
      </Callout>
      <Callout tone="info">
        <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          <strong>The catch:</strong> while the output is LOW, {Pres > 1e-4 ? `${(Pres * 1000).toFixed(1)} mW` : '~0 mW'} of steady current wastes power in the resistor. CMOS replaces the resistor with a second transistor so only one path ever conducts — that is why chips use CMOS.
        </div>
      </Callout>
    </div>
  );

  const footer = (
    <>
      <ChallengeCard questions={RN_PREDICT_Q} state={ch} title="Predict first" />
      {ask ? <LabAsk ask={ask} activity={activity} /> : null}
    </>
  );

  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{scene}</LabFrame>;
}

const RN_PREDICT_Q: ChallengeQuestion[] = [
  {
    id: 'rnmos-high',
    prompt: 'Input A is HIGH (1). The NMOS turns on and connects the output to ground. What is the output Y?',
    choices: [{ value: '0', label: 'Y = 0 (LOW)' }, { value: '1', label: 'Y = 1 (HIGH)' }],
    answer: '0',
    explain: 'A HIGH input turns the transistor ON, so it pulls Y down to ground: Y = 0. One transistor + a pull-up resistor inverts the input — a NOT gate.',
  },
];

// ── CmosNandLab — FOUR transistors become a 2-input NAND, the universal gate. A parallel pair of
//    PMOS pulls the output HIGH unless BOTH inputs are HIGH; only then does the series pair of
//    NMOS pull it to ground. Engine-solved. The payoff: NAND alone builds every other gate (and a
//    whole CPU), so this is the atom of all digital logic. ──

export interface CmosNandProps {
  vdd?: number;
  vth?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const NAND_W = 480, NAND_H = 300;

export function CmosNandLab({
  vdd = 5, vth = 2,
  title = 'NAND from four transistors: the universal gate',
  prompt = 'Toggle A and B. The top PMOS pair pulls the output HIGH unless BOTH inputs are HIGH; only then does the bottom NMOS pair connect it to ground. That is a NAND, and a NAND can build every other gate.',
  ask, activity = 'cmos-nand',
}: CmosNandProps = {}): ReactNode {
  const [A, setA] = useState(0);
  const [B, setB] = useState(0);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();
  const ch = useChallenge(NAND_PREDICT_Q);
  useCheckpoint({ solved: ch.allCorrect, activity: 'cmos-nand:predict' });

  const mk = (a: number, b: number): Elem[] => [
    { kind: 'V', n1: 1, n2: 0, value: vdd },                        // VDD (node 1)
    { kind: 'V', n1: 3, n2: 0, value: a },                          // A (node 3)
    { kind: 'V', n1: 4, n2: 0, value: b },                          // B (node 4)
    { kind: 'M', pmos: true, n1: 2, n2: 1, n3: 3, value: 0, vth, k: K }, // PMOS_A: d=Y(2) s=VDD(1) g=A
    { kind: 'M', pmos: true, n1: 2, n2: 1, n3: 4, value: 0, vth, k: K }, // PMOS_B: d=Y s=VDD g=B  (parallel)
    { kind: 'M', n1: 2, n2: 5, n3: 3, value: 0, vth, k: K },             // NMOS_A: d=Y(2) s=mid(5) g=A
    { kind: 'M', n1: 5, n2: 0, n3: 4, value: 0, vth, k: K },             // NMOS_B: d=mid(5) s=GND(0) g=B (series)
  ];
  const Va = A ? vdd : 0, Vb = B ? vdd : 0;
  const Y = solveDC(mk(Va, Vb)).nodeV[2] ?? 0;
  const pA = vdd - Va > vth, pB = vdd - Vb > vth;   // PMOS conducts when its gate is LOW
  const nA = Va > vth, nB = Vb > vth;               // NMOS conducts when its gate is HIGH
  const pullDown = nA && nB;                         // series: needs BOTH
  const yHi = Y > vdd / 2;

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * 0.4) % 1), { running: (pA || pB || pullDown) && !reduce });

  // layout: VDD rail → parallel PMOS pair → Y bus → series NMOS pair → GND rail
  const VDD_Y = 30, GND_Y = 290, Y_Y = 145;
  const PAt = 180, PBt = 300, Nt = 240, OUTx = 440;   // terminal x's (glyph cx = term − 9)
  const wire = (a: [number, number], b: [number, number]): [number, number][] => [a, b];

  const scene = (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', maxWidth: NAND_W, margin: '0 auto' }}>
      <svg viewBox={`0 0 ${NAND_W} ${NAND_H}`} width="100%" role="img" aria-label={`CMOS NAND, A ${A}, B ${B}, output ${yHi ? 'high' : 'low'}`}>
        <Wire points={[[120, VDD_Y], [360, VDD_Y]]} live={pA || pB} />
        <Wire points={[[120, GND_Y], [360, GND_Y]]} live={pullDown} />
        <Wire points={wire([PAt, VDD_Y], [PAt, 55])} live={pA} />
        <Wire points={wire([PAt, 115], [PAt, Y_Y])} live={pA} />
        <Wire points={wire([PBt, VDD_Y], [PBt, 55])} live={pB} />
        <Wire points={wire([PBt, 115], [PBt, Y_Y])} live={pB} />
        <Wire points={[[PAt, Y_Y], [OUTx, Y_Y]]} live={yHi} />
        <Wire points={wire([Nt, Y_Y], [Nt, 160])} live={pullDown} />
        <Wire points={wire([Nt, 280], [Nt, GND_Y])} live={pullDown} />
        {pA && <FlowDots points={[[PAt, VDD_Y], [PAt, Y_Y]] as [number, number][]} phase={phase} />}
        {pB && <FlowDots points={[[PBt, VDD_Y], [PBt, Y_Y]] as [number, number][]} phase={phase} />}
        {pullDown && <FlowDots points={[[Nt, Y_Y], [Nt, GND_Y]] as [number, number][]} phase={phase} />}
        <MosfetGlyph cx={PAt - 9} cy={85} half={30} pmos on={pA} live={pA} label="A" />
        <MosfetGlyph cx={PBt - 9} cy={85} half={30} pmos on={pB} live={pB} label="B" />
        <MosfetGlyph cx={Nt - 9} cy={190} half={30} on={nA} live={pullDown} label="A" />
        <MosfetGlyph cx={Nt - 9} cy={250} half={30} on={nB} live={pullDown} label="B" />
        <Tag x={364} y={VDD_Y + 4} text={`VDD ${vdd}V`} color="var(--stage-fg)" size={12} weight={700} anchor="start" />
        <Tag x={364} y={GND_Y + 4} text="GND" color="var(--stage-muted)" size={12} weight={700} anchor="start" />
        <Tag x={92} y={66} text="PMOS pull-up" color="var(--stage-muted)" size={11} weight={700} anchor="start" />
        <Tag x={92} y={222} text="NMOS pull-down" color="var(--stage-muted)" size={11} weight={700} anchor="start" />
        <circle cx={OUTx + 4} cy={Y_Y} r={4.5} fill={yHi ? C_HI : C_LO} />
        <Tag x={OUTx + 12} y={Y_Y - 8} text="Y" color="var(--stage-fg)" size={12} weight={700} anchor="start" />
        <Tag x={OUTx + 12} y={Y_Y + 11} text={yHi ? '1' : '0'} color={yHi ? C_HI : C_LO} size={13} weight={800} anchor="start" />
      </svg>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label="input A">
        <span className="lab-field-row"><Chip selected={A === 0} onClick={() => setA(0)}>0</Chip><Chip selected={A === 1} onClick={() => setA(1)}>1</Chip></span>
      </Field>
      <Field label="input B">
        <span className="lab-field-row"><Chip selected={B === 0} onClick={() => setB(0)}>0</Chip><Chip selected={B === 1} onClick={() => setB(1)}>1</Chip></span>
      </Field>
    </ControlBar>
  );

  const rows: [number, number, number][] = [[0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 1, 0]];
  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={(pA || pB) !== pullDown ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {pullDown ? '✓ both inputs HIGH → NMOS pair pulls Y LOW' : '✓ a PMOS conducts → Y pulled HIGH'}
      </div>
      <Callout tone="result">
        <table style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', borderCollapse: 'collapse' }}>
          <thead><tr><th style={{ textAlign: 'left', paddingRight: 14 }}>A</th><th style={{ textAlign: 'left', paddingRight: 14 }}>B</th><th style={{ textAlign: 'left' }}>Y</th></tr></thead>
          <tbody>
            {rows.map(([a, b, y]) => (
              <tr key={`${a}${b}`} style={{ fontWeight: a === A && b === B ? 800 : 400, background: a === A && b === B ? 'color-mix(in oklab, var(--stage-accent) 12%, transparent)' : undefined }}>
                <td>{a}</td><td>{b}</td><td style={{ color: y ? 'var(--stage-good)' : 'var(--stage-fg)' }}>{y}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 6, color: 'var(--stage-muted)', fontSize: 12 }}>output = {Y.toFixed(2)} V ({yHi ? 'logic 1' : 'logic 0'}), so Y = (A·B)′</div>
      </Callout>
      <Callout tone="info">
        <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          <strong>NAND is universal.</strong> Tie both inputs together → a NOT. A NAND then a NOT → AND. By De Morgan, NANDs make OR too. So these four transistors are the one building block every gate, and an entire CPU, is made from.
        </div>
      </Callout>
    </div>
  );

  const footer = (
    <>
      <ChallengeCard questions={NAND_PREDICT_Q} state={ch} title="Predict first" />
      {ask ? <LabAsk ask={ask} activity={activity} /> : null}
    </>
  );

  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{scene}</LabFrame>;
}

const NAND_PREDICT_Q: ChallengeQuestion[] = [
  {
    id: 'nand-11',
    prompt: 'Both inputs are HIGH (A = 1, B = 1). Both NMOS transistors turn on, completing the path to ground. What is the output Y?',
    choices: [{ value: '0', label: 'Y = 0 (LOW)' }, { value: '1', label: 'Y = 1 (HIGH)' }],
    answer: '0',
    explain: 'With both inputs HIGH the series NMOS pair conducts and pulls Y to ground (and both PMOS turn off). Y = 0 only when A AND B are 1, which is NAND = (A·B)′.',
  },
];

// ── CmosNorLab — the De Morgan twin of NAND. Flip the networks: TWO PMOS in series pull the output
//    HIGH only when BOTH inputs are LOW; TWO NMOS in parallel pull it LOW if EITHER input is HIGH.
//    Engine-solved. NOR is the other universal gate, so NAND and NOR are the two single bricks every
//    digital circuit can be built from. ──

export interface CmosNorProps {
  vdd?: number;
  vth?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const NOR_W = 480, NOR_H = 300;

export function CmosNorLab({
  vdd = 5, vth = 2,
  title = 'NOR: the De Morgan twin of NAND',
  prompt = 'Toggle A and B. The networks are flipped from the NAND: a SERIES PMOS pair pulls the output HIGH only when BOTH inputs are LOW, and a PARALLEL NMOS pair pulls it LOW the moment EITHER input goes HIGH. NOR is the other universal gate.',
  ask, activity = 'cmos-nor',
}: CmosNorProps = {}): ReactNode {
  const [A, setA] = useState(0);
  const [B, setB] = useState(0);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();
  const ch = useChallenge(NOR_PREDICT_Q);
  useCheckpoint({ solved: ch.allCorrect, activity: 'cmos-nor:predict' });

  const mk = (a: number, b: number): Elem[] => [
    { kind: 'V', n1: 1, n2: 0, value: vdd },                        // VDD (node 1)
    { kind: 'V', n1: 3, n2: 0, value: a },                          // A (node 3)
    { kind: 'V', n1: 4, n2: 0, value: b },                          // B (node 4)
    { kind: 'M', pmos: true, n1: 5, n2: 1, n3: 3, value: 0, vth, k: K }, // PMOS_A: d=mid(5) s=VDD(1) g=A
    { kind: 'M', pmos: true, n1: 2, n2: 5, n3: 4, value: 0, vth, k: K }, // PMOS_B: d=Y(2) s=mid(5) g=B (series)
    { kind: 'M', n1: 2, n2: 0, n3: 3, value: 0, vth, k: K },             // NMOS_A: d=Y(2) s=GND g=A
    { kind: 'M', n1: 2, n2: 0, n3: 4, value: 0, vth, k: K },             // NMOS_B: d=Y(2) s=GND g=B (parallel)
  ];
  const Va = A ? vdd : 0, Vb = B ? vdd : 0;
  const Y = solveDC(mk(Va, Vb)).nodeV[2] ?? 0;
  const pA = vdd - Va > vth, pB = vdd - Vb > vth;   // PMOS conducts when its gate is LOW
  const nA = Va > vth, nB = Vb > vth;               // NMOS conducts when its gate is HIGH
  const pullUp = pA && pB;                           // series: needs BOTH low
  const yHi = Y > vdd / 2;

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * 0.4) % 1), { running: (pullUp || nA || nB) && !reduce });

  // layout: VDD rail → series PMOS pair → Y bus → parallel NMOS pair → GND rail
  const VDD_Y = 30, GND_Y = 290, Y_Y = 200;
  const Px = 240;                       // series PMOS stack terminal x
  const NAt = 180, NBt = 300, OUTx = 440;
  const wire = (a: [number, number], b: [number, number]): [number, number][] => [a, b];

  const scene = (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', maxWidth: NOR_W, margin: '0 auto' }}>
      <svg viewBox={`0 0 ${NOR_W} ${NOR_H}`} width="100%" role="img" aria-label={`CMOS NOR, A ${A}, B ${B}, output ${yHi ? 'high' : 'low'}`}>
        <Wire points={[[120, VDD_Y], [360, VDD_Y]]} live={pullUp} />
        <Wire points={[[120, GND_Y], [360, GND_Y]]} live={nA || nB} />
        <Wire points={wire([Px, VDD_Y], [Px, 55])} live={pullUp} />
        <Wire points={wire([Px, 115], [Px, 119])} live={pullUp} />
        <Wire points={wire([Px, 179], [Px, Y_Y])} live={pullUp} />
        <Wire points={[[NAt, Y_Y], [OUTx, Y_Y]]} live={yHi} />
        <Wire points={wire([NAt, Y_Y], [NAt, 210])} live={nA} />
        <Wire points={wire([NAt, 270], [NAt, GND_Y])} live={nA} />
        <Wire points={wire([NBt, Y_Y], [NBt, 210])} live={nB} />
        <Wire points={wire([NBt, 270], [NBt, GND_Y])} live={nB} />
        {pullUp && <FlowDots points={[[Px, VDD_Y], [Px, Y_Y]] as [number, number][]} phase={phase} />}
        {nA && <FlowDots points={[[NAt, Y_Y], [NAt, GND_Y]] as [number, number][]} phase={phase} />}
        {nB && <FlowDots points={[[NBt, Y_Y], [NBt, GND_Y]] as [number, number][]} phase={phase} />}
        <MosfetGlyph cx={Px - 9} cy={85} half={30} pmos on={pA} live={pullUp} label="A" />
        <MosfetGlyph cx={Px - 9} cy={149} half={30} pmos on={pB} live={pullUp} label="B" />
        <MosfetGlyph cx={NAt - 9} cy={240} half={30} on={nA} live={nA} label="A" />
        <MosfetGlyph cx={NBt - 9} cy={240} half={30} on={nB} live={nB} label="B" />
        <Tag x={364} y={VDD_Y + 4} text={`VDD ${vdd}V`} color="var(--stage-fg)" size={12} weight={700} anchor="start" />
        <Tag x={364} y={GND_Y + 4} text="GND" color="var(--stage-muted)" size={12} weight={700} anchor="start" />
        <Tag x={92} y={118} text="PMOS pull-up" color="var(--stage-muted)" size={11} weight={700} anchor="start" />
        <Tag x={92} y={244} text="NMOS pull-down" color="var(--stage-muted)" size={11} weight={700} anchor="start" />
        <circle cx={OUTx + 4} cy={Y_Y} r={4.5} fill={yHi ? C_HI : C_LO} />
        <Tag x={OUTx + 12} y={Y_Y - 8} text="Y" color="var(--stage-fg)" size={12} weight={700} anchor="start" />
        <Tag x={OUTx + 12} y={Y_Y + 11} text={yHi ? '1' : '0'} color={yHi ? C_HI : C_LO} size={13} weight={800} anchor="start" />
      </svg>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label="input A">
        <span className="lab-field-row"><Chip selected={A === 0} onClick={() => setA(0)}>0</Chip><Chip selected={A === 1} onClick={() => setA(1)}>1</Chip></span>
      </Field>
      <Field label="input B">
        <span className="lab-field-row"><Chip selected={B === 0} onClick={() => setB(0)}>0</Chip><Chip selected={B === 1} onClick={() => setB(1)}>1</Chip></span>
      </Field>
    </ControlBar>
  );

  const rows: [number, number, number][] = [[0, 0, 1], [0, 1, 0], [1, 0, 0], [1, 1, 0]];
  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={pullUp !== (nA || nB) ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {pullUp ? '✓ both inputs LOW → series PMOS pulls Y HIGH' : '✓ an NMOS conducts → Y pulled LOW'}
      </div>
      <Callout tone="result">
        <table style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', borderCollapse: 'collapse' }}>
          <thead><tr><th style={{ textAlign: 'left', paddingRight: 14 }}>A</th><th style={{ textAlign: 'left', paddingRight: 14 }}>B</th><th style={{ textAlign: 'left' }}>Y</th></tr></thead>
          <tbody>
            {rows.map(([a, b, y]) => (
              <tr key={`${a}${b}`} style={{ fontWeight: a === A && b === B ? 800 : 400, background: a === A && b === B ? 'color-mix(in oklab, var(--stage-accent) 12%, transparent)' : undefined }}>
                <td>{a}</td><td>{b}</td><td style={{ color: y ? 'var(--stage-good)' : 'var(--stage-fg)' }}>{y}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 6, color: 'var(--stage-muted)', fontSize: 12 }}>output = {Y.toFixed(2)} V ({yHi ? 'logic 1' : 'logic 0'}), so Y = (A + B)′</div>
      </Callout>
      <Callout tone="info">
        <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          <strong>NOR is universal too.</strong> Compare with the NAND: swapping series for parallel in each network turns AND-logic into OR-logic (De Morgan in silicon). NAND and NOR are the two single bricks any digital circuit, from a gate to a CPU, can be built from.
        </div>
      </Callout>
    </div>
  );

  const footer = (
    <>
      <ChallengeCard questions={NOR_PREDICT_Q} state={ch} title="Predict first" />
      {ask ? <LabAsk ask={ask} activity={activity} /> : null}
    </>
  );

  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{scene}</LabFrame>;
}

const NOR_PREDICT_Q: ChallengeQuestion[] = [
  {
    id: 'nor-00',
    prompt: 'A NOR outputs HIGH for exactly one input combination. Which one?',
    choices: [{ value: 'a', label: 'both LOW: A = 0, B = 0' }, { value: 'b', label: 'both HIGH: A = 1, B = 1' }, { value: 'c', label: 'whenever the inputs differ' }],
    answer: 'a',
    explain: 'Only when both inputs are LOW do both series PMOS conduct (and both parallel NMOS stay off), pulling Y HIGH. Any HIGH input opens an NMOS to ground, so Y = (A + B)′.',
  },
];
