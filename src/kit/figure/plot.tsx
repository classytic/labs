'use client';

/**
 * The small plot that lives beside a scene (an energy distribution, a rate curve, a titration
 * curve). PlotFrame draws the axes in the house style; Curve / Area / Guide / Marker draw on
 * it in figure coordinates, which the caller maps with `scale()`.
 */

import type { ReactNode } from 'react';
import { STROKE, alpha, type StrokeRole } from './figure.js';
import { Ball } from './body.js';
import { FigText } from './text.js';

export interface PlotBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Linear mappers from data space to the plot box (y grows downward on screen). */
export function scale(box: PlotBox, xDomain: readonly [number, number], yDomain: readonly [number, number]) {
  const [x0, x1] = xDomain;
  const [y0, y1] = yDomain;
  return {
    x: (v: number): number => box.x + ((v - x0) / (x1 - x0 || 1)) * box.w,
    y: (v: number): number => box.y + box.h - ((v - y0) / (y1 - y0 || 1)) * box.h,
  };
}

export interface PlotFrameProps extends PlotBox {
  xLabel?: ReactNode;
  yLabel?: ReactNode;
  title?: ReactNode;
  /** Arrowheads on the axes (schematic plots) vs plain (quantitative). */
  arrows?: boolean;
  /** Tick positions in figure units along each axis, with optional labels. */
  xTicks?: ReadonlyArray<{ at: number; label?: ReactNode }>;
  yTicks?: ReadonlyArray<{ at: number; label?: ReactNode }>;
  /** Faint horizontal grid lines at these y positions. */
  grid?: ReadonlyArray<number>;
  children?: ReactNode;
}

export function PlotFrame({
  x,
  y,
  w,
  h,
  xLabel,
  yLabel,
  title,
  arrows = true,
  xTicks,
  yTicks,
  grid,
  children,
}: PlotFrameProps): ReactNode {
  const bottom = y + h;
  const right = x + w;
  const ah = 7;
  return (
    <g>
      {title != null && (
        <FigText x={x} y={y - 8} size="title">
          {title}
        </FigText>
      )}
      {grid?.map((gy) => (
        <line key={gy} x1={x} y1={gy} x2={right} y2={gy} stroke="var(--fig-grid)" strokeWidth={STROKE.hair} />
      ))}
      {children}
      <line
        x1={x}
        y1={bottom}
        x2={right + (arrows ? 4 : 0)}
        y2={bottom}
        stroke="var(--fig-axis)"
        strokeWidth={STROKE.line}
        strokeLinecap="round"
      />
      <line
        x1={x}
        y1={bottom}
        x2={x}
        y2={y - (arrows ? 4 : 0)}
        stroke="var(--fig-axis)"
        strokeWidth={STROKE.line}
        strokeLinecap="round"
      />
      {arrows && (
        <>
          <path
            d={`M ${right + 6} ${bottom} l ${-ah} ${-ah * 0.55} v ${ah * 1.1} Z`}
            fill="var(--fig-axis)"
          />
          <path d={`M ${x} ${y - 6} l ${-ah * 0.55} ${ah} h ${ah * 1.1} Z`} fill="var(--fig-axis)" />
        </>
      )}
      {xTicks?.map((t, i) => (
        <g key={i}>
          <line
            x1={t.at}
            y1={bottom}
            x2={t.at}
            y2={bottom + 4}
            stroke="var(--fig-axis)"
            strokeWidth={STROKE.hair}
          />
          {t.label != null && (
            <FigText x={t.at} y={bottom + 16} anchor="middle" size="note" tone="soft">
              {t.label}
            </FigText>
          )}
        </g>
      ))}
      {yTicks?.map((t, i) => (
        <g key={i}>
          <line x1={x - 4} y1={t.at} x2={x} y2={t.at} stroke="var(--fig-axis)" strokeWidth={STROKE.hair} />
          {t.label != null && (
            <FigText x={x - 7} y={t.at} anchor="end" baseline="middle" size="note" tone="soft">
              {t.label}
            </FigText>
          )}
        </g>
      ))}
      {xLabel != null && (
        <FigText x={right} y={bottom + (xTicks?.length ? 30 : 18)} anchor="end" size="note" tone="soft">
          {xLabel}
        </FigText>
      )}
      {yLabel != null && (
        <FigText
          x={x - (yTicks?.length ? 30 : 8)}
          y={y + h / 2}
          anchor="middle"
          size="note"
          tone="soft"
          rotate={-90}
        >
          {yLabel}
        </FigText>
      )}
    </g>
  );
}

