'use client';

/**
 * TrigSignsLab, the unit circle where the SIGNS of sin/cos/tan stop being
 * memorised and become spatial. Drag the angle; the quadrant lights up, the CAST
 * letter (All / Sin / Tan / Cos) shows which functions are positive there, and the
 * cos (horizontal) and sin (vertical) legs are drawn GREEN when positive, RED when
 * negative, so "cos is negative in the second quadrant" is something you SEE. Land
 * on a special angle and the exact value (½, √3⁄2, …) appears.
 *
 * The unit-circle dragger pattern (shared with TrigExplorer); the teaching
 * semantics come from the trig kernel (quadrant / CAST / reference angle / exact).
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Axes, Circle, Segment, Vector, Dot, Label, Polyline, MovableDot, type Vec2 } from '@classytic/stage';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { StatusPill } from '../../kit/controls.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Tex } from '../../core/tex.js';
import { toRad, toDeg } from '../../core/util.js';
import * as T from './core.js';

export interface TrigSignsProps {
  startDeg?: number;
  /** Snap the dragged angle to this step in degrees. Default 15 (hits 30/45/60/90). */
  snapDeg?: number;
  /** Land the angle here for a checkpoint (e.g. 150). */
  targetDeg?: number;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

const SIGN_COLOR = (s: number): string => (s > 0 ? 'var(--stage-good)' : s < 0 ? 'var(--stage-danger)' : 'var(--stage-muted)');
const signTxt = (s: number): string => (Number.isNaN(s) ? '∅' : s > 0 ? '+' : s < 0 ? '−' : '0');

/** A small labelled sign badge, so the readout shows magnitude + a clear sign
 *  (not a loose "−" that reads as part of the value). */
const SignChip = ({ s }: { s: number }): ReactNode => (
  <span
    aria-label={s > 0 ? 'positive' : s < 0 ? 'negative' : 'zero'}
    style={{
      fontSize: 11, fontWeight: 800, lineHeight: 1, padding: '2px 6px', borderRadius: 999,
      color: SIGN_COLOR(s), background: `color-mix(in oklab, ${SIGN_COLOR(s)} 16%, transparent)`,
    }}
  >
    {signTxt(s)}{s > 0 ? ' pos' : s < 0 ? ' neg' : ''}
  </span>
);
const CAST = [{ q: 1, x: 0.45, y: 0.45, c: 'A' }, { q: 2, x: -0.45, y: 0.45, c: 'S' }, { q: 3, x: -0.45, y: -0.45, c: 'T' }, { q: 4, x: 0.45, y: -0.45, c: 'C' }] as const;

/** Arc points from the +Re axis through to θ, radius r (the angle wedge). */
function arc(thetaRad: number, r: number): Vec2[] {
  const n = 30;
  return Array.from({ length: n + 1 }, (_, i) => { const t = (thetaRad * i) / n; return { x: r * Math.cos(t), y: r * Math.sin(t) }; });
}

