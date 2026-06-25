'use client';

/**
 * CircularMotionLab — "Whirl & cut", where centripetal force points and where the
 * ball REALLY goes when you let go.
 *
 * A ball on a string whirls at constant speed. The velocity arrow is always
 * TANGENT; the tension (centripetal force F = mv²/r) always points to the centre —
 * it changes the direction of v, never its size. Then CUT THE STRING: the ball
 * flies off along the tangent in a straight line — NOT radially outward, the
 * single most common misconception. Tune v, r, m and read F live (hammer throw,
 * a car cornering, the spin cycle).
 *
 * Uses the ambient PlayWrap gate (pause to study the vectors). Tokenized SVG.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Circle, Segment, Dot, Vector, Label } from '@classytic/stage';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { Slider, CheckButton, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { clamp } from '../../core/util.js';

export interface CircularMotionProps {
  speed?: number;
  radius?: number;
  mass?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ lock: ['radius'] }`. */
  controlConfig?: ControlConfig;
}

export function CircularMotionLab({
  speed = 6, radius = 3, mass = 1,
  title = 'Whirl & cut — where does it really go?',
  prompt = 'The string’s tension is the centripetal force F = mv²/r — always toward the centre, bending the path without changing the speed. Cut the string and the ball leaves along the tangent, not outward.',
  objectives,
  controlConfig,
}: CircularMotionProps): ReactNode {
  const [v, setV] = useState(speed);
  const [r, setR] = useState(radius);
  const [m, setM] = useState(mass);
  const [cut, setCut] = useState(false);
  const gate = usePlayGate();

  const ang = useRef(0);           // current angle (CCW)
  const fly = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const omega = v / r;             // rad/s (v = ωr)
  const F = (m * v * v) / r;       // centripetal force

  useFrameTick(gate.running, (f) => {
    const dt = Math.min(0.04, f.dtMs / 1000);
    if (!cut) {
      ang.current = (ang.current + omega * dt) % (Math.PI * 2);
    } else if (fly.current) {
      fly.current.x += fly.current.vx * dt;
      fly.current.y += fly.current.vy * dt;
      // it has flown clear in a straight line — stop (re-tie to run again) instead of teleporting back
      if (Math.hypot(fly.current.x, fly.current.y) > 8.5) gate.setPlaying(false);
    }
  });

  const ballPos = (): { x: number; y: number } => ({ x: r * Math.cos(ang.current), y: r * Math.sin(ang.current) });
  const tangent = (): { x: number; y: number } => ({ x: -Math.sin(ang.current), y: Math.cos(ang.current) }); // CCW unit tangent

  function startFly(): void {
    const p = ballPos(); const tg = tangent();
    fly.current = { x: p.x, y: p.y, vx: tg.x * v, vy: tg.y * v };
  }
  const doCut = (): void => { startFly(); setCut(true); gate.setPlaying(true); };
  const retie = (): void => { setCut(false); fly.current = null; };
  const onParam = (set: (n: number) => void) => (n: number): void => { set(n); retie(); };

  const VSCALE = 0.45;   // m/s → world length for the velocity arrow
  const FSCALE = 0.10;   // N → world length for the force arrow

  const p = cut && fly.current ? { x: fly.current.x, y: fly.current.y } : ballPos();
  const tg = tangent();
  const span = Math.max(6, r + 3);
  const view = { xMin: -span, xMax: span, yMin: -span, yMax: span };

  const figure = (
    <PlayWrap gate={gate}>
      <div>
        <Stage view={view} height={300} ariaLabel={`Ball whirling at ${v} m/s on a ${r} m string, centripetal force ${F.toFixed(0)} newtons${cut ? '; string cut, flying off tangentially' : ''}`}>
          {/* circular path */}
          <Circle center={{ x: 0, y: 0 }} r={r} color="var(--stage-fg)" opacity={0.3} weight={1.2} fill="none" />
          {/* hub */}
          <Dot x={0} y={0} r={5} color="var(--stage-fg)" opacity={0.7} />
          {/* string + centripetal force (only while attached) */}
          {!cut && <Segment from={{ x: 0, y: 0 }} to={p} color="var(--stage-fg)" opacity={0.5} weight={1.5} />}
          {!cut && <Vector tail={p} tip={{ x: p.x - Math.cos(ang.current) * F * FSCALE, y: p.y - Math.sin(ang.current) * F * FSCALE }} color="var(--stage-warn)" weight={3} />}
          {!cut && <Label x={p.x - Math.cos(ang.current) * F * FSCALE} y={p.y - Math.sin(ang.current) * F * FSCALE} text="F" color="var(--stage-warn)" size={12} dy={-4} />}
          {/* velocity (tangent) — green, always */}
          <Vector tail={p} tip={{ x: p.x + tg.x * v * VSCALE, y: p.y + tg.y * v * VSCALE }} color="var(--stage-good)" weight={3} />
          <Label x={p.x + tg.x * v * VSCALE} y={p.y + tg.y * v * VSCALE} text="v" color="var(--stage-good)" size={12} dy={-4} />
          {/* faint tangent guide line after the cut — proves "tangent, not outward" */}
          {cut && fly.current && <Segment from={{ x: fly.current.x - tg.x * 12, y: fly.current.y - tg.y * 12 }} to={{ x: fly.current.x + tg.x * 12, y: fly.current.y + tg.y * 12 }} color="var(--stage-good)" opacity={0.3} weight={1} dashed />}
          {/* the ball */}
          <Circle center={p} r={0.45} color="var(--stage-accent)" fill="var(--stage-accent)" fillOpacity={0.9} weight={1.5} />
        </Stage>
      </div>
    </PlayWrap>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
          <span>centripetal F = mv²/r = <strong>{F.toFixed(0)} N</strong></span>
          <span>angular speed ω = v/r = <strong>{omega.toFixed(2)} rad/s</strong></span>
          <span>period T = 2πr/v = <strong>{((2 * Math.PI * r) / v).toFixed(2)} s</strong></span>
        </span>
      </Callout>
      <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>
        <span style={{ color: 'var(--stage-good)', fontWeight: 700 }}>v</span> is tangent;
        <span style={{ color: 'var(--stage-warn)', fontWeight: 700 }}> F</span> points to the centre.
        Cut the string → no inward pull → straight-line tangent flight (Newton’s 1st law). Hammer throw, a
        car cornering, the spin cycle.
      </p>
      <LiveRegion>{cut ? 'String cut — the ball travels in a straight line along the tangent.' : `Centripetal force ${F.toFixed(0)} newtons toward the centre.`}</LiveRegion>
    </div>
  );

  const controls = (
    <ControlBar>
      {cut ? <CheckButton onClick={retie}>↺ Re-tie</CheckButton> : <CheckButton onClick={doCut}>✂ Cut string</CheckButton>}
      <Chip selected={cut} onClick={() => (cut ? retie() : doCut())}>{cut ? 'flying free' : 'on the string'}</Chip>
      <Field label="speed v" value={`${v} m/s`}><Slider value={v} min={2} max={12} step={0.5} onChange={onParam(setV)} ariaLabel="speed (m/s)" /></Field>
      <Field label="radius r" value={`${r} m`}><Slider value={r} min={1.5} max={5} step={0.5} onChange={onParam((n) => setR(clamp(n, 1.5, 5)))} ariaLabel="radius (m)" /></Field>
      <Field label="mass m" value={`${m} kg`}><Slider value={m} min={0.5} max={4} step={0.5} onChange={onParam(setM)} ariaLabel="mass (kg)" /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} controlConfig={controlConfig}>{figure}</LabFrame>;
}
