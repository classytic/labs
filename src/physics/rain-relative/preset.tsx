'use client';

/**
 * RainRelativeLab, relative velocity you can FEEL.
 *
 * Sit in a car in the rain. The rain falls straight down in the ground frame,
 * but in YOUR frame it slants, its apparent velocity is V_rain − V_car. Drag
 * the speed up and the rain streaks harder and leans more; the velocity triangle
 * and the angle θ track it live. This is the "show me" the static board lacked.
 *
 * Architecture on purpose: the hundreds of raindrops are drawn on `CanvasLayer`
 * (zero-dep Canvas2D, the engine's particle escape hatch, no Pixi), animated by
 * the shared `useFrameLoop` RAF clock; the car, the velocity triangle and the
 * labels sit on an SVG `<Stage>` overlaid on top (crisp + accessible). Honors
 * prefers-reduced-motion. One source of truth, `ratio = tan θ`, drives the
 * canvas slant, the triangle, and the readout, so they can never disagree.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, CanvasLayer, Segment, Vector, Label, useCoords } from '@classytic/stage';
import { mulberry32 } from '../../core/rng.js';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { Slider } from '../../kit/controls.js';
import { AngleArc } from '../../kit/diagram.js';
import { LabFrame, ControlBar, Field, LiveRegion } from '../../kit/frame.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';

export interface RainRelativeProps {
  maxSpeed?: number;
  start?: number;
  title?: string;
  prompt?: string;
  height?: number;
}

const VIEW = { xMin: -6, xMax: 6, yMin: 0, yMax: 8 };
const RAIN_FALL_PX = 360; // px/sec downward
const DROPS = 150;

interface Drop { x: number; y: number; len: number }

/** A clean SVG sedan whose wheels spin (driven by `wheelAngle`). Drawn in pixel
 *  space around the road-contact point (0, baseY), so it sits on the road at any
 *  view scale. Body tint follows `--stage-accent-2`; tyres are theme-neutral. */
function Car({ baseY, wheelAngle }: { baseY: number; wheelAngle: number }): ReactNode {
  const c = useCoords();
  const [px, py] = c.toPx(0, baseY);
  const edge = 'color-mix(in oklab, var(--stage-accent-2) 58%, black)';
  return (
    <g transform={`translate(${px} ${py})`}>
      <defs>
        <linearGradient id="rr-car-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="color-mix(in oklab, var(--stage-accent-2) 82%, white)" />
          <stop offset="1" stopColor="var(--stage-accent-2)" />
        </linearGradient>
      </defs>
      <ellipse cx={0} cy={-2} rx={94} ry={7} fill="#000" opacity={0.16} />
      <path d="M -88 -16 Q -96 -16 -96 -28 L -96 -33 Q -96 -44 -80 -45 L 78 -45 Q 94 -44 94 -31 L 94 -22 Q 94 -16 86 -16 Z" fill="url(#rr-car-body)" stroke={edge} strokeWidth={2} strokeLinejoin="round" />
      <path d="M -54 -45 Q -46 -69 -18 -69 L 26 -69 Q 48 -69 58 -45 Z" fill="url(#rr-car-body)" stroke={edge} strokeWidth={2} strokeLinejoin="round" />
      <path d="M -46 -47 Q -40 -64 -18 -64 L -4 -64 L -4 -47 Z" fill="#dceeff" opacity={0.92} />
      <path d="M 2 -47 L 2 -64 L 24 -64 Q 44 -64 52 -47 Z" fill="#dceeff" opacity={0.92} />
      <ellipse cx={88} cy={-27} rx={5} ry={4} fill="#ffe07a" />
      <line x1={-2} y1={-45} x2={-2} y2={-18} stroke={edge} strokeWidth={1.4} opacity={0.5} />
      {[-50, 54].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={-14} r={16} fill="#2b2b2b" />
          <circle cx={wx} cy={-14} r={9.5} fill="#d7d7d7" />
          <g transform={`rotate(${wheelAngle} ${wx} ${-14})`} stroke="#8c8c8c" strokeWidth={2.4} strokeLinecap="round">
            <line x1={wx} y1={-23} x2={wx} y2={-5} />
            <line x1={wx - 9} y1={-14} x2={wx + 9} y2={-14} />
            <line x1={wx - 6.4} y1={-20.4} x2={wx + 6.4} y2={-7.6} />
            <line x1={wx - 6.4} y1={-7.6} x2={wx + 6.4} y2={-20.4} />
          </g>
          <circle cx={wx} cy={-14} r={3} fill="#555" />
        </g>
      ))}
    </g>
  );
}

