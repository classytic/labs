'use client';

/**
 * Semiconductor symbols: Diode, LED, and the NMOS/PMOS transistor. Each a pure SVG
 * fragment on the shared authoring contract (see ./index.ts).
 */

import type { ReactNode } from 'react';
import {
  Leads,
  GlyphLabel,
  C_DIODE,
  C_MOS,
  CHARGE,
  SHEEN,
  METAL,
  BG,
  FG,
  WIRE,
  LIVE,
  tint,
  type LeadGlyphProps,
} from './_shared.js';

export interface DiodeGlyphProps extends LeadGlyphProps {
  /** Forward-biased & passing current, tint the triangle/leads LIVE (when `live`). */
  conducting?: boolean;
}

/**
 * DIODE, the exam-standard symbol: a filled triangle (anode, current →) pointing
 * right into a vertical bar (cathode). Current flows anode→cathode only; when it is
 * forward-biased and `live`, the triangle, bar and leads light up (`conducting`).
 */
export function DiodeGlyph({ cx, cy, half, live, label, conducting }: DiodeGlyphProps): ReactNode {
  const bw = 16; // body half-width (triangle base → cathode bar)
  const bh = 13; // triangle half-height
  const on = !!(conducting && live);
  const accent = C_DIODE; // keep its signature colour; energised state shows on the leads/flow
  const apex = cx + bw; // triangle tip == cathode bar == body edge (leads meet it)
  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={bw} live={on} />
      <path
        d={`M ${cx - bw} ${cy - bh} L ${apex} ${cy} L ${cx - bw} ${cy + bh} Z`}
        fill={tint(C_DIODE, on ? 38 : 14)}
        stroke={accent}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <line
        x1={apex}
        y1={cy - bh}
        x2={apex}
        y2={cy + bh}
        stroke={accent}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <line
        x1={cx - bw + 1.5}
        y1={cy - bh + 1.5}
        x2={apex - 1.5}
        y2={cy - 1}
        stroke={SHEEN}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <GlyphLabel cx={cx} cy={cy} bodyH={bh} label={label} />
    </g>
  );
}

export interface LedGlyphProps extends LeadGlyphProps {
  /** Forward-biased and emitting, arrows + a soft glow light up in `color`. */
  on?: boolean;
  /** Emission colour token when `on` (default the charge token). */
  color?: string;
}

/**
 * LED (light-emitting diode), the diode triangle pointing into a cathode bar, PLUS
 * two short emission arrows pointing away from the junction. When `on`, the arrows +
 * a soft halo glow in `color`; off → neutral metal.
 */
export function LedGlyph({ cx, cy, half, live, label, on, color = CHARGE }: LedGlyphProps): ReactNode {
  const bw = 16; // body half-width (triangle base → bar)
  const th = 12; // triangle half-height
  const baseX = cx - bw; // anode side (triangle base)
  const barX = cx + bw; // cathode bar x
  const emit = on ? color : METAL; // arrow + glow colour
  const arrows: ReactNode[] = [];
  for (let a = 0; a < 2; a++) {
    const ox = cx + 2 + a * 7; // tail x, stepped right
    const oy = cy - th - 2 - a * 1; // tail y, just above the body
    const ex = ox + 7; // head x (up-right)
    const ey = oy - 8; // head y
    arrows.push(
      <g
        key={`em${a}`}
        stroke={emit}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={on ? 0.95 : 0.6}
      >
        <line x1={ox} y1={oy} x2={ex} y2={ey} />
        <path d={`M ${ex} ${ey} L ${ex - 4} ${ey + 0.5} M ${ex} ${ey} L ${ex - 0.5} ${ey + 4}`} />
      </g>,
    );
  }
  return (
    <g>
      <Leads cx={cx} cy={cy} half={half} bodyHalf={bw} live={live} />
      {on && <circle cx={cx} cy={cy} r={bw + 4} fill={color} opacity={0.16} />}
      <path
        d={`M ${baseX} ${cy - th} L ${barX} ${cy} L ${baseX} ${cy + th} Z`}
        fill={BG}
        stroke={live ? LIVE : METAL}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <line
        x1={baseX + 1.5}
        y1={cy - th + 2}
        x2={barX - 2}
        y2={cy - 1}
        stroke={SHEEN}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <line
        x1={barX}
        y1={cy - th}
        x2={barX}
        y2={cy + th}
        stroke={live ? LIVE : METAL}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {arrows}
      <GlyphLabel cx={cx} cy={cy} bodyH={th} label={label} />
    </g>
  );
}

