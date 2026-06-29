'use client';

/**
 * ComplexPlaneLab, the Argand-diagram playground built on the complex kernel. A
 * complex number is a POINT (a + bi) you drag; the lab draws it as a vector from
 * the origin so the SAME (x, y) → (r, θ) story the vector labs teach now reads as
 * "modulus and argument". Modes turn the abstract into the visible:
 *   • point    , drag z: see a, b, the modulus r = √(a²+b²), and the angle θ in
 *                BOTH degrees and radians.
 *   • multiply , also plot i·z, the 90° ROTATION that makes i² = −1 obvious
 *                (rotate 90° twice = 180° = −1).
 *   • power    , plot z, z², z³, , De Moivre as a spiral (moduli multiply,
 *                angles add).
 *   • roots    , the n nth-roots of unity equally spaced on the unit circle
 *                (n = 4 → 1, i, −1, −i; n = 3 → 1, ω, ω²).
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Segment, Dot, Label, Circle, Polyline, MovableDot, type Vec2 } from '@classytic/stage';
import { CoordPlane } from '../../kit/coords.js';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { StatusPill } from '../../kit/controls.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import * as C from './core.js';

export type ComplexMode = 'point' | 'multiply' | 'power' | 'roots';

export interface ComplexPlaneProps {
  start?: { re: number; im: number };
  mode?: ComplexMode;
  /** roots mode: how many nth-roots of unity to draw (clamped 2..12). */
  rootsN?: number;
  /** power mode: highest power to plot (clamped 2..6). */
  powerN?: number;
  /** grid snap in units (0 = free). Default 1. */
  snap?: number;
  /** view half-extent ±range on both axes. Default 6. */
  range?: number;
  /** target z for a checkpoint ("drag to 3 + 4i"). */
  target?: { re: number; im: number };
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

const clampNum = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const fmt = (n: number, dp = 2): string => { const r = Math.round(n * 10 ** dp) / 10 ** dp; return (Object.is(r, -0) ? 0 : r).toString().replace(/^-/, '−'); };

/** Points along the angle arc from the +Re axis to θ, at radius `r`. */
function arc(theta: number, r: number): Vec2[] {
  const n = 28;
  return Array.from({ length: n + 1 }, (_, i) => { const t = (theta * i) / n; return { x: r * Math.cos(t), y: r * Math.sin(t) }; });
}

const rootLabel = (k: number, n: number): string =>
  n === 4 ? ['1', 'i', '−1', '−i'][k]! : n === 2 ? ['1', '−1'][k]! : k === 0 ? '1' : k === 1 ? 'ω' : `ω${k === 2 ? '²' : k === 3 ? '³' : '^' + k}`;