export function RainRelativeLab({
  maxSpeed = 10,
  start = 0,
  title = 'Rain on a moving car',
  prompt = 'Speed up, watch the rain slant. In your frame the rain comes at V_rain − V_car.',
  height = 360,
}: RainRelativeProps): ReactNode {
  const [speed, setSpeed] = useState(start);
  const drops = useRef<Drop[]>([]);
  const lastT = useRef(0);
  const wheelAngle = useRef(0);
  const rng = useRef(mulberry32(20240621));   // seeded → deterministic raindrops (SSR/replay-safe; no Math.random)
  const reduce = useReducedMotion();
  const gate = usePlayGate();

  const ratio = (speed / maxSpeed) * 1.7; // = tan θ (apparent-rain slant)
  const theta = Math.atan(ratio);
  const thetaDeg = Math.round((theta * 180) / Math.PI);

  useFrameTick(gate.running && !reduce, (f) => {
    wheelAngle.current = (wheelAngle.current + speed * f.dtMs * 0.05) % 360; // spin ∝ speed
  });

  const draw = (ctx: CanvasRenderingContext2D, c: { width: number; height: number }): void => {
    const W = c.width, H = c.height;
    if (drops.current.length === 0) {
      const rnd = rng.current;
      drops.current = Array.from({ length: DROPS }, () => ({ x: rnd() * (W + 200) - 100, y: rnd() * H, len: 10 + rnd() * 10 }));
    }
    const now = performance.now();
    let dt = (now - lastT.current) / 1000;
    if (!(dt > 0) || dt > 0.1) dt = 0.016;
    lastT.current = now;

    const vy = RAIN_FALL_PX;
    const vx = -ratio * RAIN_FALL_PX; // car moves +x → rain drifts −x in car frame
    const sp = Math.hypot(vx, vy) || 1;
    const ux = vx / sp, uy = vy / sp;

    const accent = (typeof getComputedStyle !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue('--stage-accent').trim()) || 'rgb(120,160,235)';
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const d of drops.current) {
      if (!reduce) { d.x += vx * dt; d.y += vy * dt; }
      if (d.y > H + 12) { d.y = -12; d.x = rng.current() * (W + 200) - 100; }
      if (d.x < -60) d.x += W + 120; else if (d.x > W + 60) d.x -= W + 120;
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - ux * d.len, d.y - uy * d.len);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  // ── velocity triangle (math coords): V_rain (down) + (−V_car) → V_RC ──
  const O = { x: 2.7, y: 6.2 };
  const vr = 2.3;
  const vcar = ratio * vr;
  const aRain = { x: O.x, y: O.y - vr };
  const aRC = { x: O.x - vcar, y: O.y - vr };

  const cy = 1.5; // road line (math y)

  const figure = (
    <PlayWrap gate={gate}>
    <div style={{ position: 'relative', width: '100%', borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <CanvasLayer view={VIEW} height={height} draw={draw} ariaLabel={`rain slanting ${thetaDeg} degrees as the car speeds up`} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Stage view={VIEW} height={height} preserveAspect={false} background="transparent" ariaLabel="car and velocity triangle">
          {/* road */}
          <Segment from={{ x: -6, y: cy }} to={{ x: 6, y: cy }} color="var(--stage-fg)" opacity={0.5} weight={2} />
          {/* car, wheels spin while moving */}
          <Car baseY={cy} wheelAngle={wheelAngle.current} />

          {/* velocity triangle */}
          <Vector tail={O} tip={aRain} color="var(--stage-accent)" weight={2.5} />
          <Label x={aRain.x} y={(O.y + aRain.y) / 2} text="rain" color="var(--stage-accent)" size={12} dx={16} dy={16} />
          <Segment from={aRain} to={aRC} color="var(--stage-muted)" weight={1.5} dashed />
          <Vector tail={O} tip={aRC} color="var(--stage-warn)" weight={3.5} />
          <Label x={aRC.x} y={aRC.y} text="apparent" color="var(--stage-warn)" size={12} dx={-10} dy={14} />
          <AngleArc at={O} from={{ x: 0, y: -1 }} to={{ x: -vcar, y: -vr }} rPx={24} label={`${thetaDeg}°`} />
        </Stage>
      </div>
      <LiveRegion>{`Car speed ${speed}. Apparent rain ${thetaDeg} degrees from vertical.`}</LiveRegion>
    </div>
    </PlayWrap>
  );

  const controls = (
    <ControlBar>
      <Field label="car speed" value={`${thetaDeg}° from vertical`}>
        <Slider value={speed} min={0} max={maxSpeed} step={0.5} onChange={setSpeed} ariaLabel="car speed" />
      </Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} controls={controls}>{figure}</LabFrame>;
}
