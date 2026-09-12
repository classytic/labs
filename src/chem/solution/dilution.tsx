'use client';

/**
 * DilutionLab, C₁V₁ = C₂V₂ is just: the dots don't leave.
 *
 * Take an aliquot of stock (V₁) and dilute it to a final volume (V₂). Two beakers
 * (a 0.5 L aliquot vessel and a 1.5 L final vessel, drawn in that width ratio)
 * show the SAME solute particles, concentrated in the small aliquot on the left,
 * spread through the larger volume on the right, so the conserved quantity
 * (moles = C·V) is SEEN, not memorized: same particles, more liquid, paler colour,
 * lower C. Composes the shared SolutionField (single source of truth for the dots).
 *
 * Rearranging C₁V₁=C₂V₂ for an unknown / serial dilutions → a paired MathDerivation.
 */

import { useState, type ReactNode } from 'react';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { Slider } from '../../kit/controls.js';
import { clamp } from '../../core/util.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { SolutionField } from './field.js';
import { Tex } from '../../core/tex.js';

export interface DilutionProps {
  stockConcentration?: number;
  aliquotVolume?: number;
  finalVolume?: number;
  maxMolarity?: number;
  /** Legacy species hue; colour now comes from the figure palette (accepted, unused). */
  hue?: number;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
  activity?: AuthoredActivity;
}

const DOTS_PER_MOL = 200;

/** Predict the conserved quantity: moles (dots) don't change on dilution, so adding water lowers C. */
const DILUTION_CHALLENGE: AuthoredChoiceQuestion[] = [
  {
    id: 'conserved',
    prompt: 'You dilute the aliquot to a larger final volume. What is left unchanged?',
    choices: [
      { value: 'moles', label: 'the moles of solute (the dots)' },
      { value: 'conc', label: 'the concentration' },
      { value: 'volume', label: 'the volume' },
    ],
    answer: 'moles',
    explain: 'Adding water never removes solute, n = C·V is conserved, which is exactly C₁V₁ = C₂V₂.',
  },
  {
    id: 'doubleV',
    prompt: 'Keep the same aliquot but double the final volume V₂. The final concentration C₂…',
    choices: [
      { value: 'halves', label: 'halves' },
      { value: 'doubles', label: 'doubles' },
      { value: 'same', label: 'is unchanged' },
    ],
    answer: 'halves',
    explain: 'C₂ = n/V₂ with n fixed, twice the volume means half the concentration.',
  },
];

const DILUTION_ACTIVITY: AuthoredActivity = {
  pattern: 'forecast',
  title: 'Dilution: the dots don’t leave',
  objectives: [
    'Identify moles of solute as conserved during dilution',
    'Connect particle spreading to reduced concentration',
    'Use C₁V₁ = C₂V₂ to compare dilutions',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict what is conserved',
      lead: 'Choose what stays fixed when only water is added.',
      success: 'conservation-prediction',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Follow the solute',
      lead: 'Compare the same solute particles before and after dilution.',
      reveal: ['model'],
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Change the dilution',
      lead: 'Change aliquot and final volumes and inspect C₁V₁ and C₂V₂.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain doubled volume',
      lead: 'Explain the concentration change when final volume doubles.',
      success: 'volume-explanation',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Design another dilution',
      lead: 'Build a new dilution while tracking conserved moles.',
      controls: true,
      reveal: ['model'],
    },
  ],
  questions: DILUTION_CHALLENGE,
  success: [
    {
      id: 'conservation-prediction',
      source: 'answer',
      key: 'conserved',
      pendingLabel: 'Identify the conserved quantity.',
    },
    {
      id: 'volume-explanation',
      source: 'answer',
      key: 'doubleV',
      pendingLabel: 'Explain doubled final volume.',
    },
  ],
};

