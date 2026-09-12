'use client';

/**
 * Lines with meaning: Arrow (a vector, a flow, a pointer), Ray (a glowing beam of light or
 * energy), Track (a path something follows) and Ground (the floor a scene stands on). Widths
 * are stroke roles; heads are drawn as filled triangles so they take the line's colour without
 * marker plumbing.
 */

import type { ReactNode } from 'react';
import { STROKE, alpha, figUrl, useFigureId, type StrokeRole } from './figure.js';
import { FigText } from './text.js';

export interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  weight?: StrokeRole;
  /** Head length in user units (0 hides the head). */
  head?: number;
  dashed?: boolean;
  /** Also draw a head at the start. */
  double?: boolean;
  label?: ReactNode;
  /** Which side of the arrow the label sits on (perpendicular offset), default left/above. */
  labelSide?: 'left' | 'right';
  opacity?: number;
  className?: string;
}

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = 'var(--fig-ink)',
  weight = 'line',
  head = 8,
  dashed = false,
  double = false,
  label,
  labelSide = 'left',
  opacity,
  className,
}: ArrowProps): ReactNode {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const sw = STROKE[weight];
  const hl = head;
  const hw = head * 0.55;
  // shorten the shaft so the tip lands exactly on (x2, y2)
  const ex = x2 - ux * hl * 0.8;
  const ey = y2 - uy * hl * 0.8;
  const sx = double ? x1 + ux * hl * 0.8 : x1;
  const sy = double ? y1 + uy * hl * 0.8 : y1;
  const headPath = (tx: number, ty: number, dirx: number, diry: number): string => {
    const bx = tx - dirx * hl;
    const by = ty - diry * hl;
    const px = -diry * hw;
    const py = dirx * hw;
    return `M ${tx} ${ty} L ${bx + px} ${by + py} L ${bx - px} ${by - py} Z`;
  };
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const side = labelSide === 'left' ? -1 : 1;
  const off = 10 + sw;
  return (
    <g className={className} opacity={opacity}>
      <line
        x1={sx}
        y1={sy}
        x2={ex}
        y2={ey}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={dashed ? `${sw * 3} ${sw * 2.2}` : undefined}
      />
      {head > 0 && <path d={headPath(x2, y2, ux, uy)} fill={color} />}
      {head > 0 && double && <path d={headPath(x1, y1, -ux, -uy)} fill={color} />}
      {label != null && (
        <FigText
          x={mx + -uy * off * side}
          y={my + ux * off * side}
          anchor="middle"
          baseline="middle"
          size="note"
        >
          {label}
        </FigText>
      )}
    </g>
  );
}

/** A beam of light/energy: a blurred wide glow under a crisp core. */
export function Ray({
  x1,
  y1,
  x2,
  y2,
  color = 'var(--fig-hue-2)',
  width = 6,
  opacity = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  width?: number;
  opacity?: number;
}): ReactNode {
  const uid = useFigureId();
  return (
    <g opacity={opacity}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={alpha(color, 55)}
        strokeWidth={width * 2.2}
        strokeLinecap="round"
        filter={figUrl(uid, 'glow')}
      />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width * 0.45} strokeLinecap="round" />
    </g>
  );
}

/** A path something follows (orbit, trajectory, route). */
export function Track({
  d,
  points,
  color = 'var(--fig-ink-soft)',
  weight = 'line',
  dashed = true,
  closed = false,
  opacity,
}: {
  d?: string;
  points?: ReadonlyArray<readonly [number, number]>;
  color?: string;
  weight?: StrokeRole;
  dashed?: boolean;
  closed?: boolean;
  opacity?: number;
}): ReactNode {
  const sw = STROKE[weight];
  const path =
    d ??
    (points ? points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ') + (closed ? ' Z' : '') : '');
  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? `${sw * 3} ${sw * 2.5}` : undefined}
      opacity={opacity}
    />
  );
}

/** The floor of a scene: a hairline in ink with a soft shadow band beneath it. */
export function Ground({
  x1,
  x2,
  y,
  shadow = true,
  hatch = false,
}: {
  x1: number;
  x2: number;
  y: number;
  shadow?: boolean;
  /** Short diagonal hatches under the line (a fixed wall/floor in mechanics). */
  hatch?: boolean;
}): ReactNode {
  const hatches: ReactNode[] = [];
  if (hatch) {
    for (let x = x1 + 6; x < x2; x += 12) {
      hatches.push(
        <line
          key={x}
          x1={x}
          y1={y}
          x2={x - 7}
          y2={y + 8}
          stroke="var(--fig-outline)"
          strokeWidth={STROKE.hair}
        />,
      );
    }
  }
  return (
    <g>
      {shadow && <rect x={x1} y={y} width={x2 - x1} height={10} fill="var(--fig-ground)" opacity={0.6} />}
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="var(--fig-ink)"
        strokeWidth={STROKE.line}
        strokeLinecap="round"
      />
      {hatches}
    </g>
  );
}