export function ComplexPlaneLab(props: ComplexPlaneProps = {}): ReactNode {
  const {
    mode = 'point', rootsN = 4, powerN = 3, snap = 1, range = 6, target,
    height = 380,
    title = 'The complex plane',
    prompt = mode === 'roots' ? 'The nth-roots of unity, equally spaced on the unit circle.'
      : mode === 'multiply' ? 'Drag z. Multiplying by i rotates it 90° — do it twice and you land on −z.'
      : 'Drag the point. Read off a + bi, the modulus r, and the angle θ.',
    activity = 'complex-plane',
  } = props;

  const snapV = (p: Vec2): Vec2 => {
    const s = snap > 0 ? { x: Math.round(p.x / snap) * snap, y: Math.round(p.y / snap) * snap } : p;
    return { x: clampNum(s.x, -range, range), y: clampNum(s.y, -range, range) };
  };
  const start0 = (): Vec2 => snapV({ x: props.start?.re ?? (mode === 'roots' ? 0 : 3), y: props.start?.im ?? (mode === 'roots' ? 0 : 2) });
  const [z, setZ] = useState<Vec2>(start0);
  useEffect(() => { setZ(start0()); }, [props.start?.re, props.start?.im, mode, range]); // eslint-disable-line react-hooks/exhaustive-deps

  const Z: C.Complex = { re: z.x, im: z.y };
  const r = C.abs(Z);
  const thetaRad = C.arg(Z);
  const thetaDeg = C.argDeg(Z);

  const solved = target != null && C.eq(Z, { re: target.re, im: target.im }, 1e-6);
  useCheckpoint({ solved, activity, response: C.toStr(Z) });

  const nRoots = clampNum(Math.round(rootsN), 2, 12);
  const nPow = clampNum(Math.round(powerN), 2, 6);
  const roots = useMemo(() => C.rootsOfUnity(nRoots), [nRoots]);
  const iz = C.mul(C.I, Z);
  const powers = useMemo(() => Array.from({ length: nPow }, (_, k) => C.powInt(Z, k + 1)), [Z.re, Z.im, nPow]); // eslint-disable-line react-hooks/exhaustive-deps

  const view = { xMin: -range, xMax: range, yMin: -range, yMax: range };
  const accent = solved ? 'var(--stage-good)' : 'var(--stage-accent)';

  const figure = (
    <CoordPlane view={view} height={height} step={mode === 'roots' || mode === 'multiply' ? 1 : undefined} ariaLabel={`Argand plane, z = ${C.toStr(Z)}`}>
      {/* unit circle (the home of rotations + roots of unity) */}
      <Circle center={{ x: 0, y: 0 }} r={1} color="var(--stage-muted)" weight={1} fill="none" opacity={0.5} />
      {/* axis labels */}
      <Label x={range - 0.3} y={0} text="Re" color="var(--stage-muted)" size={12} dy={-10} />
      <Label x={0} y={range - 0.3} text="Im" color="var(--stage-muted)" size={12} dx={14} />

      {/* roots of unity */}
      {mode === 'roots' && roots.map((w, k) => (
        <g key={k}>
          <Segment from={{ x: 0, y: 0 }} to={{ x: w.re, y: w.im }} color="var(--stage-good)" weight={1.5} opacity={0.55} />
          <Dot x={w.re} y={w.im} r={5} color="var(--stage-good)" />
          <Label x={w.re} y={w.im} text={rootLabel(k, nRoots)} color="var(--stage-good)" size={13} dx={w.re >= 0 ? 12 : -12} dy={w.im >= 0 ? -8 : 14} anchor={w.re >= 0 ? 'start' : 'end'} />
        </g>
      ))}

      {/* powers: z, z², z³ … as a spiral */}
      {mode === 'power' && (
        <>
          <Polyline points={[{ x: 0, y: 0 }, ...powers.filter(C.isFiniteC).map((p) => ({ x: p.re, y: p.im }))]} color="var(--stage-accent-2)" weight={1.5} opacity={0.5} dashed />
          {powers.map((p, k) => C.isFiniteC(p) && (
            <g key={k}><Dot x={p.re} y={p.im} r={4} color="var(--stage-accent-2)" /><Label x={p.re} y={p.im} text={`z${['', '²', '³', '⁴', '⁵', '⁶'][k]}`} color="var(--stage-accent-2)" size={12} dy={-10} /></g>
          ))}
        </>
      )}

      {/* the modulus vector + angle arc (hidden in roots mode, where the roots are the focus) */}
      {mode !== 'roots' && (z.x !== 0 || z.y !== 0) && (
        <>
          <Segment from={{ x: 0, y: 0 }} to={z} color={accent} weight={2.5} />
          <Polyline points={arc(thetaRad, Math.min(0.9, r * 0.45) + 0.4)} color="var(--stage-muted)" weight={1.5} />
          <Label x={Math.cos(thetaRad / 2) * 1.05} y={Math.sin(thetaRad / 2) * 1.05} text="θ" color="var(--stage-muted)" size={13} />
          <Label x={z.x / 2} y={z.y / 2} text={`r=${fmt(r)}`} color={accent} size={12} dx={z.y >= 0 ? 10 : -10} dy={z.x >= 0 ? -8 : 14} anchor={z.y >= 0 ? 'start' : 'end'} />
          {/* real / imaginary projections */}
          <Segment from={z} to={{ x: z.x, y: 0 }} color="var(--stage-grid)" weight={1.25} dashed />
          <Segment from={z} to={{ x: 0, y: z.y }} color="var(--stage-grid)" weight={1.25} dashed />
        </>
      )}

      {/* multiply-by-i: the 90° rotation made visible */}
      {mode === 'multiply' && (z.x !== 0 || z.y !== 0) && (
        <>
          <Segment from={{ x: 0, y: 0 }} to={{ x: iz.re, y: iz.im }} color="var(--stage-accent-2)" weight={2} opacity={0.85} dashed />
          <Dot x={iz.re} y={iz.im} r={6} color="var(--stage-accent-2)" />
          <Label x={iz.re} y={iz.im} text="i·z" color="var(--stage-accent-2)" size={12} dy={-12} />
        </>
      )}

      {mode !== 'roots' && target != null && !solved && <Dot x={target.re} y={target.im} r={9} color="var(--stage-good)" opacity={0.35} />}

      {mode !== 'roots' && (
        <MovableDot value={z} onMove={(p) => setZ(snapV(p))} snap={snap} step={snap || 1} color={accent} r={9} ariaLabel="complex number z, drag it" />
      )}
    </CoordPlane>
  );

  const controls = mode === 'roots' ? (
    <ControlBar>
      <span style={{ fontWeight: 700, fontSize: 15 }}>z<sup>{nRoots}</sup> = 1 has {nRoots} roots</span>
      <span style={{ opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>spaced {fmt(360 / nRoots, 1)}° apart on the unit circle</span>
    </ControlBar>
  ) : (
    <ControlBar>
      <span style={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>z = {C.toStr(Z)}</span>
      <span style={{ opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>|z| = {fmt(r)}</span>
      <span style={{ opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>arg = {fmt(thetaDeg, 1)}° = {fmt(thetaRad)} rad</span>
      {mode === 'multiply' && <span style={{ opacity: 0.85 }}>i·z = {C.toStr(iz)}</span>}
      {target != null && <StatusPill ok={solved}>{solved ? `✓ ${C.toStr({ re: target.re, im: target.im })}` : `target ${C.toStr({ re: target.re, im: target.im })}`}</StatusPill>}
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} controls={controls}>{figure}</LabFrame>;
}
