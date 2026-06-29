'use client';

/**
 * Annotation kit, the teacher's pointing finger. Instruments show the mechanism;
 * these let a lesson narrate the WHY *on* the figure: a Callout (leader line +
 * labelled bubble) names a feature ("← best fit", "the valley floor"), a Spotlight
 * pulses to pull the eye, and a Bracket spans a range with a label ("68% within 1σ").
 *
 * Deliberately PIXEL-SPACE + pure SVG so they drop into ANY lab: a self-contained
 * <svg> passes its own xOf/yOf, a <Stage> lab passes coords.toPx(...). No useCoords
 * dependency, so neither rendering model is privileged. Token-coloured by `tone`.
 */

import type { ReactNode } from 'react';

export type Tone = 'info' | 'good' | 'warn' | 'bad' | 'muted';
const TONE: Record<Tone, string> = {
  info: 'var(--stage-accent)', good: 'var(--stage-good)', warn: 'var(--stage-warn)',
  bad: 'var(--stage-danger, #e03131)', muted: 'var(--stage-muted)',
};
const charW = 6.4; // ~width per char at fontSize 11

/** A labelled pointer to (x,y): a dot, a leader line, and a tinted bubble offset by
 *  (dx,dy). Keep dx/dy pointing into open space so the bubble clears the figure.
 *  (Named `Pointer`, not Callout, to avoid clashing with frame.js's prose-box Callout
 *  and cms-ui's document-level Callout block, this one anchors to FIGURE geometry.) */
export function Pointer({ x, y, text, dx = 30, dy = -26, tone = 'info', fontSize = 11 }: {
  x: number; y: number; text: string; dx?: number; dy?: number; tone?: Tone; fontSize?: number;
}): ReactNode {
  const col = TONE[tone];
  const w = text.length * (charW * (fontSize / 11)) + 14, h = fontSize + 9;
  const bx = dx >= 0 ? x + dx : x + dx - w, by = y + dy - h / 2;
  const anchorX = dx >= 0 ? bx : bx + w;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <line x1={x} y1={y} x2={anchorX} y2={by + h / 2} stroke={col} strokeWidth={1.5} />
      <circle cx={x} cy={y} r={3} fill={col} />
      <rect x={bx} y={by} width={w} height={h} rx={h / 2} fill="var(--stage-bg)" stroke={col} strokeWidth={1.5} />
      <text x={bx + w / 2} y={by + h / 2} textAnchor="middle" dominantBaseline="central" fontSize={fontSize} fontWeight={700} fill={col}>{text}</text>
    </g>
  );
}

/** A pulsing attention ring at (cx,cy), draws the eye to "look here". */
export function Spotlight({ cx, cy, r = 13, tone = 'warn' }: { cx: number; cy: number; r?: number; tone?: Tone }): ReactNode {
  const col = TONE[tone];
  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={2} className="lab-pulse" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke={col} strokeWidth={2} opacity={0.9} />
    </g>
  );
}

/** A span bracket from x1→x2 at height y with a centred label, "this range means …".
 *  `side: 'below'` drops the ticks/label under y; 'above' lifts them over it. */
export function Bracket({ x1, x2, y, text, tone = 'info', side = 'below', fontSize = 11 }: {
  x1: number; x2: number; y: number; text: string; tone?: Tone; side?: 'above' | 'below'; fontSize?: number;
}): ReactNode {
  const col = TONE[tone];
  const s = side === 'below' ? 1 : -1, tick = 6 * s, ly = y + (side === 'below' ? 14 : -8);
  return (
    <g style={{ pointerEvents: 'none' }}>
      <path d={`M${x1},${y + tick} L${x1},${y} L${x2},${y} L${x2},${y + tick}`} fill="none" stroke={col} strokeWidth={1.5} />
      <text x={(x1 + x2) / 2} y={ly} textAnchor="middle" dominantBaseline={side === 'below' ? 'hanging' : 'auto'} fontSize={fontSize} fontWeight={700} fill={col}>{text}</text>
    </g>
  );
}
