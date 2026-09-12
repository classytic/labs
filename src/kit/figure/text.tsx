'use client';

/**
 * FigText, the only way to put words in a figure. Sizes and tones are roles resolved by
 * styles/figure.css (`.fig-text`), with a paper-coloured halo so labels survive crossing a
 * stroke. On-screen size = user units × (rendered width / viewBox width): keep it ≥ 12 px in
 * the narrowest layout the figure renders in.
 */

import type { ReactNode } from 'react';

export type FigTextSize = 'label' | 'note' | 'title' | 'measure' | 'eyebrow';
export type FigTextTone = 'ink' | 'soft' | 'hue-1' | 'hue-2' | 'hue-3' | 'hot' | 'good' | 'inverse';

export interface FigTextProps {
  x: number;
  y: number;
  size?: FigTextSize;
  tone?: FigTextTone;
  anchor?: 'start' | 'middle' | 'end';
  /** Vertical alignment relative to y (default: alphabetic baseline). */
  baseline?: 'auto' | 'middle' | 'hanging';
  /** Rotate around (x, y), degrees. */
  rotate?: number;
  /** Drop the halo (e.g. text on a solid fill). */
  halo?: boolean;
  className?: string;
  children: ReactNode;
}

export function FigText({
  x,
  y,
  size = 'label',
  tone = 'ink',
  anchor = 'start',
  baseline = 'auto',
  rotate,
  halo = true,
  className,
  children,
}: FigTextProps): ReactNode {
  return (
    <text
      className={['fig-text', className].filter(Boolean).join(' ')}
      data-size={size === 'label' ? undefined : size}
      data-tone={tone === 'ink' ? undefined : tone}
      data-halo={halo ? undefined : 'false'}
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline={baseline === 'auto' ? undefined : baseline}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
    >
      {children}
    </text>
  );
}

/** A small rounded tag with text inside (legend chips, value pills, unit badges). */
export function FigTag({
  x,
  y,
  children,
  color = 'var(--fig-hue-1)',
  anchor = 'start',
  width,
}: {
  x: number;
  y: number;
  children: ReactNode;
  /** Fill colour; text renders inverse on it. */
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  /** Explicit width (user units). Defaults to an estimate from the text length. */
  width?: number;
}): ReactNode {
  const text = typeof children === 'string' || typeof children === 'number' ? String(children) : '';
  const w = width ?? Math.max(24, text.length * 7.2 + 14);
  const h = 20;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return (
    <g>
      <rect x={x0} y={y - h / 2} width={w} height={h} rx={h / 2} fill={color} />
      <FigText x={x0 + w / 2} y={y} anchor="middle" baseline="middle" size="note" tone="inverse">
        {children}
      </FigText>
    </g>
  );
}
