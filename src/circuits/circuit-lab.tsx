'use client';

/**
 * CircuitLab — two resistors driven by a battery, in series or parallel, with the
 * voltage- and current-divider rules made visible. Drag V, R₁, R₂; flip series
 * ↔ parallel; step through: total resistance → total current → how it divides.
 *
 * Series: same current, voltage splits (VDR  Vᵢ = V·Rᵢ/ΣR).
 * Parallel: same voltage, current splits (CDR  Iᵢ = I·R_other/ΣR).
 *
 * Now on the @classytic/stage engine: the schematic is SVG wires + `ResistorBox`
 * glyphs + labels (accessible, themed) instead of a canvas blit.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Segment, Label, type Vec2 } from '@classytic/stage';
import { Slider, Chip } from '../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../kit/frame.js';
import { ResistorBox } from '../kit/diagram.js';
import { Tex } from '../core/tex.js';
import { num, clamp } from '../core/util.js';

const STEPS_SERIES = [
  'Two resistors in series carry the SAME current.',
  'Add them up: the total resistance is R₁ + R₂.',
  'Total current I = V / (R₁ + R₂) flows through both.',
  'The voltage splits in proportion (VDR): Vᵢ = V · Rᵢ / (R₁ + R₂).',
];
const STEPS_PARALLEL = [
  'Two resistors in parallel share the SAME voltage.',
  'Combine reciprocals: 1/R = 1/R₁ + 1/R₂.',
  'Total current I = V / R splits between the branches.',
  'The current splits inversely (CDR): Iᵢ = I · R_other / (R₁ + R₂).',
];

export interface CircuitLabProps {
  voltage?: number | string;
  r1?: number | string;
  r2?: number | string;
  mode?: 'series' | 'parallel';
  title?: string;
  height?: number;
}

// Normalized schematic view (units, not px); preserveAspect=false fills the box.
const VIEW = { xMin: 0, xMax: 100, yMin: 0, yMax: 60 };
const TOP = 46, BOT = 12, BX = 9, RIGHT = 93;

export function CircuitLab({ voltage, r1, r2, mode: modeInit = 'series', height = 320 }: CircuitLabProps = {}): ReactNode {
  const [V, setV] = useState(clamp(num(voltage, 12), 1, 24));
  const [R1, setR1] = useState(clamp(num(r1, 100), 10, 1000));
  const [R2, setR2] = useState(clamp(num(r2, 200), 10, 1000));
  const [parallel, setParallel] = useState(modeInit === 'parallel');
  const [step, setStep] = useState(0);
  useEffect(() => { setV(clamp(num(voltage, 12), 1, 24)); }, [voltage]);
  useEffect(() => { setR1(clamp(num(r1, 100), 10, 1000)); }, [r1]);
  useEffect(() => { setR2(clamp(num(r2, 200), 10, 1000)); }, [r2]);
  useEffect(() => { setParallel(modeInit === 'parallel'); }, [modeInit]);

  const Rtot = parallel ? (R1 * R2) / (R1 + R2) : R1 + R2;
  const Itot = V / Rtot;
  const v1 = parallel ? V : (V * R1) / (R1 + R2);
  const v2 = parallel ? V : (V * R2) / (R1 + R2);
  const i1 = parallel ? V / R1 : Itot;
  const i2 = parallel ? V / R2 : Itot;

  const steps = parallel ? STEPS_PARALLEL : STEPS_SERIES;
  const clampedStep = Math.min(step, steps.length - 1);

  const W = (a: Vec2, b: Vec2, key: string): ReactNode => <Segment key={key} from={a} to={b} color="var(--stage-fg)" opacity={0.5} weight={2} />;
  const cyMid = (TOP + BOT) / 2;

  const figure = (
      <Stage view={VIEW} height={height} preserveAspect={false} ariaLabel={`${parallel ? 'Parallel' : 'Series'} circuit: ${V}V battery with R1 ${R1.toFixed(0)} and R2 ${R2.toFixed(0)} ohms`}>
        {/* battery */}
        {W({ x: BX, y: cyMid + 6 }, { x: BX, y: TOP }, 'b-up')}
        {W({ x: BX, y: cyMid - 6 }, { x: BX, y: BOT }, 'b-dn')}
        <Segment from={{ x: BX - 5, y: cyMid + 6 }} to={{ x: BX + 5, y: cyMid + 6 }} color="var(--stage-accent-2)" weight={2.5} />
        <Segment from={{ x: BX - 3, y: cyMid - 6 }} to={{ x: BX + 3, y: cyMid - 6 }} color="var(--stage-accent-2)" weight={2.5} />
        <Label x={BX + 8} y={cyMid} text={`${V.toFixed(0)} V`} color="var(--stage-accent-2)" anchor="start" size={12} />

        {!parallel ? (
          <>
            {W({ x: BX, y: TOP }, { x: 26, y: TOP }, 's1')}
            <ResistorBox center={{ x: 34, y: TOP }} w={16} h={7} color="var(--stage-accent)" label={`R₁ ${R1.toFixed(0)}Ω`} reading={step >= 3 ? `${v1.toFixed(2)} V` : undefined} />
            {W({ x: 42, y: TOP }, { x: 58, y: TOP }, 's2')}
            <ResistorBox center={{ x: 66, y: TOP }} w={16} h={7} color="var(--stage-good)" label={`R₂ ${R2.toFixed(0)}Ω`} reading={step >= 3 ? `${v2.toFixed(2)} V` : undefined} />
            {W({ x: 74, y: TOP }, { x: RIGHT, y: TOP }, 's3')}
            {W({ x: RIGHT, y: TOP }, { x: RIGHT, y: BOT }, 's4')}
            {W({ x: RIGHT, y: BOT }, { x: BX, y: BOT }, 's5')}
          </>
        ) : (
          <>
            {/* left + right rails */}
            {W({ x: BX, y: TOP }, { x: 30, y: TOP }, 'p1')}
            {W({ x: 30, y: TOP }, { x: 30, y: BOT }, 'pl')}
            {W({ x: BX, y: BOT }, { x: 30, y: BOT }, 'p2')}
            {W({ x: 72, y: TOP }, { x: RIGHT, y: TOP }, 'p3')}
            {W({ x: RIGHT, y: TOP }, { x: RIGHT, y: BOT }, 'pr-out')}
            {W({ x: 72, y: BOT }, { x: RIGHT, y: BOT }, 'p4')}
            {W({ x: 72, y: TOP }, { x: 72, y: BOT }, 'pr')}
            {/* branch 1 (upper) */}
            {W({ x: 30, y: TOP }, { x: 43, y: TOP }, 'b1a')}
            <ResistorBox center={{ x: 51, y: TOP }} w={16} h={7} color="var(--stage-accent)" label={`R₁ ${R1.toFixed(0)}Ω`} reading={step >= 3 ? `${(i1 * 1000).toFixed(1)} mA` : undefined} />
            {W({ x: 59, y: TOP }, { x: 72, y: TOP }, 'b1b')}
            {/* branch 2 (lower) */}
            {W({ x: 30, y: BOT }, { x: 43, y: BOT }, 'b2a')}
            <ResistorBox center={{ x: 51, y: BOT }} w={16} h={7} color="var(--stage-good)" label={`R₂ ${R2.toFixed(0)}Ω`} reading={step >= 3 ? `${(i2 * 1000).toFixed(1)} mA` : undefined} />
            {W({ x: 59, y: BOT }, { x: 72, y: BOT }, 'b2b')}
          </>
        )}
      </Stage>
  );

  const controls = (
    <>
      <ControlBar>
        <button type="button" className="lab-chip" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={clampedStep === 0}>← Back</button>
        <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.75 }}>step {clampedStep + 1} / {steps.length}</span>
        <button type="button" className="lab-chip" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={clampedStep >= steps.length - 1}>Next →</button>
        <Chip selected={parallel} onClick={() => { setParallel((p) => !p); setStep(0); }}>{parallel ? 'parallel' : 'series'}</Chip>
      </ControlBar>
      <ControlBar>
        <Field label="V"><Slider value={V} min={1} max={24} step={1} onChange={setV} ariaLabel="battery voltage" style={{ width: 90 }} /></Field>
        <Field label="R₁"><Slider value={R1} min={10} max={1000} step={10} onChange={setR1} ariaLabel="resistor 1" style={{ width: 90 }} /></Field>
        <Field label="R₂"><Slider value={R2} min={10} max={1000} step={10} onChange={setR2} ariaLabel="resistor 2" style={{ width: 90 }} /></Field>
      </ControlBar>
    </>
  );

  const aside = (
    <>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
          <span>R {Rtot.toFixed(0)} Ω</span>
          <span>I {(Itot * 1000).toFixed(1)} mA</span>
        </span>
      </Callout>
      <div style={{ display: 'grid', gap: 6, padding: '8px 2px 0', fontSize: 14 }}>
        {parallel ? (
          <>
            <Tex tex={`\\frac{1}{R}=\\frac{1}{R_1}+\\frac{1}{R_2}\\Rightarrow R=${Rtot.toFixed(1)}\\,\\Omega`} />
            <Tex tex={`I_1=I\\cdot\\frac{R_2}{R_1+R_2}=${(i1 * 1000).toFixed(1)}\\,\\text{mA}`} />
          </>
        ) : (
          <>
            <Tex tex={`R=R_1+R_2=${Rtot.toFixed(0)}\\,\\Omega,\\quad I=\\frac{V}{R}=${(Itot * 1000).toFixed(1)}\\,\\text{mA}`} />
            <Tex tex={`V_1=V\\cdot\\frac{R_1}{R_1+R_2}=${v1.toFixed(2)}\\,\\text{V}`} />
          </>
        )}
      </div>
    </>
  );

  return (
    <LabFrame
      title={parallel ? 'Parallel — current divides' : 'Series — voltage divides'}
      prompt={steps[clampedStep]}
      aside={aside}
      controls={controls}
    >
      {figure}
    </LabFrame>
  );
}
