'use client';

/**
 * DilutionLab — C₁V₁ = C₂V₂ is just: the dots don't leave.
 *
 * Take an aliquot of stock (V₁) and dilute it to a final volume (V₂). Two beakers
 * show the SAME solute dots — concentrated in the small aliquot on the left,
 * spread through the larger volume on the right — so the conserved quantity
 * (moles = C·V) is SEEN, not memorized: same dots, bigger box, paler colour, lower
 * C. Composes the shared SolutionField (single source of truth for the dots).
 *
 * Rearranging C₁V₁=C₂V₂ for an unknown / serial dilutions → a paired MathDerivation.
 */

import { useState, type ReactNode } from 'react';
import { LabFrame, ControlBar, Field, Callout, LiveRegion } from '../../kit/frame.js';
import { Slider } from '../../kit/controls.js';
import { clamp } from '../../core/util.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { SolutionField } from './field.js';
import { Tex } from '../../core/tex.js';

export interface DilutionProps {
  stockConcentration?: number;
  aliquotVolume?: number;
  finalVolume?: number;
  maxMolarity?: number;
  hue?: number;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}

const DOTS_PER_MOL = 200;

/** Predict the conserved quantity: moles (dots) don't change on dilution, so adding water lowers C. */
const DILUTION_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'conserved',
    prompt: 'You dilute the aliquot to a larger final volume. What stays the SAME?',
    choices: [
      { value: 'moles', label: 'the moles of solute (the dots)' },
      { value: 'conc', label: 'the concentration' },
      { value: 'volume', label: 'the volume' },
    ],
    answer: 'moles',
    explain: 'Adding water never removes solute — n = C·V is conserved, which is exactly C₁V₁ = C₂V₂.',
  },
  {
    id: 'doubleV',
    prompt: 'Keep the same aliquot but DOUBLE the final volume V₂. The final concentration C₂…',
    choices: [
      { value: 'halves', label: 'halves' },
      { value: 'doubles', label: 'doubles' },
      { value: 'same', label: 'is unchanged' },
    ],
    answer: 'halves',
    explain: 'C₂ = n/V₂ with n fixed — twice the volume means half the concentration.',
  },
];

export function DilutionLab({
  stockConcentration = 2, aliquotVolume = 0.25, finalVolume = 1, maxMolarity = 4, hue = 200,
  title = 'Dilution — the dots don’t leave',
  prompt = 'Take an aliquot of stock, add water to the final volume. Same dots, bigger box → lower concentration.',
  height = 180, objectives,
}: DilutionProps): ReactNode {
  const c1 = clamp(stockConcentration, 0.5, maxMolarity);
  const [v1, setV1] = useState(clamp(aliquotVolume, 0.1, 0.5));
  const [v2, setV2] = useState(clamp(finalVolume, 0.5, 1.5));
  const n = c1 * v1;             // moles taken — conserved
  const c2 = n / v2;
  const dots = Math.round(n * DOTS_PER_MOL);
  const challenge = useChallenge(DILUTION_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'dilution' });

  const figure = (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
        <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
          <SolutionField dots={dots} fill={v1 / 0.5} tint={c1 / maxMolarity} hue={hue} height={height} ariaLabel={`aliquot: ${n.toFixed(2)} moles, ${c1.toFixed(1)} molar`} />
          <p style={{ textAlign: 'center', margin: '4px 0 6px', fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>aliquot · C₁={c1.toFixed(1)} · V₁={v1.toFixed(2)} L</p>
        </div>
        <span style={{ fontSize: 22, color: 'var(--stage-muted)' }}>→</span>
        <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
          <SolutionField dots={dots} fill={v2 / 1.5} tint={c2 / maxMolarity} hue={hue} height={height} ariaLabel={`diluted: ${n.toFixed(2)} moles, ${c2.toFixed(2)} molar`} />
          <p style={{ textAlign: 'center', margin: '4px 0 6px', fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>diluted · C₂={c2.toFixed(2)} · V₂={v2.toFixed(2)} L</p>
        </div>
      </div>
      <LiveRegion>
        {`${c1.toFixed(1)} molar times ${v1.toFixed(2)} litres gives ${n.toFixed(2)} moles, diluted to ${v2.toFixed(2)} litres is ${c2.toFixed(2)} molar.`}
      </LiveRegion>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="aliquot V₁ (L)" value={v1.toFixed(2)}>
        <Slider value={v1} min={0.1} max={0.5} step={0.05} onChange={setV1} ariaLabel="aliquot volume taken from stock" />
      </Field>
      <Field label="final V₂ (L)" value={v2.toFixed(2)}>
        <Slider value={v2} min={0.5} max={1.5} step={0.05} onChange={setV2} ariaLabel="final volume after adding water" />
      </Field>
    </ControlBar>
  );

  const footer = (
    <>
      <Callout tone="result">
        <b style={{ fontVariantNumeric: 'tabular-nums' }}><Tex tex={`C_1 V_1 = C_2 V_2 = ${n.toFixed(2)}\\ \\text{mol}`} /></b> &nbsp;(the dots don’t leave)
      </Callout>
      <ChallengeCard questions={DILUTION_CHALLENGE} state={challenge} title="Predict" />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
