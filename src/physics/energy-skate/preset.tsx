'use client';

/**
 * EnergySkateLab, "Where did the energy go?", KE ⇄ PE on a ramp, with friction
 * bleeding the total into heat.
 *
 * A skater is released from a height on a parabolic ramp. Three stacked bars , 
 * potential, kinetic, and thermal, ALWAYS sum to the same total: as the skater
 * drops, the PE bar empties into the KE bar and back on the way up. Turn friction
 * on and a THERMAL bar grows each pass, so the skater can never climb as high
 * again, mechanical energy isn't destroyed, it's moved to heat. (The "LOL" energy
 * bar chart, animated.)
 *
 * This complements WorkEnergyLab (work = area under F–x): here the spotlight is
 * CONVERSION and conservation, not the definition of work.
 *
 * Tokenized SVG; energy-method integrator here; honours reduced-motion.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polyline, Label, useInView, type Vec2 } from '@classytic/stage';
import { Slider, CheckButton, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, Control, MeterBar, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { clamp } from '../../core/util.js';

export interface EnergySkateProps {
  startHeight?: number;
  friction?: boolean;
  mass?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ hide: ['friction'] }` to pin friction off (or on). */
  controlConfig?: ControlConfig;
}

const G = 9.8;
const X = 6;          // ramp half-width
const H = 5;          // ramp height at the lip
const MU = 0.08;      // rolling-friction coefficient (energy per metre = μ·m·g)
const yAt = (x: number): number => H * (x / X) * (x / X);   // parabolic valley

export function EnergySkateLab({
  startHeight = 4, friction = false, mass = 1,
  title = 'Where did the energy go?: KE ⇄ PE (and heat)',
  prompt = 'Release the skater and watch potential energy pour into kinetic and back. The three bars always add to the same total, unless friction is on, then a heat bar grows and the skater can’t climb as high again.',
  objectives,
  controlConfig,
}: EnergySkateProps): ReactNode {
  const [h0, setH0] = useState(clamp(startHeight, 1, H));
  const [fric, setFric] = useState(friction);
  const [m] = useState(mass);
  const [running, setRunning] = useState(false);

  // release point: x0 on the left wall at height h0
  const x0 = -X * Math.sqrt(h0 / H);
  const E0 = m * G * h0;                 // total energy budget

  const xRef = useRef(x0);
  const dirRef = useRef(1);              // +1 → moving right
  const qRef = useRef(0);               // thermal energy accumulated
  const reduce = useReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const SCALE = 0.5;

  const repaint = useFrameTick(running && inView, (f) => {
    const dt = Math.min(0.03, f.dtMs / 1000);
    let x = xRef.current;
    const y = yAt(x);
    let ke = E0 - m * G * y - qRef.current;
    // friction has eaten essentially all the mechanical energy → settle and stop
    // (unconditional, so it can't jitter forever at vanishing amplitude).
    if (fric && E0 - qRef.current <= m * G * 0.03) { xRef.current = 0; setRunning(false); return; }
    if (ke <= 0) {
      // turning point, reverse direction
      dirRef.current = -dirRef.current;
      ke = 0;
    }
    const v = Math.sqrt(Math.max(0, (2 * ke) / m));
    // horizontal step (projected); good enough for the energy story
    const dx = dirRef.current * v * SCALE * dt;
    x = clamp(x + dx, -X, X);
    if (Math.abs(x) >= X) dirRef.current = -dirRef.current;   // bounce off the lip
    if (fric) qRef.current = Math.min(E0, qRef.current + MU * m * G * Math.abs(dx));
    xRef.current = x;
  });

  const release = (): void => {
    xRef.current = x0; dirRef.current = 1; qRef.current = 0;
    if (reduce) { xRef.current = 0; repaint(); return; }
    setRunning(true);
  };
  const onH0 = (n: number): void => { setH0(clamp(n, 1, H)); setRunning(false); xRef.current = -X * Math.sqrt(clamp(n, 1, H) / H); dirRef.current = 1; qRef.current = 0; };

  // live energies
  const x = xRef.current;
  const y = yAt(x);
  const pe = m * G * y;
  const ke = Math.max(0, E0 - pe - qRef.current);
  const q = qRef.current;

  const track: Vec2[] = [];
  for (let i = -X; i <= X + 1e-9; i += 0.25) track.push({ x: i, y: yAt(i) });
  const view = { xMin: -X - 1, xMax: X + 1, yMin: -1, yMax: H + 1 };

  const figure = (
    <div ref={viewRef} className="lab-playwrap">
      <Stage view={view} height={240} preserveAspect={false} ariaLabel={`Skater on a ramp released from ${h0.toFixed(1)} m${fric ? ', with friction' : ''}`}>
        {/* ground */}
        <Segment from={{ x: view.xMin, y: 0 }} to={{ x: view.xMax, y: 0 }} color="var(--stage-fg)" opacity={0.3} weight={1} />
        {/* release-height guide */}
        <Segment from={{ x: view.xMin, y: h0 }} to={{ x: view.xMax, y: h0 }} color="var(--stage-muted)" opacity={0.5} weight={1} dashed />
        <Label x={view.xMin} y={h0} text={`release ${h0.toFixed(1)} m`} color="var(--stage-muted)" size={10} anchor="start" dy={-3} />
        {/* the ramp */}
        <Polyline points={track} color="var(--stage-fg)" weight={2.5} />
        {/* skater (emoji avoids aspect-stretch into an ellipse) */}
        <Label x={x} y={y + 0.4} text="🛹" color="var(--stage-fg)" size={30} />
      </Stage>
    </div>
  );

  const ebar = E0 > 0 ? 1 / E0 : 0;
  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <MeterBar label="potential PE = mgh" frac={pe * ebar} color="var(--stage-accent-2)" value={`${pe.toFixed(1)} J`} />
      <MeterBar label="kinetic KE = ½mv²" frac={ke * ebar} color="var(--stage-good)" value={`${ke.toFixed(1)} J`} />
      {fric && <MeterBar label="thermal (friction) 🔥" frac={q * ebar} color="var(--stage-warn)" value={`${q.toFixed(1)} J`} />}
      <Callout tone="result">
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          PE + KE{fric ? ' + heat' : ''} = <strong>{(pe + ke + (fric ? q : 0)).toFixed(1)} J</strong>
          {' '}= constant total {E0.toFixed(1)} J
        </span>
      </Callout>
      <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>
        Friction off → the skater returns to the same height forever (mechanical energy conserved). Friction
        on → the heat bar climbs and every peak is lower: energy moved, not lost.
      </p>
      <LiveRegion>{`Potential ${pe.toFixed(1)}, kinetic ${ke.toFixed(1)}${fric ? `, heat ${q.toFixed(1)}` : ''} joules; total ${E0.toFixed(1)}.`}</LiveRegion>
    </div>
  );

  const controls = (
    <ControlBar>
      <CheckButton onClick={release}>▶ Release</CheckButton>
      <Control name="friction"><Chip selected={fric} onClick={() => { setFric((c) => !c); setRunning(false); qRef.current = 0; }}>friction {fric ? 'on 🔥' : 'off'}</Chip></Control>
      <Field label="start height" value={`${h0.toFixed(1)} m`}><Slider value={h0} min={1} max={H} step={0.5} onChange={onH0} ariaLabel="release height (m)" /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} controlConfig={controlConfig}>{figure}</LabFrame>;
}
