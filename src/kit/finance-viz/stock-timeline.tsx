'use client';

/**
 * StockTimeline — a stock-over-time chart with guide levels (the reorder sawtooth, a
 * savings run-down, any level-vs-time series). A pure view: the lab computes the
 * series + guides and passes them in.
 */

import type { ReactNode } from 'react';

export interface StockGuide {
  level: number;
  color: string;
  label: string;
}
export interface StockTimelineProps {
  /** the level at each period (e.g. stock on hand per day). */
  series: number[];
  /** horizontal reference lines (reorder level, buffer…). */
  guides?: StockGuide[];
  xLabel?: string;
  /** header line above the chart. */
  caption?: ReactNode;
  /** shade the danger band below this level (e.g. the buffer). */
  dangerBelow?: number;
  accent?: string;
  height?: number;
}

/** A level-vs-time chart with guide lines, the reorder sawtooth and its kin. */
export function StockTimeline({
  series,
  guides = [],
  xLabel,
  caption,
  dangerBelow,
  accent = 'var(--stage-accent, #3b82f6)',
  height = 280,
}: StockTimelineProps): ReactNode {
  const W = 720,
    H = height;
  const GX0 = 44,
    GX1 = 700,
    GY0 = caption ? 34 : 18,
    GY1 = H - 34;
  const n = Math.max(1, series.length - 1);
  const maxY = Math.max(1, ...series, ...guides.map((g) => g.level)) * 1.08;
  const X = (i: number): number => GX0 + (i / n) * (GX1 - GX0);
  const Y = (v: number): number => GY1 - (v / maxY) * (GY1 - GY0);
  const linePts = series.map((s, i) => `${X(i).toFixed(1)},${Y(s).toFixed(1)}`).join(' ');
  const areaPts = `${GX0},${GY1} ${linePts} ${X(n)},${GY1}`;
  return (
    <div className="finance-chart-frame">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Stock level over time${guides.length ? `; ${guides.map((g) => `${g.label} ${Math.round(g.level)}`).join(', ')}` : ''}`}
      >
        {caption && (
          <text x={GX0} y={22} fontSize={11.5} fill="var(--stage-muted)">
            {caption}
          </text>
        )}
        {/* danger band below a floor (e.g. buffer) */}
        {dangerBelow != null && dangerBelow > 0 && (
          <rect
            x={GX0}
            y={Y(dangerBelow)}
            width={GX1 - GX0}
            height={GY1 - Y(dangerBelow)}
            fill="var(--stage-danger, #e03131)"
            opacity={0.06}
          />
        )}
        {/* axes */}
        <line x1={GX0} y1={GY0} x2={GX0} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
        <line x1={GX0} y1={GY1} x2={GX1} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
        {/* guide levels */}
        {guides.map((g) => (
          <g key={g.label}>
            <line
              x1={GX0}
              y1={Y(g.level)}
              x2={GX1}
              y2={Y(g.level)}
              stroke={g.color}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={GX1 - 4}
              y={Y(g.level) - 4}
              textAnchor="end"
              fontSize={9.5}
              fontWeight={600}
              fill={g.color}
            >
              {g.label} {Math.round(g.level)}
            </text>
          </g>
        ))}
        {/* filled area + line */}
        <polygon points={areaPts} fill={accent} opacity={0.1} />
        <polyline points={linePts} fill="none" stroke={accent} strokeWidth={2.5} strokeLinejoin="round" />
        {xLabel && (
          <text x={GX1} y={GY1 + 16} textAnchor="end" fontSize={10} fill="var(--stage-muted)">
            {xLabel}
          </text>
        )}
      </svg>
    </div>
  );
}
