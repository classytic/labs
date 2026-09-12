'use client';

/**
 * Glass, the house-style container: beaker / box / flask / tube / cylinder drawn with the
 * figure's glass edge, a faint glass fill, one sheen down the left wall, a metal rim and a
 * soft contact shadow. Liquid (0..1 of the inner height) is clipped to the vessel's silhouette
 * and glides on change. Children render INSIDE the vessel, clipped, so particles and floats
 * can never leak past a wall.
 */

import { useId, type ReactNode } from 'react';
import { STROKE, alpha } from './figure.js';
import { FigText } from './text.js';

export type GlassShape = 'beaker' | 'box' | 'flask' | 'tube' | 'cylinder';

export interface GlassProps {
  x: number;
  y: number;
  w: number;
  h: number;
  shape?: GlassShape;
  /** Liquid level, 0..1 of the inner height. */
  fill?: number;
  /** Liquid colour role (default hue-3, the medium). */
  liquid?: string;
  /** Liquid opacity (0.55 reads as water; 0.85 as a dense solution). */
  liquidOpacity?: number;
  /** Caption under the vessel. */
  label?: ReactNode;
  /** Draw the metal rim (off for an open box). */
  rim?: boolean;
  /** Draw the contact shadow under the base. */
  shadow?: boolean;
  /** Content drawn inside the vessel, clipped to its silhouette. */
  children?: ReactNode;
  /** Content drawn over the glass (labels, probes) — not clipped. */
  overlay?: ReactNode;
}

/** The inner rectangle a caller can place things in (matches the clip for `shape`). */
export function glassInner(
  x: number,
  y: number,
  w: number,
  h: number,
  shape: GlassShape = 'beaker',
): { x: number; y: number; w: number; h: number } {
  const wall = STROKE.edge;
  const lip = shape === 'box' ? wall : 6;
  if (shape === 'flask') {
    const neck = w * 0.34;
    return { x: x + (w - neck) / 2 + wall, y: y + lip, w: neck - wall * 2, h: h - lip - wall };
  }
  return { x: x + wall, y: y + lip, w: w - wall * 2, h: h - lip - wall };
}

function silhouette(x: number, y: number, w: number, h: number, shape: GlassShape): string {
  const wall = STROKE.edge;
  const lx = x + wall;
  const rx = x + w - wall;
  const bot = y + h - wall;
  const lip = shape === 'box' ? wall : 6;
  const top = y + lip;
  switch (shape) {
    case 'box':
      return `M ${lx} ${y + wall} H ${rx} V ${bot} H ${lx} Z`;
    case 'tube': {
      const r = (rx - lx) / 2;
      return `M ${lx} ${top} V ${bot - r} A ${r} ${r} 0 0 0 ${rx} ${bot - r} V ${top} Z`;
    }
    case 'cylinder':
      return `M ${lx} ${top} V ${bot - 4} Q ${(lx + rx) / 2} ${bot + 4} ${rx} ${bot - 4} V ${top} Z`;
    case 'flask': {
      const neck = w * 0.34;
      const nl = x + (w - neck) / 2 + wall;
      const nr = nl + neck - wall * 2;
      const shoulder = y + h * 0.42;
      return `M ${nl} ${top} V ${shoulder} L ${lx} ${bot - 10} Q ${lx} ${bot} ${lx + 10} ${bot} H ${rx - 10} Q ${rx} ${bot} ${rx} ${bot - 10} L ${nr} ${shoulder} V ${top} Z`;
    }
    default:
      // beaker: straight walls, slightly rounded base
      return `M ${lx} ${top} V ${bot - 6} Q ${lx} ${bot} ${lx + 6} ${bot} H ${rx - 6} Q ${rx} ${bot} ${rx} ${bot - 6} V ${top} Z`;
  }
}