export function DilutionLab({
  stockConcentration = 2,
  aliquotVolume = 0.25,
  finalVolume = 1,
  maxMolarity = 4,
  hue = 200,
  title = 'Dilution: the dots don’t leave',
  prompt = 'Take an aliquot of stock, add water to the final volume. Same particles, more liquid, lower concentration.',
  height = 180,
  objectives = DILUTION_ACTIVITY.objectives,
  activity,
}: DilutionProps): ReactNode {
  const c1 = clamp(stockConcentration, 0.5, maxMolarity);
  const [v1, setV1] = useState(clamp(aliquotVolume, 0.1, 0.5));
  const [v2, setV2] = useState(clamp(finalVolume, 0.5, 1.5));
  const n = c1 * v1; // moles taken, conserved
  const c2 = n / v2;
  const dots = Math.round(n * DOTS_PER_MOL);

  const figure = (
    <>
      <div className="chem-dilution-scene">
        <div className="chem-solution-vessel">
          {/* the aliquot vessel holds 0.5 L, the final vessel 1.5 L: widths in that ratio (same height) */}
          <SolutionField
            dots={dots}
            fill={v1 / 0.5}
            tint={c1 / maxMolarity}
            hue={hue}
            height={height}
            width={320}
            vessel={0.34}
            ariaLabel={`aliquot: ${n.toFixed(2)} moles, ${c1.toFixed(1)} molar`}
          />
          <p>
            aliquot · C₁ = {c1.toFixed(1)} M · V₁ = {v1.toFixed(2)} L
          </p>
        </div>
        <span className="chem-process-arrow" aria-hidden>
          →
        </span>
        <div className="chem-solution-vessel">
          <SolutionField
            dots={dots}
            fill={v2 / 1.5}
            tint={c2 / maxMolarity}
            hue={hue}
            height={height}
            width={320}
            vessel={0.9}
            ariaLabel={`diluted: ${n.toFixed(2)} moles, ${c2.toFixed(2)} molar`}
          />
          <p>
            diluted · C₂ = {c2.toFixed(2)} M · V₂ = {v2.toFixed(2)} L
          </p>
        </div>
      </div>
      <LiveRegion>
        {`${c1.toFixed(1)} molar times ${v1.toFixed(2)} litres gives ${n.toFixed(2)} moles, diluted to ${v2.toFixed(2)} litres is ${c2.toFixed(2)} molar.`}
      </LiveRegion>
    </>
  );

  const controls = (
    <>
      <Field label="aliquot V₁ (L)" value={v1.toFixed(2)}>
        <Slider
          value={v1}
          min={0.1}
          max={0.5}
          step={0.05}
          onChange={setV1}
          ariaLabel="aliquot volume taken from stock"
        />
      </Field>
      <Field label="final V₂ (L)" value={v2.toFixed(2)}>
        <Slider
          value={v2}
          min={0.5}
          max={1.5}
          step={0.05}
          onChange={setV2}
          ariaLabel="final volume after adding water"
        />
      </Field>
    </>
  );

  const runtimeActivity: AuthoredActivity = activity ?? { ...DILUTION_ACTIVITY, title, objectives };
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtimeActivity}
      activityId="dilution"
      eyebrow="Solutions and concentration"
      title={title}
      description={prompt}
      status={
        <>
          <span>C₁ {c1.toFixed(2)} M</span>
          <span>C₂ {c2.toFixed(2)} M</span>
        </>
      }
      evidence={
        <Readout
          value={<Tex tex={`C_1V_1=C_2V_2=${n.toFixed(2)}\\,\\mathrm{mol}`} />}
          sub="The particle count and amount of solute are conserved."
        />
      }
      controls={({ sequence }) => (sequence.current.controls ? controls : null)}
      observation="Adding solvent spreads the same solute through more volume; particle count stays fixed while concentration falls."
      transcript={`${n.toFixed(2)} moles are taken from ${c1.toFixed(2)} molar stock in a ${v1.toFixed(2)} litre aliquot. Dilution to ${v2.toFixed(2)} litres produces ${c2.toFixed(2)} molar solution.`}
    >
      {figure}
    </AuthoredActivityRuntime>
  );
}
