'use client';

/**
 * AtwoodLab — "Which way, and how fast?", two masses over a pulley.
 *
 * The classic Atwood machine: link two masses over a frictionless pulley and the
 * WHOLE system shares one acceleration. Gravity pulls each side (m·g), but only
 * the DIFFERENCE drives the motion while the TOTAL mass resists it:
 *
 *     a = (m₁ − m₂)·g / (m₁ + m₂)        tension  T = 2·m₁·m₂·g / (m₁ + m₂)
 *
 * Equal masses → balance (a = 0). A tiny difference on big masses → a gentle a,
 * which is exactly how Atwood measured g. Predict which side drops, then release.
 *
 * Tokenized SVG; time-dependent integrator here; honours reduced-motion.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Circle, Label, useInView } from '@classytic/stage';
import { Slider, CheckButton, Chip, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, LiveRegion, type ControlConfig } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { useReducedMotion, useFrameTick } from '../../kit/anim.js';
import { clamp } from '../../core/util.js';

export interface AtwoodProps {
  m1?: number;
  m2?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  /** Lock/hide knobs, e.g. `{ lock: ['m₁ (left)'] }`. */
  controlConfig?: ControlConfig;
}

const G = 9.8;
const Y0 = 0.6;        // initial top-of-mass height
const TRAVEL = 2.6;    // max travel before a mass hits floor/pulley

export function AtwoodLab({
  m1 = 3, m2 = 2,
  title = 'Atwood machine — which way, and how fast?',
  prompt = 'Two masses share one rope over a pulley. Only the difference in weight drives them, while the total mass resists: a = (m₁ − m₂)g / (m₁ + m₂). Predict which side falls, then release.',
  objectives,
  controlConfig,
}: AtwoodProps): ReactNode {
  const [ma, setMa] = useState(m1);
  const [mb, setMb] = useState(m2);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const tRef = useRef(0);
  const reduce = useReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  useCheckpoint({ solved: finished, activity: 'atwood' });

  const a = ((ma - mb) * G) / (ma + mb);          // +a → left (m₁) accelerates DOWN
  const tension = (2 * ma * mb * G) / (ma + mb);
  const balanced = Math.abs(ma - mb) < 1e-9;

  const repaint = useFrameTick(running && inView && !balanced, (f) => {
    tRef.current += Math.min(0.05, f.dtMs / 1000);
    const s = 0.5 * Math.abs(a) * tRef.current * tRef.current;
    if (s >= TRAVEL) { setRunning(false); setFinished(true); }
  });

  const release = (): void => {
    tRef.current = 0; setFinished(false);
    if (reduce) { tRef.current = Math.sqrt((2 * TRAVEL) / Math.max(0.01, Math.abs(a))); setFinished(true); repaint(); return; }
    setRunning(true);
  };
  const onParam = (set: (n: number) => void) => (n: number): void => { set(n); setRunning(false); setFinished(false); tRef.current = 0; };

  const t = tRef.current;
  const s = clamp(0.5 * Math.abs(a) * t * t, 0, TRAVEL);
  const v = Math.abs(a) * t;
  const dirL = a > 0 ? -1 : 1;                      // left mass direction (down if a>0)
  const yL = Y0 + dirL * s;
  const yR = Y0 - dirL * s;

  const PY = 3.4, PR = 0.95;                        // pulley
  const LX = -PR, RX = PR;                          // rope tangent x-offsets at the pulley
  const box = (cx: number, top: number, mass: number, tint: string): ReactNode => {
    const w = 0.32 + mass * 0.05, h = 0.5 + mass * 0.08;
    return (
      <>
        <Segment from={{ x: cx, y: PY }} to={{ x: cx, y: top }} color="var(--stage-fg)" opacity={0.5} weight={1.5} />
        <Polygon points={[{ x: cx - w, y: top - h }, { x: cx + w, y: top - h }, { x: cx + w, y: top }, { x: cx - w, y: top }]} color={`color-mix(in oklab, ${tint} 60%, black)`} fill={tint} fillOpacity={0.85} weight={1.5} />
        <Label x={cx} y={top - h / 2} text={`${mass}kg`} color="var(--stage-bg)" size={12} />
      </>
    );
  };

  const view = { xMin: -3.4, xMax: 3.4, yMin: -3, yMax: 4.6 };

  const figure = (
    <div ref={viewRef} className="lab-playwrap">
      <Stage view={view} height={300} preserveAspect ariaLabel={`Atwood machine, ${ma} kg versus ${mb} kg, acceleration ${Math.abs(a).toFixed(2)} m/s²`}>
        {/* ceiling + pulley */}
        <Segment from={{ x: -2, y: 4.1 }} to={{ x: 2, y: 4.1 }} color="var(--stage-fg)" opacity={0.6} weight={3} />
        <Segment from={{ x: 0, y: 4.1 }} to={{ x: 0, y: PY + PR }} color="var(--stage-fg)" opacity={0.5} weight={2} />
        <Circle center={{ x: 0, y: PY }} r={PR} color="var(--stage-fg)" fill="var(--stage-muted)" fillOpacity={0.4} weight={2} />
        <Circle center={{ x: 0, y: PY }} r={0.12} color="var(--stage-fg)" fill="var(--stage-fg)" fillOpacity={0.7} weight={0} />
        {/* rope over the top of the pulley */}
        <Segment from={{ x: LX, y: PY }} to={{ x: RX, y: PY }} color="var(--stage-fg)" opacity={0.5} weight={1.5} />
        {box(LX, yL, ma, 'var(--stage-accent)')}
        {box(RX, yR, mb, 'var(--stage-accent-2)')}
        {/* floor */}
        <Segment from={{ x: -3.4, y: -2.6 }} to={{ x: 3.4, y: -2.6 }} color="var(--stage-fg)" opacity={0.35} weight={1.2} />
      </Stage>
    </div>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
          <span>acceleration a = <strong>{Math.abs(a).toFixed(2)} m/s²</strong></span>
          <span>tension T = <strong>{tension.toFixed(1)} N</strong></span>
          <span>speed now = <strong>{v.toFixed(1)} m/s</strong></span>
        </span>
      </Callout>
      <StatusPill ok={!balanced}>{balanced ? 'balanced — no motion' : `${ma > mb ? 'left' : 'right'} side falls`}</StatusPill>
      <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>
        Only the <strong>difference</strong> (m₁−m₂)g drives it; the <strong>total</strong> (m₁+m₂) resists.
        Big equal masses with a tiny difference give a slow, measurable a — how Atwood weighed gravity.
      </p>
      <LiveRegion>{balanced ? 'Balanced, no motion.' : `${ma > mb ? 'Left' : 'Right'} side falls at ${Math.abs(a).toFixed(2)} metres per second squared.`}</LiveRegion>
    </div>
  );

  const controls = (
    <ControlBar>
      <CheckButton onClick={release}>▶ Release</CheckButton>
      <Chip selected={false} onClick={() => { setRunning(false); setFinished(false); tRef.current = 0; repaint(); }}>Reset</Chip>
      <Field label="m₁ (left)" value={`${ma} kg`}><Slider value={ma} min={1} max={8} step={0.5} onChange={onParam(setMa)} ariaLabel="left mass (kg)" /></Field>
      <Field label="m₂ (right)" value={`${mb} kg`}><Slider value={mb} min={1} max={8} step={0.5} onChange={onParam(setMb)} ariaLabel="right mass (kg)" /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} controlConfig={controlConfig}>{figure}</LabFrame>;
}
