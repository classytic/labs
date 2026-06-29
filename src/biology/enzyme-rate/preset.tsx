'use client';

/**
 * EnzymeRateLab, the optimum, then the cliff: enzymes denature.
 *
 * Drag temperature: the rate climbs to an optimum (more kinetic energy → more
 * successful enzyme–substrate collisions) then CRASHES as the lock-and-key active
 * site is mangled, and crucially, cooling back down does NOT restore it
 * (thermal denaturation is irreversible). The bell is BUILT from plotted dots as
 * you sweep, never pre-drawn. pH mode shows the same optimum but reversibly; a
 * "fresh enzyme" reset is the only way back from a denatured run.
 *
 * Reuses core/util + kit/controls; tokenized; reduced-motion safe (no autoplay , 
 * the learner drags). The collision-theory vs denaturation split → a MathDerivation.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Axes, Segment, Dot, Label, Polygon } from '@classytic/stage';
import { Slider, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';

export interface EnzymeRateProps {
  factor?: 'temperature' | 'pH';
  optimum?: number;
  factorMin?: number;
  factorMax?: number;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}

const CLIFF = 16; // °C (or pH units) past the optimum over which denaturation completes

/** A lock-and-key enzyme glyph; `denat` 0 (intact) → 1 (mangled active site). */
function Enzyme({ denat }: { denat: number }): ReactNode {
  const d = clamp(denat, 0, 1);
  const body = d > 0.05 ? 'var(--stage-danger)' : 'var(--stage-accent)';
  const edge = `color-mix(in oklab, ${body} 60%, black)`;
  // active-site notch: a clean V when intact; splayed/jagged as it denatures
  const splay = d * 14;
  const notch = `M ${40 - splay} 26 L 52 ${48 + d * 8} L 64 ${30 - splay * 0.5} L 76 ${48 + d * 6} L ${88 + splay} 26`;
  const keySeated = d < 0.25;
  return (
    <svg width={150} height={120} viewBox="0 0 130 120" aria-hidden>
      {/* enzyme body */}
      <path d="M 18 30 Q 14 70 30 96 Q 64 110 98 96 Q 114 70 110 30 Z" fill={`color-mix(in oklab, ${body} 22%, var(--stage-bg))`} stroke={edge} strokeWidth={2} />
      {/* active-site notch (warps with denat) */}
      <path d={notch} fill="var(--stage-bg)" stroke={edge} strokeWidth={2.5} strokeLinejoin="round" />
      {/* substrate "key": seats cleanly when intact, sits askew + red when denatured */}
      <g transform={keySeated ? 'translate(52 8)' : `translate(58 -8) rotate(${18 + d * 14} 12 14)`}>
        <path d="M 0 18 L 12 0 L 24 18 Z" fill={keySeated ? 'var(--stage-good)' : 'var(--stage-warn)'} stroke="color-mix(in oklab, var(--stage-fg) 40%, transparent)" strokeWidth={1} />
      </g>
      <text x={64} y={114} fill="var(--stage-muted)" fontSize={10} fontWeight={700} textAnchor="middle">{d > 0.4 ? 'DENATURED' : keySeated ? 'substrate fits' : 'binding…'}</text>
    </svg>
  );
}

