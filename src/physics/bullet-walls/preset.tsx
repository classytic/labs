'use client';

/**
 * BulletWallsLab — "How many planks?", the classic penetration problem made
 * watchable and PREDICT-FIRST.
 *
 * A bullet fires into a stack of identical planks. Each plank pushes back with a
 * constant retarding force over its thickness, so it drains a FIXED chunk of
 * kinetic energy — equivalently a fixed Δ(v²) per plank. The bullet free-flies
 * between planks (constant v) and decelerates linearly in v² while inside one
 * (v²(x) = v²ₑ − (cost/width)·depth), the textbook v² = u² − 2as. It stops the
 * instant its kinetic energy runs out — embedding partway through a plank.
 *
 * The learner GUESSES how many planks it punches through, then fires and watches
 * it slow plank-by-plank while the KE bar drains — turning "N = u²/(2as)" from a
 * formula into a bet you can win.
 *
 * Tokenized SVG; time-dependent integrator here; honours reduced-motion.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Label, useInView, useLearner } from '@classytic/stage';
import { Slider, Stepper, CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, MeterBar, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { clamp } from '../../core/util.js';

export interface BulletWallsProps {
  speed?: number;
  /** Energy a single plank drains, expressed as the v² it removes (m²/s²). */
  toughness?: number;
  planks?: number;
  mass?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide any knob — e.g. `{ lock: ['plank toughness'] }` to fix the toughness. */
  controlConfig?: ControlConfig;
}

const PLANK_W = 0.7;        // world width of a plank
const GAP = 1.0;            // gap between planks
const START_X = -4;
const STACK_X0 = 0;         // x of the first plank's near face

