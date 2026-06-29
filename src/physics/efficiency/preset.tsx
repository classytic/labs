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

import { useRef, useState, type ReactNode } from 'react';
import { Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { Tex } from '../../core/tex.js';

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
  /** Author your own breakdown, overrides the preset entirely. */
  streams?: EffStream[];
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const W = 720, H = 340;
const GREEN = 'var(--stage-good, #16a34a)';
const HEAT = 'rgb(214,90,60)';
const PRESETS: Record<string, { name: string; streams: EffStream[] }> = {
  incandescent: { name: 'Incandescent bulb', streams: [{ label: 'Light', share: 5, kind: 'useful' }, { label: 'Heat', share: 95, kind: 'waste' }] },
  led: { name: 'LED bulb', streams: [{ label: 'Light', share: 45, kind: 'useful' }, { label: 'Heat', share: 55, kind: 'waste' }] },
  'petrol-engine': { name: 'Petrol engine', streams: [{ label: 'Motion', share: 25, kind: 'useful' }, { label: 'Heat (exhaust + cooling)', share: 75, kind: 'waste' }] },
  'electric-motor': { name: 'Electric motor', streams: [{ label: 'Motion', share: 90, kind: 'useful' }, { label: 'Heat', share: 10, kind: 'waste' }] },
  'power-station': { name: 'Thermal power station', streams: [{ label: 'Electricity', share: 40, kind: 'useful' }, { label: 'Heat (cooling towers)', share: 60, kind: 'waste' }] },
  human: { name: 'Human body', streams: [{ label: 'Useful work', share: 25, kind: 'useful' }, { label: 'Heat', share: 75, kind: 'waste' }] },
};
const ORDER = ['incandescent', 'led', 'petrol-engine', 'electric-motor', 'power-station', 'human'] as const;

export function EfficiencyLab({
  device: device0 = 'incandescent',
  deviceName,
  inputJoules = 100,
  streams: streamsProp,
  title = 'Efficiency: how much of the energy is useful?',
  prompt = 'Energy in splits into useful output and wasted energy (mostly heat). Efficiency is the fraction that comes out useful: η = useful ÷ input. Compare the devices.',
  objectives = [
    'Define efficiency as the input→output ratio η = useful energy ÷ total input',
    'Read a Sankey diagram, ribbon thickness is energy share',
    'Compare real devices and see where energy is wasted (heat)',
  ],
}: EfficiencyProps = {}): ReactNode {
  const [device, setDevice] = useState(device0);
  const tRef = useRef(0);
  const gate = usePlayGate();
  useFrameTick(gate.running, (f) => { tRef.current += Math.min(0.05, f.dtMs / 1000); });
  const t = tRef.current;

  const preset = PRESETS[device]!;
  const streams = (streamsProp && streamsProp.length ? streamsProp : preset.streams);
  const name = deviceName ?? (streamsProp ? 'Device' : preset.name);
  const total = streams.reduce((a, s) => a + Math.max(0, s.share), 0) || 1;
  const usefulFrac = streams.filter((s) => s.kind === 'useful').reduce((a, s) => a + s.share, 0) / total;
  const colorOf = (s: EffStream): string => s.color ?? (s.kind === 'useful' ? GREEN : HEAT);

  // ── Sankey geometry ──
  const INX1 = 150, OUTX = 520, TOP = 80, BOT = 300, bandH = BOT - TOP;
  // input stack (source order: useful first, then waste)
  const ordered = [...streams].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'useful' ? -1 : 1));
  let yi = TOP;
  const inSeg = ordered.map((s) => { const h = (s.share / total) * bandH; const seg = { s, y0: yi, y1: yi + h }; yi += h; return seg; });
  // output stack with a gap between the useful group and the waste group
  const usefulH = ordered.filter((s) => s.kind === 'useful').reduce((a, s) => a + (s.share / total) * bandH, 0);
  const GAP = 26;
  let yo = TOP, started = false;
  const outSeg = ordered.map((s) => {
    if (s.kind === 'waste' && !started) { started = true; yo = TOP + usefulH + GAP; }
    const h = (s.share / total) * (bandH - GAP * 0); const seg = { s, y0: yo, y1: yo + h }; yo += h; return seg;
  });

  const ribbon = (a: { y0: number; y1: number }, b: { y0: number; y1: number }, color: string): ReactNode => {
    const mx = (INX1 + OUTX) / 2;
    return <path d={`M ${INX1} ${a.y0} C ${mx} ${a.y0}, ${mx} ${b.y0}, ${OUTX} ${b.y0} L ${OUTX} ${b.y1} C ${mx} ${b.y1}, ${mx} ${a.y1}, ${INX1} ${a.y1} Z`} fill={color} fillOpacity={0.5} />;
  };

  // flow particles along each ribbon centreline
  const flow: ReactNode[] = [];
  if (gate.playing) {
    inSeg.forEach((seg, k) => {
      const o = outSeg[k]!;
      const yMidA = (seg.y0 + seg.y1) / 2, yMidB = (o.y0 + o.y1) / 2;
      const n = Math.max(1, Math.round((seg.s.share / total) * 14));
      for (let i = 0; i < n; i++) {
        const u = ((t * 0.5 + i / n) % 1);
        const x = INX1 + u * (OUTX - INX1);
        const e = u * u * (3 - 2 * u);
        const y = yMidA + (yMidB - yMidA) * e;
        flow.push(<circle key={`${k}-${i}`} cx={x} cy={y} r={2.6} fill={colorOf(seg.s)} opacity={0.9} />);
      }
    });
  }

  const figure = (
    <PlayWrap gate={gate}>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${name}, efficiency ${Math.round(usefulFrac * 100)} percent`}>
          {/* input bar */}
          <rect x={90} y={TOP} width={INX1 - 90} height={bandH} rx={3} fill="var(--stage-accent, #3b82f6)" opacity={0.7} />
          <text x={90} y={TOP - 10} fontSize={12} fontWeight={700} fill="var(--stage-fg)">energy in</text>
          <text x={90} y={BOT + 18} fontSize={11} fill="var(--stage-muted)">{inputJoules} J (100%)</text>
          {/* ribbons */}
          {inSeg.map((seg, k) => <g key={k}>{ribbon(seg, outSeg[k]!, colorOf(seg.s))}</g>)}
          {flow}
          {/* output labels */}
          {outSeg.map((seg, k) => {
            const j = (seg.s.share / total) * inputJoules;
            return <g key={k}>
              <rect x={OUTX} y={seg.y0} width={6} height={Math.max(2, seg.y1 - seg.y0)} fill={colorOf(seg.s)} />
              <text x={OUTX + 12} y={(seg.y0 + seg.y1) / 2 - 2} fontSize={12} fontWeight={700} fill={colorOf(seg.s)}>{seg.s.label}</text>
              <text x={OUTX + 12} y={(seg.y0 + seg.y1) / 2 + 13} fontSize={11} fill="var(--stage-muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>{j.toFixed(0)} J · {Math.round((seg.s.share / total) * 100)}%{seg.s.kind === 'useful' ? ' ✓ useful' : ' wasted'}</text>
            </g>;
          })}
        </svg>
      </div>
    </PlayWrap>
  );

  const usefulJ = usefulFrac * inputJoules;
  const aside = (
    <>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 2, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontWeight: 800, fontSize: 20 }}>η = {Math.round(usefulFrac * 100)}%</span>
          <span style={{ fontSize: 13, color: 'var(--stage-muted)' }}>{name}</span>
        </span>
      </Callout>
      <div style={{ display: 'grid', gap: 8, padding: '8px 2px 0', fontSize: 13 }}>
        <Tex tex={'\\eta = \\dfrac{\\text{useful output}}{\\text{total input}}'} block />
        <span style={{ color: 'var(--stage-muted)' }}>Of every <strong style={{ color: 'var(--stage-fg)' }}>{inputJoules} J</strong> in, <strong style={{ color: GREEN }}>{usefulJ.toFixed(0)} J</strong> comes out useful and <strong style={{ color: HEAT }}>{(inputJoules - usefulJ).toFixed(0)} J</strong> is wasted (mostly heat). Energy is conserved, efficiency is about how much ends up where you want it.</span>
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="device">
        <span className="lab-field-row" style={{ flexWrap: 'wrap' }}>
          {ORDER.map((k) => <Chip key={k} selected={device === k} onClick={() => setDevice(k)}>{PRESETS[k]!.name}</Chip>)}
        </span>
      </Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls}>{figure}</LabFrame>;
}
