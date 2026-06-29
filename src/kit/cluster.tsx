'use client';

/**
 * DotCluster, the "a quantity you can SEE growing" primitive, the petri-dish of dots
 * Brilliant uses for exponential growth (the joke that doubles each day). N items pack
 * into a disc via a deterministic sunflower (phyllotaxis) layout, so 3 → 6 → 12 reads
 * as a visibly denser crowd, not just a bigger number. The newly-added items can be
 * highlighted, which is what makes "it DOUBLED" land: you see the new half light up.
 *
 * Pure SVG, --stage-* tokens, deterministic (golden-angle trig, no RNG), so it renders
 * the same server/client and rasterises to video. Reuse for any count you grow over
 * steps: population, bacteria, money, reach, infections.
 */

import type { ReactNode } from 'react';

const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // ~137.5°, the phyllotaxis angle

export interface DotClusterProps {
  count: number;
  /** Highlight the last `highlight` items (e.g. the ones added this step). */
  highlight?: number;
  /** Diameter of the dish (px). */
  size?: number;
  color?: string;
  highlightColor?: string;
  /** Dish ring tint; set `emphasis` to draw the bold "current" ring. */
  emphasis?: boolean;
  /** Caption above (e.g. "Day 2"). */
  label?: string;
  /** Chip below (the value, or "?" while hidden). */
  value?: ReactNode;
}

export function DotCluster({
  count, highlight = 0, size = 120, color = 'color-mix(in oklab, var(--stage-fg) 55%, transparent)',
  highlightColor = 'var(--stage-accent)', emphasis = false, label, value,
}: DotClusterProps): ReactNode {
  const capH = label ? 24 : 6;
  const capB = value != null ? 30 : 6;
  const dishR = size / 2;
  const cx = dishR;
  const cy = capH + dishR;
  const total = capH + size + capB;

  const n = Math.max(0, Math.round(count));
  // dot radius shrinks as the crowd grows so it always fits the dish
  const dotR = Math.max(2.2, Math.min(7, (dishR * 0.78) / Math.sqrt(Math.max(1, n))));
  const fitR = dishR - dotR - 3;

  const dots: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt((i + 0.5) / n) * fitR;
    const th = i * GOLDEN;
    const x = cx + r * Math.cos(th);
    const y = cy + r * Math.sin(th);
    const isNew = i >= n - highlight;
    dots.push(<circle key={i} cx={x} cy={y} r={dotR} fill={isNew ? highlightColor : color} opacity={isNew ? 0.95 : 0.8} />);
  }

  return (
    <svg width={size} height={total} viewBox={`0 0 ${size} ${total}`} role="img"
      aria-label={`${label ? label + ': ' : ''}${value != null && value !== '?' ? value : count} items`}>
      {label && <text x={cx} y={14} fontSize={13} fontWeight={700} fill="var(--stage-fg)" textAnchor="middle">{label}</text>}
      {/* dish */}
      <circle cx={cx} cy={cy} r={dishR - 1}
        fill="color-mix(in oklab, var(--stage-fg) 7%, transparent)"
        stroke={emphasis ? highlightColor : 'color-mix(in oklab, var(--stage-fg) 22%, transparent)'}
        strokeWidth={emphasis ? 2.5 : 1.5} />
      {dots}
      {/* value chip */}
      {value != null && (
        <g>
          <rect x={cx - 16} y={capH + size - 8} width={32} height={24} rx={5}
            fill="var(--stage-bg)" stroke="color-mix(in oklab, var(--stage-fg) 30%, transparent)" strokeWidth={1.5} />
          <text x={cx} y={capH + size + 4} fontSize={14} fontWeight={800} fill="var(--stage-fg)"
            textAnchor="middle" dominantBaseline="middle">{value}</text>
        </g>
      )}
    </svg>
  );
}
