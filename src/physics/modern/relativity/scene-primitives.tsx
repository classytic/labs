/**
 * Shared glyphs for the relativity scenes, drawn from the figure kit (one hue + neutrals,
 * hairline outlines, one sheen, no gradients). Every scene in this folder composes these
 * inside a `<Figure domain="physics">` so the labs share one visual language.
 */
import type { ReactNode } from 'react';
import {
  Arrow,
  Ball,
  Block,
  FigText,
  HUE,
  Particle,
  STROKE,
  Track,
  shade,
  tint,
  type FigTextTone,
} from '../../../kit/figure/index.js';

type Anchor = 'start' | 'middle' | 'end';

/** A panel / frame title inside a figure. */
export function FrameLabel({
  x,
  y,
  children,
  anchor = 'start',
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: Anchor;
}): ReactNode {
  return (
    <FigText x={x} y={y} anchor={anchor} size="title">
      {children}
    </FigText>
  );
}

/** A quiet explanatory note (legend text, a caption under a panel). */
export function SceneNote({
  x,
  y,
  children,
  anchor = 'start',
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: Anchor;
}): ReactNode {
  return (
    <FigText x={x} y={y} anchor={anchor} size="note" tone="soft">
      {children}
    </FigText>
  );
}

/** A dimension line: end ticks, a double-headed arrow and the measured value above it. */
export function MeasurementLine({
  x1,
  x2,
  y,
  label,
  tone = HUE.ink,
  labelTone = 'ink',
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
  /** Colour role for the line (default ink). */
  tone?: string;
  labelTone?: FigTextTone;
}): ReactNode {
  return (
    <g>
      <Track
        points={[
          [x1, y - 7],
          [x1, y + 7],
        ]}
        dashed={false}
        color={tone}
        weight="line"
      />
      <Track
        points={[
          [x2, y - 7],
          [x2, y + 7],
        ]}
        dashed={false}
        color={tone}
        weight="line"
      />
      <Arrow x1={x1} y1={y} x2={x2} y2={y} color={tone} weight="line" head={7} double />
      <FigText x={(x1 + x2) / 2} y={y - 11} anchor="middle" size="measure" tone={labelTone}>
        {label}
      </FigText>
    </g>
  );
}

/**
 * The one clock-face glyph every relativity scene reuses: a paper dial in a glass edge,
 * four quarter ticks, a long and a short hand. `turns` is the long hand's rotation
 * (1 = one full turn); the short hand follows at a twelfth of that.
 */
export function ClockFace({
  cx,
  cy,
  r,
  turns = 0,
  active = false,
}: {
  cx: number;
  cy: number;
  r: number;
  turns?: number;
  active?: boolean;
}): ReactNode {
  const hand = (fraction: number, length: number): readonly [number, number] => {
    const a = fraction * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * length, cy + Math.sin(a) * length];
  };
  const ticks = [0, 0.25, 0.5, 0.75].map((f) => [hand(f, r * 0.8), hand(f, r * 0.92)] as const);
  return (
    <g>
      <Ball cx={cx} cy={cy} r={r} color={HUE.paper} active={active} />
      {ticks.map(([a, b], i) => (
        <Track key={i} points={[a, b]} dashed={false} color={HUE.soft} weight="hair" />
      ))}
      <Track points={[[cx, cy], hand(turns / 12, r * 0.45)]} dashed={false} color={HUE.ink} weight="line" />
      <Track points={[[cx, cy], hand(turns, r * 0.72)]} dashed={false} color={HUE.ink} weight="line" />
      <Particle x={cx} y={cy} r={Math.max(1.6, r * 0.09)} color={HUE.ink} />
    </g>
  );
}

/** A clean side-view spacecraft silhouette: hull, engine nozzle, one sheen, three portholes. */
export function Spacecraft({
  x,
  y,
  width,
  accent = false,
}: {
  x: number;
  y: number;
  width: number;
  accent?: boolean;
}): ReactNode {
  const color = accent ? HUE[2] : HUE[1];
  const w = width;
  const hull = tint(color, accent ? 28 : 18);
  const glass = tint(HUE.ink, 12);
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M 7 16 H 20 V 36 H 7 L 0 31 V 21 Z"
        fill={tint(HUE.metal, 18)}
        stroke={HUE.soft}
        strokeWidth={STROKE.hair}
      />
      <path
        d={`M 22 4 Q 15 4 10 12 L 2 26 L 10 40 Q 15 48 22 48 H ${w - 36} Q ${w - 22} 48 ${w - 8} 35 L ${w} 26 L ${w - 8} 17 Q ${w - 22} 4 ${w - 36} 4 Z`}
        fill={hull}
        stroke={color}
        strokeWidth={STROKE.line}
        strokeLinejoin="round"
      />
      <Track
        points={[
          [w * 0.16, 11],
          [w * 0.68, 11],
        ]}
        dashed={false}
        color="var(--fig-sheen)"
        weight="line"
        opacity={0.55}
      />
      {[0.3, 0.46, 0.62].map((p) => (
        <Block key={p} x={w * p - 9} y={18} w={18} h={16} color={glass} radius={4} />
      ))}
      <Track
        points={[
          [26, 41],
          [w - 42, 41],
        ]}
        dashed={false}
        color={color}
        weight="hair"
        opacity={0.45}
      />
    </g>
  );
}

/** A passenger car: rounded body, four windows, a centre door, under-frame and two wheels. */
export function TrainCar({
  offset = 0,
  x = 166,
  y = 140,
  width = 384,
  height = 76,
  color = HUE[1],
}: {
  /** Horizontal displacement (the car slides along the rail). */
  offset?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
}): ReactNode {
  const wheelY = y + height + 9;
  const body = tint(color, 22);
  const glass = tint(HUE.ink, 10);
  return (
    <g transform={`translate(${offset} 0)`}>
      <Block x={x} y={y} w={width} h={height} color={body} radius={14} />
      <path
        d={`M ${x + 16} ${y + 7} H ${x + width - 16}`}
        stroke={color}
        strokeWidth={STROKE.line}
        strokeLinecap="round"
      />
      <Block x={x + 10} y={y + height - 3} w={width - 20} h={7} color={shade(color)} radius={3} />
      {[0.15, 0.38, 0.62, 0.85].map((p) => (
        <Block key={p} x={x + width * p - 26} y={y + 11} w={52} h={30} color={glass} radius={6} />
      ))}
      <Block x={x + width / 2 - 15} y={y + 10} w={30} h={height - 13} color={tint(color, 12)} radius={5} />
      {[x + 66, x + width - 66].map((wx) => (
        <g key={wx}>
          <Ball cx={wx} cy={wheelY} r={11} color={HUE.metal} />
          <Particle x={wx} y={wheelY} r={3} color={HUE.paper} />
        </g>
      ))}
    </g>
  );
}

/** Clip a segment to an axis-aligned box (Liang–Barsky); null when nothing is inside. */
export function clipSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  box: { x0: number; y0: number; x1: number; y1: number },
): [number, number, number, number] | null {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const edges: Array<[number, number]> = [
    [-dx, x1 - box.x0],
    [dx, box.x1 - x1],
    [-dy, y1 - box.y0],
    [dy, box.y1 - y1],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return null;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return null;
      if (t < t1) t1 = t;
    }
  }
  return [x1 + dx * t0, y1 + dy * t0, x1 + dx * t1, y1 + dy * t1];
}
