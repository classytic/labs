'use client';

/**
 * Digital I/O glyphs: the input ToggleSwitch, the output Lamp (LED), and a
 * SevenSegment display digit (with its `digitSegments` decoder). Pixel-space,
 * tokenized, pure-SVG — the inputs/outputs that bracket a logic-gate scene.
 */

import type { ReactNode } from 'react';
import { LIVE, METAL, BG, FG, SHEEN } from './_shared.js';

/** An output LED: a clean filled disc (lit = `color`, idle = a faint outlined disc). No glow. */
export function Lamp({
  cx,
  cy,
  r,
  on,
  color = LIVE,
  label,
}: {
  cx: number;
  cy: number;
  r: number;
  on?: boolean;
  color?: string;
  label?: string;
}): ReactNode {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={on ? color : 'color-mix(in oklab, var(--stage-metal) 14%, var(--stage-bg))'}
        stroke={on ? color : METAL}
        strokeWidth={1.5}
      />
      <circle cx={cx - r * 0.28} cy={cy - r * 0.3} r={r * 0.28} fill={SHEEN} opacity={on ? 0.5 : 0.2} />
      {label && (
        <text
          x={cx}
          y={cy + r + 5}
          fill={FG}
          fontSize={Math.max(8, r * 0.85)}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="hanging"
          style={{ pointerEvents: 'none' }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Which of segments a–g are lit for each hex digit 0–F (decoder truth, for a 7-seg display). */
const SEG_MAP: boolean[][] = [
  // a, b, c, d, e, f, g
  [1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 0, 0, 0, 0],
  [1, 1, 0, 1, 1, 0, 1],
  [1, 1, 1, 1, 0, 0, 1],
  [0, 1, 1, 0, 0, 1, 1],
  [1, 0, 1, 1, 0, 1, 1],
  [1, 0, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 0, 1, 1],
  [1, 1, 1, 0, 1, 1, 1],
  [0, 0, 1, 1, 1, 1, 1],
  [1, 0, 0, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 1, 1],
].map((r) => r.map(Boolean));

export function digitSegments(value: number): boolean[] {
  return SEG_MAP[((value % 16) + 16) % 16]!;
}

/**
 * A seven-segment display digit. Drive it with a `value` (0–15 → 0–F) or explicit `segs`
 * (a..g booleans). Lit segments glow in the display colour; dark segments are a faint ghost,
 * so you read it like a real LED display. This is the output for binary/decoder/DLD labs.
 */
export function SevenSegment({
  x,
  y,
  w = 46,
  h = 80,
  value,
  segs,
  color = 'var(--stage-warn)',
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  value?: number;
  segs?: boolean[];
  color?: string;
}): ReactNode {
  const on =
    segs ?? (value !== undefined ? digitSegments(value) : [false, false, false, false, false, false, false]);
  const t = Math.min(w, h) * 0.13; // segment thickness / inset
  const off = 'color-mix(in oklab, var(--stage-metal) 16%, transparent)';
  const seg = (
    key: string,
    lit: boolean | undefined,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): ReactNode => (
    <line
      key={key}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={lit ? color : off}
      strokeWidth={t}
      strokeLinecap="round"
      opacity={lit ? 1 : 0.55}
    />
  );
  const midY = y + h / 2;
  return (
    <g>
      <rect
        x={x - t}
        y={y - t}
        width={w + 2 * t}
        height={h + 2 * t}
        rx={6}
        fill="color-mix(in oklab, var(--stage-bg) 80%, var(--stage-metal))"
        stroke="var(--stage-grid)"
        strokeWidth={1}
      />
      {seg('a', on[0], x + t, y, x + w - t, y)}
      {seg('b', on[1], x + w, y + t, x + w, midY - t * 0.5)}
      {seg('c', on[2], x + w, midY + t * 0.5, x + w, y + h - t)}
      {seg('d', on[3], x + t, y + h, x + w - t, y + h)}
      {seg('e', on[4], x, midY + t * 0.5, x, y + h - t)}
      {seg('f', on[5], x, y + t, x, midY - t * 0.5)}
      {seg('g', on[6], x + t, midY, x + w - t, midY)}
    </g>
  );
}

/** An input switch (toggle). Render inside a `<g onClick>` in the lab for taps. */
export function ToggleSwitch({
  x,
  y,
  w,
  h,
  on,
  label,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  on?: boolean;
  label?: string;
}): ReactNode {
  const r = h / 2;
  const knobX = on ? x + w - r : x + r;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        fill={
          on
            ? 'color-mix(in oklab, var(--stage-live) 35%, transparent)'
            : 'color-mix(in oklab, var(--stage-metal) 18%, transparent)'
        }
        stroke={on ? LIVE : METAL}
        strokeWidth={1.5}
      />
      <circle cx={knobX} cy={y + r} r={r - 2.5} fill={BG} stroke={on ? LIVE : METAL} strokeWidth={1.5} />
      <circle
        cx={knobX - (r - 2.5) * 0.3}
        cy={y + r - (r - 2.5) * 0.3}
        r={(r - 2.5) * 0.34}
        fill={SHEEN}
        opacity={0.6}
      />
      {label && (
        <text
          x={x + w / 2}
          y={y - 4}
          fill={FG}
          fontSize={Math.max(9, h * 0.7)}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="auto"
          style={{ pointerEvents: 'none' }}
        >
          {label}
        </text>
      )}
    </g>
  );
}
