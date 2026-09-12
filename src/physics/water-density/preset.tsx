'use client';

/**
 * WaterDensityLab, water's strange, life-saving anomaly. Almost everything gets
 * denser as it cools, but water is DENSEST at about 4 °C; cool it further toward 0
 * and it expands again, and ice is less dense still, so ice floats.
 *
 *   • THE 4 °C ANOMALY, a density–temperature curve that peaks at 4 °C (zoomed in,
 *     because the bump is tiny). Drag the temperature and watch the density rise to
 *     a maximum at 4 °C, then fall.
 *   • WHY LAKES FREEZE TOP-DOWN, a lake cross-section: the densest 4 °C water sinks
 *     to the bottom, colder water sits above it, and ice forms on the surface. The
 *     ice blanket insulates the liquid water below, so fish survive the winter.
 *
 * If water behaved "normally", lakes would freeze solid from the bottom up and kill
 * everything in them. Interactive, no simulation loop. Pure SVG, themed.
 */

import { useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Slider, Segmented } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { thermalColor } from '../../kit/thermal.js';
import { DiagramLabel } from '../../kit/annotate.js';
import { ResetTransport, SceneSurface } from '../mechanics/presentation.js';
import { ThermalActivity } from '../thermal/activity.js';

type Mode = 'anomaly' | 'lake';

