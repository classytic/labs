'use client';

/**
 * EntropyLab — why heat only flows one way, and why a gas always spreads out.
 * Entropy is the bookkeeping behind the second law: in any real (spontaneous)
 * process the TOTAL entropy of the universe increases.
 *
 *   • HEAT FLOW — move a chunk of heat Q from a hot body (Th) to a cold one (Tc).
 *     The hot body loses ΔS = −Q/Th; the cold body gains ΔS = +Q/Tc. Because
 *     Tc < Th, the gain outweighs the loss, so ΔS_total = Q(1/Tc − 1/Th) > 0 —
 *     hot→cold is spontaneous. Running it backwards would DECREASE total entropy,
 *     which never happens by itself. (Equal temperatures ⇒ ΔS_total = 0, reversible.)
 *   • FREE EXPANSION — let a gas spread into a vacuum. No heat, no work, but the gas
 *     can never un-mix: ΔS = nR·ln(Vf/Vi) > 0. Spreading out is simply overwhelmingly
 *     more likely than staying bunched up (more microstates).
 *
 * Interactive (recomputes on the sliders), no simulation loop. Pure SVG, themed.
 */

import { useState, type ReactNode } from 'react';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { thermalColor } from '../../kit/thermal.js';
import { Tex } from '../../core/tex.js';

type Mode = 'heat' | 'expansion';
const R = 8.314462618;

