'use client';

/**
 * EfficiencyLab, efficiency as the input→output RATIO you can see. Energy flows in
 * on the left and splits into a USEFUL output stream and WASTED streams (usually
 * heat), drawn as a Sankey: each ribbon's thickness is its share of the energy, so
 * efficiency η = useful / input is literally the fraction of the flow that stays
 * green. Compare an incandescent bulb (≈5%) with an LED (≈45%), a petrol engine
 * (≈25%) with an electric motor (≈90%), and feel why "wasted as heat" matters.
 *
 * The device is AUTHORABLE: a creator declares the streams (label, share, useful or
 * waste) so the same lab draws any energy-flow / efficiency diagram. Interactive
 * resize on every change; press Play to watch the energy actually stream. Pure SVG.
 */

import { useId, useRef, useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { ActivitySelect } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { usePlayGate } from '../../kit/play.js';
import { Tex } from '../../core/tex.js';
import { SceneSurface, SimulationTransport } from '../mechanics/presentation.js';
import { ThermalActivity } from '../thermal/activity.js';

export interface EffStream {
  label: string;
  /** Share of the input (any positive units; normalised). */
  share: number;
  kind: 'useful' | 'waste';
  color?: string;
}
export interface EfficiencyProps {
  /** Built-in device preset (ignored if `streams` is given). */
  device?: 'incandescent' | 'led' | 'petrol-engine' | 'electric-motor' | 'power-station' | 'human';
  deviceName?: string;
  /** Energy supplied, J (default 100, so shares read as percentages). */
  inputJoules?: number;
  /** Short source label shown above the incoming flow. */
  inputLabel?: string;
  /** Author your own breakdown, overrides the preset entirely. */
  streams?: EffStream[];
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

const W = 720,
  H = 320;
const GREEN = 'var(--stage-good, #16a34a)';
const HEAT = 'var(--stage-danger, #d65a3c)';
const PRESETS: Record<string, { name: string; streams: EffStream[] }> = {
  incandescent: {
    name: 'Incandescent bulb',
    streams: [
      { label: 'Light', share: 5, kind: 'useful' },
      { label: 'Heat', share: 95, kind: 'waste' },
    ],
  },
  led: {
    name: 'LED bulb',
    streams: [
      { label: 'Light', share: 45, kind: 'useful' },
      { label: 'Heat', share: 55, kind: 'waste' },
    ],
  },
  'petrol-engine': {
    name: 'Petrol engine',
    streams: [
      { label: 'Motion', share: 25, kind: 'useful' },
      { label: 'Heat (exhaust + cooling)', share: 75, kind: 'waste' },
    ],
  },
  'electric-motor': {
    name: 'Electric motor',
    streams: [
      { label: 'Motion', share: 90, kind: 'useful' },
      { label: 'Heat', share: 10, kind: 'waste' },
    ],
  },
  'power-station': {
    name: 'Thermal power station',
    streams: [
      { label: 'Electricity', share: 40, kind: 'useful' },
      { label: 'Heat (cooling towers)', share: 60, kind: 'waste' },
    ],
  },
  human: {
    name: 'Human body',
    streams: [
      { label: 'Useful work', share: 25, kind: 'useful' },
      { label: 'Heat', share: 75, kind: 'waste' },
    ],
  },
};
const ORDER = ['incandescent', 'led', 'petrol-engine', 'electric-motor', 'power-station', 'human'] as const;

export function EfficiencyLab({
  device: device0 = 'incandescent',
  deviceName,
  inputJoules = 100,
  inputLabel = 'Energy supplied',
  streams: streamsProp,
  title = 'Efficiency: how much of the energy is useful?',
  prompt = 'Energy in splits into useful output and wasted energy (mostly heat). Efficiency is the fraction that comes out useful: η = useful ÷ input. Compare the devices.',
  objectives = [
    'Define efficiency as the input→output ratio η = useful energy ÷ total input',
    'Read a Sankey diagram, ribbon thickness is energy share',
    'Compare real devices and see where energy is wasted (heat)',
  ],
  activity,
}: EfficiencyProps = {}): ReactNode {
  const [device, setDevice] = useState(device0);
  const svgId = useId().replaceAll(':', '');
  const tRef = useRef(0);
  const gate = usePlayGate();
  useFrameTick(gate.running, (f) => {
    tRef.current += Math.min(0.05, f.dtMs / 1000);
  });
  const t = tRef.current;

  const preset = PRESETS[device]!;
  const streams = streamsProp && streamsProp.length ? streamsProp : preset.streams;
  const name = deviceName ?? (streamsProp ? 'Device' : preset.name);
  const total = streams.reduce((a, s) => a + Math.max(0, s.share), 0) || 1;
  const usefulFrac = streams.filter((s) => s.kind === 'useful').reduce((a, s) => a + s.share, 0) / total;
  const colorOf = (s: EffStream): string => s.color ?? (s.kind === 'useful' ? GREEN : HEAT);

  // ── Sankey geometry ──
  const INX1 = 154,
    OUTX = 510,
    TOP = 78,
    BOT = 268,
    bandH = BOT - TOP;
  // input stack (source order: useful first, then waste)
  const ordered = [...streams].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'useful' ? -1 : 1));
  let yi = TOP;
  const inSeg = ordered.map((s) => {
    const h = (s.share / total) * bandH;
    const seg = { s, y0: yi, y1: yi + h };
    yi += h;
    return seg;
  });
  // output stack with a gap between the useful group and the waste group
  const usefulH = ordered
    .filter((s) => s.kind === 'useful')
    .reduce((a, s) => a + (s.share / total) * bandH, 0);
  const GAP = 26;
  let yo = TOP,
    started = false;
  const outSeg = ordered.map((s) => {
    if (s.kind === 'waste' && !started) {
      started = true;
      yo = TOP + usefulH + GAP;
    }
    const h = (s.share / total) * (bandH - GAP * 0);
    const seg = { s, y0: yo, y1: yo + h };
    yo += h;
    return seg;
  });

  const ribbon = (a: { y0: number; y1: number }, b: { y0: number; y1: number }, color: string): ReactNode => {
    const mx = (INX1 + OUTX) / 2;
    return (
      <path
        d={`M ${INX1} ${a.y0} C ${mx} ${a.y0}, ${mx} ${b.y0}, ${OUTX} ${b.y0} L ${OUTX} ${b.y1} C ${mx} ${b.y1}, ${mx} ${a.y1}, ${INX1} ${a.y1} Z`}
        fill={color}
        fillOpacity={0.5}
      />
    );
  };

  // flow particles along each ribbon centreline
  const flow: ReactNode[] = [];
  if (gate.playing) {
    inSeg.forEach((seg, k) => {
      const o = outSeg[k]!;
      const yMidA = (seg.y0 + seg.y1) / 2,
        yMidB = (o.y0 + o.y1) / 2;
      const n = Math.max(1, Math.round((seg.s.share / total) * 14));
      for (let i = 0; i < n; i++) {
        const u = (t * 0.5 + i / n) % 1;
        const x = INX1 + u * (OUTX - INX1);
        const e = u * u * (3 - 2 * u);
        const y = yMidA + (yMidB - yMidA) * e;
        flow.push(<circle key={`${k}-${i}`} cx={x} cy={y} r={2.6} fill={colorOf(seg.s)} opacity={0.9} />);
      }
    });
  }

  const figure = (
    <SceneSurface className="physics-efficiency-scene" tone="grid">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`${name}, efficiency ${Math.round(usefulFrac * 100)} percent`}
      >
        <defs>
          <linearGradient id={`${svgId}-input`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="var(--stage-accent, #3b82f6)" />
            <stop offset="1" stopColor="color-mix(in oklab, var(--stage-accent, #3b82f6) 65%, white)" />
          </linearGradient>
          <filter id={`${svgId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="currentColor" floodOpacity=".12" />
          </filter>
        </defs>
        {/* input bar */}
        <rect
          x={88}
          y={TOP}
          width={INX1 - 88}
          height={bandH}
          rx={10}
          fill={`url(#${svgId}-input)`}
          filter={`url(#${svgId}-shadow)`}
        />
        <text
          x={88}
          y={TOP - 20}
          fontSize={11}
          fontWeight={750}
          letterSpacing=".08em"
          fill="var(--stage-muted)"
        >
          {inputLabel.toUpperCase()}
        </text>
        <text x={88} y={TOP - 4} fontSize={16} fontWeight={780} fill="var(--stage-fg)">
          {inputJoules} J
        </text>
        <text
          className="physics-svg-on-fill"
          x={121}
          y={TOP + bandH / 2 - 5}
          textAnchor="middle"
          fontSize={17}
          fontWeight={800}
        >
          100%
        </text>
        <text
          className="physics-svg-on-fill"
          x={121}
          y={TOP + bandH / 2 + 14}
          textAnchor="middle"
          fontSize={9}
          fontWeight={750}
          letterSpacing=".06em"
          opacity={0.92}
        >
          INPUT
        </text>
        {/* ribbons */}
        {inSeg.map((seg, k) => (
          <g key={k}>{ribbon(seg, outSeg[k]!, colorOf(seg.s))}</g>
        ))}
        {flow}
        {/* output labels */}
        {outSeg.map((seg, k) => {
          const j = (seg.s.share / total) * inputJoules;
          return (
            <g key={k}>
              <rect
                x={OUTX}
                y={seg.y0}
                width={8}
                height={Math.max(4, seg.y1 - seg.y0)}
                rx={4}
                fill={colorOf(seg.s)}
              />
              <text
                x={OUTX + 20}
                y={(seg.y0 + seg.y1) / 2 - 4}
                fontSize={15}
                fontWeight={780}
                fill={colorOf(seg.s)}
              >
                {seg.s.label}
              </text>
              <text
                className="physics-svg-numeric"
                x={OUTX + 20}
                y={(seg.y0 + seg.y1) / 2 + 15}
                fontSize={12}
                fontWeight={650}
                fill="var(--stage-muted)"
              >
                {j.toFixed(0)} J · {Math.round((seg.s.share / total) * 100)}% · {seg.s.kind}
              </text>
            </g>
          );
        })}
      </svg>
    </SceneSurface>
  );

  const usefulJ = usefulFrac * inputJoules;
  const aside = (
    <>
      <div className="physics-probe">
        <span>Useful conversion</span>
        <strong>η = {Math.round(usefulFrac * 100)}%</strong>
        <small>{name}</small>
      </div>
      <div
        className="physics-efficiency-ledger"
        aria-label={`${usefulJ.toFixed(0)} joules useful and ${(inputJoules - usefulJ).toFixed(
          0,
        )} joules wasted`}
      >
        <div>
          <span>
            <i data-kind="useful" />
            Useful
          </span>
          <strong>{usefulJ.toFixed(0)} J</strong>
        </div>
        <progress max={inputJoules} value={usefulJ} aria-label="Useful energy share" />
        <div>
          <span>
            <i data-kind="waste" />
            Wasted
          </span>
          <strong>{(inputJoules - usefulJ).toFixed(0)} J</strong>
        </div>
        <progress
          data-kind="waste"
          max={inputJoules}
          value={inputJoules - usefulJ}
          aria-label="Wasted energy share"
        />
      </div>
      <div className="physics-efficiency-model">
        <Tex tex={'\\eta = \\dfrac{\\text{useful output}}{\\text{total input}}'} block />
        <p>Energy is conserved. Efficiency asks how much arrives in the output you actually want.</p>
      </div>
    </>
  );

  const controls = (
    <>
      <Field label="device">
        <ActivitySelect
          ariaLabel="device"
          value={device}
          onChange={(next) => {
            setDevice(next);
            tRef.current = 0;
          }}
          options={ORDER.map((key) => {
            const item = PRESETS[key]!;
            const useful = item.streams
              .filter((stream) => stream.kind === 'useful')
              .reduce((sum, stream) => sum + stream.share, 0);
            const total = item.streams.reduce((sum, stream) => sum + stream.share, 0);
            return { value: key, label: `${item.name} · ${Math.round((useful / total) * 100)}%` };
          })}
        />
      </Field>
    </>
  );

  const reset = (): void => {
    gate.setPlaying(false);
    tRef.current = 0;
    setDevice(device0);
  };
  return (
    <ThermalActivity
      activity={activity}
      className="physics-efficiency"
      title={title}
      prompt={prompt}
      status={
        <>
          <strong>{name}</strong>
          <span>η {Math.round(usefulFrac * 100)}%</span>
          <span>{usefulJ.toFixed(0)} J useful</span>
        </>
      }
      figure={figure}
      instruments={aside}
      controls={controls}
      feedback={`Of ${inputJoules} J supplied, ${usefulJ.toFixed(
        0,
      )} J becomes useful output. Ribbon width preserves the full energy balance.`}
      objectives={objectives}
      transport={
        <SimulationTransport
          running={gate.playing}
          onReset={reset}
          onToggle={() => gate.setPlaying(!gate.playing)}
          state={gate.playing ? 'Energy flowing' : 'Paused'}
          detail={`${Math.round(usefulFrac * 100)}% useful`}
          resetLabel="Reset efficiency comparison"
        />
      }
      canvasLabel="Sankey diagram of useful and wasted energy"
      inspectorLabel="Efficiency model and device comparison"
    />
  );
}