export function TrigSignsLab({
  startDeg = 30, snapDeg = 15, targetDeg,
  height = 360,
  title = 'Signs on the unit circle (CAST)',
  prompt = 'Drag the angle. cos is the horizontal leg, sin the vertical — green where +, red where −. The CAST letter says which are positive.',
  activity = 'trig-signs',
}: TrigSignsProps = {}): ReactNode {
  const snap = (d: number): number => (snapDeg > 0 ? Math.round(d / snapDeg) * snapDeg : d);
  const [deg, setDeg] = useState(() => T.normDeg(snap(startDeg)));
  useEffect(() => { setDeg(T.normDeg(snap(startDeg))); }, [startDeg]); // eslint-disable-line react-hooks/exhaustive-deps

  const rad = toRad(deg);
  const P: Vec2 = { x: Math.cos(rad), y: Math.sin(rad) };
  const q = T.quadrant(deg);
  const sSin = T.sign('sin', deg), sCos = T.sign('cos', deg), sTan = T.sign('tan', deg);

  const solved = targetDeg != null && T.normDeg(deg) === T.normDeg(targetDeg);
  useCheckpoint({ solved, activity, response: `${deg}°` });
  const accent = solved ? 'var(--stage-good)' : 'var(--stage-fg)';

  // the SIGNED value (e.g. -\frac12) and, separately, its magnitude — so the
  // readout can show "magnitude + a sign chip" instead of printing the sign twice.
  const valTex = (fn: T.TrigFn): string => {
    const ex = T.exactTex(fn, deg);
    if (ex) return ex;
    const v = T.evalTrig(fn, deg);
    return Number.isNaN(v) ? '\\text{undef}' : (Math.round(v * 100) / 100).toString().replace(/^-/, '−');
  };
  const magTex = (fn: T.TrigFn): string => valTex(fn).replace(/^[-−]/, '');

  const figure = (
    <Stage view={{ xMin: -1.5, xMax: 1.5, yMin: -1.45, yMax: 1.45 }} height={height} ariaLabel={`Unit circle, angle ${deg} degrees in quadrant ${q || 'on an axis'}`}>
      <Axes />
      <Circle center={{ x: 0, y: 0 }} r={1} color="var(--stage-fg)" opacity={0.3} weight={1.5} fill="none" />

      {/* CAST letters — the current quadrant's letter is bold + accented */}
      {CAST.map(({ q: cq, x, y, c }) => (
        <Label key={c} x={x} y={y} text={c} size={cq === q ? 22 : 15} weight={cq === q ? 800 : 600}
          color={cq === q ? 'var(--stage-accent)' : 'var(--stage-muted)'} />
      ))}

      {/* angle wedge + θ */}
      <Polyline points={arc(rad, 0.32)} color="var(--stage-muted)" weight={1.5} />
      <Label x={0.5 * Math.cos(rad / 2)} y={0.5 * Math.sin(rad / 2)} text={`${deg}°`} color="var(--stage-muted)" size={12} />

      {/* cos = horizontal leg (sign-coloured), sin = vertical leg (sign-coloured) */}
      <Segment from={{ x: 0, y: 0 }} to={{ x: P.x, y: 0 }} color={SIGN_COLOR(sCos)} weight={4} />
      <Segment from={{ x: P.x, y: 0 }} to={{ x: P.x, y: P.y }} color={SIGN_COLOR(sSin)} weight={4} />
      <Label x={P.x / 2} y={0} text="cos" color={SIGN_COLOR(sCos)} size={11} dy={P.y >= 0 ? 14 : -8} />
      <Label x={P.x} y={P.y / 2} text="sin" color={SIGN_COLOR(sSin)} size={11} dx={P.x >= 0 ? 8 : -8} anchor={P.x >= 0 ? 'start' : 'end'} />

      {/* terminal ray + handle */}
      <Vector tail={{ x: 0, y: 0 }} tip={P} color={accent} weight={2} />
      {targetDeg != null && !solved && <Dot x={Math.cos(toRad(targetDeg))} y={Math.sin(toRad(targetDeg))} r={9} color="var(--stage-good)" opacity={0.35} />}
      <MovableDot value={P} onMove={(p) => { let a = toDeg(Math.atan2(p.y, p.x)); setDeg(T.normDeg(snap(a))); }} color={accent} r={9} ariaLabel="angle on the unit circle, drag it round" />
    </Stage>
  );

  const Row = ({ fn, s }: { fn: T.TrigFn; s: number }): ReactNode => (
    <span style={{ color: SIGN_COLOR(s), display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Tex tex={`\\${fn}\\theta = ${magTex(fn)}`} />
      {!Number.isNaN(s) && <SignChip s={s} />}
    </span>
  );

  const controls = (
    <ControlBar>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}><Tex tex={`\\theta = ${deg}^\\circ = ${T.radTex(deg)}`} /></span>
      <Row fn="sin" s={sSin} />
      <Row fn="cos" s={sCos} />
      <Row fn="tan" s={sTan} />
      <span style={{ opacity: 0.8 }}>{q ? `Q${q}: ${T.castLetter(deg)} positive` : 'on an axis'}{T.isSpecial(deg) ? ` · ref ${T.referenceAngleDeg(deg)}°` : ''}</span>
      {targetDeg != null && <StatusPill ok={solved}>{solved ? `✓ ${targetDeg}°` : `target ${targetDeg}°`}</StatusPill>}
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} controls={controls}>{figure}</LabFrame>;
}