export interface WaterDensityProps {
  mode?: Mode;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

const W = 640,
  H = 360;
// background-coloured text outline so annotations stay legible over the curve
// real liquid-water density (kg/m³), zoomed on the 0–25 °C region where the anomaly lives
const SAMPLES: [number, number][] = [
  [0, 999.84],
  [1, 999.9],
  [2, 999.94],
  [3, 999.96],
  [4, 999.97],
  [5, 999.96],
  [6, 999.94],
  [8, 999.85],
  [10, 999.7],
  [15, 999.1],
  [20, 998.2],
  [25, 997.05],
];
const ICE_RHO = 916.7;
const T_MAX = 25,
  RHO_LO = 997.0,
  RHO_HI = 1000.15;

function densityOf(t: number): number {
  const tc = Math.max(0, Math.min(T_MAX, t));
  for (let i = 0; i < SAMPLES.length - 1; i++) {
    const [t0, r0] = SAMPLES[i]!,
      [t1, r1] = SAMPLES[i + 1]!;
    if (tc <= t1) return r0 + (r1 - r0) * ((tc - t0) / (t1 - t0));
  }
  return SAMPLES[SAMPLES.length - 1]![1];
}

export function WaterDensityLab({
  mode: mode0 = 'anomaly',
  title = 'Water’s 4 °C anomaly: why ice floats',
  prompt = 'Almost everything shrinks as it cools, but water is densest at 4 °C and expands again toward freezing, so ice floats and lakes freeze from the top down.',
  objectives = [
    'See water reach maximum density at about 4 °C (not at 0 °C)',
    'Explain why ice floats, it is LESS dense than liquid water',
    'Explain why a lake freezes top-down, leaving 4 °C water (and fish) below',
  ],
  activity,
}: WaterDensityProps = {}): ReactNode {
  const [mode, setMode] = useState<Mode>(mode0);
  const [tC, setTC] = useState(12);

  const GX0 = 70,
    GX1 = 600,
    GY0 = 40,
    GY1 = 300;
  const PX = (t: number): number => GX0 + (t / T_MAX) * (GX1 - GX0);
  const PY = (r: number): number => GY1 - ((r - RHO_LO) / (RHO_HI - RHO_LO)) * (GY1 - GY0);
  const rho = densityOf(tC);

  let figure: ReactNode;

  if (mode === 'anomaly') {
    const curve = SAMPLES.map(([t, r]) => `${PX(t).toFixed(1)},${PY(r).toFixed(1)}`).join(' ');
    figure = (
      <SceneSurface className="physics-water-density-scene">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={`Water density ${rho.toFixed(2)} kilograms per cubic metre at ${tC} degrees`}
        >
          {/* axes */}
          <line x1={GX0} y1={GY0} x2={GX0} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
          <line x1={GX0} y1={GY1} x2={GX1} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
          <text x={GX0 - 6} y={GY0 + 2} textAnchor="end" fontSize={13} fill="var(--stage-muted)">
            ρ (kg/m³)
          </text>
          <text x={(GX0 + GX1) / 2} y={GY1 + 32} textAnchor="middle" fontSize={13} fill="var(--stage-muted)">
            temperature (°C) →
          </text>
          {/* x ticks */}
          {[0, 4, 10, 15, 20, 25].map((t) => (
            <g key={t}>
              <line x1={PX(t)} y1={GY1} x2={PX(t)} y2={GY1 + 4} stroke="var(--stage-muted)" strokeWidth={1} />
              <text x={PX(t)} y={GY1 + 18} textAnchor="middle" fontSize={13} fill="var(--stage-muted)">
                {t}
              </text>
            </g>
          ))}
          {/* max-density guide at 4 °C (haloed so it reads over the curve peak) */}
          <line
            x1={PX(4)}
            y1={GY0}
            x2={PX(4)}
            y2={GY1}
            stroke="var(--stage-good)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <DiagramLabel
            x={PX(4) + 8}
            y={GY0 + 14}
            text="densest at 4 °C"
            tone="good"
            fontSize={14}
            fontWeight={700}
            anchor="start"
            bounds={{ left: 8, right: W - 8, top: 8, bottom: H - 8 }}
          />
          {/* curve */}
          <polyline
            points={curve}
            fill="none"
            stroke="var(--stage-accent)"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle cx={PX(4)} cy={PY(999.97)} r={5} fill="var(--stage-good)" />
          {/* live marker */}
          <circle
            cx={PX(tC)}
            cy={PY(rho)}
            r={6}
            fill={thermalColor(tC / T_MAX)}
            stroke="var(--stage-bg)"
            strokeWidth={2}
          />
          <line
            x1={PX(tC)}
            y1={PY(rho)}
            x2={PX(tC)}
            y2={GY1}
            stroke="var(--stage-muted)"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />
          {/* cooling-direction notes, kept CLEAR of the curve + haloed */}
          <DiagramLabel
            x={PX(15)}
            y={PY(997.55)}
            text="25 → 4 °C: denser, sinks"
            tone="muted"
            fontSize={13}
            fontWeight={600}
            bounds={{ left: 8, right: W - 8, top: 8, bottom: H - 8 }}
          />
          <DiagramLabel
            x={PX(2)}
            y={PY(999.45)}
            text="4 → 0 °C: lighter, rises"
            tone="muted"
            fontSize={13}
            fontWeight={600}
            anchor="start"
            bounds={{ left: 8, right: W - 8, top: 8, bottom: H - 8 }}
          />
        </svg>
      </SceneSurface>
    );
  } else {
    // frozen-lake cross-section
    const lx = 60,
      rx = 580,
      top = 60,
      bot = 300;
    const iceBot = top + 34;
    const bands = [
      { y0: iceBot, y1: top + 90, t: 0, label: '0 °C: just above freezing' },
      { y0: top + 90, y1: top + 150, t: 2, label: '2 °C' },
      { y0: top + 150, y1: top + 210, t: 3, label: '3 °C' },
      { y0: top + 210, y1: bot, t: 4, label: '4 °C: densest water sinks here' },
    ];
    figure = (
      <SceneSurface className="physics-water-density-scene">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label="Lake cross-section freezing from the top down with 4 degree water at the bottom"
        >
          {/* sky / cold air */}
          <rect
            x={lx}
            y={top - 30}
            width={rx - lx}
            height={30}
            fill="color-mix(in oklab, var(--stage-accent) 8%, var(--stage-bg))"
          />
          <text x={lx + 8} y={top - 12} fontSize={14} fill="var(--stage-muted)">
            cold air
          </text>
          {/* water bands, coldest (top) → 4 °C (bottom) */}
          {bands.map((b, i) => (
            <g key={i}>
              <rect
                x={lx}
                y={b.y0}
                width={rx - lx}
                height={b.y1 - b.y0}
                fill={thermalColor(b.t / T_MAX)}
                opacity={0.4}
              />
              <DiagramLabel
                x={rx - 10}
                y={(b.y0 + b.y1) / 2}
                text={b.label}
                tone="foreground"
                anchor="end"
                fontSize={14}
                fontWeight={650}
                bounds={{ left: lx + 8, right: rx - 8, top: top, bottom: bot }}
              />
            </g>
          ))}
          {/* ice cap on top (less dense → floats) */}
          <rect
            x={lx}
            y={top}
            width={rx - lx}
            height={iceBot - top}
            fill="color-mix(in oklab, #cfeaff 75%, var(--stage-bg))"
            stroke="color-mix(in oklab, #2b7fff 40%, transparent)"
            strokeWidth={1.5}
          />
          <text x={lx + 10} y={top + 22} fontSize={12} fontWeight={800} fill="#2b6fb8">
            ICE floats (less dense)
          </text>
          {/* fish surviving at the bottom */}
          {(
            [
              [140, 270],
              [250, 282],
              [430, 268],
            ] as [number, number][]
          ).map(([fx, fy], i) => (
            <g key={i} fill="var(--stage-fg)" opacity={0.75}>
              <ellipse cx={fx} cy={fy} rx={12} ry={6} />
              <polygon points={`${fx + 11},${fy} ${fx + 20},${fy - 5} ${fx + 20},${fy + 5}`} />
              <circle cx={fx - 6} cy={fy - 1} r={1.4} fill="var(--stage-bg)" />
            </g>
          ))}
          {/* lake walls */}
          <path
            d={`M ${lx} ${top} L ${lx} ${bot} L ${rx} ${bot} L ${rx} ${top}`}
            fill="none"
            stroke="var(--stage-metal)"
            strokeWidth={3}
          />
          {/* sink arrow */}
          <text x={lx + 30} y={bot - 14} fontSize={16} fill="var(--stage-accent)">
            ↓ 4 °C sinks
          </text>
        </svg>
      </SceneSurface>
    );
  }

  const instruments =
    mode === 'anomaly' ? (
      <>
        <div className="physics-probe">
          <span>Liquid density</span>
          <strong>ρ = {rho.toFixed(2)} kg/m³</strong>
          <small>
            at {tC} °C{Math.abs(tC - 4) < 0.6 ? ' · maximum density' : ''}
          </small>
        </div>
        <div className="physics-thermal-model physics-explain">
          <span>
            As liquid water cools it gets denser, but only down to{' '}
            <strong className="physics-emphasis">4 °C</strong>. Cool it further and the molecules begin lining
            up into the open hexagonal structure of ice, so it{' '}
            <strong className="physics-emphasis">expands</strong>.
          </span>
          <span>
            Ice itself is only <strong className="physics-emphasis">{ICE_RHO} kg/m³</strong>, much less than
            water, which is why it floats.
          </span>
        </div>
      </>
    ) : (
      <div className="physics-thermal-model physics-explain">
        <span>
          Because the densest water is at <strong className="physics-emphasis">4 °C</strong>, it sinks to the
          bottom. Colder water (0–3 °C) is lighter and stays on top, where it finally freezes into floating
          ice.
        </span>
        <span>
          The ice blanket <strong className="physics-emphasis">insulates</strong> the water beneath, so the
          lake never freezes solid, and the fish survive at 4 °C. If water were "normal", lakes would freeze
          bottom-up and kill everything.
        </span>
      </div>
    );

  const controls = (
    <>
      <>
        <Field label="view">
          <Segmented
            ariaLabel="view"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'anomaly', label: 'the 4 °C anomaly' },
              { value: 'lake', label: 'why lakes freeze top-down' },
            ]}
          />
        </Field>
      </>
      {mode === 'anomaly' && (
        <>
          <Field label="temperature" value={`${tC} °C`}>
            <Slider
              value={tC}
              min={0}
              max={25}
              step={1}
              onChange={setTC}
              ariaLabel="water temperature (Celsius)"
            />
          </Field>
        </>
      )}
    </>
  );

  const reset = (): void => {
    setMode(mode0);
    setTC(12);
  };
  return (
    <ThermalActivity
      activity={activity}
      className="physics-water-density"
      title={title}
      prompt={prompt}
      status={
        <>
          <strong>{mode === 'anomaly' ? 'Density anomaly' : 'Lake in winter'}</strong>
          {mode === 'anomaly' ? (
            <>
              <span>{tC} °C</span>
              <span>{rho.toFixed(2)} kg/m³</span>
            </>
          ) : (
            <span>4 °C water remains below</span>
          )}
        </>
      }
      figure={figure}
      instruments={instruments}
      controls={controls}
      feedback={
        mode === 'anomaly'
          ? 'Water becomes denser as it cools only until 4 °C; below that temperature its open molecular structure expands.'
          : 'Floating ice insulates the liquid below while the densest 4 °C water remains at the bottom.'
      }
      objectives={objectives}
      transport={
        <ResetTransport
          onReset={reset}
          state={mode === 'anomaly' ? `${rho.toFixed(2)} kg/m³ at ${tC} °C` : 'Lake freezes from the top'}
          detail={mode === 'anomaly' ? 'maximum near 4 °C' : 'liquid water survives below'}
          resetLabel="Reset water density"
        />
      }
      canvasLabel="Water density anomaly and frozen-lake model"
      inspectorLabel="Density explanation and temperature"
    />
  );
}
