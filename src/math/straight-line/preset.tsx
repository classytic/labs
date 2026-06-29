'use client';

/**
 * StraightLineLab, one authorable lab that covers the whole Edexcel/IGCSE
 * "equation of a straight line" spine, switched by `mode`:
 *
 *   two-point          drag A and B → the line through them, with the gradient
 *                      shown as a rise/run triangle and the live y = m·x + c.
 *   gradient-intercept drag the y-intercept (on the y-axis) and a slope handle , 
 *                      feel how m tilts and c slides the line.
 *   intercept-form     drag the x- and y-intercepts → x/a + y/b = 1.
 *   parallel           a FIXED given line; drag a point P; the parallel line
 *                      through P is built live (same gradient).
 *   perpendicular      same, but the ⊥ line (gradient −1/m); the right angle at
 *                      the crossing is marked and m₁·m₂ = −1 is shown.
 *
 * Direct manipulation on a CoordPlane + an optional checked question (AskBox).
 * A creator authors a real exam question by setting the mode, the given line /
 * starting points, and the answer to check, no code.
 */

import { useState, type ReactNode } from 'react';
import { Line, Dot, MovableDot, Label, type Vec2 } from '@classytic/stage';
import { LabFrame, Callout } from '../../kit/frame.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { RightAngleMark } from '../../kit/diagram.js';
import {
  CoordPlane, GradientTriangle, lineThrough, lineFrom, parallelThrough, perpThrough,
  intersectLines, distance, midpoint, lineTex, interceptTex, snapPoint, num, type Lin,
} from '../../kit/coords.js';

export type StraightLineMode =
  | 'two-point' | 'gradient-intercept' | 'intercept-form' | 'parallel' | 'perpendicular';

