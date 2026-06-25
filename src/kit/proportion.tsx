'use client';

/**
 * ProportionModel — a reusable area/proportion model: a unit square split into
 * COLUMNS (widths = a first proportion) and, within each column, stacked ROWS
 * (heights = a conditional proportion). Areas read as joint probabilities. The
 * shared visual under Bayes (prior × likelihood), fractions, ratios, and any
 * "part of a part" picture — authored as DATA, not re-hand-rolled per lab.
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
}

export function ProportionModel({ columns, size = 234, caption, result, resultColor = 'var(--stage-good)', ariaLabel = 'Proportion area model' }: ProportionModelProps): ReactNode {
  const OX = 12, OY = 16;
  const total = columns.reduce((s, c) => s + c.frac, 0) || 1;
  let acc = 0;
  const cols = columns.map((c) => {
    const x = OX + (acc / total) * size;
    acc += c.frac;
    return { c, x, w: (c.frac / total) * size };
  });
  const W = size + 24;
  const Hh = OY + size + (caption ? 18 : 0) + (result ? 20 : 0) + 8;

  return (
    <svg viewBox={`0 0 ${W} ${Hh}`} style={{ width: '100%', maxWidth: size + 90, height: 'auto' }} role="img" aria-label={ariaLabel}>
      {cols.map(({ c, x, w }, ci) => {
        let ry = OY;
        return (
          <g key={ci}>
            {c.label && <text x={x + w / 2} y={OY - 4} textAnchor={w < size * 0.16 ? 'start' : 'middle'} fontSize={10} fill="var(--stage-muted)">{c.label}</text>}
            {c.rows.map((r, ri) => {
              const h = r.frac * size;
              const y = ry;
              ry += h;
              const big = w * h > 1400;
              return (
                <g key={ri}>
                  <rect x={x} y={y} width={Math.max(0, w)} height={Math.max(0, h)} fill={r.color} opacity={r.opacity ?? 1} />
                  {r.lit && <rect x={x} y={y} width={Math.max(1.5, w)} height={Math.max(0, h)} fill="none" stroke="var(--stage-fg)" strokeWidth={1.75} />}
                  {r.count != null && big && (
                    <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill={r.lit ? 'white' : 'var(--stage-fg)'} style={{ pointerEvents: 'none' }}>{Math.round(r.count)}</text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      {/* column dividers + outer frame */}
      {cols.slice(1).map(({ x }, i) => <line key={i} x1={x} y1={OY} x2={x} y2={OY + size} stroke="var(--stage-bg)" strokeWidth={1} />)}
      <rect x={OX} y={OY} width={size} height={size} fill="none" stroke="var(--stage-grid)" strokeWidth={1} />
      {caption && <text x={OX} y={OY + size + 15} fontSize={10} fill="var(--stage-muted)">{caption}</text>}
      {result && <text x={OX} y={OY + size + (caption ? 33 : 17)} fontSize={11.5} fontWeight={700} fill={resultColor}>{result}</text>}
    </svg>
  );
}
