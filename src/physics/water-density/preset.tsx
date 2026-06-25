'use client';

/**
 * WaterDensityLab — water's strange, life-saving anomaly. Almost everything gets
 * denser as it cools, but water is DENSEST at about 4 °C; cool it further toward 0
 * and it expands again, and ice is less dense still — so ice floats.
 *
 *   • THE 4 °C ANOMALY — a density–temperature curve that peaks at 4 °C (zoomed in,
 *     because the bump is tiny). Drag the temperature and watch the density rise to
 *     a maximum at 4 °C, then fall.
 *   • WHY LAKES FREEZE TOP-DOWN — a lake cross-section: the densest 4 °C water sinks
 *     to the bottom, colder water sits above it, and ice forms on the surface. The
 *     ice blanket insulates the liquid water below, so fish survive the winter.
 *
 * If water behaved "normally", lakes would freeze solid from the bottom up and kill
 * everything in them. Interactive, no simulation loop. Pure SVG, themed.
 */

import { useState, type ReactNode } from 'react';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { thermalColor } from '../../kit/thermal.js';

type Mode = 'anomaly' | 'lake';

export interface WaterDensityProps {
  mode?: Mode;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const W = 640, H = 360;
// real liquid-water density (kg/m³), zoomed on the 0–25 °C region where the anomaly lives
const SAMPLES: [number, number][] = [
  [0, 999.84], [1, 999.90], [2, 999.94], [3, 999.96], [4, 999.97], [5, 999.96],
  [6, 999.94], [8, 999.85], [10, 999.70], [15, 999.10], [20, 998.20], [25, 997.05],
];
const ICE_RHO = 916.7;
const T_MAX = 25, RHO_LO = 997.0, RHO_HI = 1000.15;

function densityOf(t: number): number {
  const tc = Math.max(0, Math.min(T_MAX, t));
  for (let i = 0; i < SAMPLES.length - 1; i++) {
    const [t0, r0] = SAMPLES[i]!, [t1, r1] = SAMPLES[i + 1]!;
    if (tc <= t1) return r0 + (r1 - r0) * ((tc - t0) / (t1 - t0));
  }
  return SAMPLES[SAMPLES.length - 1]![1];
}

export function WaterDensityLab({
  mode: mode0 = 'anomaly',
  title = 'Water’s 4 °C anomaly — why ice floats',
  prompt = 'Almost everything shrinks as it cools, but water is densest at 4 °C and expands again toward freezing — so ice floats and lakes freeze from the top down.',
  objectives = [
    'See water reach maximum density at about 4 °C (not at 0 °C)',
    'Explain why ice floats — it is LESS dense than liquid water',
    'Explain why a lake freezes top-down, leaving 4 °C water (and fish) below',
  ],
}: WaterDensityProps = {}): ReactNode {
  const [mode, setMode] = useState<Mode>(mode0);
  const [tC, setTC] = useState(12);

  const GX0 = 70, GX1 = 600, GY0 = 40, GY1 = 300;
  const PX = (t: number): number => GX0 + (t / T_MAX) * (GX1 - GX0);
  const PY = (r: number): number => GY1 - ((r - RHO_LO) / (RHO_HI - RHO_LO)) * (GY1 - GY0);
  const rho = densityOf(tC);

  let figure: ReactNode;

  if (mode === 'anomaly') {
    const curve = SAMPLES.map(([t, r]) => `${PX(t).toFixed(1)},${PY(r).toFixed(1)}`).join(' ');
    figure = (
      <div style={fwrap}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Water density ${rho.toFixed(2)} kilograms per cubic metre at ${tC} degrees`}>
          {/* axes */}
          <line x1={GX0} y1={GY0} x2={GX0} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
          <line x1={GX0} y1={GY1} x2={GX1} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
          <text x={GX0 - 6} y={GY0 + 2} textAnchor="end" fontSize={10} fill="var(--stage-muted)">ρ (kg/m³)</text>
          <text x={(GX0 + GX1) / 2} y={GY1 + 32} textAnchor="middle" fontSize={10} fill="var(--stage-muted)">temperature (°C) →</text>
          {/* x ticks */}
          {[0, 4, 10, 15, 20, 25].map((t) => (
            <g key={t}><line x1={PX(t)} y1={GY1} x2={PX(t)} y2={GY1 + 4} stroke="var(--stage-muted)" strokeWidth={1} /><text x={PX(t)} y={GY1 + 16} textAnchor="middle" fontSize={10} fill="var(--stage-muted)">{t}</text></g>
          ))}
          {/* max-density guide at 4 °C */}
          <line x1={PX(4)} y1={GY0} x2={PX(4)} y2={GY1} stroke="var(--stage-good)" strokeWidth={1} strokeDasharray="4 4" />
          <text x={PX(4) + 5} y={GY0 + 12} fontSize={11} fontWeight={700} fill="var(--stage-good)">densest at 4 °C</text>
          {/* curve */}
          <polyline points={curve} fill="none" stroke="var(--stage-accent)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={PX(4)} cy={PY(999.97)} r={5} fill="var(--stage-good)" />
          {/* live marker */}
          <circle cx={PX(tC)} cy={PY(rho)} r={6} fill={thermalColor(tC / T_MAX)} stroke="var(--stage-bg)" strokeWidth={2} />
          <line x1={PX(tC)} y1={PY(rho)} x2={PX(tC)} y2={GY1} stroke="var(--stage-muted)" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
          {/* cooling-direction note */}
          <text x={PX(15)} y={PY(998.0)} fontSize={10} fill="var(--stage-muted)">cooling 25→4 °C: denser → sinks</text>
          <text x={PX(0.4)} y={PY(999.6)} fontSize={10} fill="var(--stage-muted)">4→0 °C: lighter → rises</text>
        </svg>
      </div>
    );
  } else {
    // frozen-lake cross-section
    const lx = 60, rx = 580, top = 60, bot = 300;
    const iceBot = top + 34;
    const bands = [
      { y0: iceBot, y1: top + 90, t: 0, label: '0 °C — just above freezing' },
      { y0: top + 90, y1: top + 150, t: 2, label: '2 °C' },
      { y0: top + 150, y1: top + 210, t: 3, label: '3 °C' },
      { y0: top + 210, y1: bot, t: 4, label: '4 °C — densest water sinks here' },
    ];
    figure = (
      <div style={fwrap}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Lake cross-section freezing from the top down with 4 degree water at the bottom">
          {/* sky / cold air */}
          <rect x={lx} y={top - 30} width={rx - lx} height={30} fill="color-mix(in oklab, var(--stage-accent) 8%, var(--stage-bg))" />
          <text x={lx + 8} y={top - 12} fontSize={11} fill="var(--stage-muted)">cold air ❄</text>
          {/* water bands, coldest (top) → 4 °C (bottom) */}
          {bands.map((b, i) => (
            <g key={i}>
              <rect x={lx} y={b.y0} width={rx - lx} height={b.y1 - b.y0} fill={thermalColor(b.t / T_MAX)} opacity={0.4} />
              <text x={rx - 10} y={(b.y0 + b.y1) / 2 + 4} textAnchor="end" fontSize={11} fill="var(--stage-fg)">{b.label}</text>
            </g>
          ))}
          {/* ice cap on top (less dense → floats) */}
          <rect x={lx} y={top} width={rx - lx} height={iceBot - top} fill="color-mix(in oklab, #cfeaff 75%, var(--stage-bg))" stroke="color-mix(in oklab, #2b7fff 40%, transparent)" strokeWidth={1.5} />
          <text x={lx + 10} y={top + 22} fontSize={12} fontWeight={800} fill="#2b6fb8">ICE floats (less dense)</text>
          {/* fish surviving at the bottom */}
          {([[140, 270], [250, 282], [430, 268]] as [number, number][]).map(([fx, fy], i) => (
            <g key={i} fill="var(--stage-fg)" opacity={0.75}>
              <ellipse cx={fx} cy={fy} rx={12} ry={6} />
              <polygon points={`${fx + 11},${fy} ${fx + 20},${fy - 5} ${fx + 20},${fy + 5}`} />
              <circle cx={fx - 6} cy={fy - 1} r={1.4} fill="var(--stage-bg)" />
            </g>
          ))}
          {/* lake walls */}
          <path d={`M ${lx} ${top} L ${lx} ${bot} L ${rx} ${bot} L ${rx} ${top}`} fill="none" stroke="var(--stage-metal)" strokeWidth={3} />
          {/* sink arrow */}
          <text x={lx + 30} y={bot - 14} fontSize={16} fill="var(--stage-accent)">↓ 4 °C sinks</text>
        </svg>
      </div>
    );
  }

  const aside = mode === 'anomaly' ? (
    <>
      <Callout tone="result"><span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800 }}>
        <span style={{ fontSize: 16 }}>ρ = {rho.toFixed(2)} kg/m³</span><br />at {tC} °C{Math.abs(tC - 4) < 0.6 ? ' — maximum!' : ''}
      </span></Callout>
      <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13, color: 'var(--stage-muted)' }}>
        <span>As liquid water cools it gets denser — but only down to <strong style={{ color: 'var(--stage-fg)' }}>4 °C</strong>. Cool it further and the molecules begin lining up into the open hexagonal structure of ice, so it <strong style={{ color: 'var(--stage-fg)' }}>expands</strong>.</span>
        <span>Ice itself is only <strong style={{ color: 'var(--stage-fg)' }}>{ICE_RHO} kg/m³</strong> — much less than water — which is why it floats.</span>
      </div>
    </>
  ) : (
    <div style={{ display: 'grid', gap: 8, padding: '2px 2px 0', fontSize: 13, color: 'var(--stage-muted)' }}>
      <Callout tone="info"><span>Because the densest water is at <strong style={{ color: 'var(--stage-fg)' }}>4 °C</strong>, it sinks to the bottom. Colder water (0–3 °C) is lighter and stays on top, where it finally freezes into floating ice.</span></Callout>
      <span>The ice blanket <strong style={{ color: 'var(--stage-fg)' }}>insulates</strong> the water beneath, so the lake never freezes solid — and the fish survive at 4 °C. If water were "normal", lakes would freeze bottom-up and kill everything.</span>
    </div>
  );

  const controls = (
    <div style={{ display: 'grid', gap: 10 }}>
      <ControlBar>
        <Field label="view">
          <span className="lab-field-row">
            <Chip selected={mode === 'anomaly'} onClick={() => setMode('anomaly')}>the 4 °C anomaly</Chip>
            <Chip selected={mode === 'lake'} onClick={() => setMode('lake')}>why lakes freeze top-down</Chip>
          </span>
        </Field>
      </ControlBar>
      {mode === 'anomaly' && (
        <ControlBar>
          <Field label="temperature" value={`${tC} °C`}>
            <Slider value={tC} min={0} max={25} step={1} onChange={setTC} ariaLabel="water temperature (Celsius)" />
          </Field>
        </ControlBar>
      )}
    </div>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls}>{figure}</LabFrame>;
}

const fwrap: React.CSSProperties = { borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' };