const toPath = (points: ReadonlyArray<readonly [number, number]>): string =>
  points.map(([px, py], i) => `${i ? 'L' : 'M'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');

export function Curve({
  points,
  color = 'var(--fig-hue-1)',
  weight = 'edge',
  dashed = false,
  opacity,
}: {
  points: ReadonlyArray<readonly [number, number]>;
  color?: string;
  weight?: StrokeRole;
  dashed?: boolean;
  opacity?: number;
}): ReactNode {
  const sw = STROKE[weight];
  return (
    <path
      d={toPath(points)}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? `${sw * 3} ${sw * 2.2}` : undefined}
      opacity={opacity}
    />
  );
}

/** Shaded region under a curve segment down to `baseY`. */
export function Area({
  points,
  baseY,
  color = 'var(--fig-hue-2)',
  opacity = 22,
}: {
  points: ReadonlyArray<readonly [number, number]>;
  baseY: number;
  color?: string;
  /** Fill strength in percent. */
  opacity?: number;
}): ReactNode {
  if (!points.length) return null;
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const d = `M ${first[0].toFixed(1)} ${baseY} ${toPath(points).replace(/^M/, 'L')} L ${last[0].toFixed(1)} ${baseY} Z`;
  return <path d={d} fill={alpha(color, opacity)} />;
}

/** A dashed reference line with a label at its far end. */
export function Guide({
  x1,
  y1,
  x2,
  y2,
  color = 'var(--fig-hot)',
  label,
  labelAnchor = 'middle',
  labelDx = 0,
  labelDy = -6,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  label?: ReactNode;
  labelAnchor?: 'start' | 'middle' | 'end';
  labelDx?: number;
  labelDy?: number;
}): ReactNode {
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={STROKE.line}
        strokeDasharray="5 4"
        strokeLinecap="round"
      />
      {label != null && (
        <FigText x={x2 + labelDx} y={y2 + labelDy} anchor={labelAnchor} size="note" tone="ink">
          {label}
        </FigText>
      )}
    </g>
  );
}

/** A data point on a plot. */
export function Marker({
  x,
  y,
  color = 'var(--fig-hue-1)',
  r = 5,
  label,
}: {
  x: number;
  y: number;
  color?: string;
  r?: number;
  label?: ReactNode;
}): ReactNode {
  return (
    <g>
      <Ball cx={x} cy={y} r={r} color={color} />
      {label != null && (
        <FigText x={x + r + 5} y={y} baseline="middle" size="note">
          {label}
        </FigText>
      )}
    </g>
  );
}

/** A horizontal proportion bar split into coloured segments (a composition, a mixture). */
export function SegmentBar({
  x,
  y,
  w,
  h = 22,
  segments,
  radius = 6,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  segments: ReadonlyArray<{ frac: number; color: string; label?: ReactNode }>;
  radius?: number;
}): ReactNode {
  let cursor = x;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={radius} fill="var(--fig-ground)" />
      {segments.map((s, i) => {
        const sw = Math.max(0, s.frac) * w;
        const sx = cursor;
        cursor += sw;
        if (sw <= 0.5) return null;
        return (
          <g key={i}>
            <rect
              x={sx}
              y={y}
              width={sw}
              height={h}
              rx={radius}
              fill={s.color}
              style={{
                transition: 'x 0.45s cubic-bezier(0.2,0.8,0.2,1), width 0.45s cubic-bezier(0.2,0.8,0.2,1)',
              }}
            />
            {s.label != null && sw > 40 && (
              <FigText x={sx + 9} y={y + h / 2} baseline="middle" size="note" tone="inverse">
                {s.label}
              </FigText>
            )}
          </g>
        );
      })}
    </g>
  );
}