export interface StraightLineProps {
  mode?: StraightLineMode;
  /** Starting draggable points (two-point / gradient-intercept / intercept-form). */
  pointA?: Vec2;
  pointB?: Vec2;
  /** The fixed line for parallel / perpendicular modes. */
  given?: { m: number; c: number };
  /** Starting position of the draggable point P (parallel / perpendicular). */
  through?: Vec2;
  view?: { xMin: number; xMax: number; yMin: number; yMax: number };
  height?: number;
  /** Drag snap step in units (0 = free). Default 1. */
  snap?: number;
  /** two-point: also show |AB| and the midpoint. */
  showDistance?: boolean;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const C_LINE = 'var(--stage-accent)';
const C_GIVEN = 'var(--stage-accent-2)';
const C_A = 'var(--stage-good)';
const C_B = 'var(--stage-accent)';
const DEFAULT_VIEW = { xMin: -8, xMax: 8, yMin: -6, yMax: 6 };

const DEFAULTS: Record<StraightLineMode, { a: Vec2; b: Vec2 }> = {
  'two-point': { a: { x: -3, y: -2 }, b: { x: 4, y: 3 } },
  'gradient-intercept': { a: { x: 0, y: 1 }, b: { x: 3, y: 3 } },
  'intercept-form': { a: { x: 4, y: 0 }, b: { x: 0, y: 3 } },
  parallel: { a: { x: 2, y: -3 }, b: { x: 0, y: 0 } },
  perpendicular: { a: { x: 2, y: -3 }, b: { x: 0, y: 0 } },
};

const PROMPTS: Record<StraightLineMode, string> = {
  'two-point': 'Drag A and B. The gradient is the rise over the run; the equation is y = m·x + c.',
  'gradient-intercept': 'Drag the y-intercept up the y-axis, and the handle to tilt the gradient.',
  'intercept-form': 'Drag where the line cuts each axis. Intercept form: x/a + y/b = 1.',
  parallel: 'Drag P. The new line stays parallel to the given one, same gradient, different intercept.',
  perpendicular: 'Drag P. The new line is perpendicular to the given one: its gradient is −1/m, so m₁·m₂ = −1.',
};

export function StraightLineLab(props: StraightLineProps = {}): ReactNode {
  const mode = props.mode ?? 'two-point';
  const {
    given = { m: 0.5, c: 2 }, view = DEFAULT_VIEW, height = 380, snap = 1,
    showDistance = false,
    title = 'The straight line', prompt = PROMPTS[mode], ask,
    activity = `straight-line-${mode}`,
  } = props;

  const def = DEFAULTS[mode];
  const [A, setA] = useState<Vec2>(props.pointA ?? def.a);
  const [B, setB] = useState<Vec2>(props.pointB ?? def.b);
  const [P, setP] = useState<Vec2>(props.through ?? { x: -2, y: 2 });
  const snapP = (p: Vec2): Vec2 => snapPoint(p, snap);

  const givenLine: Lin = lineFrom(given.m, { x: 0, y: given.c });

  // ── derive the line(s) + readouts for this mode ─────────────────────────────
  let line: Lin;
  let scene: ReactNode;
  const readouts: { label: string; value: string }[] = [];

  if (mode === 'parallel' || mode === 'perpendicular') {
    line = mode === 'parallel' ? parallelThrough(givenLine, P) : perpThrough(givenLine, P);
    const cross = intersectLines(givenLine, line);
    readouts.push({ label: 'given line', value: lineTex(givenLine) });
    readouts.push({ label: 'new line', value: lineTex(line) });
    if (mode === 'parallel') readouts.push({ label: 'gradients', value: `both m = ${num(given.m)}` });
    else readouts.push({ label: 'm₁ · m₂', value: `${num(given.m)} · ${num(line.m)} = ${num(given.m * (Number.isFinite(line.m) ? line.m : 0))}${Number.isFinite(line.m) ? '' : ' (⊥ vertical)'}` });
    scene = (
      <>
        <Line from={{ x: 0, y: givenLine.c }} to={{ x: 1, y: givenLine.c + givenLine.m }} color={C_GIVEN} weight={2.5} />
        {line.vertical !== undefined
          ? <Line from={{ x: line.vertical, y: 0 }} to={{ x: line.vertical, y: 1 }} color={C_LINE} weight={3} />
          : <Line from={{ x: 0, y: line.c }} to={{ x: 1, y: line.c + line.m }} color={C_LINE} weight={3} />}
        {cross && mode === 'perpendicular' && (
          <RightAngleMark at={cross} u={{ x: 1, y: givenLine.m }} v={line.vertical !== undefined ? { x: 0, y: 1 } : { x: 1, y: line.m }} />
        )}
        {cross && <Dot x={cross.x} y={cross.y} r={4} color="var(--stage-muted)" />}
        <MovableDot value={P} onMove={(p) => setP(snapP(p))} snap={snap} color={C_A} ariaLabel="point P, drag it" />
        <Label x={P.x} y={P.y} text={`P (${num(P.x)}, ${num(P.y)})`} color={C_A} size={12} weight={700} dx={12} dy={-8} anchor="start" />
      </>
    );
  } else if (mode === 'intercept-form') {
    // A is the x-intercept (a,0); B is the y-intercept (0,b)
    const a = A.x, b = B.y;
    line = lineThrough(A, B);
    readouts.push({ label: 'x-intercept a', value: num(a) });
    readouts.push({ label: 'y-intercept b', value: num(b) });
    readouts.push({ label: 'intercept form', value: interceptTex(a, b) });
    readouts.push({ label: 'gradient form', value: lineTex(line) });
    scene = (
      <>
        <Line from={A} to={B} color={C_LINE} weight={3} />
        <Label x={a} y={0} text={`a = ${num(a)}`} color={C_A} size={12} weight={700} dy={a >= 0 ? 16 : 16} dx={a >= 0 ? 6 : -6} anchor={a >= 0 ? 'start' : 'end'} />
        <Label x={0} y={b} text={`b = ${num(b)}`} color={C_B} size={12} weight={700} dx={10} anchor="start" />
        <MovableDot value={A} onMove={(p) => setA({ x: snapPoint(p, snap).x || 0.001, y: 0 })} snap={snap} constrain="horizontal" color={C_A} ariaLabel="x-intercept a, drag along the x-axis" />
        <MovableDot value={B} onMove={(p) => setB({ x: 0, y: snapPoint(p, snap).y || 0.001 })} snap={snap} constrain="vertical" color={C_B} ariaLabel="y-intercept b, drag along the y-axis" />
      </>
    );
  } else {
    // two-point and gradient-intercept share the "line through A,B" geometry;
    // gradient-intercept just pins A to the y-axis (it IS the intercept).
    const pinA = mode === 'gradient-intercept';
    line = lineThrough(A, B);
    readouts.push({ label: 'gradient m', value: num(line.m) });
    readouts.push({ label: 'y-intercept c', value: num(line.c) });
    readouts.push({ label: 'equation', value: lineTex(line) });
    if (showDistance && mode === 'two-point') {
      readouts.push({ label: '|AB|', value: num(distance(A, B)) });
      const mid = midpoint(A, B);
      readouts.push({ label: 'midpoint', value: `(${num(mid.x)}, ${num(mid.y)})` });
    }
    scene = (
      <>
        <Line from={A} to={B} color={C_LINE} weight={3} />
        <GradientTriangle a={A.x <= B.x ? A : B} b={A.x <= B.x ? B : A} />
        <MovableDot
          value={A}
          onMove={(p) => setA(pinA ? { x: 0, y: snapPoint(p, snap).y } : snapP(p))}
          snap={snap}
          color={C_A}
          ariaLabel={pinA ? 'y-intercept, drag up the y-axis' : 'point A, drag it'}
        />
        <MovableDot value={B} onMove={(p) => setB(snapP(p))} snap={snap} color={C_B} ariaLabel="point B, drag it" />
      </>
    );
  }

  const figure = (
    <CoordPlane view={view} height={height} ariaLabel={`${title}: ${lineTex(line)}`}>
      {scene}
    </CoordPlane>
  );

  const aside = (
    <Callout tone="result">
      <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
        {readouts.map((r, i) => (
          <span key={i}>{r.label}: <strong>{r.value}</strong></span>
        ))}
      </div>
    </Callout>
  );

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;

  return <LabFrame title={title} prompt={prompt} aside={aside} footer={footer}>{figure}</LabFrame>;
}