export function BulletWallsLab({
  speed = 30, toughness = 160, planks = 6, mass = 0.02,
  title = 'How many planks? — bet, then fire',
  prompt = 'Each plank steals the same chunk of energy. Guess how many the bullet smashes through, then fire and watch the speed (and the energy bar) drain plank by plank.',
  objectives,
  controlConfig,
}: BulletWallsProps): ReactNode {
  const [v0, setV0] = useState(speed);
  const [cost, setCost] = useState(toughness);   // Δ(v²) per plank
  const [n, setN] = useState(planks);
  const [guess, setGuess] = useState(2);
  const [running, setRunning] = useState(false);
  const [fired, setFired] = useState(false);

  const xRef = useRef(START_X);
  const v2Ref = useRef(v0 * v0);
  const reduce = useReducedMotion();
  const learner = useLearner();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  // plank near-faces
  const faceX = (i: number): number => STACK_X0 + i * (PLANK_W + GAP);
  // analytic answer: full planks penetrated = floor(v0² / cost)
  const ke0 = 0.5 * mass * v0 * v0;
  const fullPenetrated = Math.min(n, Math.floor((v0 * v0) / cost + 1e-9));
  const stopsInsideStack = (v0 * v0) / cost < n;
  // partial depth into the (fullPenetrated)-th plank if it lodges
  const remV2 = v0 * v0 - fullPenetrated * cost;
  const lodgeDepth = stopsInsideStack ? clamp(remV2 / cost, 0, 1) * PLANK_W : 0;

  const SPEED_SCALE = 0.25;   // m/s → world units/s on screen

  const repaint = useFrameTick(running && inView, (f) => {
    const dt = Math.min(0.04, f.dtMs / 1000);
    let x = xRef.current;
    let v2 = v2Ref.current;
    const v = Math.sqrt(Math.max(0, v2));
    let dx = v * SPEED_SCALE * dt;
    // are we inside an intact plank?
    let inside = false;
    for (let i = 0; i < n; i++) {
      const a = faceX(i), b = a + PLANK_W;
      if (x >= a && x < b) { inside = true; break; }
    }
    if (inside) {
      // constant retarding force → v² falls linearly with depth travelled
      const dV2 = (cost / PLANK_W) * dx;
      if (dV2 >= v2) {
        // lodges within this plank: advance only the distance its energy allows
        const allowed = (v2 / cost) * PLANK_W;
        x += allowed; v2 = 0;
      } else {
        x += dx; v2 -= dV2;
      }
    } else {
      x += dx;
    }
    xRef.current = x; v2Ref.current = v2;
    const exited = x >= faceX(n - 1) + PLANK_W + 0.5;
    if (v2 <= 0 || exited) {
      setRunning(false);
      learner?.report({ activity: 'bullet-walls', correct: guess === fullPenetrated, score: { raw: guess === fullPenetrated ? 1 : 0, max: 1 }, response: String(guess), completion: true });
    }
  });

  const fire = (): void => {
    xRef.current = START_X; v2Ref.current = v0 * v0; setFired(true);
    if (reduce) {
      // jump to the resting place
      xRef.current = stopsInsideStack ? faceX(fullPenetrated) + lodgeDepth : faceX(n - 1) + PLANK_W + 0.5;
      v2Ref.current = stopsInsideStack ? 0 : v0 * v0 - n * cost;
      repaint();
      return;
    }
    setRunning(true);
  };
  const onParam = (set: (x: number) => void) => (x: number): void => { set(x); setRunning(false); setFired(false); xRef.current = START_X; v2Ref.current = (set === setV0 ? x : v0) ** 2; };

  // live state for render
  const bx = xRef.current;
  const vNow = Math.sqrt(Math.max(0, v2Ref.current));
  const keNow = 0.5 * mass * v2Ref.current;
  // how many planks has the bullet's nose cleared (passed the far face)?
  let broken = 0;
  for (let i = 0; i < n; i++) if (bx >= faceX(i) + PLANK_W) broken++;
  const settled = fired && !running;

  const stackEnd = faceX(n - 1) + PLANK_W;
  const view = { xMin: START_X - 1.3, xMax: stackEnd + 1.5, yMin: -2.4, yMax: 2.4 };

  const Plank = (i: number): ReactNode => {
    const a = faceX(i);
    const shattered = bx >= a + PLANK_W;                 // nose cleared this plank
    const lodgedHere = settled && stopsInsideStack && i === fullPenetrated;
    const col = shattered ? 'var(--stage-muted)' : lodgedHere ? 'var(--stage-warn)' : 'var(--stage-good)';
    return (
      <g key={`p${i}`}>
        <Polygon
          points={[{ x: a, y: -1.6 }, { x: a + PLANK_W, y: -1.6 }, { x: a + PLANK_W, y: 1.6 }, { x: a, y: 1.6 }]}
          color={`color-mix(in oklab, ${col} 60%, black)`}
          fill={col}
          fillOpacity={shattered ? 0.18 : 0.7}
          weight={1.2}
        />
        {/* crack lines on a shattered plank */}
        {shattered && <Segment from={{ x: a, y: 0.7 }} to={{ x: a + PLANK_W, y: -0.5 }} color="var(--stage-fg)" opacity={0.35} weight={0.8} />}
        {shattered && <Segment from={{ x: a, y: -0.6 }} to={{ x: a + PLANK_W, y: 0.8 }} color="var(--stage-fg)" opacity={0.35} weight={0.8} />}
      </g>
    );
  };

  const figure = (
    <div ref={viewRef} className="lab-playwrap">
      <Stage view={view} height={230} preserveAspect={false} ariaLabel={`A bullet at ${v0} m/s fired into ${n} planks`}>
        {/* ground */}
        <Segment from={{ x: view.xMin, y: -1.6 }} to={{ x: view.xMax, y: -1.6 }} color="var(--stage-fg)" opacity={0.4} weight={1.5} />
        {Array.from({ length: n }, (_, i) => Plank(i))}
        {/* the bullet — a little pointed slug; its NOSE sits at bx (the physics entry point) */}
        <Polygon
          points={[{ x: bx - 1.0, y: -0.22 }, { x: bx - 0.32, y: -0.22 }, { x: bx, y: 0 }, { x: bx - 0.32, y: 0.22 }, { x: bx - 1.0, y: 0.22 }]}
          color="color-mix(in oklab, var(--stage-metal) 55%, black)"
          fill="var(--stage-metal)"
          fillOpacity={1}
          weight={1}
        />
        {/* speed streak while moving */}
        {running && vNow > 0.5 && <Segment from={{ x: bx - 1.1 - Math.min(2, vNow * 0.08), y: 0 }} to={{ x: bx - 1.0, y: 0 }} color="var(--stage-metal)" opacity={0.4} weight={3} />}
        <Label x={bx - 0.5} y={0.22} text={`${vNow.toFixed(0)} m/s`} color="var(--stage-fg)" size={11} dy={-6} />
      </Stage>
    </div>
  );

  const verdict = settled
    ? (guess === fullPenetrated ? `🎯 Spot on — ${fullPenetrated} planks` : `It broke ${fullPenetrated}, you guessed ${guess}`)
    : null;

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
          <span>start KE = ½mv² = <strong>{ke0.toFixed(1)} J</strong></span>
          <span>cost per plank ≈ <strong>{(0.5 * mass * cost).toFixed(1)} J</strong></span>
          <span>broken so far: <strong>{broken} / {n}</strong></span>
        </span>
      </Callout>
      {/* KE drain bar */}
      <MeterBar label="kinetic energy" frac={ke0 > 0 ? keNow / ke0 : 0} color="var(--stage-accent)" value={`${keNow.toFixed(1)} J`} />
      {verdict && <StatusPill ok={guess === fullPenetrated}>{verdict}</StatusPill>}
      <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>
        Predict with <strong>N = u² / (Δv² per plank)</strong> — then watch v² fall by the same step each plank
        (v² = u² − 2as). It lodges when the energy hits zero.
      </p>
      <LiveRegion>{settled ? `The bullet broke ${fullPenetrated} of ${n} planks. You guessed ${guess}.` : ''}</LiveRegion>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label="your guess"><Stepper value={guess} min={0} max={n} onChange={setGuess} label="planks you think it breaks" /></Field>
      <CheckButton onClick={fire}>▶ Fire</CheckButton>
      <Field label="muzzle speed" value={`${v0} m/s`}><Slider value={v0} min={10} max={60} step={1} onChange={onParam(setV0)} ariaLabel="muzzle speed (m/s)" /></Field>
      <Field label="plank toughness" value={`Δv² ${cost}`}><Slider value={cost} min={40} max={400} step={10} onChange={onParam(setCost)} ariaLabel="energy each plank absorbs" /></Field>
      <Field label="planks" value={`${n}`}><Slider value={n} min={1} max={10} step={1} onChange={(x) => { onParam(setN)(x); setGuess((g) => Math.min(g, x)); }} ariaLabel="number of planks" /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} controlConfig={controlConfig}>{figure}</LabFrame>;
}
