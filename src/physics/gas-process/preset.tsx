'use client';

/**
 * GasProcessLab — the four ideal-gas processes on a P–V diagram, with the first law
 * kept honest. Pick a process, push/pull the gas, and watch:
 *   • a piston cylinder (gas particles spread as V grows, colour tracks T),
 *   • the P–V curve with the WORK shaded as the area under it (∫P dV),
 *   • the bookkeeping ΔU = Q − W with every term and sign.
 *
 * A faint isotherm through the start point shows why an adiabatic curve falls
 * STEEPER than an isothermal one (it also cools). Pure `@classytic/stage/thermo`
 * kernel; interactive (recomputes on the slider), no simulation loop.
 */

import { useState, type ReactNode } from 'react';
import { runProcess, R, gammaMonatomic, gammaDiatomic, type ProcessKind, type GasState } from '@classytic/stage/thermo';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { thermalColor } from '../../kit/thermal.js';
import { Tex } from '../../core/tex.js';

export interface GasProcessProps {
  kind?: ProcessKind;
  /** Default gas (learner can still toggle). */
  gas?: 'monatomic' | 'diatomic';
  /** Initial amount, mol (default 1). */
  moles?: number;
  /** Initial temperature, K (default 300). */
  tempK?: number;
  /** Initial volume, L (default 20). */
  volumeL?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const W = 720, H = 380;
const KINDS: { k: ProcessKind; label: string; hint: string }[] = [
  { k: 'isothermal', label: 'isothermal', hint: 'T constant' },
  { k: 'adiabatic', label: 'adiabatic', hint: 'Q = 0' },
  { k: 'isobaric', label: 'isobaric', hint: 'P constant' },
  { k: 'isochoric', label: 'isochoric', hint: 'V constant' },
];
const kPa = (p: number): string => (p / 1000).toFixed(0);
const L = (v: number): string => (v * 1000).toFixed(1);
const J = (x: number): string => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(0);

export function GasProcessLab({
  kind: kind0 = 'isothermal',
  title = 'Gas processes — work is the area under P–V',
  prompt = 'Expand or compress an ideal gas four different ways. The shaded area under the P–V curve is the work; the first law ΔU = Q − W balances the books.',
  objectives = [
    'Read work as the area under the P–V curve (∫P dV)',
    'Compare isothermal, adiabatic, isobaric and isochoric paths',
    'Apply the first law ΔU = Q − W and see when Q, W or ΔU is zero',
  ],
  gas: gas0 = 'monatomic',
  moles = 1,
  tempK = 300,
  volumeL = 20,
}: GasProcessProps = {}): ReactNode {
  const [kind, setKind] = useState<ProcessKind>(kind0);
  const [mono, setMono] = useState(gas0 === 'monatomic');
  const [ratio, setRatio] = useState(1.8);           // V-ratio (or T-ratio for isochoric)
  const gamma = mono ? gammaMonatomic : gammaDiatomic;

  // initial state from props (creator declares the sample)
  const N = moles, T0 = tempK, V0 = volumeL / 1000;
  const P0 = (N * R * T0) / V0;
  const s0: GasState = { P: P0, V: V0, T: T0, n: N };
  const target = kind === 'isochoric' ? { T: T0 * ratio } : { V: V0 * ratio };
  const r = runProcess(s0, kind, target, gamma);
  const { end, path, Q, W: work, dU, dS } = r;

  // ── PV diagram bounds (anchor at 0 so the area reads to the V-axis) ──
  const allV = path.map((p) => p.V).concat(V0 * 2.6);
  const allP = path.map((p) => p.P).concat(P0 * 1.15);
  const Vmax = Math.max(...allV), Pmax = Math.max(...allP);
  const GX0 = 360, GX1 = 695, GY0 = 30, GY1 = 320;
  const PXV = (v: number): number => GX0 + (v / Vmax) * (GX1 - GX0);
  const PYP = (p: number): number => GY1 - (p / Pmax) * (GY1 - GY0);
  const curve = path.map((p) => `${PXV(p.V).toFixed(1)},${PYP(p.P).toFixed(1)}`).join(' ');
  const areaPts = `${PXV(path[0]!.V).toFixed(1)},${PYP(0).toFixed(1)} ${curve} ${PXV(end.V).toFixed(1)},${PYP(0).toFixed(1)}`;
  // faint reference isotherm through the start point
  const isoRef = Array.from({ length: 40 }, (_, i) => {
    const v = (0.4 + (i / 39) * 2.1) * V0;
    return `${PXV(v).toFixed(1)},${PYP((N * R * T0) / v).toFixed(1)}`;
  }).join(' ');

  // ── piston cylinder (left) ──
  const cylX = 60, cylTop = 70, cylW = 150, cylBotMax = 320;
  const vFrac = end.V / (V0 * 2.6);
  const gasTop = cylBotMax - vFrac * (cylBotMax - cylTop);
  const tFrac = Math.max(0, Math.min(1, (end.T - 150) / 450));
  const particles = Array.from({ length: 26 }, (_, i) => {
    const px = cylX + 12 + ((i * 0.6180339) % 1) * (cylW - 24);
    const py = gasTop + 10 + ((i * 0.3542) % 1) * (cylBotMax - gasTop - 16);
    return <circle key={i} cx={px} cy={py} r={3} fill={thermalColor(tFrac)} opacity={0.9} />;
  });

  const figure = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${kind} process, work ${work.toFixed(0)} joules`}>
        {/* cylinder */}
        <rect x={cylX} y={gasTop} width={cylW} height={cylBotMax - gasTop} fill={thermalColor(tFrac)} opacity={0.18} />
        {particles}
        <path d={`M ${cylX} ${cylTop - 6} L ${cylX} ${cylBotMax} L ${cylX + cylW} ${cylBotMax} L ${cylX + cylW} ${cylTop - 6}`} fill="none" stroke="var(--stage-metal)" strokeWidth={3} strokeLinejoin="round" />
        {/* piston */}
        <rect x={cylX - 4} y={gasTop - 10} width={cylW + 8} height={10} rx={3} fill="var(--stage-metal)" />
        <rect x={cylX + cylW / 2 - 5} y={gasTop - 34} width={10} height={24} fill="var(--stage-metal)" />
        {/* pressure arrows on the piston (down) */}
        {[0.3, 0.5, 0.7].map((f) => <line key={f} x1={cylX + cylW * f} y1={gasTop - 40} x2={cylX + cylW * f} y2={gasTop - 28} stroke="var(--stage-warn)" strokeWidth={2} markerEnd="" />)}
        <text x={cylX + cylW / 2} y={cylBotMax + 18} textAnchor="middle" fontSize={11} fill="var(--stage-muted)">{L(end.V)} L · {kPa(end.P)} kPa · {end.T.toFixed(0)} K</text>

        {/* PV diagram */}
        <line x1={GX0} y1={GY0} x2={GX0} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
        <line x1={GX0} y1={GY1} x2={GX1} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
        <text x={GX0 - 6} y={GY0 + 4} textAnchor="end" fontSize={11} fill="var(--stage-muted)">P</text>
        <text x={GX1} y={GY1 + 20} textAnchor="end" fontSize={11} fill="var(--stage-muted)">V →</text>
        <polyline points={isoRef} fill="none" stroke="var(--stage-grid)" strokeWidth={1} strokeDasharray="3 3" />
        {/* work area */}
        <polygon points={areaPts} fill="var(--stage-warn)" opacity={0.18} />
        {/* process curve */}
        <polyline points={curve} fill="none" stroke="var(--stage-accent)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {/* endpoints */}
        <circle cx={PXV(s0.V)} cy={PYP(s0.P)} r={5} fill="var(--stage-muted)" />
        <text x={PXV(s0.V)} y={PYP(s0.P) - 9} textAnchor="middle" fontSize={10} fill="var(--stage-muted)">start</text>
        <circle cx={PXV(end.V)} cy={PYP(end.P)} r={6} fill="var(--stage-accent)" stroke="var(--stage-bg)" strokeWidth={2} />
        <text x={(PXV(s0.V) + PXV(end.V)) / 2} y={PYP(0) - 8} textAnchor="middle" fontSize={11} fontWeight={700} fill="color-mix(in oklab, var(--stage-warn) 80%, var(--stage-fg))">W = area</text>
      </svg>
    </div>
  );

  const zero = (label: string): ReactNode => <span style={{ color: 'var(--stage-muted)' }}>{label}</span>;
  const aside = (
    <>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 3, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          <span><strong>W</strong> (by gas) = {kind === 'isochoric' ? zero('0 J') : `${J(work)} J`}</span>
          <span><strong>Q</strong> (in) = {kind === 'adiabatic' ? zero('0 J') : `${J(Q)} J`}</span>
          <span><strong>ΔU</strong> = {kind === 'isothermal' ? zero('0 J') : `${J(dU)} J`}</span>
          <span><strong>ΔS</strong> = {kind === 'adiabatic' ? zero('0 J/K') : `${J(dS)} J/K`}</span>
        </span>
      </Callout>
      <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
        <Tex tex={'\\Delta U = Q - W'} block />
        <span style={{ color: 'var(--stage-muted)' }}>
          {kind === 'isothermal' && <>T fixed ⇒ ΔU = 0, so <strong style={{ color: 'var(--stage-fg)' }}>all the heat becomes work</strong>. PV = const.</>}
          {kind === 'adiabatic' && <>No heat in (Q = 0), so the work comes straight out of internal energy — the gas <strong style={{ color: 'var(--stage-fg)' }}>cools as it expands</strong>. PVᵞ = const (steeper than the isotherm).</>}
          {kind === 'isobaric' && <>P fixed ⇒ work is simply <strong style={{ color: 'var(--stage-fg)' }}>W = PΔV</strong> (a rectangle). Heat splits into work + internal energy.</>}
          {kind === 'isochoric' && <>V fixed ⇒ no work at all (<strong style={{ color: 'var(--stage-fg)' }}>W = 0</strong>); every joule of heat raises the internal energy (and temperature).</>}
        </span>
      </div>
    </>
  );

  const controls = (
    <div style={{ display: 'grid', gap: 10 }}>
      <ControlBar>
        <Field label="process">
          <span className="lab-field-row">
            {KINDS.map((k) => <Chip key={k.k} selected={kind === k.k} onClick={() => setKind(k.k)}>{k.label}</Chip>)}
          </span>
        </Field>
        <Field label="gas">
          <span className="lab-field-row">
            <Chip selected={mono} onClick={() => setMono(true)}>monatomic (γ=5/3)</Chip>
            <Chip selected={!mono} onClick={() => setMono(false)}>diatomic (γ=7/5)</Chip>
          </span>
        </Field>
      </ControlBar>
      <ControlBar>
        <Field label={kind === 'isochoric' ? 'heat / cool (T ratio)' : 'expand / compress (V ratio)'} value={`×${ratio.toFixed(2)}`}>
          <Slider value={ratio} min={0.5} max={2.5} step={0.05} onChange={setRatio} ariaLabel="process amount" />
        </Field>
      </ControlBar>
    </div>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls}>{figure}</LabFrame>;
}
