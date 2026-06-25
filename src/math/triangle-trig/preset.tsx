'use client';

/**
 * TriangleTrig — the first REPRESENTATION plug-in: a thing the graph engine can't
 * draw (a labelled right triangle), authored by config and reusing the shared
 * answer-check seam. Built for the angle-of-elevation/depression family — "from the
 * top of a 15 m tower the angle of depression to a point is 31°, find the distance"
 * (the user's "see the angle and the tree/pole distances"). A 2-D split is clearer
 * (and cheaper) than pseudo-3-D.
 *
 * The creator gives an angle + ONE leg; the engine solves the rest (tan/sin/cos),
 * draws the triangle with every side + the angle labelled, exposes chosen knobs as
 * sliders for intuition, and — with `ask` — grades a typed answer via `checkAnswer`.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Segment, Label, type Vec2 } from '@classytic/stage';
import { AngleArc, RightAngleMark } from '../../kit/diagram.js';
import { Slider } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { AskBox } from '../../kit/pedagogy.js';
import { checkAnswer } from '../../kit/answer-check.js';
import type { ProblemAsk } from '../interactive/index.js';

export interface TriangleTrigProps {
  /** Angle θ in degrees (0 < θ < 90). */
  angleDeg?: number;
  /** Length of the GIVEN leg. */
  leg?: number;
  /** Which leg `leg` is: the vertical 'opposite' or the horizontal 'adjacent'. */
  legKind?: 'opposite' | 'adjacent';
  /** Framing: elevation (look up from the base) / depression (look down from the top) / plain. */
  mode?: 'elevation' | 'depression' | 'plain';
  labels?: { opposite?: string; adjacent?: string; hypotenuse?: string; angle?: string };
  /** Which knobs are draggable. Empty → a fixed (authored) scenario. Default: ['angle']. */
  drive?: ('angle' | 'leg')[];
  legMin?: number;
  legMax?: number;
  /** Optional graded question; the answer is checked symbolically/numerically. */
  ask?: ProblemAsk;
  title?: string;
  prompt?: string;
  height?: number;
  activity?: string;
}

const C_GIVEN = 'var(--stage-accent)';
const C_HYP = 'var(--stage-accent-2)';
const C_CALC = 'var(--stage-fg)';

const fmt = (n: number): string => (Number.isFinite(n) ? (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(2)) : '—');