export function Glass({
  x,
  y,
  w,
  h,
  shape = 'beaker',
  fill = 0,
  liquid = 'var(--fig-hue-3)',
  liquidOpacity = 0.55,
  label,
  rim = shape !== 'box',
  shadow = true,
  children,
  overlay,
}: GlassProps): ReactNode {
  const uid = useId().replace(/:/g, '');
  const clipId = `${uid}-clip`;
  const d = silhouette(x, y, w, h, shape);
  const inner = glassInner(x, y, w, h, shape);
  const liq = Math.max(0, Math.min(1, fill));
  const liquidTop = inner.y + inner.h - liq * inner.h;
  const wall = STROKE.edge;
  const bot = y + h - wall;
  const liquidW = shape === 'flask' ? w : inner.w;
  const liquidX = shape === 'flask' ? x : inner.x;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={d} />
        </clipPath>
      </defs>
      {shadow && (
        <ellipse
          cx={x + w / 2}
          cy={bot + 3}
          rx={w * 0.46}
          ry={4}
          fill="var(--fig-shadow)"
          style={{ filter: 'blur(2px)' }}
        />
      )}
      {/* glass fill */}
      <path d={d} fill="var(--fig-glass-fill)" />
      <g clipPath={`url(#${clipId})`}>
        {liq > 0.001 && (
          <>
            <rect
              className="fig-ease"
              x={liquidX}
              y={liquidTop}
              width={liquidW}
              height={Math.max(0, bot - liquidTop)}
              fill={liquid}
              fillOpacity={liquidOpacity}
              style={{
                transition: 'y 0.45s cubic-bezier(0.2,0.8,0.2,1), height 0.45s cubic-bezier(0.2,0.8,0.2,1)',
              }}
            />
            <ellipse
              cx={x + w / 2}
              cy={liquidTop}
              rx={liquidW / 2}
              ry={3.5}
              fill={liquid}
              fillOpacity={Math.min(1, liquidOpacity + 0.3)}
              style={{ transition: 'cy 0.45s cubic-bezier(0.2,0.8,0.2,1)' }}
            />
          </>
        )}
        {children}
        {/* left-wall sheen */}
        <line
          x1={inner.x + 3}
          y1={inner.y + 6}
          x2={inner.x + 3}
          y2={bot - 8}
          stroke="var(--fig-sheen)"
          strokeWidth={STROKE.line}
          strokeLinecap="round"
          opacity={0.32}
        />
      </g>
      {/* glass edge, open at the top */}
      <path
        d={d.replace(/\s*Z\s*$/, '')}
        fill="none"
        stroke="var(--fig-glass)"
        strokeWidth={STROKE.edge}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {shape === 'box' && (
        <path d={d} fill="none" stroke="var(--fig-glass)" strokeWidth={STROKE.edge} strokeLinejoin="round" />
      )}
      {rim && (
        <line
          x1={(shape === 'flask' ? inner.x : x) - 3}
          y1={y + 6}
          x2={(shape === 'flask' ? inner.x + inner.w : x + w) + 3}
          y2={y + 6}
          stroke="var(--fig-metal)"
          strokeWidth={STROKE.edge}
          strokeLinecap="round"
        />
      )}
      {overlay}
      {label != null && (
        <FigText x={x + w / 2} y={y + h + 18} anchor="middle" tone="soft">
          {label}
        </FigText>
      )}
    </g>
  );
}

/** Rising bubbles inside a vessel (call inside <Glass>; pass the inner rect and a phase). */
export function Bubbles({
  inner,
  liquidTop,
  count,
  phase,
  color = 'var(--fig-paper)',
}: {
  inner: { x: number; y: number; w: number; h: number };
  liquidTop: number;
  count: number;
  phase: number;
  color?: string;
}): ReactNode {
  const bottom = inner.y + inner.h;
  const items: ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const fr = (phase * 0.7 + i * 0.959) % 1;
    const by = bottom - fr * (bottom - liquidTop);
    const bx = inner.x + 8 + ((i * 0.41) % 1) * (inner.w - 16);
    items.push(
      <circle key={i} cx={bx} cy={by} r={1.6 + (i % 3)} fill={color} opacity={0.6 * (1 - fr) + 0.2} />,
    );
  }
  return <>{items}</>;
}

/** A translucent field/region (a gas volume, an electric field, a tissue) with a soft edge. */
export function Region({
  x,
  y,
  w,
  h,
  color = 'var(--fig-hue-3)',
  radius = 6,
  label,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  radius?: number;
  label?: ReactNode;
}): ReactNode {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={radius}
        fill={alpha(color, 10)}
        stroke={alpha(color, 45)}
        strokeWidth={STROKE.hair}
      />
      {label != null && (
        <FigText x={x + 8} y={y + 16} size="eyebrow" tone="soft">
          {label}
        </FigText>
      )}
    </g>
  );
}
