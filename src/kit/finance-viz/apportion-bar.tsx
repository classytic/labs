'use client';

/**
 * ApportionBar — split one pool across N segments by a weight (cost by floor area,
 * overhead by machine-hours, profit by capital…). Width IS the share. A pure view:
 * the lab computes the numbers and passes them in.
 */

import type { ReactNode } from 'react';

const PALETTE = [
  'var(--stage-accent, #3b82f6)',
  'var(--stage-good, #16a34a)',
  'var(--stage-warn, #e0a020)',
  'rgb(150,110,200)',
  'var(--stage-danger, #e03131)',
  'rgb(20,160,170)',
];

export interface ApportionSegment {
  label: string;
  /** the basis this segment carries (area, hours, headcount…). */
  weight: number;
  /** optional colour override; otherwise cycles the palette. */
  color?: string;
}
export interface ApportionBarProps {
  /** the pool being shared out (e.g. total rent). */
  total: number;
  segments: ApportionSegment[];
  /** format the money share, e.g. (n) => `$${n}`. */
  format?: (n: number) => string;
  /** what the weight is measured in, e.g. "sq ft" or "hrs". */
  weightLabel?: string;
  /** header line above the bar. */
  caption?: ReactNode;
  height?: number;
}

/** One pool split into proportional zones; each zone's width = its share of the cost. */
export function ApportionBar({
  total,
  segments,
  format = (n) => `${Math.round(n)}`,
  weightLabel = '',
  caption,
  height = 210,
}: ApportionBarProps): ReactNode {
  const W = 720,
    H = height;
  const GX0 = 24,
    GX1 = 696,
    GY0 = caption ? 40 : 20,
    GY1 = H - 20;
  const sum = segments.reduce((a, s) => a + Math.max(0, s.weight), 0) || 1;
  let x = GX0;
  const cols = segments.map((s, i) => {
    const w = (Math.max(0, s.weight) / sum) * (GX1 - GX0);
    const seg = {
      s,
      i,
      x0: x,
      w,
      share: (total * Math.max(0, s.weight)) / sum,
      color: s.color ?? PALETTE[i % PALETTE.length]!,
    };
    x += w;
    return seg;
  });
  return (
    <div className="finance-chart-frame">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`Pool of ${format(total)} split across ${segments.length} parts by ${weightLabel || 'weight'}`}
      >
        {caption && (
          <text x={GX0} y={24} fontSize={12} fontWeight={700} fill="var(--stage-fg)">
            {caption}
          </text>
        )}
        {cols.map((c) => {
          const narrow = c.w < 78;
          return (
            <g key={`${c.s.label}-${c.i}`}>
              <rect
                x={c.x0}
                y={GY0}
                width={Math.max(0, c.w - 2)}
                height={GY1 - GY0}
                rx={6}
                fill={c.color}
                opacity={0.2}
                stroke={c.color}
                strokeWidth={1.5}
              />
              <text
                x={c.x0 + c.w / 2}
                y={GY0 + 26}
                textAnchor="middle"
                fontSize={narrow ? 10 : 12.5}
                fontWeight={700}
                fill="var(--stage-fg)"
              >
                {c.s.label}
              </text>
              <text
                x={c.x0 + c.w / 2}
                y={GY0 + 45}
                textAnchor="middle"
                fontSize={10}
                fill="var(--stage-muted)"
              >
                {Math.round(c.s.weight).toLocaleString('en-US')} {weightLabel}
              </text>
              <text
                x={c.x0 + c.w / 2}
                y={GY1 - 12}
                textAnchor="middle"
                fontSize={narrow ? 11 : 13.5}
                fontWeight={800}
                fill={c.color}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {format(c.share)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
