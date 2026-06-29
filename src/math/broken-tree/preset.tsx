'use client';

/**
 * BrokenTreeLab, the "tree snaps in the wind" trig word problem, but as a thing you
 * PLAY WITH, not a labelled wireframe. A whole tree of height H stands by a house at
 * distance D. DRAG the break point up/down the trunk: the leafy top snaps off, bends
 * over, and its tip slides along the ground in real time. Break it at the right height
 * and the falling top just reaches the house, that's the goal + the payoff.
 *
 * Physics of the bend: the broken top is a RIGID piece of length L = H − h that pivots
 * at the break (height h) and swings down until its tip touches the ground, landing at
 *     d = √(L² − h²)        with   tan θ = h / d   at the tip.
 * (It can only reach the ground while h ≤ H/2, i.e. the broken piece is long enough.)
 * So as you break LOWER, the top is longer and lands FARTHER, you feel the relationship
 * instead of reading it. The classic "find the original height" is the same triangle.
 *
 * Direct manipulation (MovableDot on the trunk) + a real tree (trunk + foliage) + a
 * target = the template for how the trig-scenario library should FEEL. Authorable via
 * props (originalHeight, target, …); tokenised where it can be, nature colours for the tree.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Segment, Circle, Polygon, Label, MovableDot, type Vec2 } from '@classytic/stage';
import { AngleArc, RightAngleMark } from '../../kit/diagram.js';
import { LabFrame, Callout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';

export interface BrokenTreeProps {
  /** The tree's full (un-broken) height. */
  originalHeight?: number;
  /** Ground distance to the house, the goal is to land the top here (omit → free play). */
  target?: number;
  /** Initial break height. */
  breakHeight?: number;
  title?: string;
  prompt?: string;
  height?: number;
  activity?: string;
}

const C_TRUNK = 'oklch(0.46 0.06 60)';        // bark brown
const C_LEAF = 'oklch(0.62 0.15 145)';        // foliage green
const C_LEAF_DK = 'oklch(0.5 0.14 150)';
const fmt = (n: number): string => (Number.isFinite(n) ? n.toFixed(1) : ', ');

/** A leafy crown: layered blobs, darker low/sides + lighter on top for depth. Transparency
 *  is applied to the WHOLE group (a single <g opacity>) so overlapping blobs don't compound
 *  into blotchy dark patches, the foliage reads as one flat-tinted shape. */
function Crown({ at, r, opacity = 1 }: { at: Vec2; r: number; opacity?: number }): ReactNode {
  const blob = (dx: number, dy: number, rr: number, c: string): ReactNode =>
    <Circle center={{ x: at.x + dx, y: at.y + dy }} r={rr} color="none" fill={c} fillOpacity={1} weight={0} />;
  return (
    <g opacity={opacity}>
      {blob(-r * 0.55, -r * 0.1, r * 0.72, C_LEAF_DK)}
      {blob(r * 0.55, -r * 0.05, r * 0.7, C_LEAF_DK)}
      {blob(0, -r * 0.35, r * 0.62, C_LEAF_DK)}
      {blob(0, r * 0.05, r * 0.92, C_LEAF)}
      {blob(-r * 0.32, r * 0.5, r * 0.5, C_LEAF)}
      {blob(r * 0.34, r * 0.46, r * 0.56, C_LEAF)}
    </g>
  );
}