export interface EntropyProps {
  mode?: Mode;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const W = 640, H = 340;

export function EntropyLab({
  mode: mode0 = 'heat',
  title = 'Entropy & the second law — the one-way arrow',
  prompt = 'Real processes always increase the total entropy of the universe. See why heat flows hot→cold and why a gas spreads out — and never reverses on its own.',
  objectives = [
    'Compute entropy change as ΔS = Q/T for heat moved at temperature T',
    'See ΔS_total > 0 for spontaneous heat flow (and = 0 only when Th = Tc)',
    'Explain free expansion: ΔS = nR·ln(Vf/Vi) > 0, gas never un-mixes',
  ],
}: EntropyProps = {}): ReactNode {
  const [mode, setMode] = useState<Mode>(mode0);
  // heat-flow
  const [Th, setTh] = useState(500);
  const [Tc, setTc] = useState(300);
  const [Q, setQ] = useState(1000);
  // free expansion
  const [m, setM] = useState(1);                      // partition openness 0..1

  let figure: ReactNode;
  let aside: ReactNode;

  if (mode === 'heat') {
    const tc = Math.min(Tc, Th);
    const dSh = -Q / Th, dSc = Q / tc, dST = dSh + dSc;
    const scale = 70 / Math.max(2, Math.abs(dSc));     // px per (J/K)
    const bar = (x: number, label: string, val: number, color: string): ReactNode => {
      const baseY = 250, hpx = val * scale;
      return (
        <g>
          <rect x={x - 26} y={hpx >= 0 ? baseY - hpx : baseY} width={52} height={Math.abs(hpx)} rx={3} fill={color} opacity={0.85} />
          <text x={x} y={270} textAnchor="middle" fontSize={11} fill="var(--stage-fg)">{label}</text>
          <text x={x} y={hpx >= 0 ? baseY - hpx - 6 : baseY + Math.abs(hpx) + 14} textAnchor="middle" fontSize={11} fontWeight={700} fill={color} style={{ fontVariantNumeric: 'tabular-nums' }}>{val >= 0 ? '+' : '−'}{Math.abs(val).toFixed(2)}</text>
        </g>
      );
    };
    figure = (
      <div style={fwrap}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Heat flow, total entropy change ${dST.toFixed(2)} joules per kelvin`}>
          {/* two bodies + heat packet — vertically centred in the left panel */}
          <rect x={40} y={130} width={120} height={90} rx={10} fill={thermalColor(0.95)} opacity={0.85} />
          <text x={100} y={180} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--stage-bg)">HOT</text>
          <text x={100} y={200} textAnchor="middle" fontSize={12} fill="var(--stage-bg)">{Th} K</text>
          <rect x={250} y={130} width={120} height={90} rx={10} fill={thermalColor(0.12)} opacity={0.85} />
          <text x={310} y={180} textAnchor="middle" fontSize={13} fontWeight={800} fill="var(--stage-bg)">COLD</text>
          <text x={310} y={200} textAnchor="middle" fontSize={12} fill="var(--stage-bg)">{tc} K</text>
          <line x1={165} y1={175} x2={245} y2={175} stroke="var(--stage-warn)" strokeWidth={3} />
          <polygon points="245,175 235,169 235,181" fill="var(--stage-warn)" />
          <text x={205} y={164} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--stage-warn)">Q = {Q} J</text>
          {/* entropy bars */}
          <line x1={420} y1={250} x2={620} y2={250} stroke="var(--stage-grid)" strokeWidth={1} />
          <text x={520} y={56} textAnchor="middle" fontSize={11} fill="var(--stage-muted)">entropy change (J/K)</text>
          {bar(450, 'hot', dSh, 'var(--stage-danger, #e03131)')}
          {bar(520, 'cold', dSc, 'var(--stage-accent, #3b82f6)')}
          {bar(590, 'total', dST, 'var(--stage-good, #16a34a)')}
        </svg>
      </div>
    );
    aside = (
      <>
        <Callout tone={dST >= 0 ? 'result' : 'info'}>
          <span style={{ display: 'grid', gap: 2, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>ΔS_total = {dST >= 0 ? '+' : '−'}{Math.abs(dST).toFixed(2)} J/K</span>
            <span style={{ fontSize: 13 }}>{dST > 0.001 ? 'spontaneous ✓' : 'reversible limit (Th = Tc)'}</span>
          </span>
        </Callout>
        <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
          <Tex tex={'\\Delta S_{tot} = \\dfrac{Q}{T_c} - \\dfrac{Q}{T_h} > 0'} block />
          <span style={{ color: 'var(--stage-muted)' }}>The cold body gains <strong style={{ color: 'var(--stage-fg)' }}>more</strong> entropy than the hot body loses (same Q, smaller T). So heat flows hot→cold by itself; the reverse would lower total entropy — forbidden by the 2nd law.</span>
        </div>
      </>
    );
  } else {
    const n = 1, ratio = 1 + m, dS = n * R * Math.log(ratio);
    const bx = 60, by = 70, bw = 360, bh = 200, mid = bx + bw / 2;
    const wallX = mid;                                  // partition position
    const accRight = bx + bw * (0.5 + 0.5 * m);         // right edge of accessible region
    const parts = Array.from({ length: 44 }, (_, i) => {
      const hx = (i * 0.6180339) % 1, hy = (i * 0.7548 + 0.13) % 1;
      const x = bx + 8 + hx * (accRight - bx - 16);
      const y = by + 10 + hy * (bh - 20);
      return <circle key={i} cx={x} cy={y} r={3.2} fill={thermalColor(0.5)} opacity={0.9} />;
    });
    figure = (
      <div style={fwrap}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Free expansion, entropy increase ${dS.toFixed(2)} joules per kelvin`}>
          <rect x={bx} y={by} width={bw} height={bh} rx={6} fill="color-mix(in oklab, var(--stage-accent) 8%, transparent)" stroke="var(--stage-metal)" strokeWidth={3} />
          {/* vacuum label on the empty side */}
          {m < 0.98 && <text x={(accRight + bx + bw) / 2} y={by + bh / 2} textAnchor="middle" fontSize={12} fill="var(--stage-muted)">vacuum</text>}
          {parts}
          {/* partition (fades as it opens) */}
          <line x1={wallX} y1={by} x2={wallX} y2={by + bh} stroke="var(--stage-warn)" strokeWidth={4} strokeDasharray="6 5" opacity={1 - m} />
          <text x={bx + bw / 2} y={by + bh + 22} textAnchor="middle" fontSize={11} fill="var(--stage-muted)">{m < 0.02 ? 'gas confined to the left half' : m > 0.98 ? 'gas fills the whole box' : 'spreading…'}</text>
        </svg>
      </div>
    );
    aside = (
      <>
        <Callout tone="result"><span style={{ fontWeight: 800, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>ΔS = +{dS.toFixed(2)} J/K</span></Callout>
        <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
          <Tex tex={'\\Delta S = nR\\,\\ln\\!\\dfrac{V_f}{V_i}'} block />
          <span style={{ color: 'var(--stage-muted)' }}>No heat, no work — yet entropy still rises, because the gas now has far more ways to arrange itself. Fully open (Vf = 2Vi) gives <strong style={{ color: 'var(--stage-fg)' }}>nR·ln 2 ≈ 5.76 J/K</strong>. You’ll never see it pile back into one half on its own.</span>
        </div>
      </>
    );
  }

  const controls = (
    <div style={{ display: 'grid', gap: 10 }}>
      <ControlBar>
        <Field label="process">
          <span className="lab-field-row">
            <Chip selected={mode === 'heat'} onClick={() => setMode('heat')}>heat flows hot→cold</Chip>
            <Chip selected={mode === 'expansion'} onClick={() => setMode('expansion')}>free expansion (spreading)</Chip>
          </span>
        </Field>
      </ControlBar>
      {mode === 'heat' ? (
        <ControlBar>
          <Field label="hot Th" value={`${Th} K`}><Slider value={Th} min={310} max={800} step={10} onChange={setTh} ariaLabel="hot temperature" /></Field>
          <Field label="cold Tc" value={`${Math.min(Tc, Th)} K`}><Slider value={Tc} min={250} max={800} step={10} onChange={setTc} ariaLabel="cold temperature" /></Field>
          <Field label="heat Q" value={`${Q} J`}><Slider value={Q} min={200} max={3000} step={100} onChange={setQ} ariaLabel="heat transferred" /></Field>
        </ControlBar>
      ) : (
        <ControlBar>
          <Field label="open the partition" value={`${Math.round(m * 100)}%`}><Slider value={m} min={0} max={1} step={0.05} onChange={setM} ariaLabel="partition openness" /></Field>
        </ControlBar>
      )}
    </div>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls}>{figure}</LabFrame>;
}

const fwrap: React.CSSProperties = { borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' };
