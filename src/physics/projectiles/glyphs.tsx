'use client';

/**
 * Glyphs for the projectile scenes: the launcher cart, the cannon, and the coconut palm.
 *
 * Drawn from kit parts in the figure language (stroke roles, palette tokens, one sheen, a hairline
 * darker outline, no gradients) so they sit beside the kit's own bodies without looking pasted in.
 * They are pure geometry in PIXELS: each scene converts its world units before calling them.
 */

import type { ReactNode } from 'react';
import { HUE, STROKE, shade, tint } from '../../kit/figure/index.js';

/** A spoked wheel that turns as it rolls: `turn` is the angle rolled through, in radians. */
function Wheel({ cx, cy, r, turn }: { cx: number; cy: number; r: number; turn: number }): ReactNode {
  const spokes = [0, 1, 2, 3].map((i) => {
    const a = turn + (i * Math.PI) / 4;
    const dx = Math.cos(a) * r * 0.62,
      dy = Math.sin(a) * r * 0.62;
    return (
      <line
        key={i}
        x1={cx - dx}
        y1={cy - dy}
        x2={cx + dx}
        y2={cy + dy}
        stroke={shade(HUE.metal, 55)}
        strokeWidth={STROKE.hair}
      />
    );
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={shade(HUE.metal, 45)} />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.7}
        fill={tint(HUE.metal, 70)}
        stroke={shade(HUE.metal, 55)}
        strokeWidth={STROKE.hair}
      />
      {spokes}
      <circle cx={cx} cy={cy} r={r * 0.2} fill={shade(HUE.metal, 60)} />
    </g>
  );
}

export interface CartProps {
  /** Centre of the cart, px. */
  cx: number;
  /** The ground line, px. */
  groundY: number;
  /** Pixels per metre. */
  k: number;
  /** Distance rolled so far, m, which turns the wheels. */
  rolled: number;
  color: string;
  /** Cart dimensions in metres, shared with the scene so the ball leaves the tube's mouth. */
  width: number;
  bodyHeight: number;
  wheelRadius: number;
  tubeHeight: number;
}

/**
 * A launcher cart: a chassis on two spoked wheels, with a vertical launch tube open at the top.
 * The wheels turn by distance rolled ÷ radius, so the cart reads as rolling rather than sliding.
 */
export function LauncherCart({
  cx,
  groundY,
  k,
  rolled,
  color,
  width,
  bodyHeight,
  wheelRadius,
  tubeHeight,
}: CartProps): ReactNode {
  const w = width * k,
    h = bodyHeight * k,
    r = wheelRadius * k;
  const bottom = groundY - r * 1.35;
  const top = bottom - h;
  const left = cx - w / 2;
  const tubeW = Math.max(9, 0.26 * k),
    tubeH = tubeHeight * k;
  const turn = rolled / wheelRadius;
  return (
    <g>
      {/* contact shadow: the one permitted shadow, under a body that sits on the ground */}
      <ellipse cx={cx} cy={groundY + 1.5} rx={w * 0.52} ry={3} fill="var(--fig-shadow)" />
      {/* the launch tube, standing on the deck, with its open mouth drawn as a rim */}
      <rect
        x={cx - tubeW / 2}
        y={top - tubeH}
        width={tubeW}
        height={tubeH + 2}
        rx={2}
        fill={shade(color, 80)}
        stroke={shade(color, 55)}
        strokeWidth={STROKE.hair}
      />
      <rect
        x={cx - tubeW / 2 + 2}
        y={top - tubeH + 3}
        width={tubeW * 0.22}
        height={tubeH - 4}
        rx={1}
        fill={HUE.paper}
        opacity={0.35}
      />
      <ellipse
        cx={cx}
        cy={top - tubeH}
        rx={tubeW / 2}
        ry={Math.max(2.5, tubeW * 0.22)}
        fill={shade(color, 45)}
      />
      {/* the chassis: a rounded body with a darker skirt, and one sheen along the top */}
      <rect
        x={left}
        y={top}
        width={w}
        height={h}
        rx={Math.min(8, h * 0.35)}
        fill={tint(color, 72)}
        stroke={shade(color, 60)}
        strokeWidth={STROKE.hair}
      />
      <rect x={left + 4} y={top + h * 0.68} width={w - 8} height={h * 0.22} rx={2} fill={tint(color, 45)} />
      <rect
        x={left + 6}
        y={top + 3}
        width={w * 0.6}
        height={Math.max(2, h * 0.12)}
        rx={1.5}
        fill={HUE.paper}
        opacity={0.4}
      />
      <Wheel cx={cx - w / 3} cy={groundY - r} r={r} turn={turn} />
      <Wheel cx={cx + w / 3} cy={groundY - r} r={r} turn={turn} />
    </g>
  );
}

/** Height of the tube's mouth above the ground, in metres, for a cart drawn by LauncherCart. */
export const mouthHeight = (c: Pick<CartProps, 'bodyHeight' | 'wheelRadius' | 'tubeHeight'>): number =>
  c.wheelRadius * 1.35 + c.bodyHeight + c.tubeHeight;

