'use client';

/**
 * ProportionModel, a reusable area/proportion model: a unit square split into
 * COLUMNS (widths = a first proportion) and, within each column, stacked ROWS
 * (heights = a conditional proportion). Areas read as joint probabilities. The
 * shared visual under Bayes (prior × likelihood), fractions, ratios, and any
 * "part of a part" picture, authored as DATA, not re-hand-rolled per lab.
 *
 * Pure pixel-space SVG figure (y-down), drops into any lab. Colours are tokens.
 * `lit` outlines a cell (e.g. the test-positive bands); `count` labels big cells.
 */

import type { ReactNode } from 'react';

export interface PropRow {
  /** Height as a fraction of the column (rows in a column should sum to ~1). */
  frac: number;
  color: string;
  opacity?: number;
  /** Outline this cell (a highlighted sub-region, e.g. "test positive"). */
  lit?: boolean;
  /** Optional natural-frequency count, shown when the cell is big enough. */
  count?: number;
}

export interface PropColumn {
  /** Width as a fraction of the whole (columns are normalized together). */
  frac: number;
  label?: string;
  rows: PropRow[];
}

export interface ProportionModelProps {
  columns: PropColumn[];
  /** Square side in px. Default 234. */
  size?: number;
  /** Small grey caption under the square. */
  caption?: string;
  /** Bold result line (e.g. "P(A | +) = 9%"). */
  result?: string;
  resultColor?: string;
  ariaLabel?: string;
  /**
   * Minimum on-screen size (px) for any NON-ZERO band, so a rare class (e.g. a 1%
   * prevalence column) stays a readable strip instead of a 4px sliver you can't
   * see. The band is floored and the surplus is borrowed from the larger bands, so
   * ordering + "which is bigger" still read true; set 0 for a strictly-to-scale
   * mosaic. Default 18 (fits a 1–2 digit count).
   */
  minBand?: number;
}

/**
 * Floor every non-zero band to `min` px and reclaim the surplus proportionally
 * from the bands that have room, keeping the total width/height fixed. Zero bands
 * stay zero (not drawn). This keeps a rare class visible without a giant blank gap.
 */
function floorBands(raw: number[], min: number): number[] {
  const v = raw.map((x) => (x > 0.5 ? x : 0));
  let deficit = 0,
    shrinkable = 0;
  for (const x of v) {
    if (x > 0 && x < min) deficit += min - x;
    else if (x >= min) shrinkable += x - min;
  }
  if (deficit === 0) return v;
  if (shrinkable <= 0) return v.map((x) => (x > 0 ? Math.max(x, min) : 0));
  return v.map((x) => (x <= 0 ? 0 : x < min ? min : x - deficit * ((x - min) / shrinkable)));
}

export function ProportionModel({
  columns,
  size = 234,
  caption,
  result,
  resultColor = 'var(--stage-good)',
  ariaLabel = 'Proportion area model',
  minBand = 18,
}: ProportionModelProps): ReactNode {
  const OX = 12,
    OY = 18;
  const total = columns.reduce((s, c) => s + c.frac, 0) || 1;
  const colW = floorBands(
    columns.map((c) => (c.frac / total) * size),
    minBand,
  );
  let acc = OX;
  const cols = columns.map((c, i) => {
    const x = acc;
    acc += colW[i]!;
    return { c, x, w: colW[i]! };
  });
  const W = size + 24;
  const Hh = OY + size + (caption ? 18 : 0) + (result ? 20 : 0) + 8;
  const cellStroke = 'color-mix(in oklab, var(--stage-bg) 60%, transparent)';

  return (
    <svg
      viewBox={`0 0 ${W} ${Hh}`}
      style={{ width: '100%', maxWidth: size + 90, height: 'auto' }}
      role="img"
      aria-label={ariaLabel}
    >
      {cols.map(({ c, x, w }, ci) => {
        // floor row heights too, so a rare ROW (e.g. the few "missed") stays visible
        const rowH = floorBands(
          c.rows.map((r) => r.frac * size),
          Math.min(minBand, 12),
        );
        let ry = OY;
        return (
          <g key={ci}>
            {c.label && (
              <text
                x={w < size * 0.2 ? x : x + w / 2}
                y={OY - 5}
                textAnchor={w < size * 0.2 ? 'start' : 'middle'}
                fontSize={10.5}
                fontWeight={600}
                fill="var(--stage-muted)"
              >
                {c.label}
              </text>
            )}
            {c.rows.map((r, ri) => {
              const h = rowH[ri]!;
              if (h <= 0) return null;
              const y = ry;
              ry += h;
              // show the natural-frequency count once the tile can hold it
              const showCount = r.count != null && w >= 13 && h >= 12;
              const fs = Math.max(9, Math.min(12, Math.min(w * 0.55, h * 0.7)));
              return (
                <g key={ri}>
                  <rect
                    x={x}
                    y={y}
                    width={Math.max(0, w)}
                    height={Math.max(0, h)}
                    fill={r.color}
                    opacity={r.opacity ?? 1}
                    stroke={cellStroke}
                    strokeWidth={0.75}
                  />
                  {r.lit && (
                    <rect
                      x={x + 0.9}
                      y={y + 0.9}
                      width={Math.max(1.5, w - 1.8)}
                      height={Math.max(0, h - 1.8)}
                      fill="none"
                      stroke="var(--stage-fg)"
                      strokeWidth={1.75}
                    />
                  )}
                  {showCount && (
                    <text
                      x={x + w / 2}
                      y={y + h / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={fs}
                      fontWeight={700}
                      fill={r.lit ? 'white' : 'var(--stage-fg)'}
                      style={{ pointerEvents: 'none' }}
                    >
                      {Math.round(r.count!)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      {/* column dividers + rounded outer frame */}
      {cols.slice(1).map(({ x }, i) => (
        <line key={i} x1={x} y1={OY} x2={x} y2={OY + size} stroke="var(--stage-bg)" strokeWidth={1.25} />
      ))}
      <rect
        x={OX}
        y={OY}
        width={size}
        height={size}
        rx={6}
        fill="none"
        stroke="color-mix(in oklab, var(--stage-fg) 26%, transparent)"
        strokeWidth={1.25}
      />
      {caption && (
        <text x={OX} y={OY + size + 15} fontSize={10.5} fill="var(--stage-muted)">
          {caption}
        </text>
      )}
      {result && (
        <text x={OX} y={OY + size + (caption ? 33 : 17)} fontSize={12} fontWeight={800} fill={resultColor}>
          {result}
        </text>
      )}
    </svg>
  );
}
