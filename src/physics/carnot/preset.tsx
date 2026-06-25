'use client';

/**
 * CarnotCycleLab — the most efficient possible heat engine, shown two ways at once:
 *   • P–V diagram: the four-leg loop (hot isothermal expansion → adiabatic expansion
 *     → cold isothermal compression → adiabatic compression). The ENCLOSED area is
 *     the net work the engine delivers per cycle.
 *   • T–S diagram: the very same cycle is a RECTANGLE — heat in along the top (Th),
 *     heat out along the bottom (Tc), entropy unchanged on the adiabatic sides. Its
 *     area (ΔS·(Th−Tc)) equals the net work too, and it makes the entropy bookkeeping
 *     obvious: ΔS = Qh/Th = Qc/Tc, so the gas returns to the same entropy (net ΔS = 0).
 *
 * The efficiency η = 1 − Tc/Th falls straight out, and no real engine can beat it
 * (2nd law). A point animates around both diagrams together. Pure
 * `@classytic/stage/thermo` kernel; play-gated.
 */

import { useRef, useState, type ReactNode } from 'react';
import { carnotCycle, gammaMonatomic, gammaDiatomic, type GasState } from '@classytic/stage/thermo';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { Tex } from '../../core/tex.js';

export interface CarnotProps {
  /** Initial hot-reservoir temperature, K (default 500). */
  hotK?: number;
  /** Initial cold-reservoir temperature, K (default 300). */
  coldK?: number;
  /** Default gas (learner can still toggle). */
  gas?: 'monatomic' | 'diatomic';
  /** Initial isothermal expansion ratio V₂/V₁ (default 2). */
  expansionRatio?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const W = 720, H = 380;
const V1 = 0.02;
const J = (x: number): string => Math.round(x).toString();

export function CarnotCycleLab({
  hotK = 500,
  coldK = 300,
  gas = 'monatomic',
  expansionRatio = 2,
  title = 'Carnot cycle — the best a heat engine can do',
  prompt = 'A gas absorbs heat at a hot temperature, does work, and dumps the rest at a cold one. Watch the loop on the P–V diagram and the same cycle as a rectangle on the T–S diagram.',
  objectives = [
    'See the Carnot cycle as a P–V loop whose area is the net work',
    'Read the same cycle as a T–S rectangle (heat in at Th, out at Tc)',
    'Derive the efficiency η = 1 − Tc/Th — the ceiling no engine can beat',
  ],
}: CarnotProps = {}): ReactNode {
  const [Th, setTh] = useState(hotK);
  const [Tc, setTc] = useState(coldK);
  const [mono, setMono] = useState(gas === 'monatomic');
  const [vr, setVr] = useState(expansionRatio);
  const uRef = useRef(0);
  const gate = usePlayGate();
  useFrameTick(gate.running, (f) => { uRef.current = (uRef.current + Math.min(0.05, f.dtMs / 1000) * 0.18) % 1; });

  const tcc = Math.min(Tc, Th - 20);
  const gamma = mono ? gammaMonatomic : gammaDiatomic;
  const c = carnotCycle(1, Th, tcc, V1, V1 * vr, gamma);
  const dS = c.legs[0]!.dS;                                  // Sl=0 → Sh = dS

  // ── P–V diagram (left) ──
  const allV = c.legs.flatMap((l) => l.path.map((p) => p.V));
  const allP = c.legs.flatMap((l) => l.path.map((p) => p.P));
  const Vmax = Math.max(...allV) * 1.08, Vmin = Math.min(...allV) * 0.9;
  const Pmax = Math.max(...allP) * 1.08;
  const AX = 50, BX = 350, AY = 64, BY = 320;
  const pvx = (v: number): number => AX + ((v - Vmin) / (Vmax - Vmin)) * (BX - AX);
  const pvy = (p: number): number => BY - (p / Pmax) * (BY - AY);
  const loop = c.legs.flatMap((l) => l.path).map((p) => `${pvx(p.V).toFixed(1)},${pvy(p.P).toFixed(1)}`).join(' ');

  // ── T–S diagram (right): rectangle (0,Tc)-(dS,Tc)-(dS,Th)-(0,Th) ──
  const CX = 430, DX = 700, CY = 64, DY = 320;
  const Smax = dS * 1.18, Tmax = Th * 1.12;
  const tsx = (s: number): number => CX + (s / Smax) * (DX - CX);
  const tsy = (t: number): number => DY - (t / Tmax) * (DY - CY);

  // ── animated marker: leg = floor(u*4), local f ──
  const u = uRef.current;
  const li = Math.min(3, Math.floor(u * 4));
  const lf = (u * 4) % 1;
  const leg = c.legs[li]!;
  const pvPt = leg.path[Math.min(leg.path.length - 1, Math.round(lf * (leg.path.length - 1)))]!;
  // TS marker per leg
  const tsState = (): { s: number; t: number } => {
    if (li === 0) return { s: lf * dS, t: Th };
    if (li === 1) return { s: dS, t: Th + lf * (tcc - Th) };
    if (li === 2) return { s: dS - lf * dS, t: tcc };
    return { s: 0, t: tcc + lf * (Th - tcc) };
  };
  const ts = tsState();

  const legColor = (i: number): string => (i === 0 ? 'var(--stage-danger, #e03131)' : i === 2 ? 'var(--stage-accent, #3b82f6)' : 'var(--stage-muted)');

  const figure = (
    <PlayWrap gate={gate}>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Carnot cycle, efficiency ${(c.efficiency * 100).toFixed(0)} percent`}>
          {/* P–V */}
          <text x={AX} y={AY - 14} fontSize={12} fontWeight={700} fill="var(--stage-fg)">P–V diagram</text>
          <line x1={AX} y1={CY} x2={AX} y2={BY} stroke="var(--stage-fg)" strokeWidth={1.5} />
          <line x1={AX} y1={BY} x2={BX} y2={BY} stroke="var(--stage-fg)" strokeWidth={1.5} />
          <text x={AX - 6} y={CY + 6} textAnchor="end" fontSize={10} fill="var(--stage-muted)">P</text>
          <text x={BX} y={BY + 18} textAnchor="end" fontSize={10} fill="var(--stage-muted)">V →</text>
          <polygon points={loop} fill="var(--stage-warn)" opacity={0.16} />
          {c.legs.map((l, i) => (
            <polyline key={i} points={l.path.map((p) => `${pvx(p.V).toFixed(1)},${pvy(p.P).toFixed(1)}`).join(' ')} fill="none" stroke={legColor(i)} strokeWidth={i % 2 === 0 ? 3 : 2} strokeDasharray={i % 2 === 1 ? '4 3' : undefined} strokeLinejoin="round" />
          ))}
          <text x={(AX + BX) / 2} y={(CY + BY) / 2} textAnchor="middle" fontSize={11} fontWeight={700} fill="color-mix(in oklab, var(--stage-warn) 80%, var(--stage-fg))">W = enclosed area</text>
          <circle cx={pvx(pvPt.V)} cy={pvy(pvPt.P)} r={6} fill="var(--stage-good)" stroke="var(--stage-bg)" strokeWidth={2} />

          {/* T–S */}
          <text x={CX} y={AY - 14} fontSize={12} fontWeight={700} fill="var(--stage-fg)">T–S diagram</text>
          <line x1={CX} y1={CY} x2={CX} y2={DY} stroke="var(--stage-fg)" strokeWidth={1.5} />
          <line x1={CX} y1={DY} x2={DX} y2={DY} stroke="var(--stage-fg)" strokeWidth={1.5} />
          <text x={CX - 6} y={CY + 6} textAnchor="end" fontSize={10} fill="var(--stage-muted)">T</text>
          <text x={DX} y={DY + 18} textAnchor="end" fontSize={10} fill="var(--stage-muted)">S →</text>
          {/* rectangle */}
          <rect x={tsx(0)} y={tsy(Th)} width={tsx(dS) - tsx(0)} height={tsy(tcc) - tsy(Th)} fill="var(--stage-warn)" opacity={0.16} />
          <line x1={tsx(0)} y1={tsy(Th)} x2={tsx(dS)} y2={tsy(Th)} stroke="var(--stage-danger, #e03131)" strokeWidth={3} />
          <line x1={tsx(0)} y1={tsy(tcc)} x2={tsx(dS)} y2={tsy(tcc)} stroke="var(--stage-accent, #3b82f6)" strokeWidth={3} />
          <line x1={tsx(dS)} y1={tsy(Th)} x2={tsx(dS)} y2={tsy(tcc)} stroke="var(--stage-muted)" strokeWidth={2} strokeDasharray="4 3" />
          <line x1={tsx(0)} y1={tsy(Th)} x2={tsx(0)} y2={tsy(tcc)} stroke="var(--stage-muted)" strokeWidth={2} strokeDasharray="4 3" />
          <text x={(tsx(0) + tsx(dS)) / 2} y={tsy(Th) - 5} textAnchor="middle" fontSize={10} fill="var(--stage-danger, #e03131)">Qh in at Th</text>
          <text x={(tsx(0) + tsx(dS)) / 2} y={tsy(tcc) + 14} textAnchor="middle" fontSize={10} fill="var(--stage-accent, #3b82f6)">Qc out at Tc</text>
          <circle cx={tsx(ts.s)} cy={tsy(ts.t)} r={6} fill="var(--stage-good)" stroke="var(--stage-bg)" strokeWidth={2} />
        </svg>
      </div>
    </PlayWrap>
  );

  const aside = (
    <>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 2, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontWeight: 800, fontSize: 18 }}>η = {(c.efficiency * 100).toFixed(1)}%</span>
          <span style={{ fontSize: 13 }}>Qh {J(c.Qh)} J → W {J(c.Wnet)} J + Qc {J(c.Qc)} J</span>
        </span>
      </Callout>
      <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
        <Tex tex={'\\eta = 1 - \\dfrac{T_c}{T_h} = \\dfrac{W}{Q_h}'} block />
        <span style={{ color: 'var(--stage-muted)' }}>
          Heat enters at <strong style={{ color: 'var(--stage-danger, #e03131)' }}>Th = {Th} K</strong> and leaves at <strong style={{ color: 'var(--stage-accent, #3b82f6)' }}>Tc = {tcc} K</strong>. The wider the temperature gap, the more efficient — but you can never reach 100% without Tc = 0.
        </span>
        <span style={{ color: 'var(--stage-muted)' }}>
          On the T–S rectangle, <Tex tex={'\\Delta S = Q_h/T_h = Q_c/T_c'} /> = {dS.toFixed(2)} J/K, so the gas comes back to the same entropy — <strong style={{ color: 'var(--stage-fg)' }}>net ΔS = 0</strong> for a reversible cycle.
        </span>
      </div>
    </>
  );

  const controls = (
    <div style={{ display: 'grid', gap: 10 }}>
      <ControlBar>
        <Field label="hot Th" value={`${Th} K`}><Slider value={Th} min={360} max={800} step={10} onChange={setTh} ariaLabel="hot reservoir temperature" /></Field>
        <Field label="cold Tc" value={`${tcc} K`}><Slider value={Tc} min={250} max={600} step={10} onChange={setTc} ariaLabel="cold reservoir temperature" /></Field>
      </ControlBar>
      <ControlBar>
        <Field label="expansion V₂/V₁" value={`×${vr.toFixed(1)}`}><Slider value={vr} min={1.3} max={3} step={0.1} onChange={setVr} ariaLabel="isothermal expansion ratio" /></Field>
        <Field label="gas">
          <span className="lab-field-row">
            <Chip selected={mono} onClick={() => setMono(true)}>monatomic</Chip>
            <Chip selected={!mono} onClick={() => setMono(false)}>diatomic</Chip>
          </span>
        </Field>
      </ControlBar>
    </div>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls}>{figure}</LabFrame>;
}
