'use client';

/**
 * Bodies: the things that move. A Ball is the house-style sphere (solid hue, a darker
 * hairline outline, one specular sheen); a Particle is the cheap version for crowds; a Block
 * is a rounded mass/tile. Colour is a role (`HUE.*` or a `var(--fig-*)` string), never a hex.
 */

import type { CSSProperties, ReactNode } from 'react';
import { STROKE, shade } from './figure.js';
import { FigText } from './text.js';

export interface BallProps {
  cx: number;
  cy: number;
  r: number;
  color?: string;
  /** Short text centred on the ball (1–3 characters read best). */
  label?: ReactNode;
  /** 0..1, draws an expanding ring (a collision / event flash). */
  flash?: number;
  flashColor?: string;
  opacity?: number;
  /** Selected/active: thicker outline in the ink colour. */
  active?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Ball({
  cx,
  cy,
  r,
  color = 'var(--fig-hue-1)',
  label,
  flash = 0,
  flashColor = 'var(--fig-warn)',
  opacity,
  active = false,
  className,
  style,
}: BallProps): ReactNode {
  const sheen = r >= 6;
  return (
    <g className={className} style={style} opacity={opacity}>
      {flash > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={r + (1 - flash) * r * 1.6}
          fill="none"
          stroke={flashColor}
          strokeWidth={STROKE.line}
          opacity={flash}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        stroke={active ? 'var(--fig-ink)' : shade(color)}
        strokeWidth={active ? STROKE.edge : STROKE.hair}
      />
      {sheen && (
        <ellipse
          cx={cx - r * 0.3}
          cy={cy - r * 0.34}
          rx={r * 0.32}
          ry={r * 0.22}
          fill="var(--fig-sheen)"
          opacity={0.45}
        />
      )}
      {label != null && (
        <FigText
          x={cx}
          y={cy}
          anchor="middle"
          baseline="middle"
          size={r >= 14 ? 'measure' : r >= 9 ? 'label' : 'note'}
          tone="inverse"
        >
          {label}
        </FigText>
      )}
    </g>
  );
}

/** Crowd particle: fill + outline only (no sheen), tuned for 20–200 instances. */
export function Particle({
  x,
  y,
  r = 4,
  color = 'var(--fig-hue-1)',
  opacity,
}: {
  x: number;
  y: number;
  r?: number;
  color?: string;
  opacity?: number;
}): ReactNode {
  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill={color}
      stroke={shade(color)}
      strokeWidth={STROKE.hair}
      opacity={opacity}
    />
  );
}

export interface BlockProps {
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  label?: ReactNode;
  /** Corner radius; defaults to the small figure radius. */
  radius?: number;
  active?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** A rounded solid mass (a block on a ramp, a tile, a cell in a grid). */
export function Block({
  x,
  y,
  w,
  h,
  color = 'var(--fig-hue-1)',
  label,
  radius = 4,
  active = false,
  className,
  style,
}: BlockProps): ReactNode {
  return (
    <g className={className} style={style}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={radius}
        fill={color}
        stroke={active ? 'var(--fig-ink)' : shade(color)}
        strokeWidth={active ? STROKE.edge : STROKE.hair}
      />
      <rect
        x={x + STROKE.edge}
        y={y + STROKE.edge}
        width={Math.max(0, w - STROKE.edge * 2)}
        /* A specular highlight is a THIN band, so it is capped rather than a flat 12% of the
           height: on a tall block (a source housing, a slit barrier, a control rod) 12% became a
           large pale rectangle that read as a rendering artifact, not as a highlight. */
        height={Math.min(5, Math.max(1.5, h * 0.12))}
        rx={radius * 0.6}
        fill="var(--fig-sheen)"
        opacity={0.28}
      />
      {label != null && (
        <FigText x={x + w / 2} y={y + h / 2} anchor="middle" baseline="middle" tone="inverse">
          {label}
        </FigText>
      )}
    </g>
  );
}
