'use client';

/**
 * Projectile lab — SVG RENDERER. Rendering only: it takes already-computed geometry
 * (the sampled arc + the ball position, from core/model) and draws the scene. It knows
 * nothing about the projectile EQUATIONS — swap this for a canvas/WebGL renderer and the
 * physics core is untouched.
 */

import type { ReactNode } from 'react';
import {
  Stage,
  Segment,
  Polyline,
  Circle,
  Dot,
  Label,
  useCoords,
  StageAssetDefs,
  fmt,
  type Vec2,
} from '@classytic/stage';
import type { Point } from '../core/types.js';

const WORLD_W = 130; // metres across the stage

/** A field cannon at the origin, elevated to `angle`. Static local coords rotated via an
 *  SVG transform (no transcendental-derived coordinate is serialized — SSR-deterministic). */
function CannonGlyph({ angle }: { angle: number }): ReactNode {
  const c = useCoords();
  const [ox, oy] = c.toPx(0, 0);
  const s = c.sx(1);
  const L = 13 * s,
    hw = 1.7 * s;
  const grad = 'url(#stage-grad-metal)';
  const metal = 'var(--stage-metal)';
  const edge = 'color-mix(in oklab, var(--stage-metal) 60%, black)';
  const dark = 'color-mix(in oklab, var(--stage-metal) 42%, black)';
  const sheen = 'color-mix(in oklab, var(--stage-sheen) 45%, transparent)';
  const T = `translate(${fmt(ox)},${fmt(oy)})`;
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3;
    return { x: fmt(s * 2.2 * Math.cos(a)), y: fmt(s * 2.2 * Math.sin(a)) };
  });
  return (
    <g>
      <StageAssetDefs />
      <g transform={`${T} rotate(${fmt(-angle)})`}>
        <circle cx={-s * 1.3} cy={0} r={hw * 1.15} fill={grad} stroke={edge} strokeWidth={0.7} />
        <path
          d={`M 0 ${-hw * 0.92} L ${L * 0.84} ${-hw * 0.78} L ${L * 0.84} ${-hw} L ${L} ${-hw} L ${L} ${hw} L ${L * 0.84} ${hw} L ${L * 0.84} ${hw * 0.78} L 0 ${hw * 0.92} Z`}
          fill={grad}
          stroke={edge}
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
        <line x1={L * 0.4} y1={-hw * 0.95} x2={L * 0.4} y2={hw * 0.95} stroke={dark} strokeWidth={1.6} />
        <line x1={L * 0.72} y1={-hw} x2={L * 0.72} y2={hw} stroke={dark} strokeWidth={1.6} />
        <line
          x1={s * 0.4}
          y1={-hw * 0.5}
          x2={L * 0.8}
          y2={-hw * 0.5}
          stroke={sheen}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <ellipse cx={L} cy={0} rx={hw * 0.22} ry={hw * 0.9} fill={dark} />
      </g>
      <g transform={T}>
        <circle cx={0} cy={0} r={s * 2.2} fill="var(--stage-bg)" stroke={metal} strokeWidth={2} />
        {spokes.map((p, i) => (
          <line key={i} x1={0} y1={0} x2={p.x} y2={p.y} stroke={metal} strokeWidth={1.2} />
        ))}
        <circle cx={0} cy={0} r={s * 0.7} fill={metal} />
      </g>
    </g>
  );
}

export interface ProjectileSvgProps {
  angle: number;
  target: number;
  /** peak height, to frame the vertical view (from core). */
  peak: number;
  /** the sampled flight path (from core/model.sampleArc). */
  arc: Point[];
  /** the ball's current position (from core/model.projectileAt). */
  ball: Point;
}

export function ProjectileSvg({ angle, target, peak, arc, ball }: ProjectileSvgProps): ReactNode {
  const view = { xMin: -5, xMax: WORLD_W, yMin: -4, yMax: Math.max(40, peak + 12) };
  return (
    <Stage view={view} height={300} ariaLabel={`Projectile launched at ${angle}°; target at ${target} m`}>
      <Segment
        from={{ x: view.xMin, y: 0 }}
        to={{ x: WORLD_W, y: 0 }}
        color="var(--stage-fg)"
        opacity={0.5}
        weight={1.5}
      />
      {[0, 20, 40, 60, 80, 100, 120].map((m) => (
        <Label key={m} x={m} y={0} text={`${m}m`} color="var(--stage-fg)" size={10} dy={14} />
      ))}
      <Circle center={{ x: target, y: 2.6 }} r={2.6} color="var(--stage-accent-2)" fill="none" weight={2} />
      <Circle
        center={{ x: target, y: 2.6 }}
        r={1.1}
        color="var(--stage-accent-2)"
        fill="var(--stage-accent-2)"
        fillOpacity={0.9}
        weight={0}
      />
      <Label x={target} y={2.6} text="target" color="var(--stage-accent-2)" size={11} dy={-22} />
      <CannonGlyph angle={angle} />
      <Polyline points={arc as Vec2[]} color="var(--stage-accent)" opacity={0.55} weight={1.5} dashed />
      <Circle
        center={ball as Vec2}
        r={1.4}
        color="var(--stage-good)"
        fill="var(--stage-good)"
        fillOpacity={0.25}
        weight={0}
      />
      <Dot x={ball.x} y={ball.y} r={5} color="var(--stage-good)" />
    </Stage>
  );
}
