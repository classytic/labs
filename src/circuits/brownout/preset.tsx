'use client';

/**
 * BrownoutLab — what a falling supply voltage does to digital logic. A CMOS gate only switches
 * when its transistors can turn on, and that needs the supply rail VDD to stay above the
 * threshold Vth. Drag the battery EMF down (a draining cell, a sagging rail) and the engine solves
 * the gate's output: with a healthy supply it swings rail to rail (valid 1 / 0); as VDD falls
 * toward Vth the swing collapses and the output can no longer follow the input, so it is no longer
 * a valid 1 or 0. That is a brown-out: the chip is not broken, it is simply starved of voltage, and
 * this is the bridge from EMF and
 * the battery to whether a logic circuit works at all.
 */

import { useState, type ReactNode } from 'react';
import { solveDC, type Elem } from '@classytic/stage/circuit';
import { Wire, Tag } from '../../kit/electronics.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';

const K = 0.5;
const C_HEALTHY = 'var(--stage-good)';
const C_MARGINAL = 'var(--stage-warn, oklch(0.78 0.15 80))';
const C_DEAD = 'var(--stage-danger)';

export interface BrownoutProps {
  vth?: number;
  vmax?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const W = 460, H = 250;

export function BrownoutLab({
  vth = 2, vmax = 6,
  title = 'Brown-out: when the supply is too low to think',
  prompt = 'Drag the battery EMF down. The CMOS gate only switches while the supply rail VDD stays above the transistor threshold. As VDD falls toward Vth the output, solved by the engine, loses its swing and can no longer follow the input: a brown-out, where the logic is no longer a valid 1 or 0.',
  ask, activity = 'brownout',
}: BrownoutProps = {}): ReactNode {
  const [vdd, setVdd] = useState(5);
  const [A, setA] = useState(1);
  const ch = useChallenge(BROWNOUT_Q);
  useCheckpoint({ solved: ch.allCorrect, activity: 'brownout:predict' });

  // A CMOS inverter on the chosen rail: VDD=node1, Y=node2, A=node3.
  const inv = (vddV: number, aV: number): Elem[] => [
    { kind: 'V', n1: 1, n2: 0, value: vddV },
    { kind: 'V', n1: 3, n2: 0, value: aV },
    { kind: 'M', pmos: true, n1: 2, n2: 1, n3: 3, value: 0, vth, k: K },
    { kind: 'M', n1: 2, n2: 0, n3: 3, value: 0, vth, k: K },
  ];
  const yAt = (aV: number) => solveDC(inv(vdd, aV)).nodeV[2] ?? 0;
  const Yhigh = yAt(0);          // input LOW  → output should be HIGH (≈ VDD)
  const Ylow = yAt(vdd);         // input HIGH → output should be LOW  (≈ 0)
  const Y = yAt(A ? vdd : 0);    // the displayed case
  const swing = Yhigh - Ylow;
  const swingFrac = vdd > 0.05 ? swing / vdd : 0;

  // Verdict from the engine: below Vth the swing collapses to mid-rail (output invalid). Just above
  // Vth the swing is full but the absolute rail is low, so the noise margin is thin (marginal). The
  // safe band is a comfortable headroom above Vth.
  const SAFE = 1.5 * vth;
  const collapsed = swingFrac <= 0.5;
  const zone: 'healthy' | 'marginal' | 'dead' = collapsed ? 'dead' : vdd < SAFE ? 'marginal' : 'healthy';
  const zoneColor = zone === 'healthy' ? C_HEALTHY : zone === 'marginal' ? C_MARGINAL : C_DEAD;
  const valid = !collapsed;       // a clean (full-swing) output level
  const level = collapsed ? 'invalid' : Y > vdd / 2 ? '1' : '0';

  // ── gauge geometry (the hero): a vertical supply-voltage bar with three zones ──
  const GX = 70, GTOP = 40, GBOT = 210, GW = 26;
  const y = (v: number) => GBOT - (Math.min(v, vmax) / vmax) * (GBOT - GTOP);
  const band = (lo: number, hi: number, color: string) => <rect x={GX} y={y(hi)} width={GW} height={Math.max(0, y(lo) - y(hi))} fill={color} opacity={0.32} />;

  // ── the gate, to the right of the gauge ──
  const gx = 250, gy = 125;

  const scene = (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', maxWidth: W, margin: '0 auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Brown-out demo, supply ${vdd.toFixed(1)} volts, logic ${zone === 'healthy' ? 'valid' : zone === 'marginal' ? 'marginal' : 'invalid'}`}>
        {/* supply gauge */}
        {band(0, vth, C_DEAD)}
        {band(vth, SAFE, C_MARGINAL)}
        {band(SAFE, vmax, C_HEALTHY)}
        <rect x={GX} y={GTOP} width={GW} height={GBOT - GTOP} fill="none" stroke="var(--stage-grid)" strokeWidth={1} rx={4} />
        <line x1={GX - 4} y1={y(vth)} x2={GX + GW + 4} y2={y(vth)} stroke={C_DEAD} strokeWidth={1} strokeDasharray="3 3" />
        <line x1={GX - 4} y1={y(SAFE)} x2={GX + GW + 4} y2={y(SAFE)} stroke={C_HEALTHY} strokeWidth={1} strokeDasharray="3 3" />
        <Tag x={GX + GW + 8} y={y(vth) + 4} text={`Vth ${vth}V`} color="var(--stage-muted)" size={10} weight={700} anchor="start" />
        <Tag x={GX + GW + 8} y={y(SAFE) + 4} text="safe" color="var(--stage-muted)" size={10} weight={700} anchor="start" />
        {/* fill to current VDD + marker */}
        <rect x={GX} y={y(vdd)} width={GW} height={GBOT - y(vdd)} fill={zoneColor} opacity={0.85} />
        <polygon points={`${GX - 12},${y(vdd) - 6} ${GX - 12},${y(vdd) + 6} ${GX - 2},${y(vdd)}`} fill={zoneColor} />
        <Tag x={GX + GW / 2} y={GTOP - 8} text="VDD" color="var(--stage-fg)" size={12} weight={800} anchor="middle" />
        <Tag x={GX + GW / 2} y={GBOT + 16} text={`${vdd.toFixed(1)} V`} color={zoneColor} size={13} weight={800} anchor="middle" />

        {/* rail from the gauge into the gate's VDD pin */}
        <Wire points={[[GX + GW, y(vdd)], [gx, y(vdd)], [gx, gy - 34]]} live={vdd > 0.05} />
        {/* the gate: a NOT symbol (triangle + bubble) */}
        <polygon points={`${gx},${gy - 26} ${gx},${gy + 26} ${gx + 40},${gy}`} fill="color-mix(in oklab, var(--stage-metal, gray) 18%, var(--stage-bg))" stroke="var(--stage-fg)" strokeWidth={1.5} />
        <circle cx={gx + 46} cy={gy} r={5} fill="var(--stage-bg)" stroke="var(--stage-fg)" strokeWidth={1.5} />
        <Tag x={gx + 20} y={gy + 4} text="NOT" color="var(--stage-fg)" size={10} weight={700} anchor="middle" />
        {/* input A */}
        <Wire points={[[gx - 36, gy], [gx, gy]]} live={!!A} />
        <circle cx={gx - 40} cy={gy} r={4.5} fill={A ? C_HEALTHY : 'var(--stage-muted)'} />
        <Tag x={gx - 40} y={gy - 10} text={`A=${A}`} color="var(--stage-fg)" size={11} weight={700} anchor="middle" />
        {/* output Y */}
        <Wire points={[[gx + 51, gy], [gx + 96, gy]]} live={valid && level === '1'} />
        <circle cx={gx + 100} cy={gy} r={5} fill={level === 'invalid' ? C_DEAD : level === '1' ? C_HEALTHY : 'var(--stage-muted)'} />
        <Tag x={gx + 108} y={gy - 8} text="Y" color="var(--stage-fg)" size={12} weight={700} anchor="start" />
        <Tag x={gx + 108} y={gy + 12} text={level === 'invalid' ? '?' : level} color={level === 'invalid' ? C_DEAD : level === '1' ? C_HEALTHY : 'var(--stage-fg)'} size={14} weight={800} anchor="start" />
        <Tag x={gx + 20} y={H - 14} text={`output = ${Y.toFixed(2)} V`} color="var(--stage-muted)" size={11} weight={700} anchor="middle" />
      </svg>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label={`battery EMF = ${vdd.toFixed(1)} V`}>
        <Slider min={0} max={vmax} step={0.1} value={vdd} onChange={setVdd} ariaLabel="battery EMF in volts" />
      </Field>
      <Field label="input A">
        <span className="lab-field-row"><Chip selected={A === 0} onClick={() => setA(0)}>0</Chip><Chip selected={A === 1} onClick={() => setA(1)}>1</Chip></span>
      </Field>
    </ControlBar>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={valid ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {zone === 'healthy' ? '✓ supply healthy: logic valid, good noise margin' : zone === 'marginal' ? '⚠ low rail: logic still valid but the noise margin is thin' : '✗ supply below threshold: output invalid (no swing)'}
      </div>
      <Callout tone="result">
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          supply VDD = <strong>{vdd.toFixed(1)} V</strong> (threshold Vth = {vth} V)<br />
          output swing = <strong>{Math.max(0, swing).toFixed(2)} V</strong> ({Math.round(Math.max(0, swingFrac) * 100)}% of rail)<br />
          this output = {Y.toFixed(2)} V → {level === 'invalid' ? <span style={{ color: C_DEAD, fontWeight: 700 }}>invalid (neither 1 nor 0)</span> : <span style={{ fontWeight: 700 }}>logic {level}</span>}
        </div>
      </Callout>
      <Callout tone="info">
        <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          A transistor needs gate-to-source above Vth to conduct. Once the whole rail drops near Vth, neither the pull-up nor the pull-down can fully turn on, so the output can no longer be driven to a valid level and the swing collapses. Real systems brown out when a battery drains or a heavy load makes the supply sag (EMF minus the internal-resistance drop). The cure is a minimum supply voltage, not a faster chip.
        </div>
      </Callout>
    </div>
  );

  const footer = (
    <>
      <ChallengeCard questions={BROWNOUT_Q} state={ch} title="Predict first" />
      {ask ? <LabAsk ask={ask} activity={activity} /> : null}
    </>
  );

  return <LabFrame title={title} prompt={prompt} controls={controls} aside={aside} footer={footer}>{scene}</LabFrame>;
}

const BROWNOUT_Q: ChallengeQuestion[] = [
  {
    id: 'brownout-low',
    prompt: 'The battery drains until the supply VDD falls below the transistor threshold Vth. What happens to the gate output?',
    choices: [
      { value: 'a', label: 'it becomes invalid: neither a clean 1 nor 0' },
      { value: 'b', label: 'it stays a perfect 1 and 0, just slower' },
      { value: 'c', label: 'the gate burns out' },
    ],
    answer: 'a',
    explain: 'Below Vth neither transistor can fully turn on, so the output cannot reach the rails and the swing collapses (it stops following the input). Nothing is damaged: the chip is simply starved of voltage. That is a brown-out, and it is why every chip has a minimum supply voltage.',
  },
];
