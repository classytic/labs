'use client';

/**
 * PlotChart — shared line-chart chrome so labels never collide: the legend sits in a
 * reserved band ABOVE the plot (not on top of the data), y-tick + guide labels get a
 * background halo (paint-order stroke) so they stay readable over any line, and the
 * x-axis label lives in the bottom gutter. The lab draws its own data marks (lines,
 * shaded regions, markers, bars) via the render-prop, which receives the scales +
 * geometry. Used by the depreciation / compound-interest / break-even labs.
 */

import type { ReactNode } from 'react';

export interface PlotGuide {
  value: number;
  label: string;
  color?: string;
  side?: 'left' | 'right';
}
export interface PlotLegendItem {
  label: string;
  color: string;
  dashed?: boolean;
}
export interface PlotGeom {
  X: (x: number) => number;
  Y: (v: number) => number;
  GX0: number;
  GX1: number;
  GY0: number;
  GY1: number;
  W: number;
  H: number;
}
export interface PlotChartProps {
  xMax: number;
  yMax: number;
  /** y values to tick + label on the axis. */
  yTicks?: number[];
  formatY?: (n: number) => string;
  xLabel?: string;
  /** horizontal dashed reference lines with haloed labels. */
  guides?: PlotGuide[];
  legend?: PlotLegendItem[];
  ariaLabel?: string;
  height?: number;
  children?: (g: PlotGeom) => ReactNode;
}

/** haloed label, a background stroke keeps text legible over gridlines and curves. */
function Halo({
  x,
  y,
  children,
  color = 'var(--stage-muted)',
  size = 10,
  weight = 400,
  anchor = 'start',
}: {
  x: number;
  y: number;
  children: ReactNode;
  color?: string;
  size?: number;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
}): ReactNode {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight}
      textAnchor={anchor}
      fill={color}
      stroke="var(--stage-bg)"
      strokeWidth={3.5}
      style={{ paintOrder: 'stroke' }}
    >
      {children}
    </text>
  );
}

export function PlotChart({
  xMax,
  yMax,
  yTicks,
  formatY = (n) => `${Math.round(n)}`,
  xLabel,
  guides = [],
  legend = [],
  ariaLabel,
  height = 340,
  children,
}: PlotChartProps): ReactNode {
  const W = 720,
    H = height;
  const GX0 = 66,
    GX1 = 700;
  const GY0 = legend.length ? 44 : 24; // reserve a band above the plot for the legend
  const GY1 = H - 34;
  const X = (x: number): number => GX0 + (xMax > 0 ? x / xMax : 0) * (GX1 - GX0);
  const Y = (v: number): number => GY1 - (yMax > 0 ? v / yMax : 0) * (GY1 - GY0);
  const ticks = yTicks ?? [0, yMax / 2, yMax];

  // legend laid out left→right in the top band
  let lx = GX0;
  const legendEls = legend.map((it) => {
    const el = (
      <g key={it.label} transform={`translate(${lx}, 20)`} fontSize={11}>
        <line
          x1={0}
          y1={0}
          x2={20}
          y2={0}
          stroke={it.color}
          strokeWidth={it.dashed ? 2 : 3}
          strokeDasharray={it.dashed ? '5 4' : undefined}
        />
        <text x={26} y={4} fill="var(--stage-fg)">
          {it.label}
        </text>
      </g>
    );
    lx += 26 + it.label.length * 6.6 + 22;
    return el;
  });

  return (
    <div className="finance-chart-frame">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ariaLabel ?? 'chart'}>
        {legendEls}
        {/* a whisper of a grid — a premium chart reads its levels off faint rules, not a bare field */}
        {ticks.map((t, i) => (
          <line
            key={`grid${i}`}
            x1={GX0}
            y1={Y(t)}
            x2={GX1}
            y2={Y(t)}
            stroke="var(--stage-grid)"
            strokeWidth={1}
            opacity={0.45}
          />
        ))}
        {/* y ticks + haloed labels */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={GX0 - 4} y1={Y(t)} x2={GX0} y2={Y(t)} stroke="var(--stage-muted)" strokeWidth={1} />
            <Halo x={GX0 - 8} y={Y(t) + 3} anchor="end">
              {formatY(t)}
            </Halo>
          </g>
        ))}
        {/* the lab's own data marks (drawn under the guides so guide labels stay readable) */}
        {children?.({ X, Y, GX0, GX1, GY0, GY1, W, H })}
        {/* horizontal guides on top of any shaded fills */}
        {guides.map((g) => {
          const right = g.side === 'right';
          const col = g.color ?? 'var(--stage-grid)';
          return (
            <g key={g.label}>
              <line
                x1={GX0}
                y1={Y(g.value)}
                x2={GX1}
                y2={Y(g.value)}
                stroke={col}
                strokeWidth={1}
                strokeDasharray="3 4"
              />
              <Halo
                x={right ? GX1 - 4 : GX0 + 6}
                y={Y(g.value) - 4}
                anchor={right ? 'end' : 'start'}
                color={g.color ?? 'var(--stage-muted)'}
                size={9.5}
                weight={600}
              >
                {g.label}
              </Halo>
            </g>
          );
        })}
        {/* axes drawn last so they sit crisp on top of any fills */}
        <line x1={GX0} y1={GY0 - 6} x2={GX0} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
        <line x1={GX0} y1={GY1} x2={GX1} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
        {xLabel && (
          <text x={GX1} y={GY1 + 18} textAnchor="end" fontSize={10} fill="var(--stage-muted)">
            {xLabel}
          </text>
        )}
      </svg>
    </div>
  );
}
