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
import { CellGlyph, DiodeGlyph, BulbGlyph, Wire, FlowDots } from '../../kit/electronics.js';
import { useReducedMotion } from '../../kit/anim.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';

export interface DiodeProps {
  volts?: number;
  resistanceK?: number;
  /** which panels to show: the schematic, the I-V graph, or both (default). */
  show?: 'both' | 'circuit' | 'graph';
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const VT = 0.025852, IS = 1e-12;
const C_OK = 'var(--stage-good)';
const C_BAD = 'var(--stage-danger, #e03131)';

// schematic layout (pixel space), a rectangular loop with devices on the top wire
const W = 520, H = 188, xL = 45, xR = 475, yT = 56, yB = 150, HALF = 28;
const CELL_X = 110, DIODE_X = 250, BULB_X = 400;
const LOOP: [number, number][] = [[xL, yT], [xR, yT], [xR, yB], [xL, yB], [xL, yT]];

export function DiodeLab({
  volts = 2, resistanceK = 1, show = 'both',
  title = 'The diode: a one-way valve',
  prompt = 'The battery pushes current around the loop. Forward, the valve opens and the lamp lights; reverse it and the flow is blocked.',
  ask, activity = 'diode',
}: DiodeProps = {}): ReactNode {
  const [Vs, setVs] = useState(volts);
  const [Rk, setRk] = useState(resistanceK);
  const [reversed, setReversed] = useState(false);
  const [phase, setPhase] = useState(0);
  const reduce = useReducedMotion();

  const R = Rk * 1000;
  const elems: Elem[] = [
    { kind: 'V', n1: 1, n2: 0, value: Vs },
    { kind: 'R', n1: 1, n2: 2, value: R },
    reversed ? { kind: 'D', n1: 0, n2: 2, value: 0, id: 'd' } : { kind: 'D', n1: 2, n2: 0, value: 0, id: 'd' },
  ];
  const sol = solveDC(elems);
  const V2 = sol.nodeV[2] ?? 0;
  const Vd = reversed ? -V2 : V2;
  const Ima = (sol.current['d'] ?? 0) * 1000;
  const conducting = Ima > 0.05;
  const brightness = Math.max(0, Math.min(1, Ima / ((Vs / R) * 1000 || 1)));

  useFrameLoop((f) => setPhase((p) => (p + (f.dtMs / 1000) * (0.1 + 0.4 * brightness)) % 1), { running: conducting && !reduce });

  const scene = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Diode circuit, ${conducting ? 'conducting, lamp lit' : 'blocked, lamp dark'}`}>
        <Wire points={LOOP} live={conducting} />
        {conducting && <FlowDots points={LOOP} phase={phase} />}
        <CellGlyph cx={CELL_X} cy={yT} half={HALF} live={conducting} label={`${Vs} V`} />
        {/* the diode symbol; mirror it when wired in reverse so the triangle points back */}
        <g transform={reversed ? `translate(${2 * DIODE_X} 0) scale(-1 1)` : undefined}>
          <DiodeGlyph cx={DIODE_X} cy={yT} half={HALF} live={conducting} conducting={conducting} label={reversed ? 'reverse' : 'forward'} />
        </g>
        <BulbGlyph cx={BULB_X} cy={yT} half={HALF} live={conducting} brightness={brightness} label="lamp" />
      </svg>
    </div>
  );

  const ivCurve = (vd: number): number => IS * (Math.exp(Math.min(vd / VT, 80)) - 1) * 1000;
  const graph = (
    <CoordPlane view={{ xMin: -0.7, xMax: 0.75, yMin: -1.5, yMax: 10 }} height={160} preserveAspect={false} ariaLabel="Diode I-V curve">
      <Plot.OfX y={ivCurve} domain={[-0.7, 0.72]} color="var(--stage-accent)" weight={2.5} />
      <Dot x={Math.max(-0.7, Math.min(0.72, Vd))} y={Math.max(-1.5, Math.min(10, ivCurve(Vd)))} r={5} color={conducting ? C_OK : C_BAD} />
      <Segment from={{ x: 0.6, y: 0 }} to={{ x: 0.6, y: 10 }} color="var(--stage-muted)" weight={1} dashed />
      <Label x={0.72} y={9.3} text="I (mA) vs V across the diode" color="var(--stage-muted)" size={10} anchor="end" />
    </CoordPlane>
  );

  const figure = show === 'circuit' ? scene : show === 'graph' ? graph
    : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{scene}{graph}</div>;

  const controls = (
    <ControlBar>
      <Field label="orientation">
        <span className="lab-field-row">
          <Chip selected={!reversed} onClick={() => setReversed(false)}>forward ▶|</Chip>
          <Chip selected={reversed} onClick={() => setReversed(true)}>reverse |◀</Chip>
        </span>
      </Field>
      <Field label="battery" value={`${Vs} V`}><Slider value={Vs} min={0} max={5} step={0.1} onChange={setVs} ariaLabel="battery voltage" /></Field>
      <Field label="R" value={`${Rk} kΩ`}><Slider value={Rk} min={0.2} max={10} step={0.1} onChange={setRk} ariaLabel="series resistance" /></Field>
    </ControlBar>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={conducting ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {conducting ? '✓ valve OPEN, current flows, lamp lit' : '✗ valve SHUT, blocked, lamp dark'}
      </div>
      <Callout tone="result">
        <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          <span>V across diode = <strong>{Vd.toFixed(2)} V</strong></span>
          <span>current = <strong>{Math.abs(Ima) < 0.001 ? '≈ 0' : Ima.toFixed(2) + ' mA'}</strong></span>
          <span style={{ color: 'var(--stage-muted)' }}>forward drop sits near the 0.6 to 0.7 V knee no matter the current</span>
        </div>
      </Callout>
    </div>
  );

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;

  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{figure}</LabFrame>;
}
