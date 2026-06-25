'use client';

/**
 * ProjectileLab — tune launch angle + speed, land the shot on the target. Now on
 * the @classytic/stage engine (SVG, accessible): the ground, cannon, predicted
 * arc, target, and ball are real primitives in a metre coordinate system; the
 * flight animates on the engine clock.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polyline, Circle, Dot, Label, useFrameLoop, useInView, useCoords, StageAssetDefs, fmt, type Vec2 } from '@classytic/stage';
import { Slider, CheckButton, StatusPill } from '../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../kit/frame.js';
import { num, toRad } from '../core/util.js';

/**
 * A field cannon anchored at the launch point (math origin), elevated to
 * `angle`. Drawn in a LOCAL pixel frame with STATIC coordinates and rotated via
 * an SVG transform — so no transcendental-derived coordinate is ever serialized
 * into an attribute (SSR-deterministic, per the engine's `fmt` rule). Sized in
 * world units (px-per-metre) so it tracks pan/zoom like the rest of the scene.
 */
function CannonGlyph({ angle }: { angle: number }): ReactNode {
  const c = useCoords();
  const [ox, oy] = c.toPx(0, 0);
  const s = c.sx(1);                 // px per metre
  const L = 13 * s, hw = 1.7 * s;    // barrel length / half-bore (metres → px)
  const grad = 'url(#stage-grad-metal)';
  const metal = 'var(--stage-metal)';
  const edge = 'color-mix(in oklab, var(--stage-metal) 60%, black)';
  const dark = 'color-mix(in oklab, var(--stage-metal) 42%, black)';
  const sheen = 'color-mix(in oklab, var(--stage-sheen) 45%, transparent)';
  const T = `translate(${fmt(ox)},${fmt(oy)})`;
  // Spoke endpoints: cos/sin are transcendental → fmt() so SSR == client.
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3;
    return { x: fmt(s * 2.2 * Math.cos(a)), y: fmt(s * 2.2 * Math.sin(a)) };
  });
  return (
    <g>
      <StageAssetDefs />
      {/* barrel + breech cap — local +x runs along the bore, screen-rotated by −angle (math y is up) */}
      <g transform={`${T} rotate(${fmt(-angle)})`}>
        <circle cx={-s * 1.3} cy={0} r={hw * 1.15} fill={grad} stroke={edge} strokeWidth={0.7} />
        <path
          d={`M 0 ${-hw * 0.92} L ${L * 0.84} ${-hw * 0.78} L ${L * 0.84} ${-hw} L ${L} ${-hw} L ${L} ${hw} L ${L * 0.84} ${hw} L ${L * 0.84} ${hw * 0.78} L 0 ${hw * 0.92} Z`}
          fill={grad} stroke={edge} strokeWidth={0.7} strokeLinejoin="round"
        />
        {/* reinforcing rings */}
        <line x1={L * 0.4} y1={-hw * 0.95} x2={L * 0.4} y2={hw * 0.95} stroke={dark} strokeWidth={1.6} />
        <line x1={L * 0.72} y1={-hw} x2={L * 0.72} y2={hw} stroke={dark} strokeWidth={1.6} />
        {/* top-light sheen */}
        <line x1={s * 0.4} y1={-hw * 0.5} x2={L * 0.8} y2={-hw * 0.5} stroke={sheen} strokeWidth={1.2} strokeLinecap="round" />
        {/* muzzle bore */}
        <ellipse cx={L} cy={0} rx={hw * 0.22} ry={hw * 0.9} fill={dark} />
      </g>
      {/* carriage wheel — upright (NOT rotated with the barrel), at the pivot */}
      <g transform={T}>
        <circle cx={0} cy={0} r={s * 2.2} fill="var(--stage-bg)" stroke={metal} strokeWidth={2} />
        {spokes.map((p, i) => <line key={i} x1={0} y1={0} x2={p.x} y2={p.y} stroke={metal} strokeWidth={1.2} />)}
        <circle cx={0} cy={0} r={s * 0.7} fill={metal} />
      </g>
    </g>
  );
}

export interface ProjectileLabProps {
  targetMeters?: number | string;
  g?: number | string;
}

const WORLD_W = 130; // metres across the stage