export function BrokenTreeLab({
  originalHeight = 18, target = 12, breakHeight = 3,
  title = 'Snap the tree so its top reaches the house',
  prompt = 'Drag the break point up or down the trunk. The top bends to the ground, break it lower and it falls farther.',
  height = 340, activity = 'broken-tree',
}: BrokenTreeProps = {}): ReactNode {
  const H = originalHeight;
  const [breakH, setBreakH] = useState(breakHeight);
  const h = clamp(breakH, 0.5, H / 2 - 0.05);    // the broken piece must be long enough to reach the ground
  const L = H - h;                               // length of the bent-over top
  const d = Math.sqrt(Math.max(0, L * L - h * h));
  const th = Math.atan2(h, d || 1e-6);
  const deg = (th * 180) / Math.PI;

  const hasGoal = typeof target === 'number';
  const reached = hasGoal && Math.abs(d - target) < 0.3;
  useCheckpoint({ solved: reached, activity });

  // scene points (metres)
  const foot: Vec2 = { x: 0, y: 0 };
  const brk: Vec2 = { x: 0, y: h };
  const tip: Vec2 = { x: d, y: 0 };
  const far = Math.max(d, target ?? 0, H) + 2;
  const pad = far * 0.08;
  const view = { xMin: -pad * 2, xMax: far, yMin: -pad, yMax: H + pad };

  // L label sits ABOVE the fallen top near the break end (0.34 along), offset along the
  // outward normal — clear of the crown (which sits lower-right) and the d/θ labels.
  const nx = h / (L || 1), ny = d / (L || 1);
  const lf = 0.34;
  const Lmid: Vec2 = { x: brk.x + (tip.x - brk.x) * lf + nx * 0.9, y: brk.y + (tip.y - brk.y) * lf + ny * 0.9 };
  // the leafy top rests on the fallen trunk, lifted ABOVE the line so the ground tip + the
  // θ arc stay clear below it, and kept back from the exact tip so it doesn't bury the house.
  const crownAt: Vec2 = { x: brk.x + (tip.x - brk.x) * 0.66, y: brk.y + (tip.y - brk.y) * 0.66 + 1.0 };
  const Hx = -pad * 1.4;                          // x of the original-height dimension bracket
  const houseC = reached ? 'var(--stage-good)' : 'var(--stage-muted)';

  const figure = (
    <Stage view={view} height={height} preserveAspect ariaLabel={`Broken tree: original height ${fmt(H)}, broke at ${fmt(h)}, top reaches ${fmt(d)} along the ground`}>
      {/* earth + ground line (a scene, not floating strokes) */}
      <Polygon points={[{ x: -pad * 2, y: 0 }, { x: far, y: 0 }, { x: far, y: -pad }, { x: -pad * 2, y: -pad }]} color="none" fill="oklch(0.62 0.13 145)" fillOpacity={0.14} weight={0} />
      <Segment from={{ x: -pad * 2, y: 0 }} to={{ x: far, y: 0 }} color="oklch(0.5 0.08 145)" weight={2} opacity={0.65} />

      {/* original-height bracket — uses the empty sky AND shows H = h + L */}
      <Segment from={{ x: Hx, y: 0 }} to={{ x: Hx, y: H }} color="var(--stage-muted)" weight={1} opacity={0.7} />
      <Segment from={{ x: Hx - 0.4, y: 0 }} to={{ x: Hx + 0.4, y: 0 }} color="var(--stage-muted)" weight={1} opacity={0.7} />
      <Segment from={{ x: Hx - 0.4, y: H }} to={{ x: Hx + 0.4, y: H }} color="var(--stage-muted)" weight={1} opacity={0.7} />
      <Label x={Hx} y={H / 2} text={`H = ${fmt(H)} m`} color="var(--stage-muted)" size={11} dx={-5} anchor="end" />

      {/* faint ghost of the whole tree before it broke */}
      <Segment from={foot} to={{ x: 0, y: H }} color="var(--stage-muted)" weight={2} dashed opacity={0.35} />
      <Crown at={{ x: 0, y: H - 0.6 }} r={2} opacity={0.16} />

      {/* the house (the target) */}
      {hasGoal && (
        <>
          <Polygon points={[{ x: target - 1, y: 0 }, { x: target + 1, y: 0 }, { x: target + 1, y: 1.8 }, { x: target - 1, y: 1.8 }]} color={houseC} fill={houseC} fillOpacity={0.16} weight={1.5} />
          <Polygon points={[{ x: target - 1.35, y: 1.8 }, { x: target, y: 3 }, { x: target + 1.35, y: 1.8 }]} color={houseC} fill={houseC} fillOpacity={0.28} weight={1.5} />
          <Polygon points={[{ x: target - 0.3, y: 0 }, { x: target + 0.3, y: 0 }, { x: target + 0.3, y: 1.1 }, { x: target - 0.3, y: 1.1 }]} color={houseC} fill={houseC} fillOpacity={0.42} weight={1} />
          <Label x={target} y={0} text={`house · ${fmt(target)} m`} color="var(--stage-muted)" size={11} dy={16} />
        </>
      )}

      {/* THE RIGHT TRIANGLE — the trig content, shaded so it reads as the hero */}
      <Polygon points={[foot, brk, tip]} color="var(--stage-accent)" fill="var(--stage-accent)" fillOpacity={0.12} weight={0} />

      {/* standing stump (top snapped off) + the bent-over leafy top resting on the house */}
      <Segment from={foot} to={brk} color={C_TRUNK} weight={6} />
      <Segment from={brk} to={tip} color={C_TRUNK} weight={5} />
      <Crown at={crownAt} r={1.25} />

      <RightAngleMark at={foot} u={{ x: 0, y: 1 }} v={{ x: 1, y: 0 }} />
      <AngleArc at={tip} from={{ x: -1, y: 0 }} to={{ x: brk.x - tip.x, y: brk.y - tip.y }} rPx={30} label={`θ = ${Math.round(deg)}°`} />

      {/* measurements */}
      <Label x={0} y={h / 2} text={`h = ${fmt(h)}`} color={C_TRUNK} size={12} weight={700} dx={-10} anchor="end" />
      <Label x={Lmid.x} y={Lmid.y} text={`L = ${fmt(L)}`} color={C_TRUNK} size={12} weight={700} anchor="middle" />
      <Label x={d / 2} y={0} text={`d = ${fmt(d)}`} color="var(--stage-fg)" size={12} weight={700} dy={16} />

      {/* the grab handle ON the trunk, drag to set where it snaps */}
      <MovableDot value={brk} onMove={(p) => setBreakH(clamp(p.y, 0.5, H / 2 - 0.05))} color="var(--stage-accent)" ariaLabel="break point, drag up or down the trunk" />
    </Stage>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {hasGoal && (
        <div className="lab-pill" data-state={reached ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
          {reached ? '✓ The top reaches the house!' : `the top lands ${fmt(d)} m out, ${d > target ? 'break it higher' : 'break it lower'}`}
        </div>
      )}
      <Callout tone="result">
        <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          <span>original height H = <strong>{fmt(H)}</strong></span>
          <span>broke at h = <strong style={{ color: C_TRUNK }}>{fmt(h)}</strong> · fell top L = <strong>{fmt(L)}</strong></span>
          <span>reaches d = <strong>{fmt(d)}</strong> at θ = <strong>{Math.round(deg)}°</strong></span>
          <span style={{ color: 'var(--stage-muted)' }}>tan θ = h/d · L = H − h · d = √(L² − h²)</span>
        </div>
      </Callout>
    </div>
  );

  return <LabFrame title={title} prompt={prompt} aside={aside}>{figure}</LabFrame>;
}
