'use client';

/**
 * CircleLab, the coordinate-geometry circle, as a thing you drag. Move the
 * CENTRE (a, b) and pull the RIM to set the radius r; the equation
 * (x − a)² + (y − b)² = r² updates live, and (optionally) its expanded form
 * x² + y² + Dx + Ey + F = 0, the shape Edexcel hands you to complete-the-square.
 *
 * Turn on `showTangent` and a point rides the rim: the tangent there is drawn
 * perpendicular to the radius (right-angle marked), which is the other classic
 * circle question. Authorable via props + an optional checked answer (AskBox):
 * "find the centre", "find the radius", "give the equation of the tangent".
 */

import { useState, type ReactNode } from 'react';
import { Circle, Segment, Line, Dot, MovableDot, type Vec2 } from '@classytic/stage';
import { LabFrame, Callout } from '../../kit/frame.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { RightAngleMark } from '../../kit/diagram.js';
import {
  CoordPlane, lineFrom, circleTex, circleExpandedTex, lineTex,
  distance, snapPoint, num, type Lin,
} from '../../kit/coords.js';

export interface CircleProps {
  center?: Vec2;
  radius?: number;
  /** Show a point on the rim with its tangent (⊥ to the radius). */
  showTangent?: boolean;
  /** Initial tangent-point position, degrees round the circle. */
  tangentAngleDeg?: number;
  /** Also show the expanded x² + y² + Dx + Ey + F = 0 form. */
  showExpanded?: boolean;
  view?: { xMin: number; xMax: number; yMin: number; yMax: number };
  height?: number;
  /** Drag snap step (0 = free). Default 1. */
  snap?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const C_CIRCLE = 'var(--stage-accent)';
const C_CENTER = 'var(--stage-good)';
const C_TAN = 'var(--stage-accent-2)';
const DEFAULT_VIEW = { xMin: -7, xMax: 7, yMin: -7, yMax: 7 };

export function CircleLab({
  center: center0 = { x: 0, y: 0 }, radius = 4,
  showTangent = false, tangentAngleDeg = 45, showExpanded = false,
  view = DEFAULT_VIEW, height = 400, snap = 1,
  title = 'The circle', prompt = 'Drag the centre to move it; drag the rim to resize. (x − a)² + (y − b)² = r².',
  ask, activity = 'circle',
}: CircleProps = {}): ReactNode {
  const [center, setCenter] = useState<Vec2>(center0);
  const [rim, setRim] = useState<Vec2>({ x: center0.x + radius, y: center0.y });
  const [tAng, setTAng] = useState((tangentAngleDeg * Math.PI) / 180);

  const r = Math.max(0.5, distance(center, rim));
  const { x: a, y: b } = center;

  // tangent point rides the rim at angle tAng; the tangent is ⊥ to the radius,
  // i.e. it runs along (−Δy, Δx) where (Δx, Δy) is the radius vector at T.
  const T: Vec2 = { x: a + r * Math.cos(tAng), y: b + r * Math.sin(tAng) };
  const tdx = -(T.y - b), tdy = T.x - a;
  const tangent: Lin = Math.abs(tdx) < 1e-9 ? { m: Infinity, c: NaN, vertical: T.x } : lineFrom(tdy / tdx, T);

  const readouts: { label: string; value: string }[] = [
    { label: 'centre (a, b)', value: `(${num(a)}, ${num(b)})` },
    { label: 'radius r', value: num(r) },
    { label: 'equation', value: circleTex(a, b, r) },
  ];
  if (showExpanded) readouts.push({ label: 'expanded', value: circleExpandedTex(a, b, r) });
  if (showTangent) readouts.push({ label: 'tangent', value: lineTex(tangent) });

  const figure = (
    <CoordPlane view={view} height={height} ariaLabel={`Circle ${circleTex(a, b, r)}`}>
      <Circle center={center} r={r} color={C_CIRCLE} fill={C_CIRCLE} fillOpacity={0.07} weight={2.5} />
      <Segment from={center} to={rim} color="var(--stage-muted)" weight={1.5} dashed />
      {showTangent && (
        <>
          <Segment from={center} to={T} color={C_TAN} weight={1.5} dashed />
          {tangent.vertical !== undefined
            ? <Line from={{ x: tangent.vertical, y: 0 }} to={{ x: tangent.vertical, y: 1 }} color={C_TAN} weight={2.5} />
            : <Line from={{ x: 0, y: tangent.c }} to={{ x: 1, y: tangent.c + tangent.m }} color={C_TAN} weight={2.5} />}
          <RightAngleMark at={T} u={{ x: T.x - a, y: T.y - b }} v={tangent.vertical !== undefined ? { x: 0, y: 1 } : { x: 1, y: tangent.m }} />
          <MovableDot value={T} onMove={(p) => setTAng(Math.atan2(p.y - b, p.x - a))} color={C_TAN} ariaLabel="tangent point, drag it round the rim" />
        </>
      )}
      <MovableDot value={center} onMove={(p) => setCenter(snapPoint(p, snap))} snap={snap} color={C_CENTER} ariaLabel="centre, drag to move the circle" />
      <MovableDot value={rim} onMove={(p) => setRim(snapPoint(p, snap))} snap={snap} color={C_CIRCLE} ariaLabel="rim, drag to change the radius" />
      <Dot x={a} y={b} r={2.5} color={C_CENTER} />
    </CoordPlane>
  );

  const aside = (
    <Callout tone="result">
      <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
        {readouts.map((rr, i) => <span key={i}>{rr.label}: <strong>{rr.value}</strong></span>)}
      </div>
    </Callout>
  );

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;

  return <LabFrame title={title} prompt={prompt} aside={aside} footer={footer}>{figure}</LabFrame>;
}