export function EnzymeRateLab({
  factor = 'temperature', optimum = 40, factorMin = 0, factorMax = 80,
  title = 'The optimum, then the cliff: enzymes denature',
  prompt = 'Drag the temperature. Past the optimum the enzyme denatures, and cooling back down won’t fix it.',
  height = 240, objectives,
}: EnzymeRateProps): ReactNode {
  const reversible = factor === 'pH';
  const [f, setF] = useState(reversible ? optimum - 2 : factorMin + 5);
  const peak = useRef(f);            // max factor reached (drives irreversible denaturation)
  const pts = useRef<Map<number, number>>(new Map());
  const [, setTick] = useState(0);
  const atOptimum = Math.abs(f - optimum) < 1.5;
  useCheckpoint({ solved: atOptimum, activity: 'enzyme-rate' });

  // denaturation: irreversible (from the peak reached) for temperature; reversible
  // (from the current value) for pH.
  const denatFrom = (x: number): number => clamp((x - optimum) / CLIFF, 0, 1);
  const denat = reversible ? denatFrom(f) : denatFrom(peak.current);
  // kinetic climb up to the optimum × intact capacity
  const kinetic = clamp(f / optimum, 0, 1);
  const rate = clamp(kinetic * (1 - denat), 0, 1);

  // record the visited point (builds the curve as you sweep)
  pts.current.set(Math.round(f), rate);

  const onF = (v: number): void => {
    setF(v);
    if (!reversible && v > peak.current) peak.current = v;
    setTick((t) => (t + 1) & 0xffff);
  };
  const reset = (): void => { pts.current = new Map(); peak.current = factorMin + 5; setF(factorMin + 5); setTick((t) => (t + 1) & 0xffff); };

  const view = { xMin: factorMin - (factorMax - factorMin) * 0.06, xMax: factorMax + 1, yMin: -0.12, yMax: 1.12 };
  const unit = reversible ? '' : ' °C';
  const points = [...pts.current.entries()].sort((a, b) => a[0] - b[0]);
  const state = denat > 0.5 ? 'denatured' : Math.abs(f - optimum) < 2 ? 'optimum' : f < optimum ? 'climbing' : 'falling';

  const figure = (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 12 }}>
      <Enzyme denat={denat} />
      <div style={{ flex: 1, minWidth: 240 }}>
        <Stage view={view} height={height} preserveAspect={false} ariaLabel={`Enzyme rate vs ${factor}; ${state}`}>
          <Axes ticks={false} />
          <Label x={(factorMin + factorMax) / 2} y={-0.08} text={reversible ? 'pH →' : 'temperature →'} color="var(--stage-muted)" size={11} />
          <Label x={factorMin} y={0.55} text="rate" color="var(--stage-muted)" size={11} dx={-6} />
          {/* denatured zone (temperature, irreversible) */}
          {!reversible && <Polygon points={[{ x: optimum + CLIFF, y: 0 }, { x: factorMax, y: 0 }, { x: factorMax, y: 1.1 }, { x: optimum + CLIFF, y: 1.1 }]} color="var(--stage-danger)" fill="var(--stage-danger)" fillOpacity={0.08} weight={0} />}
          {/* optimum marker */}
          <Segment from={{ x: optimum, y: 0 }} to={{ x: optimum, y: 1.1 }} color="var(--stage-good)" weight={1} dashed opacity={0.5} />
          <Label x={optimum} y={1.1} text="optimum" color="var(--stage-good)" size={10} dy={-4} />
          {/* plotted points (built as you sweep) */}
          {points.map(([x, y]) => <Dot key={x} x={x} y={y} r={3} color="var(--stage-accent)" opacity={0.85} />)}
          {/* current point */}
          <Dot x={f} y={rate} r={6} color={denat > 0.5 ? 'var(--stage-danger)' : 'var(--stage-good)'} />
        </Stage>
      </div>
    </div>
  );

  const aside = (
    <Callout tone={state === 'optimum' ? 'result' : 'info'}>
      <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{reversible ? 'pH' : 'temperature'} {f.toFixed(0)}{unit} · rate {(rate * 100).toFixed(0)}</div>
      <StatusPill ok={state === 'optimum'}>{state === 'optimum' ? 'at the optimum ✓' : state === 'denatured' ? 'denatured, no recovery' : state === 'falling' ? (reversible ? 'past optimum' : 'denaturing…') : 'climbing (more collisions)'}</StatusPill>
    </Callout>
  );

  const controls = (
    <ControlBar>
      <Field label={reversible ? 'pH' : 'temperature'} value={`${f.toFixed(0)}${unit}`}>
        <Slider value={f} min={factorMin} max={factorMax} step={1} onChange={onF} ariaLabel={reversible ? 'pH' : 'temperature'} />
      </Field>
      <button type="button" className="lab-chip" onClick={reset}>↺ fresh enzyme</button>
    </ControlBar>
  );

  const footer = (
    <LiveRegion>
      {`${reversible ? 'pH' : 'Temperature'} ${f.toFixed(0)}, rate ${(rate * 100).toFixed(0)}. ${state}.`}
    </LiveRegion>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
