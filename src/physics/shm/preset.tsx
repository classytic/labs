'use client';

/**
 * SimpleHarmonicLab — "The same swing", where a spring and a pendulum turn out to
 * be the SAME motion, and where a wave comes from.
 *
 * One SHM kernel, two skins. A restoring force pulls back in proportion to the
 * displacement (spring: F = −kx; pendulum, small angle: F ≈ −mg·x/L), which forces
 * a = −ω²x and the solution x(t) = A·cos(ωt). The mass oscillates while a pen
 * traces x against time — and the trace IS a sine curve, the very shape of the
 * waves lessons (a wave is SHM spread through space). Energy sloshes between
 * elastic/PE and KE, summing to a constant (ties to the energy-skate lab).
 *
 *   ω = √(k/m)  (spring)        T = 2π√(m/k)      — heavier or softer ⇒ slower
 *   ω = √(g/L)  (pendulum)      T = 2π√(L/g)      — independent of mass AND amplitude
 *
 * Ambient PlayWrap gate (pause to read the force arrow). Tokenized SVG.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polyline, Circle, Dot, Vector, Label, type Vec2 } from '@classytic/stage';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, Control, MeterBar, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useFrameTick } from '../../kit/anim.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';

export type SHMMode = 'spring' | 'pendulum';

const SHM_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'fastest',
    prompt: 'In SHM the speed is greatest…',
    choices: [
      { value: 'centre', label: 'at the centre (equilibrium)' },
      { value: 'extreme', label: 'at the extremes' },
      { value: 'even', label: 'the same everywhere' },
    ],
    answer: 'centre',
    explain: 'All the energy is kinetic at the centre; at the extremes the mass stops and turns around.',
  },
  {
    id: 'amplitude',
    prompt: 'Doubling the amplitude changes the period…',
    choices: [
      { value: 'none', label: 'not at all' },
      { value: 'double', label: 'doubles it' },
      { value: 'half', label: 'halves it' },
    ],
    answer: 'none',
    explain: 'For ideal SHM the period depends only on k & m (or L & g), never on amplitude.',
  },
];

export interface SimpleHarmonicProps {
  mode?: SHMMode;
  /** Spring stiffness k (N/m). */
  k?: number;
  /** Pendulum length L (m). */
  length?: number;
  mass?: number;
  /** Amplitude: metres (spring) or degrees (pendulum). */
  amplitude?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Focus a lesson: set `mode` + `controlConfig:{ hide:['mode'] }` for spring-only or pendulum-only. */
  controlConfig?: ControlConfig;
}

const G = 9.8;
const WIN = 6;          // seconds of trace shown

