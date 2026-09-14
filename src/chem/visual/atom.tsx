import type { ReactNode } from 'react';

export interface ProjectedAtomProps {
  x: number;
  y: number;
  radius: number;
  symbol: string;
  fill: string;
  stroke?: string;
  labelColor?: string;
  opacity?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * The shared projected-chemistry atom mark.
 *
 * Chemical symbols are information, not decoration. Keep them above lighting and
 * depth effects, use a solid disc, and size two-letter symbols independently so
 * Cl, Br, and central-atom labels remain legible in light and dark host themes.
 */
export function ProjectedAtom({
  x,
  y,
  radius,
  symbol,
  fill,
  stroke = 'color-mix(in oklab, var(--stage-fg) 34%, transparent)',
  labelColor = 'var(--stage-fg)',
  opacity,
  className,
  strokeWidth = Math.max(1.5, Math.min(2.5, radius * 0.1)),
}: ProjectedAtomProps): ReactNode {
  const fontSize = Math.max(12, radius * (symbol.length > 1 ? 0.68 : 0.82));
  return (
    <g className={className} opacity={opacity}>
      <circle cx={x} cy={y} r={radius} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="850"
        fill={labelColor}
        paintOrder="stroke"
        stroke="color-mix(in oklab, var(--stage-bg) 52%, transparent)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      >
        {symbol}
      </text>
    </g>
  );
}
