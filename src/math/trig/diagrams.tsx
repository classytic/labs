'use client';

/**
 * Small, composable trig DIAGRAMS, the geometry primitives an author drops into a
 * RuleCard's `figure` slot so a trig rule is shown, not just stated. They render on
 * @classytic/stage SVG primitives and read the teaching kernel, so they stay
 * correct (signs, exact values, reference angle) for any angle.
 *
 *   • UnitCircleMini  : the terminal point with cos/sin legs coloured by sign, the
 *                       angle wedge, the CAST letter, optional exact value labels.
 *   • SpecialTriangles: the 45-45-90 and 30-60-90 triangles the exact values come
 *                       from (1,1,√2 and 1,√3,2).
 *
 * Authors compose these to PROVE a rule visually; learners drag the calculator and
 * the picture moves with it.
 */

import { type ReactNode } from 'react';
import { Stage, Axes, Circle, Segment, Vector, Dot, Label, Polyline, type Vec2 } from '@classytic/stage';
import { Tex } from '../../core/tex.js';
import { toRad } from '../../core/util.js';
import * as T from './core.js';

const SIGN_COLOR = (s: number): string => (s > 0 ? 'var(--stage-good)' : s < 0 ? 'var(--stage-danger)' : 'var(--stage-muted)');
const CAST = [{ q: 1, x: 0.55, y: 0.55, c: 'A' }, { q: 2, x: -0.55, y: 0.55, c: 'S' }, { q: 3, x: -0.55, y: -0.55, c: 'T' }, { q: 4, x: 0.55, y: -0.55, c: 'C' }] as const;

function arc(thetaRad: number, r: number): Vec2[] {
  const n = 28;
  return Array.from({ length: n + 1 }, (_, i) => { const t = (thetaRad * i) / n; return { x: r * Math.cos(t), y: r * Math.sin(t) }; });
}

export interface UnitCircleMiniProps {
  deg: number;
  /** Draw the cos (horizontal) + sin (vertical) legs, sign-coloured. */
  showLegs?: boolean;
  /** Label the legs with the exact/decimal cos and sin values. */
  showValue?: boolean;
  /** Show the CAST letters in the four quadrants (current one highlighted). */
  showCast?: boolean;
  /** Label the hypotenuse "1" (for the Pythagorean picture). */
  showHyp?: boolean;
  size?: number;
}

/** A compact unit circle that turns with `deg`. The shared trig picture. */
export function UnitCircleMini({ deg, showLegs = true, showValue = false, showCast = false, showHyp = false, size = 230 }: UnitCircleMiniProps): ReactNode {
  const rad = toRad(deg);
  const P: Vec2 = { x: Math.cos(rad), y: Math.sin(rad) };
  const q = T.quadrant(deg);
  const sCos = T.sign('cos', deg), sSin = T.sign('sin', deg);
  const valOf = (fn: T.TrigFn): string => T.exactTex(fn, deg) || (Math.round(T.evalTrig(fn, deg) * 100) / 100).toString().replace(/^-/, '−');

  return (
    <div style={{ width: '100%', maxWidth: size }}>
      <Stage view={{ xMin: -1.35, xMax: 1.35, yMin: -1.3, yMax: 1.3 }} height={size} ariaLabel={`Unit circle at ${deg} degrees`}>
        <Axes />
        <Circle center={{ x: 0, y: 0 }} r={1} color="var(--stage-fg)" opacity={0.3} weight={1.5} fill="none" />
        {showCast && CAST.map(({ q: cq, x, y, c }) => (
          <Label key={c} x={x} y={y} text={c} size={cq === q ? 18 : 13} weight={cq === q ? 800 : 600}
            color={cq === q ? 'var(--stage-accent)' : 'var(--stage-muted)'} />
        ))}
        <Polyline points={arc(rad, 0.3)} color="var(--stage-muted)" weight={1.4} />
        {showLegs && <>
          <Segment from={{ x: 0, y: 0 }} to={{ x: P.x, y: 0 }} color={SIGN_COLOR(sCos)} weight={4} />
          <Segment from={{ x: P.x, y: 0 }} to={{ x: P.x, y: P.y }} color={SIGN_COLOR(sSin)} weight={4} />
          <Label x={P.x / 2} y={0} text="cos" color={SIGN_COLOR(sCos)} size={10.5} dy={P.y >= 0 ? 13 : -7} />
          <Label x={P.x} y={P.y / 2} text="sin" color={SIGN_COLOR(sSin)} size={10.5} dx={P.x >= 0 ? 7 : -7} anchor={P.x >= 0 ? 'start' : 'end'} />
        </>}
        <Vector tail={{ x: 0, y: 0 }} tip={P} color="var(--stage-fg)" weight={2} />
        {showHyp && <Label x={P.x / 2} y={P.y / 2} text="1" color="var(--stage-fg)" size={11} dx={-8} />}
        <Dot x={P.x} y={P.y} r={5} color="var(--stage-fg)" />
      </Stage>
      {showValue && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 2, fontSize: 13 }}>
          <span style={{ color: SIGN_COLOR(sCos) }}>cos = <Tex tex={valOf('cos')} /></span>
          <span style={{ color: SIGN_COLOR(sSin) }}>sin = <Tex tex={valOf('sin')} /></span>
        </div>
      )}
    </div>
  );
}

/** The two triangles every exact value comes from: 45-45-90 and 30-60-90. */
export function SpecialTriangles({ size = 300 }: { size?: number }): ReactNode {
  return (
    <div style={{ width: '100%', maxWidth: size }}>
      <Stage view={{ xMin: -0.2, xMax: 4.2, yMin: -0.4, yMax: 2.2 }} height={size * 0.55} ariaLabel="The 45-45-90 and 30-60-90 triangles">
        {/* 45-45-90: legs 1,1, hypotenuse √2 */}
        <Polyline points={[{ x: 0, y: 0 }, { x: 1.3, y: 0 }, { x: 1.3, y: 1.3 }, { x: 0, y: 0 }]} color="var(--stage-accent)" weight={2} />
        <Label x={0.65} y={0} text="1" size={12} dy={14} color="var(--stage-muted)" />
        <Label x={1.3} y={0.65} text="1" size={12} dx={8} color="var(--stage-muted)" />
        <Label x={0.6} y={0.72} text="√2" size={12} dx={-6} color="var(--stage-fg)" />
        <Label x={0.28} y={0.04} text="45°" size={10} dy={2} color="var(--stage-muted)" />

        {/* 30-60-90: sides 1,√3,2 */}
        <Polyline points={[{ x: 2.4, y: 0 }, { x: 2.4 + 1.5, y: 0 }, { x: 2.4, y: 1.6 }, { x: 2.4, y: 0 }]} color="var(--stage-good)" weight={2} />
        <Label x={2.4 + 0.75} y={0} text="√3" size={12} dy={14} color="var(--stage-muted)" />
        <Label x={2.4} y={0.8} text="1" size={12} dx={-10} color="var(--stage-muted)" />
        <Label x={2.4 + 0.78} y={0.82} text="2" size={12} dx={6} color="var(--stage-fg)" />
        <Label x={2.4 + 1.2} y={0.04} text="30°" size={10} dy={2} color="var(--stage-muted)" />
        <Label x={2.42} y={1.45} text="60°" size={10} dx={6} color="var(--stage-muted)" />
      </Stage>
    </div>
  );
}