/**
 * A small field cannon: a barrel pivoting on a spoked carriage wheel. `angle` is the elevation in
 * degrees; the barrel's mouth is where the throw begins.
 */
export function Cannon({
  x,
  y,
  angle,
  length = 34,
}: {
  x: number;
  y: number;
  angle: number;
  length?: number;
}): ReactNode {
  const r = length * 0.3;
  return (
    <g>
      <ellipse cx={x} cy={y + 1.5} rx={length * 0.55} ry={3} fill="var(--fig-shadow)" />
      <g transform={`rotate(${-angle} ${x} ${y - r})`}>
        <rect
          x={x - length * 0.25}
          y={y - r - length * 0.16}
          width={length * 1.1}
          height={length * 0.32}
          rx={length * 0.1}
          fill={shade(HUE.metal, 75)}
          stroke={shade(HUE.metal, 45)}
          strokeWidth={STROKE.hair}
        />
        <rect
          x={x + length * 0.72}
          y={y - r - length * 0.2}
          width={length * 0.14}
          height={length * 0.4}
          rx={2}
          fill={shade(HUE.metal, 55)}
        />
        <rect
          x={x - length * 0.18}
          y={y - r - length * 0.11}
          width={length * 0.7}
          height={length * 0.06}
          rx={1}
          fill={HUE.paper}
          opacity={0.35}
        />
      </g>
      <Wheel cx={x} cy={y - r} r={r} turn={0.4} />
    </g>
  );
}

/**
 * A coconut palm: a curved, tapering trunk and drooping fronds, with a small cluster of coconuts
 * under the crown. The crown sits just above the point where the coconut hangs.
 */
export function CoconutPalm({
  baseX,
  groundY,
  crownX,
  crownY,
  scale,
}: {
  baseX: number;
  groundY: number;
  crownX: number;
  crownY: number;
  scale: number;
}): ReactNode {
  const bark = shade(HUE.warn, 45);
  const leaf = shade(HUE.good, 80);
  const leafDark = shade(HUE.good, 55);
  // The trunk bows outward: its centre line is a quadratic curve, widened into a tapering band.
  const midX = baseX + (crownX - baseX) * 0.2 + scale * 0.9,
    midY = (groundY + crownY) / 2;
  const wBase = scale * 0.34,
    wTop = scale * 0.18;
  const trunk = `M ${baseX - wBase} ${groundY} Q ${midX - (wBase + wTop) / 2} ${midY} ${crownX - wTop} ${crownY}
    L ${crownX + wTop} ${crownY} Q ${midX + (wBase + wTop) / 2} ${midY} ${baseX + wBase} ${groundY} Z`;
  const rings: ReactNode[] = [];
  for (let i = 1; i < 9; i++) {
    const f = i / 9;
    // Points on the centre curve, and a short bark ring across it.
    const px = (1 - f) * (1 - f) * baseX + 2 * (1 - f) * f * midX + f * f * crownX;
    const py = (1 - f) * (1 - f) * groundY + 2 * (1 - f) * f * midY + f * f * crownY;
    const half = wBase + (wTop - wBase) * f;
    rings.push(
      <line
        key={i}
        x1={px - half * 0.8}
        y1={py}
        x2={px + half * 0.8}
        y2={py - 1.5}
        stroke={shade(HUE.warn, 30)}
        strokeWidth={STROKE.hair}
        opacity={0.6}
      />,
    );
  }
  // Fronds: long drooping arcs from the crown, thick with a darker midrib.
  const fronds = [-150, -115, -80, -45, -10, 25].map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    const len = scale * (2.6 + (i % 2) * 0.5);
    const ex = crownX + Math.cos(a) * len,
      ey = crownY + Math.sin(a) * len * 0.55 + len * 0.45;
    const qx = crownX + Math.cos(a) * len * 0.55,
      qy = crownY + Math.sin(a) * len * 0.6 - len * 0.2;
    const d = `M ${crownX} ${crownY} Q ${qx} ${qy} ${ex} ${ey}`;
    return (
      <g key={deg}>
        <path d={d} fill="none" stroke={leaf} strokeWidth={scale * 0.32} strokeLinecap="round" />
        <path d={d} fill="none" stroke={leafDark} strokeWidth={STROKE.hair} />
      </g>
    );
  });
  return (
    <g>
      <path d={trunk} fill={tint(bark, 80)} stroke={bark} strokeWidth={STROKE.hair} />
      {rings}
      {fronds}
      <circle
        cx={crownX - scale * 0.35}
        cy={crownY + scale * 0.35}
        r={scale * 0.3}
        fill={shade(HUE.warn, 40)}
      />
      <circle
        cx={crownX + scale * 0.3}
        cy={crownY + scale * 0.4}
        r={scale * 0.3}
        fill={shade(HUE.warn, 40)}
      />
    </g>
  );
}
