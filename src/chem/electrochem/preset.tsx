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
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { Tex } from '../../core/tex.js';

interface Metal { z: number; E0: number; ion: string; color: string }
const METALS: Record<string, Metal> = {
  Mg: { z: 2, E0: -2.37, ion: 'Mg²⁺', color: 'rgba(140,150,170,0.18)' },
  Al: { z: 3, E0: -1.66, ion: 'Al³⁺', color: 'rgba(140,150,170,0.18)' },
  Zn: { z: 2, E0: -0.76, ion: 'Zn²⁺', color: 'rgba(150,160,180,0.16)' },
  Fe: { z: 2, E0: -0.44, ion: 'Fe²⁺', color: 'rgba(120,170,110,0.30)' },
  Ni: { z: 2, E0: -0.25, ion: 'Ni²⁺', color: 'rgba(80,180,120,0.32)' },
  Pb: { z: 2, E0: -0.13, ion: 'Pb²⁺', color: 'rgba(150,160,180,0.18)' },
  Cu: { z: 2, E0: 0.34, ion: 'Cu²⁺', color: 'rgba(40,110,210,0.40)' },
  Ag: { z: 1, E0: 0.80, ion: 'Ag⁺', color: 'rgba(150,160,180,0.14)' },
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
}

const W = 720, H = 380;
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
}: ElectrochemProps = {}): ReactNode {
  const [mA, setMA] = useState(metalA);
  const [mB, setMB] = useState(metalB);
  const [cA, setCA] = useState(concA);
  const [cB, setCB] = useState(concB);
  const tRef = useRef(0);
  const gate = usePlayGate();
  useFrameTick(gate.running, (f) => { tRef.current += Math.min(0.05, f.dtMs / 1000); });
  const t = tRef.current;

  const cell = galvanicCell(hc(mA, cA), hc(mB, cB));
  const { anode, cathode, E0cell, n, Q, E } = cell;
  // which UI side each picked electrode maps to (anode drawn left, cathode right)
  const aMetal = METALS[anode.metal]!, cMetal = METALS[cathode.metal]!;

  // ── geometry ──
  const wireY = 44, Vx = 360, Vy = 60, Vr = 30;
  const Lx = 175, Rx = 545, elecTopY = 120, beakTop = 175, beakBot = 330;
  // electron path anode(left)→cathode(right) through the voltmeter
  const path: [number, number][] = [[Lx, elecTopY], [Lx, wireY], [Vx - Vr - 4, wireY], [Vx + Vr + 4, wireY], [Rx, wireY], [Rx, elecTopY]];
  const segLen = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i]![0], p[1] - path[i]![1]));
  const totLen = segLen.reduce((a, b) => a + b, 0);
  const posAt = (u: number): [number, number] => {
    let d = u * totLen;
    for (let i = 0; i < segLen.length; i++) {
      if (d <= segLen[i]!) { const f = d / segLen[i]!; return [path[i]![0] + (path[i + 1]![0] - path[i]![0]) * f, path[i]![1] + (path[i + 1]![1] - path[i]![1]) * f]; }
      d -= segLen[i]!;
    }
    return path[path.length - 1]!;
  };
  const wirePts = path.map((p) => p.join(',')).join(' ');

  const beaker = (x: number, metal: string, m: Metal, conc: number, role: 'anode' | 'cathode'): ReactNode => {
    const bx = x - 95, bw = 190;
    return (
      <g>
        <rect x={bx} y={beakTop} width={bw} height={beakBot - beakTop} rx={6} fill={m.color} stroke="var(--stage-metal)" strokeWidth={2} />
        {/* electrode bar */}
        <rect x={x - 9} y={elecTopY} width={18} height={beakBot - elecTopY - 16} rx={2} fill="var(--stage-metal)" />
        <text x={x} y={elecTopY - 8} textAnchor="middle" fontSize={14} fontWeight={800} fill="var(--stage-fg)">{metal}</text>
        <text x={x} y={beakBot + 18} textAnchor="middle" fontSize={11} fill="var(--stage-muted)">{m.ion} · {conc.toFixed(conc < 0.1 ? 3 : 2)} M</text>
        <text x={x} y={beakTop + 18} textAnchor="middle" fontSize={11} fontWeight={700} fill={role === 'anode' ? 'var(--stage-danger, #e03131)' : 'var(--stage-good, #16a34a)'}>{role === 'anode' ? 'anode −' : 'cathode +'}</text>
        <text x={x} y={beakTop + 33} textAnchor="middle" fontSize={9.5} fill="var(--stage-muted)">{role === 'anode' ? 'oxidation' : 'reduction'}</text>
      </g>
    );
  };

  const figure = (
    <PlayWrap gate={gate}>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${anode.metal} ${cathode.metal} galvanic cell, EMF ${E.toFixed(2)} volts`}>
          {/* wire + voltmeter */}
          <polyline points={wirePts} fill="none" stroke="var(--stage-metal)" strokeWidth={2.5} />
          <circle cx={Vx} cy={Vy} r={Vr} fill="var(--stage-bg)" stroke="var(--stage-fg)" strokeWidth={2} />
          <text x={Vx} y={Vy - 4} textAnchor="middle" fontSize={15} fontWeight={800} fill={E > 0 ? 'var(--stage-good, #16a34a)' : 'var(--stage-danger,#e03131)'} style={{ fontVariantNumeric: 'tabular-nums' }}>{E.toFixed(2)}</text>
          <text x={Vx} y={Vy + 10} textAnchor="middle" fontSize={9} fill="var(--stage-muted)">volts</text>
          {/* salt bridge */}
          <path d={`M ${Lx + 70} ${beakTop + 8} C ${Lx + 70} ${beakTop - 40}, ${Rx - 70} ${beakTop - 40}, ${Rx - 70} ${beakTop + 8}`} fill="none" stroke="color-mix(in oklab, var(--stage-warn) 50%, var(--stage-bg))" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
          <text x={Vx} y={beakTop - 30} textAnchor="middle" fontSize={10} fill="var(--stage-muted)">salt bridge</text>
          {/* electron flow (anode → cathode) */}
          {gate.playing && Array.from({ length: 9 }, (_, i) => {
            const u = (t * 0.35 + i / 9) % 1;
            const [px, py] = posAt(u);
            return <circle key={i} cx={px} cy={py} r={3.4} fill="var(--stage-warn)" />;
          })}
          <text x={Vx} y={wireY - 8} textAnchor="middle" fontSize={9.5} fill="var(--stage-warn)">e⁻ →</text>
          {/* half-cells: anode left, cathode right */}
          {beaker(Lx, anode.metal, aMetal, anode.conc, 'anode')}
          {beaker(Rx, cathode.metal, cMetal, cathode.conc, 'cathode')}
        </svg>
      </div>
    </PlayWrap>
  );

  const sameMetal = mA === mB;
  const aside = (
    <>
      <Callout tone={E > 0 ? 'result' : 'info'}>
        <span style={{ display: 'grid', gap: 2, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontWeight: 800, fontSize: 20 }}>E = {E.toFixed(3)} V</span>
          <span style={{ fontSize: 13, color: 'var(--stage-muted)' }}>E°cell {E0cell.toFixed(2)} V · n = {n} · Q = {Q < 0.01 || Q > 99 ? Q.toExponential(1) : Q.toFixed(2)}</span>
        </span>
      </Callout>
      <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
        <Tex tex={'E = E^\\circ_{cell} - \\dfrac{RT}{nF}\\ln Q'} block />
        <span style={{ color: 'var(--stage-muted)' }}>
          <strong style={{ color: 'var(--stage-danger, #e03131)' }}>{anode.metal}</strong> is the anode (oxidised, loses e⁻); <strong style={{ color: 'var(--stage-good, #16a34a)' }}>{cathode.metal}</strong> is the cathode (reduced). {sameMetal
            ? <>Same metal both sides ⇒ E°cell = 0, this is a <strong style={{ color: 'var(--stage-fg)' }}>concentration cell</strong>, driven only by the concentration difference.</>
            : <>Diluting the cathode ion raises Q and lowers E; concentrating it raises E.</>}
        </span>
      </div>
    </>
  );

  const picker = (val: string, set: (m: string) => void): ReactNode => (
    <span className="lab-field-row" style={{ flexWrap: 'wrap' }}>
      {ORDER.map((m) => <Chip key={m} selected={val === m} onClick={() => set(m)}>{m}</Chip>)}
    </span>
  );
  const controls = (
    <div style={{ display: 'grid', gap: 10 }}>
      <ControlBar>
        <Field label="electrode 1">{picker(mA, setMA)}</Field>
        <Field label={`[${METALS[mA]!.ion}]`} value={`${cA.toFixed(2)} M`}><Slider value={cA} min={0.001} max={2} step={0.01} onChange={setCA} ariaLabel="electrode 1 ion concentration" /></Field>
      </ControlBar>
      <ControlBar>
        <Field label="electrode 2">{picker(mB, setMB)}</Field>
        <Field label={`[${METALS[mB]!.ion}]`} value={`${cB.toFixed(2)} M`}><Slider value={cB} min={0.001} max={2} step={0.01} onChange={setCB} ariaLabel="electrode 2 ion concentration" /></Field>
      </ControlBar>
    </div>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls}>{figure}</LabFrame>;
}
