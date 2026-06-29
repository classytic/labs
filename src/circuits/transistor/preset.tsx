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
import { CellGlyph, BulbGlyph, MosfetGlyph, Wire, FlowDots, Tag } from '../../kit/electronics.js';
import { useReducedMotion } from '../../kit/anim.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { Slider } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';

const PREDICT_Q: ChallengeQuestion[] = [
  {
    id: 'on',
    prompt: 'A MOSFET conducts only when the gate voltage exceeds its threshold Vₜₕ. With the gate held BELOW Vₜₕ, is the transistor ON or OFF?',
    choices: [
      { value: 'on', label: 'ON (lamp lit, drain current flows)' },
      { value: 'off', label: 'OFF (lamp dark, no drain current)' },
    ],
    answer: 'off',
    explain: 'Below threshold the channel never forms, so no drain current flows and the lamp stays dark. The transistor only turns ON once the gate climbs past Vₜₕ, opening a much larger drain current.',
  },
];

export interface TransistorProps {
  supply?: number;
  vth?: number;
  loadK?: number;
  /** which panels to show: the schematic, the transfer graph, or both (default). */
  show?: 'both' | 'circuit' | 'graph';
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const K = 0.02;
const C_OK = 'var(--stage-good)';
const C_BAD = 'var(--stage-danger, #e03131)';

// schematic layout (pixel space)
const W = 520, H = 210, xL = 55, xR = 430, yT = 48, yB = 172, HALF = 28;
const CELL_X = 120, LAMP_X = 250;
const MCX = xR - 9, MCY = (yT + yB) / 2, MHALF = (yB - yT) / 2;
const GATE_TERM = MCX - 13 - 24;
const LOOP: [number, number][] = [[xL, yT], [xR, yT], [xR, yB], [xL, yB], [xL, yT]];

export function TransistorLab({
  supply = 5, vth = 2, loadK = 1, show = 'both',
  title = 'The transistor: a small input controls a big current',
  prompt = 'Turn the gate voltage. Below the threshold the channel is shut and the lamp is dark; past it, the gate opens a much larger drain current.',
  ask, activity = 'transistor',
}: TransistorProps = {}): ReactNode {
  const [Vg, setVg] = useState(3);
  const [Rk, setRk] = useState(loadK);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();
  const ch = useChallenge(PREDICT_Q);
  useCheckpoint({ solved: ch.allCorrect, activity: `${activity}:predict` });

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
  const on = Id > 0.05;
  const brightness = Math.max(0, Math.min(1, Id / maxId));

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * (0.1 + 0.4 * brightness)) % 1), { running: on && !reduce });

  const scene = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`NMOS circuit, ${on ? 'on, lamp lit' : 'off, lamp dark'}`}>
        <Wire points={LOOP} live={on} />
        {on && <FlowDots points={LOOP} phase={phase} />}
        <CellGlyph cx={CELL_X} cy={yT} half={HALF} live={on} label={`${supply} V`} />
        <BulbGlyph cx={LAMP_X} cy={yT} half={HALF} live={on} brightness={brightness} label="lamp" />
        <MosfetGlyph cx={MCX} cy={MCY} half={MHALF} on={on} live={on} />
        {/* gate drive: a lead + the controlling voltage label */}
        <line x1={GATE_TERM - 48} y1={MCY} x2={GATE_TERM} y2={MCY} stroke="var(--stage-wire)" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={GATE_TERM - 48} cy={MCY} r={3} fill="var(--stage-metal)" />
        <Tag x={GATE_TERM - 52} y={MCY - 8} text="gate" color="var(--stage-fg)" size={11} weight={600} anchor="end" />
        <Tag x={GATE_TERM - 52} y={MCY + 14} text={`${Vg.toFixed(1)} V`} color={on ? C_OK : C_BAD} size={11} weight={700} anchor="end" />
      </svg>
    </div>
  );

  // transfer curve Id vs gate, swept through the engine
  const pts: { x: number; y: number }[] = [];
  for (let vg = 0; vg <= 5.0001; vg += 0.1) pts.push({ x: vg, y: (solveDC(mk(vg)).current['q'] ?? 0) * 1000 });
  const gview = { xMin: 0, xMax: 5, yMin: 0, yMax: Math.max(2, Math.ceil(maxId * 1.1)) };
  const graph = (
    <CoordPlane view={gview} height={150} preserveAspect={false} step={1} ariaLabel="NMOS transfer curve">
      <Segment from={{ x: vth, y: 0 }} to={{ x: vth, y: gview.yMax }} color="var(--stage-muted)" weight={1} dashed />
      <Label x={vth} y={gview.yMax} text={`Vₜₕ = ${vth} V`} color="var(--stage-muted)" size={10} dy={-4} dx={4} anchor="start" />
      <Polyline points={pts} color="var(--stage-accent)" weight={2.5} />
      <Dot x={Vg} y={Math.max(0, Math.min(gview.yMax, Id))} r={5} color={on ? C_OK : C_BAD} />
      <Label x={5} y={gview.yMax * 0.95} text="drain current (mA) vs gate (V)" color="var(--stage-muted)" size={10} anchor="end" />
    </CoordPlane>
  );

  const figure = show === 'circuit' ? scene : show === 'graph' ? graph
    : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{scene}{graph}</div>;

  const controls = (
    <ControlBar>
      <Field label="gate voltage" value={`${Vg.toFixed(1)} V`}><Slider value={Vg} min={0} max={5} step={0.1} onChange={setVg} ariaLabel="gate voltage" /></Field>
      <Field label="load R" value={`${Rk.toFixed(1)} kΩ`}><Slider value={Rk} min={0.5} max={5} step={0.1} onChange={setRk} ariaLabel="load resistance" /></Field>
    </ControlBar>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={on ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {on ? `✓ ON, lamp ${Math.round(brightness * 100)}% bright` : '✗ OFF, gate below threshold, lamp dark'}
      </div>
      <Callout tone="result">
        <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          <span>gate V<sub>gs</sub> = <strong>{Vg.toFixed(1)} V</strong> (threshold {vth} V)</span>
          <span>drain current = <strong>{Math.abs(Id) < 0.001 ? '≈ 0' : Id.toFixed(2) + ' mA'}</strong></span>
          <span>drain voltage = <strong>{Vdrain.toFixed(2)} V</strong></span>
          <span style={{ color: 'var(--stage-muted)' }}>a small gate voltage steers a much larger drain current, switch or amplifier</span>
        </div>
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
