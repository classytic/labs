'use client';

/**
 * Small composite helpers built on @classytic/stage primitives, shared by the
 * physics/vector labs. Render these INSIDE a `<Stage>` (they use the coordinate
 * context via the underlying primitives).
 */

import { Fragment, type ReactNode } from 'react';
import { Vector, Segment, Label, Polygon, useCoords, type Vec2 } from '@classytic/stage';

/**
 * An angle arc drawn at point `at`, swept from direction `from` to direction
 * `to` (both as vectors from `at`), with an optional label (e.g. "θ" or "53°").
 * Radius is in pixels so it stays a constant on-screen size. Computed in pixel
 * space so it's correct regardless of the (possibly non-uniform) view scale.
 */
export interface AngleArcProps {
  at: Vec2;
  from: Vec2;
  to: Vec2;
  rPx?: number;
  color?: string;
  label?: string;
}
export function AngleArc({ at, from, to, rPx = 26, color = 'var(--stage-fg)', label }: AngleArcProps): ReactNode {
  const c = useCoords();
  const o = c.toPx(at.x, at.y);
  const p1 = c.toPx(at.x + from.x, at.y + from.y);
  const p2 = c.toPx(at.x + to.x, at.y + to.y);
  const a1 = Math.atan2(p1[1] - o[1], p1[0] - o[0]);
  const a2 = Math.atan2(p2[1] - o[1], p2[0] - o[0]);
  let da = a2 - a1;
  while (da <= -Math.PI) da += 2 * Math.PI;
  while (da > Math.PI) da -= 2 * Math.PI;
  const sweep = da > 0 ? 1 : 0;
  const sx = o[0] + rPx * Math.cos(a1), sy = o[1] + rPx * Math.sin(a1);
  const ex = o[0] + rPx * Math.cos(a2), ey = o[1] + rPx * Math.sin(a2);
  const am = a1 + da / 2;
  const lx = o[0] + (rPx + 13) * Math.cos(am), ly = o[1] + (rPx + 13) * Math.sin(am);
  return (
    <Fragment>
      <path d={`M ${sx} ${sy} A ${rPx} ${rPx} 0 0 ${sweep} ${ex} ${ey}`} fill="none" stroke={color} strokeWidth={1.6} opacity={0.85} />
      {label && <text x={lx} y={ly} fill={color} fontSize={13} fontWeight={600} textAnchor="middle" dominantBaseline="middle">{label}</text>}
    </Fragment>
  );
}

/** A small right-angle square at `at`, between unit-ish directions `u` and `v`. */
export function RightAngleMark({ at, u, v, sizePx = 12, color = 'var(--stage-muted)' }: { at: Vec2; u: Vec2; v: Vec2; sizePx?: number; color?: string }): ReactNode {
  const c = useCoords();
  const o = c.toPx(at.x, at.y);
  const dir = (d: Vec2): [number, number] => { const p = c.toPx(at.x + d.x, at.y + d.y); const dx = p[0] - o[0], dy = p[1] - o[1]; const m = Math.hypot(dx, dy) || 1; return [dx / m, dy / m]; };
  const [ux, uy] = dir(u);
  const [vx, vy] = dir(v);
  const a: [number, number] = [o[0] + ux * sizePx, o[1] + uy * sizePx];
  const b: [number, number] = [o[0] + (ux + vx) * sizePx, o[1] + (uy + vy) * sizePx];
  const d: [number, number] = [o[0] + vx * sizePx, o[1] + vy * sizePx];
  return <path d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${d[0]} ${d[1]}`} fill="none" stroke={color} strokeWidth={1.4} opacity={0.8} />;
}

export interface LabeledVectorProps {
  /** Tail anchor (default origin). */
  tail?: Vec2;
  /** Vector components (dx, dy) from the tail. */
  comp: Vec2;
  color?: string;
  weight?: number;
  label?: string;
  /** Draw the dashed x/y component decomposition from the tail. */
  components?: boolean;
}

/**
 * An arrow (tail → tail+comp) with an optional tip label and optional dashed
 * x/y component decomposition — the SVG equivalent of the old canvas
 * `drawVector(..., { label, components })`.
 */
export function LabeledVector({ tail = { x: 0, y: 0 }, comp, color = 'var(--stage-accent)', weight = 2.5, label, components = false }: LabeledVectorProps): ReactNode {
  const tip = { x: tail.x + comp.x, y: tail.y + comp.y };
  const corner = { x: tip.x, y: tail.y };
  return (
    <Fragment>
      {components && (
        <Fragment>
          <Segment from={tail} to={corner} color={color} opacity={0.4} weight={1} dashed />
          <Segment from={corner} to={tip} color={color} opacity={0.4} weight={1} dashed />
        </Fragment>
      )}
      <Vector tail={tail} tip={tip} color={color} weight={weight} />
      {label && (() => {
        // Place the label just BEYOND the arrowhead, along the arrow's own (screen-space)
        // direction — so it never sits on the line, and labels of nearby vectors fan apart
        // instead of stacking at a fixed corner. (Screen y is flipped vs math y.)
        const len = Math.hypot(comp.x, comp.y) || 1;
        const ux = comp.x / len, uy = -comp.y / len;
        const off = 15;
        const anchor = ux < -0.35 ? 'end' : ux > 0.35 ? 'start' : 'middle';
        return <Label x={tip.x} y={tip.y} text={label} color={color} dx={ux * off} dy={uy * off} size={13} anchor={anchor} />;
      })()}
    </Fragment>
  );
}

export interface ResistorBoxProps {
  /** Center of the resistor, in view units. */
  center: Vec2;
  /** Box width / height in view units. */
  w: number;
  h: number;
  color?: string;
  label?: string;
  /** Optional reading shown below the box (e.g. a voltage drop / branch current). */
  reading?: string;
}

/** A schematic resistor: an outlined box (filled with the canvas bg) + a label
 *  above and an optional reading below. The SVG equivalent of the old canvas
 *  `drawResistor`. */
export function ResistorBox({ center, w, h, color = 'var(--stage-accent)', label, reading }: ResistorBoxProps): ReactNode {
  const x0 = center.x - w / 2, x1 = center.x + w / 2;
  const y0 = center.y - h / 2, y1 = center.y + h / 2;
  return (
    <Fragment>
      <Polygon points={[{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }]} color={color} fill="var(--stage-bg)" fillOpacity={1} weight={2} />
      {label && <Label x={center.x} y={y1} text={label} color="var(--stage-fg)" size={11} dy={-12} />}
      {reading && <Label x={center.x} y={y0} text={reading} color={color} size={11} dy={16} />}
    </Fragment>
  );
}