export function SimpleHarmonicLab({
  mode = 'spring', k = 8, length = 2, mass = 1, amplitude,
  title = 'The same swing — spring, pendulum, and where a wave comes from',
  prompt = 'A restoring force pulls back in proportion to displacement, so a = −ω²x and the motion is x(t) = A·cos(ωt). Watch the pen trace a sine — that’s the shape of a wave. Swap to a pendulum: its period ignores both mass and amplitude.',
  objectives,
  controlConfig,
}: SimpleHarmonicProps): ReactNode {
  const [md, setMd] = useState<SHMMode>(mode);
  const [kk, setKk] = useState(k);
  const [L, setL] = useState(length);
  const [m, setM] = useState(mass);
  const isSpring = md === 'spring';
  const [ampM, setAmpM] = useState(amplitude ?? 2.4);     // spring amplitude (m)
  const [ampDeg, setAmpDeg] = useState(amplitude ?? 28);  // pendulum amplitude (deg)

  const gate = usePlayGate();
  const tRef = useRef(0);

  const challenge = useChallenge(SHM_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'shm' });

  const omega = isSpring ? Math.sqrt(kk / m) : Math.sqrt(G / L);
  const T = (2 * Math.PI) / omega;
  const f = 1 / T;

  useFrameTick(gate.running, (fr) => {
    tRef.current += Math.min(0.05, fr.dtMs / 1000);
  });

  const t = tRef.current;
  const u = Math.cos(omega * t);          // normalised displacement ∈ [−1,1]
  const du = -Math.sin(omega * t);        // normalised velocity (∝ −sin)
  // energy split (fractions): PE ∝ u², KE ∝ (1−u²)
  const peFrac = u * u;
  const keFrac = 1 - peFrac;

  // ---- oscillator scene ----
  const scene = isSpring ? (() => {
    const wallX = -6.2, eqX = 0.4;
    const x = eqX + ampM * u;             // mass centre
    const half = 0.7;
    const coils = 14;
    const pts: Vec2[] = [{ x: wallX, y: 0 }];
    for (let i = 1; i <= coils; i++) {
      const fx = wallX + ((x - half - wallX) * i) / (coils + 1);
      pts.push({ x: fx, y: i % 2 === 0 ? 0.45 : -0.45 });
    }
    pts.push({ x: x - half, y: 0 });
    const Fx = -kk * ampM * u;            // restoring force (N), toward eq
    return (
      <Stage view={{ xMin: -7, xMax: 7, yMin: -2.4, yMax: 2.4 }} height={170} preserveAspect={false} ariaLabel={`Mass on a spring oscillating, displacement ${(ampM * u).toFixed(2)} m`}>
        <Segment from={{ x: -7, y: -1.4 }} to={{ x: 7, y: -1.4 }} color="var(--stage-fg)" opacity={0.35} weight={1.2} />
        {/* wall */}
        <Segment from={{ x: wallX, y: -1.4 }} to={{ x: wallX, y: 1.4 }} color="var(--stage-fg)" opacity={0.6} weight={3} />
        {/* equilibrium marker */}
        <Segment from={{ x: eqX, y: -1.2 }} to={{ x: eqX, y: 1.2 }} color="var(--stage-muted)" opacity={0.6} weight={1} dashed />
        <Label x={eqX} y={-1.2} text="x=0" color="var(--stage-muted)" size={10} dy={14} />
        {/* spring */}
        <Polyline points={pts} color="var(--stage-fg)" weight={1.8} opacity={0.8} />
        {/* mass */}
        <Polyline points={[{ x: x - half, y: -half }, { x: x + half, y: -half }, { x: x + half, y: half }, { x: x - half, y: half }, { x: x - half, y: -half }]} color="color-mix(in oklab, var(--stage-accent) 60%, black)" weight={1.5} />
        <Label x={x} y={0} text={`${m}kg`} color="var(--stage-accent)" size={12} />
        {/* restoring force arrow */}
        {Math.abs(Fx) > 0.5 && <Vector tail={{ x, y: 1.5 }} tip={{ x: x + clamp(Fx * 0.04, -3, 3), y: 1.5 }} color="var(--stage-warn)" weight={3} />}
        <Label x={x} y={1.5} text="F = −kx" color="var(--stage-warn)" size={11} dy={-6} />
      </Stage>
    );
  })() : (() => {
    const pivot = { x: 0, y: 1.8 };
    const th = (ampDeg * Math.PI / 180) * u;     // current angle
    const Ls = clamp(L, 1, 3.2);                  // drawn length
    const bob = { x: pivot.x + Ls * Math.sin(th), y: pivot.y - Ls * Math.cos(th) };
    return (
      <Stage view={{ xMin: -4, xMax: 4, yMin: -2.2, yMax: 2.4 }} height={170} preserveAspect ariaLabel={`Pendulum swinging, angle ${(ampDeg * u).toFixed(0)} degrees`}>
        {/* support */}
        <Segment from={{ x: -1.4, y: pivot.y }} to={{ x: 1.4, y: pivot.y }} color="var(--stage-fg)" opacity={0.6} weight={3} />
        {/* equilibrium (vertical) */}
        <Segment from={pivot} to={{ x: pivot.x, y: pivot.y - Ls }} color="var(--stage-muted)" opacity={0.5} weight={1} dashed />
        {/* string + bob */}
        <Segment from={pivot} to={bob} color="var(--stage-fg)" opacity={0.6} weight={1.5} />
        <Dot x={pivot.x} y={pivot.y} r={3} color="var(--stage-fg)" />
        <Circle center={bob} r={0.32} color="color-mix(in oklab, var(--stage-accent) 60%, black)" fill="var(--stage-accent)" fillOpacity={0.9} weight={1.5} />
        {/* restoring force (tangential, ∝ −sinθ) */}
        {Math.abs(th) > 0.02 && <Vector tail={bob} tip={{ x: bob.x - Math.cos(th) * Math.sign(th) * 0.9, y: bob.y - Math.sin(th) * Math.sign(th) * 0.9 }} color="var(--stage-warn)" weight={3} />}
        <Label x={bob.x} y={bob.y} text={`${m}kg`} color="var(--stage-accent)" size={10} dy={20} />
      </Stage>
    );
  })();

  // ---- x(t) trace (a sine — the wave link) ----
  const A_PX = 1.0;
  const curve: Vec2[] = [];
  for (let i = 0; i <= 120; i++) {
    const tau = t - WIN + (i / 120) * WIN;          // [t−WIN, t]
    curve.push({ x: i / 120, y: A_PX * Math.cos(omega * tau) });
  }
  const trace = (
    <Stage view={{ xMin: 0, xMax: 1, yMin: -1.4, yMax: 1.4 }} height={130} preserveAspect={false} ariaLabel="Displacement traced against time — a sine curve">
      <Segment from={{ x: 0, y: 0 }} to={{ x: 1, y: 0 }} color="var(--stage-fg)" opacity={0.4} weight={1} />
      <Label x={0} y={1.4} text="displacement x(t)" color="var(--stage-fg)" size={10} anchor="start" dy={-2} />
      <Label x={1} y={0} text="time →" color="var(--stage-fg)" size={10} anchor="end" dy={14} />
      <Polyline points={curve} color="var(--stage-accent)" weight={2.5} />
      {/* current value at the right edge */}
      <Dot x={1} y={A_PX * u} r={4} color="var(--stage-accent)" />
    </Stage>
  );

  const figure = (
    <PlayWrap gate={gate}>
      <div style={{ display: 'grid', gap: 8 }}>
        {scene}
        {trace}
      </div>
    </PlayWrap>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
          <span>ω = {isSpring ? '√(k/m)' : '√(g/L)'} = <strong>{omega.toFixed(2)} rad/s</strong></span>
          <span>period T = <strong>{T.toFixed(2)} s</strong></span>
          <span>frequency f = <strong>{f.toFixed(2)} Hz</strong></span>
        </span>
      </Callout>
      <MeterBar label={isSpring ? 'elastic PE = ½kx²' : 'gravitational PE'} frac={peFrac} color="var(--stage-accent-2)" value={`${Math.round(peFrac * 100)}%`} />
      <MeterBar label="kinetic KE = ½mv²" frac={keFrac} color="var(--stage-good)" value={`${Math.round(keFrac * 100)}%`} />
      <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>
        The trace is a <strong>sine</strong> — a wave is just this swing spread through space (v = fλ in the
        waves lab). {isSpring
          ? 'Heavier or softer spring ⇒ slower (T = 2π√(m/k)).'
          : 'Notice: change the mass or the amplitude and T doesn’t move — a pendulum’s period is T = 2π√(L/g).'}
      </p>
      <LiveRegion>{`${isSpring ? 'Spring' : 'Pendulum'} oscillator. Angular frequency ${omega.toFixed(2)}, period ${T.toFixed(2)} seconds.`}</LiveRegion>
    </div>
  );

  const controls = (
    <ControlBar>
      <Control name="mode">
        <Chip selected={isSpring} onClick={() => setMd('spring')}>spring</Chip>
        <Chip selected={!isSpring} onClick={() => setMd('pendulum')}>pendulum</Chip>
      </Control>
      {isSpring ? (
        <>
          <Field label="stiffness k" value={`${kk} N/m`}><Slider value={kk} min={2} max={30} step={1} onChange={setKk} ariaLabel="spring stiffness (N/m)" /></Field>
          <Field label="mass m" value={`${m} kg`}><Slider value={m} min={0.5} max={5} step={0.5} onChange={setM} ariaLabel="mass (kg)" /></Field>
          <Field label="amplitude" value={`${ampM.toFixed(1)} m`}><Slider value={ampM} min={0.8} max={3} step={0.2} onChange={setAmpM} ariaLabel="amplitude (m)" /></Field>
        </>
      ) : (
        <>
          <Field label="length L" value={`${L.toFixed(1)} m`}><Slider value={L} min={1} max={3.2} step={0.2} onChange={setL} ariaLabel="pendulum length (m)" /></Field>
          <Field label="mass m" value={`${m} kg`}><Slider value={m} min={0.5} max={5} step={0.5} onChange={setM} ariaLabel="bob mass (kg) — does not change the period" /></Field>
          <Field label="amplitude" value={`${ampDeg}°`}><Slider value={ampDeg} min={6} max={40} step={2} onChange={setAmpDeg} ariaLabel="amplitude (degrees)" /></Field>
        </>
      )}
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} controlConfig={controlConfig} footer={<ChallengeCard questions={SHM_CHALLENGE} state={challenge} title="Predict" />}>{figure}</LabFrame>;
}
