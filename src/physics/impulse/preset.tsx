'use client';

/**
 * ImpulseLab, "Catch the egg", why a long contact time saves you.
 *
 * The SAME ball at the SAME speed is brought to rest, so the impulse it delivers
 * is FIXED: J = Δp = m·v. You only change HOW LONG the stop takes (a hard wall vs
 * a soft glove / airbag). The force–time pulse is modelled as a half-sine,
 * F(t) = F_peak·sin(πt/Δt), whose area ∫F dt = F_peak·(2Δt/π) is pinned to Δp , 
 * so as Δt grows the curve morphs from a tall-thin SPIKE (hard, big peak force)
 * to a low-wide BUMP (soft), the two shaded areas staying equal on FIXED axes:
 * the single-image proof that impulse is conserved while peak force is not.
 *
 * A fragile target (egg) cracks if the peak force tops its limit, so "bend your
 * knees / airbags / follow-through" stops being a slogan and becomes a number.
 *
 * Tokenized SVG; time-dependent (integrator here); honours reduced-motion.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Polyline, Label, useInView, useLearner, type Vec2 } from '@classytic/stage';
import { Slider, CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { clamp } from '../../core/util.js';

export interface ImpulseProps {
  mass?: number;
  speed?: number;
  /** Contact time in seconds (soft = long). */
  contact?: number;
  /** Peak force the fragile target survives (N). */
  crackForce?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ lock: ['mass','speed'] }` to fix the impulse. */
  controlConfig?: ControlConfig;
}

// Fixed axes for the force–time graph so EQUAL impulse reads as EQUAL shaded area.
const T_MAX = 0.34;          // s, x-axis span
const F_MAX = 360;           // N, y-axis span
const DT_MIN = 0.02, DT_MAX = 0.30;

/** Half-sine pulse pinned to area = dp:  F_peak = π·dp / (2·Δt). */
function peakForce(dp: number, dt: number): number {
  return (Math.PI * dp) / (2 * dt);
}
function pulse(dp: number, dt: number): Vec2[] {
  const fp = peakForce(dp, dt);
  const pts: Vec2[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * dt;
    pts.push({ x: t, y: fp * Math.sin((Math.PI * t) / dt) });
  }
  return pts;
}

export function ImpulseLab({
  mass = 0.5, speed = 8, contact = 0.05, crackForce = 120,
  title = 'Catch the egg: stretch the stop, shrink the force',
  prompt = 'Same ball, same speed, so the impulse J = m·v is fixed. Drag the contact time: a softer, slower stop keeps the same area but a much smaller peak force.',
  objectives,
  controlConfig,
}: ImpulseProps): ReactNode {
  const [m, setM] = useState(mass);
  const [v, setV] = useState(speed);
  const [dt, setDt] = useState(clamp(contact, DT_MIN, DT_MAX));
  const [running, setRunning] = useState(false);

  const tRef = useRef(0);               // animation clock, 0..(approach+dt+settle)
  const reduce = useReducedMotion();
  const learner = useLearner();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const dp = m * v;                      // impulse delivered to stop the ball
  const fpeak = peakForce(dp, dt);
  const cracks = fpeak > crackForce;
  const curve = pulse(dp, dt);
  const hard = pulse(dp, DT_MIN);        // faint reference: the hard-wall spike

  const APPROACH = 0.6, SETTLE = 0.5;
  const TOTAL = APPROACH + dt + SETTLE;

  const repaint = useFrameTick(running && inView, (f) => {
    tRef.current += Math.min(0.05, f.dtMs / 1000);
    if (tRef.current >= TOTAL) {
      setRunning(false);
      learner?.report({ activity: 'impulse', correct: !cracks, score: { raw: cracks ? 0 : 1, max: 1 }, completion: true });
    }
  });

  const launch = (): void => {
    tRef.current = 0;
    if (reduce) { tRef.current = TOTAL; repaint(); return; }
    setRunning(true);
  };
  const onParam = (set: (n: number) => void) => (n: number): void => { set(n); setRunning(false); tRef.current = 0; };

  // ---- impact-scene geometry (world units) ----
  // Ball flies in from the left, compresses the cushion over [APPROACH, APPROACH+dt], then rests.
  const t = tRef.current;
  const wallX = 6;
  const ballR = 0.9;
  const restX = wallX - ballR;                 // ball centre when fully stopped at the cushion face
  const startX = -6;
  // compression fraction 0..1 over the contact window
  const phase = t < APPROACH ? 0 : t < APPROACH + dt ? (t - APPROACH) / dt : 1;
  // squish depth scales with Δt (soft = deep give); pure visual cue
  const give = 0.4 + 2.6 * ((dt - DT_MIN) / (DT_MAX - DT_MIN));
  const compress = Math.sin(phase * Math.PI) * give;   // in then back a touch
  const settled = t >= APPROACH + dt;
  const ballX = t < APPROACH
    ? startX + (restX - give - startX) * (t / APPROACH)
    : restX - compress;
  const cushionFace = wallX - 1.4 - compress;

  // live peak-force readout follows the pulse during contact
  const fNow = (t >= APPROACH && t < APPROACH + dt) ? fpeak * Math.sin((Math.PI * (t - APPROACH)) / dt) : (settled ? 0 : 0);

  const sceneView = { xMin: -6.5, xMax: 7.5, yMin: -2.2, yMax: 2.6 };

  const scene = (
    <Stage view={sceneView} height={150} preserveAspect={false} ariaLabel={`A ${m} kg ball at ${v} m/s stopped over ${(dt * 1000).toFixed(0)} ms`}>
      {/* ground line */}
      <Segment from={{ x: -6.5, y: -1.6 }} to={{ x: 7.5, y: -1.6 }} color="var(--stage-fg)" opacity={0.4} weight={1.5} />
      {/* rigid wall */}
      <Polygon points={[{ x: wallX, y: -1.6 }, { x: wallX + 1.2, y: -1.6 }, { x: wallX + 1.2, y: 2.2 }, { x: wallX, y: 2.2 }]} color="var(--stage-fg)" fill="var(--stage-muted)" fillOpacity={0.5} weight={1.5} />
      {/* cushion (its squashed width shows the "give") */}
      <Polygon
        points={[{ x: cushionFace, y: -1.2 }, { x: wallX, y: -1.2 }, { x: wallX, y: 1.8 }, { x: cushionFace, y: 1.8 }]}
        color={cracks ? 'var(--stage-warn)' : 'var(--stage-good)'}
        fill={cracks ? 'var(--stage-warn)' : 'var(--stage-good)'}
        fillOpacity={0.25}
        weight={1.5}
      />
      <Label x={(cushionFace + wallX) / 2} y={1.8} text={dt > 0.16 ? 'soft glove' : dt < 0.06 ? 'hard wall' : 'cushion'} color="var(--stage-fg)" size={10} dy={-6} />
      {/* the fragile target, the egg itself (emoji avoids aspect-stretch into an ellipse) */}
      <Label x={ballX} y={0} text={cracks && settled ? '💥' : '🥚'} color="var(--stage-fg)" size={34} />
      {/* incoming velocity hint before contact */}
      {t < APPROACH && <Label x={ballX} y={ballR + 0.3} text={`${v} m/s →`} color="var(--stage-accent)" size={11} dy={-4} />}
    </Stage>
  );

  // ---- force–time graph (fixed axes; shaded area = impulse) ----
  const gv = { xMin: 0, xMax: T_MAX, yMin: 0, yMax: F_MAX };
  const playT = clamp(t - APPROACH, 0, dt);
  const filled = curve.filter((p) => p.x <= playT);
  const graph = (
    <Stage view={gv} height={150} preserveAspect={false} ariaLabel={`Force versus time. Peak force ${fpeak.toFixed(0)} newtons over ${(dt * 1000).toFixed(0)} milliseconds`}>
      {/* axes */}
      <Segment from={{ x: 0, y: 0 }} to={{ x: T_MAX, y: 0 }} color="var(--stage-fg)" opacity={0.5} weight={1.5} />
      <Segment from={{ x: 0, y: 0 }} to={{ x: 0, y: F_MAX }} color="var(--stage-fg)" opacity={0.5} weight={1.5} />
      <Label x={T_MAX} y={0} text="time" color="var(--stage-fg)" size={10} dy={14} anchor="end" />
      <Label x={0} y={F_MAX} text="force (N)" color="var(--stage-fg)" size={10} dy={-4} anchor="start" />
      {/* crack threshold */}
      <Segment from={{ x: 0, y: crackForce }} to={{ x: T_MAX, y: crackForce }} color="var(--stage-warn)" opacity={0.7} weight={1.2} dashed />
      <Label x={T_MAX} y={crackForce} text="egg cracks" color="var(--stage-warn)" size={9} dy={-3} anchor="end" />
      {/* faint hard-wall reference spike */}
      <Polyline points={hard} color="var(--stage-muted)" weight={1} opacity={0.5} dashed />
      {/* the pulse + its shaded impulse */}
      <Polygon points={[{ x: 0, y: 0 }, ...curve, { x: dt, y: 0 }]} color="none" fill="var(--stage-accent)" fillOpacity={0.18} weight={0} />
      <Polyline points={curve} color="var(--stage-accent)" weight={2.5} />
      {/* swept fill during playback */}
      {running && filled.length > 1 && <Polygon points={[{ x: 0, y: 0 }, ...filled, { x: playT, y: 0 }]} color="none" fill="var(--stage-accent)" fillOpacity={0.4} weight={0} />}
      {/* peak marker */}
      <Segment from={{ x: dt / 2, y: 0 }} to={{ x: dt / 2, y: fpeak }} color="var(--stage-accent)" opacity={0.5} weight={1} dashed />
    </Stage>
  );

  const figure = (
    <div ref={viewRef} className="lab-playwrap" style={{ display: 'grid', gap: 8 }}>
      {scene}
      {graph}
    </div>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
          <span>impulse J = Δp = <strong>{dp.toFixed(1)} kg·m/s</strong> (fixed)</span>
          <span>contact Δt = <strong>{(dt * 1000).toFixed(0)} ms</strong></span>
          <span style={{ color: cracks ? 'var(--stage-warn)' : 'var(--stage-good)' }}>peak force ≈ <strong>{fpeak.toFixed(0)} N</strong></span>
        </span>
      </Callout>
      <StatusPill ok={!cracks}>{cracks ? '💥 Too hard, the egg cracks' : '✓ Gentle enough, egg survives'}</StatusPill>
      <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>
        Same area under both curves = same impulse. Spreading the stop over more time is exactly why
        <strong> airbags, crumple zones, knee-bending landings</strong> and <strong>following through</strong> work.
      </p>
      <LiveRegion>{`Impulse ${dp.toFixed(1)}, contact ${(dt * 1000).toFixed(0)} milliseconds, peak force ${fpeak.toFixed(0)} newtons. Egg ${cracks ? 'cracks' : 'survives'}.`}</LiveRegion>
    </div>
  );

  const controls = (
    <ControlBar>
      <CheckButton onClick={launch}>▶ Drop it</CheckButton>
      <Field label="contact Δt" value={`${(dt * 1000).toFixed(0)} ms`}><Slider value={dt} min={DT_MIN} max={DT_MAX} step={0.005} onChange={onParam(setDt)} ariaLabel="contact time (seconds)" /></Field>
      <Field label="mass" value={`${m} kg`}><Slider value={m} min={0.2} max={1.5} step={0.1} onChange={onParam(setM)} ariaLabel="ball mass (kg)" /></Field>
      <Field label="speed" value={`${v} m/s`}><Slider value={v} min={2} max={12} step={0.5} onChange={onParam(setV)} ariaLabel="impact speed (m/s)" /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} controlConfig={controlConfig}>{figure}</LabFrame>;
}
