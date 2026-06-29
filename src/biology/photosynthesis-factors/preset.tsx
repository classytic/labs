'use client';

/**
 * PhotosynthesisFactorsLab, limiting factors: the slowest worker sets the pace.
 *
 * Sliders for light, CO₂ and temperature. The rate climbs with light then
 * PLATEAUS at whichever factor is in shortest supply, raise CO₂ and the SAME
 * light curve climbs to a higher plateau, proving light was no longer limiting.
 * Temperature is different: it gives a PEAK (optimum) not a plateau, because past
 * the optimum enzymes denature. "Freeze curve" overlays a faint copy so two CO₂
 * settings compare side by side.
 *
 * Reuses Stage/Polyline + core/util + kit/controls; tokenized; reduced-motion safe.
 * The mirror photosynthesis ⇌ respiration equation belongs in a paired MathDerivation.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Axes, Polyline, Segment, Dot, Label } from '@classytic/stage';
import { Slider, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint, useChallenge, ChallengeCard, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { ReactionFlow } from '../../kit/reaction.js';
import { clamp } from '../../core/util.js';

export interface PhotosynthesisFactorsProps {
  light?: number;
  co2?: number;
  temperature?: number;
  tempOptimum?: number;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}

const CLIFF = 14; // °C past optimum over which the rate falls (denaturation/stomata)

const FACTORS_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'plateau',
    prompt: 'Raising light further does nothing, the rate-vs-light curve has flattened. What sets the height of that plateau?',
    choices: [
      { value: 'factor', label: 'another factor (CO₂ or temperature)' },
      { value: 'colour', label: 'the colour of the light' },
      { value: 'random', label: 'nothing: it’s random' },
    ],
    answer: 'factor',
    explain: 'Where the curve flattens, some OTHER factor (CO₂ supply or temperature) is now the bottleneck, the slowest worker sets the pace.',
  },
  {
    id: 'cliff',
    prompt: 'Push temperature well ABOVE the optimum and the rate CRASHES, not just plateaus. Why?',
    choices: [
      { value: 'denature', label: 'enzymes denature' },
      { value: 'co2', label: 'more CO₂ dissolves' },
      { value: 'light', label: 'the light weakens' },
    ],
    answer: 'denature',
    explain: 'Past the optimum the enzymes lose their shape (denature), that destroys capacity, unlike a mere limiting factor.',
  },
];

export function PhotosynthesisFactorsLab({
  light = 70, co2 = 50, temperature = 25, tempOptimum = 28,
  title = 'Limiting factors: the slowest worker sets the pace',
  prompt = 'Raise light: the rate plateaus where another factor (CO₂ or temperature) takes over.',
  height = 240, objectives,
}: PhotosynthesisFactorsProps): ReactNode {
  const [l, setL] = useState(light);
  const [c, setC] = useState(co2);
  const [t, setT] = useState(temperature);
  const [frozen, setFrozen] = useState<{ co2: number; temp: number; pts: { x: number; y: number }[] }[]>([]);
  const challenge = useChallenge(FACTORS_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'photosynthesis-factors' });

  const tempFactor = (temp: number): number => temp <= tempOptimum ? clamp(temp / tempOptimum, 0, 1) : clamp(1 - (temp - tempOptimum) / CLIFF, 0, 1);
  const rateAt = (lightV: number, co2V: number, tempV: number): number => Math.min(lightV / 100, co2V / 100) * tempFactor(tempV);
  const rate = rateAt(l, c, t);

  const tooHot = t > tempOptimum && tempFactor(t) < 0.95;
  const limiting = tooHot ? 'temperature (too hot)' : l / 100 <= c / 100 + 1e-9 ? 'light' : 'CO₂';

  // rate-vs-light curve at the current CO₂ + temperature
  const curve = (co2V: number, tempV: number): { x: number; y: number }[] => {
    const out: { x: number; y: number }[] = [];
    for (let x = 0; x <= 100; x += 4) out.push({ x, y: rateAt(x, co2V, tempV) });
    return out;
  };
  const pts = curve(c, t);
  const view = { xMin: -6, xMax: 104, yMin: -0.1, yMax: 1.1 };

  const freeze = (): void => { setFrozen((f) => [...f.slice(-2), { co2: c, temp: t, pts }]); };
  const bubbles = Math.round(rate * 7);

  const figure = (
    <>
      {/* photosynthesis equation, shared MoleculeGlyph + ReactionFlow engine */}
      <ReactionFlow
        reactants={[{ kind: 'co2', coef: 6 }, { kind: 'h2o', coef: 6 }, { kind: 'light' }]}
        products={[{ kind: 'glucose' }, { kind: 'o2', coef: 6 }]}
        height={76} molSize={26}
        ariaLabel="6 CO2 + 6 H2O + light gives glucose + 6 O2"
      />
      <p style={{ textAlign: 'center', margin: '0 0 8px', color: 'var(--stage-good)', fontSize: 12 }}>{'•'.repeat(bubbles)}<span style={{ color: 'var(--stage-muted)' }}> O₂ rate</span></p>

      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <Stage view={view} height={height} preserveAspect={false} ariaLabel={`Photosynthesis rate vs light; limiting factor ${limiting}`}>
          <Axes ticks={false} />
          <Label x={50} y={-0.06} text="light intensity →" color="var(--stage-muted)" size={11} />
          <Label x={0} y={0.55} text="rate" color="var(--stage-muted)" size={11} dx={-6} />
          {frozen.map((fr, i) => <Polyline key={i} points={fr.pts} color="var(--stage-muted)" weight={1.5} opacity={0.45} dashed />)}
          <Polyline points={pts} color="var(--stage-good)" weight={2.5} />
          <Dot x={l} y={rate} r={6} color={tooHot ? 'var(--stage-danger)' : 'var(--stage-good)'} />
          <Segment from={{ x: l, y: 0 }} to={{ x: l, y: rate }} color="var(--stage-fg)" weight={1} dashed opacity={0.35} />
        </Stage>
      </div>
    </>
  );

  const aside = (
    <Callout>
      <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>rate {(rate * 100).toFixed(0)}</div>
      <StatusPill ok={false}>limiting: {limiting}</StatusPill>
    </Callout>
  );

  const controls = (
    <ControlBar>
      <Field label="light" value={l}><Slider value={l} min={0} max={100} step={2} onChange={setL} ariaLabel="light intensity" /></Field>
      <Field label="CO₂" value={c}><Slider value={c} min={0} max={100} step={2} onChange={setC} ariaLabel="carbon dioxide concentration" /></Field>
      <Field label="temp" value={`${t}°C`}><Slider value={t} min={0} max={50} step={1} onChange={setT} ariaLabel="temperature" /></Field>
      <button type="button" className="lab-chip" onClick={freeze}>📌 freeze this curve</button>
    </ControlBar>
  );

  const footer = (
    <>
      <ChallengeCard questions={FACTORS_CHALLENGE} state={challenge} title="Explain the curve" />
      <LiveRegion>
        {`Light ${l}, CO₂ ${c}, temperature ${t}. Rate ${(rate * 100).toFixed(0)}. Limiting factor: ${limiting}.`}
      </LiveRegion>
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