export interface MosfetGlyphProps {
  cx: number;
  cy: number;
  /** half = px from centre up to the DRAIN terminal (and down to the SOURCE). */
  half: number;
  /** gate lead length to the left. */
  gateLen?: number;
  /** channel formed → channel + drain/source path light up. */
  on?: boolean;
  live?: boolean;
  /** P-channel: draw the gate inversion bubble. */
  pmos?: boolean;
  label?: string;
  /** where the type label sits. Default 'right'; 'top' centres it above. */
  labelPos?: 'right' | 'top';
}

/**
 * NMOS (enhancement) transistor turned for a circuit: DRAIN at top, SOURCE at bottom,
 * GATE out the left. The gate bar is separated from the channel by the oxide gap; the
 * channel is the three enhancement dashes; the body arrow points inward (NMOS). When
 * `on`, the channel and drain-source path pick up the live colour.
 */
export function MosfetGlyph({
  cx,
  cy,
  half,
  gateLen = 24,
  on,
  live,
  pmos,
  label,
  labelPos = 'right',
}: MosfetGlyphProps): ReactNode {
  const ch = on && live ? LIVE : C_MOS;
  const wire = live ? LIVE : WIRE;
  const gx = cx - 13; // gate bar x
  const chx = cx - 4; // channel bar x
  const ext = cx + 9; // drain/source vertical-lead x
  const top = cy - half,
    bot = cy + half;
  const gateTermX = gx - gateLen;
  return (
    <g>
      <line
        x1={gateTermX}
        y1={cy}
        x2={pmos ? gx - 9 : gx}
        y2={cy}
        stroke={wire}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {pmos && <circle cx={gx - 5} cy={cy} r={4} fill={BG} stroke={C_MOS} strokeWidth={1.6} />}
      <line
        x1={gx}
        y1={cy - 13}
        x2={gx}
        y2={cy + 13}
        stroke={C_MOS}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {[
        [-13, -5],
        [-3, 5],
        [7, 13],
      ].map(([a, b], i) => (
        <line
          key={i}
          x1={chx}
          y1={cy + a!}
          x2={chx}
          y2={cy + b!}
          stroke={ch}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      <line x1={chx} y1={cy - 9} x2={ext} y2={cy - 9} stroke={ch} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={ext} y1={cy - 9} x2={ext} y2={top} stroke={wire} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={chx} y1={cy + 9} x2={ext} y2={cy + 9} stroke={ch} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={ext} y1={cy + 9} x2={ext} y2={bot} stroke={wire} strokeWidth={2.5} strokeLinecap="round" />
      <path d={`M ${chx + 9} ${cy + 6} L ${chx + 2} ${cy + 9} L ${chx + 9} ${cy + 12} Z`} fill={ch} />
      <circle cx={ext} cy={top} r={2.6} fill={METAL} />
      <circle cx={ext} cy={bot} r={2.6} fill={METAL} />
      <circle cx={gateTermX} cy={cy} r={2.6} fill={METAL} />
      {label &&
        (labelPos === 'top' ? (
          <text
            x={cx}
            y={top - 7}
            fill={FG}
            fontSize={11}
            fontWeight={600}
            textAnchor="middle"
            pointerEvents="none"
          >
            {label}
          </text>
        ) : (
          <text
            x={ext + 7}
            y={cy}
            fill={FG}
            fontSize={11}
            fontWeight={600}
            textAnchor="start"
            dominantBaseline="central"
            pointerEvents="none"
          >
            {label}
          </text>
        ))}
    </g>
  );
}