export function TriangleTrig({
  angleDeg = 31, leg = 15, legKind = 'opposite', mode = 'depression',
  labels, drive = ['angle'], legMin = 1, legMax,
  ask,
  title = 'Angle of depression — solve the right triangle',
  prompt = 'The angle, the height and the ground distance are one right triangle: tan θ = opposite / adjacent.',
  height = 320, activity = 'triangle-trig',
}: TriangleTrigProps = {}): ReactNode {
  const [deg, setDeg] = useState(angleDeg);
  const [len, setLen] = useState(leg);
  const lab = { opposite: 'opposite', adjacent: 'adjacent', hypotenuse: 'hypotenuse', angle: 'θ', ...labels };
  const maxLeg = legMax ?? Math.max(20, Math.ceil(leg * 2));

  const th = (deg * Math.PI) / 180;
  const A = legKind === 'adjacent' ? len : len / Math.tan(th);   // horizontal
  const O = legKind === 'adjacent' ? len * Math.tan(th) : len;   // vertical
  const H = Math.hypot(A, O);
  const givenIsOpp = legKind === 'opposite';

  // triangle vertices (metres): right angle at B
  const Oc: Vec2 = { x: 0, y: 0 };           // bottom-left (base of sight line)
  const B: Vec2 = { x: A, y: 0 };            // bottom-right (right angle)
  const T: Vec2 = { x: A, y: O };            // top-right
  const pad = Math.max(A, O, 1) * 0.18;
  const view = { xMin: -pad, xMax: A + pad * 2.2, yMin: -pad, yMax: O + pad * 1.6 };

  // depression angle sits at the TOP, between a horizontal ray and the line of sight down
  const horiz: Vec2 = { x: A - Math.min(A * 0.55, O * 0.9 + 1), y: O };

  const sideLabel = (mid: Vec2, name: string, value: number, color: string, given: boolean, off: { dx?: number; dy?: number }): ReactNode => (
    <Label x={mid.x} y={mid.y} text={`${name} = ${fmt(value)}`} color={color} size={12} dx={off.dx} dy={off.dy} />
  );

  const figure = (
    <Stage view={view} height={height} ariaLabel={`Right triangle: ${lab.angle} ${deg} degrees, ${lab.opposite} ${fmt(O)}, ${lab.adjacent} ${fmt(A)}, hypotenuse ${fmt(H)}`}>
      {/* sides */}
      <Segment from={Oc} to={B} color={!givenIsOpp ? C_GIVEN : C_CALC} weight={!givenIsOpp ? 3 : 2} opacity={!givenIsOpp ? 1 : 0.5} />
      <Segment from={B} to={T} color={givenIsOpp ? C_GIVEN : C_CALC} weight={givenIsOpp ? 3 : 2} opacity={givenIsOpp ? 1 : 0.5} />
      <Segment from={Oc} to={T} color={C_HYP} weight={2.5} />
      <RightAngleMark at={B} u={{ x: -1, y: 0 }} v={{ x: 0, y: 1 }} />
      {mode === 'depression' ? (
        <>
          <Segment from={T} to={horiz} color="var(--stage-muted)" weight={1.2} dashed opacity={0.7} />
          <AngleArc at={T} from={{ x: horiz.x - T.x, y: 0 }} to={{ x: Oc.x - T.x, y: Oc.y - T.y }} rPx={30} label={`${lab.angle}=${deg}°`} />
        </>
      ) : (
        <AngleArc at={Oc} from={{ x: 1, y: 0 }} to={{ x: A, y: O }} rPx={30} label={`${lab.angle}=${deg}°`} />
      )}
      {sideLabel({ x: A / 2, y: 0 }, lab.adjacent, A, !givenIsOpp ? C_GIVEN : C_CALC, !givenIsOpp, { dy: 16 })}
      {sideLabel({ x: A, y: O / 2 }, lab.opposite, O, givenIsOpp ? C_GIVEN : C_CALC, givenIsOpp, { dx: 16 })}
      {sideLabel({ x: A / 2, y: O / 2 }, lab.hypotenuse, H, C_HYP, false, { dx: -10, dy: -8 })}
    </Stage>
  );

  const aside = (
    <Callout tone="result">
      <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
        <span>{lab.angle} = <strong>{deg}°</strong></span>
        <span>{lab.opposite} = <strong>{fmt(O)}</strong></span>
        <span>{lab.adjacent} = <strong>{fmt(A)}</strong></span>
        <span>hypotenuse = <strong>{fmt(H)}</strong></span>
        <span style={{ color: 'var(--stage-muted)' }}>tan {lab.angle} = {fmt(O)}/{fmt(A)} = {fmt(O / A)}</span>
      </div>
    </Callout>
  );

  const sliders: ReactNode[] = [];
  if (drive.includes('angle')) sliders.push(<Field key="a" label={lab.angle} value={`${deg}°`}><Slider value={deg} min={5} max={85} step={1} onChange={setDeg} ariaLabel="angle in degrees" /></Field>);
  if (drive.includes('leg')) sliders.push(<Field key="l" label={legKind} value={fmt(len)}><Slider value={len} min={legMin} max={maxLeg} step={1} onChange={setLen} ariaLabel={`${legKind} length`} /></Field>);
  const controls = sliders.length ? <ControlBar>{sliders}</ControlBar> : undefined;

  const footer = ask ? (
    <AskBox prompt={ask.prompt} placeholder={ask.placeholder} activity={activity} check={(r) => checkAnswer(ask.answer, r)} />
  ) : undefined;

  return <LabFrame title={title} prompt={prompt} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