export function ProjectileLab(props: ProjectileLabProps): ReactNode {
  const target = num(props.targetMeters, 70);
  const G = num(props.g, 9.8);
  const [angle, setAngle] = useState(45);
  const [speed, setSpeed] = useState(28);
  const [phase, setPhase] = useState<'idle' | 'flying' | 'hit' | 'miss'>('idle');
  const [t, setT] = useState(0);
  const startRef = useRef<number | null>(null);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const vx = speed * Math.cos(toRad(angle));
  const vy = speed * Math.sin(toRad(angle));
  const range = (vx * (2 * vy)) / G;
  const peak = (vy * vy) / (2 * G);
  const tof = (2 * vy) / G;

  useFrameLoop(
    (f) => {
      if (startRef.current === null) startRef.current = f.timeMs;
      const tt = (f.timeMs - startRef.current) / 1000;
      setT(tt);
      if (tt >= tof) {
        const landed = vx * tof;
        setPhase(Math.abs(landed - target) <= 4 ? 'hit' : 'miss');
      }
    },
    { running: phase === 'flying' && inView },
  );

  const fire = (): void => { startRef.current = null; setT(0); setPhase('flying'); };
  const reset = (label: number, set: (v: number) => void): ((v: number) => void) => (v) => { set(v); setPhase('idle'); setT(0); };

  // predicted arc (sampled in metres)
  const arc: Vec2[] = [];
  const ds = tof / 60 || 1;
  for (let s = 0; s <= tof + 1e-9; s += ds) arc.push({ x: vx * s, y: Math.max(vy * s - 0.5 * G * s * s, 0) });

  const tt = Math.min(t, tof);
  const ball = { x: vx * tt, y: Math.max(vy * tt - 0.5 * G * tt * tt, 0) };

  const view = { xMin: -5, xMax: WORLD_W, yMin: -4, yMax: Math.max(40, peak + 12) };

  const figure = (
    <div ref={viewRef}>
      <Stage view={view} height={300} ariaLabel={`Projectile launched at ${angle}° and ${speed} m/s; target at ${target} m`}>
        <Segment from={{ x: view.xMin, y: 0 }} to={{ x: WORLD_W, y: 0 }} color="var(--stage-fg)" opacity={0.5} weight={1.5} />
        {[0, 20, 40, 60, 80, 100, 120].map((m) => <Label key={m} x={m} y={0} text={`${m}m`} color="var(--stage-fg)" size={10} dy={14} />)}
        {/* target — a bullseye on the ground */}
        <Circle center={{ x: target, y: 2.6 }} r={2.6} color="var(--stage-accent-2)" fill="none" weight={2} />
        <Circle center={{ x: target, y: 2.6 }} r={1.1} color="var(--stage-accent-2)" fill="var(--stage-accent-2)" fillOpacity={0.9} weight={0} />
        <Label x={target} y={2.6} text="target" color="var(--stage-accent-2)" size={11} dy={-22} />
        {/* cannon — tapered barrel + spoked carriage wheel */}
        <CannonGlyph angle={angle} />
        <Polyline points={arc} color="var(--stage-accent)" opacity={0.55} weight={1.5} dashed />
        {/* projectile with a soft motion glow */}
        <Circle center={ball} r={1.4} color="var(--stage-good)" fill="var(--stage-good)" fillOpacity={0.25} weight={0} />
        <Dot x={ball.x} y={ball.y} r={5} color="var(--stage-good)" />
      </Stage>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label="angle" value={`${angle}°`}><Slider value={angle} min={10} max={80} step={1} onChange={reset(angle, setAngle)} ariaLabel="launch angle" style={{ width: 110 }} /></Field>
      <Field label="speed" value={`${speed} m/s`}><Slider value={speed} min={10} max={36} step={1} onChange={reset(speed, setSpeed)} ariaLabel="launch speed" style={{ width: 110 }} /></Field>
      <CheckButton onClick={fire}>Fire</CheckButton>
    </ControlBar>
  );

  const aside = (
    <>
      {(phase === 'hit' || phase === 'miss') && (
        <StatusPill ok={phase === 'hit'}>{phase === 'hit' ? '🎯 Direct hit!' : 'So close — adjust and retry'}</StatusPill>
      )}
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
          <span>range {range.toFixed(0)} m</span>
          <span>peak {peak.toFixed(0)} m</span>
          <span>time {tof.toFixed(1)} s</span>
        </span>
      </Callout>
      <p style={{ fontSize: 11, opacity: 0.6, margin: '4px 2px 0' }}>target at {target} m · g = {G} m/s²</p>
    </>
  );

  return (
    <LabFrame
      title="Projectile Lab"
      prompt="Tune the angle and speed — can you land the shot on the target?"
      aside={aside}
      controls={controls}
    >
      {figure}
    </LabFrame>
  );
}
