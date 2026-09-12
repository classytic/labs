'use client';

/**
 * SolutionBoxLab, molarity is a CROWD: particles per litre, seen.
 *
 * Solute shown as discrete dots in a transparent box. Add solute (more dots =
 * more moles, the numerator) or add water (the box widens so the SAME dots spread
 * apart, the denominator), and M = n/V is read off as both a number AND the
 * colour intensity. A draggable probe counts dots in a fixed region, proving
 * molarity is a LOCAL density, not a whole-apparatus label. Composes the shared
 * SolutionField (single source of truth for the dot engine).
 *
 * The unit-bridging algebra (mol↔g via molar mass, mol↔particles via Nₐ) belongs
 * in a paired MathDerivation, this lab only makes density-vs-amount felt.
 */

import { useState, type ReactNode } from 'react';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { Slider } from '../../kit/controls.js';
import { clamp } from '../../core/util.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { SolutionField } from './field.js';

export interface SolutionBoxProps {
  moles?: number;
  volume?: number;
  /** Tint scaling: the molarity that reads as fully saturated colour. */
  maxMolarity?: number;
  /** Legacy species hue; colour now comes from the figure palette (accepted, unused). */
  hue?: number;
  showProbe?: boolean;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
  activity?: AuthoredActivity;
}

const DOTS_PER_MOL = 200;

/** Predict how M = n/V responds to changing the numerator vs the denominator, the core molarity misconception. */
const SOLUTION_CHALLENGE: AuthoredChoiceQuestion[] = [
  {
    id: 'add-water',
    prompt: 'Add water (more volume, same solute). The molarity M = n/V…',
    choices: [
      { value: 'falls', label: 'falls' },
      { value: 'rises', label: 'rises' },
      { value: 'same', label: 'stays the same' },
    ],
    answer: 'falls',
    explain: 'The same dots spread through a bigger box, n is fixed, V grows, so the density n/V drops.',
  },
  {
    id: 'add-solute',
    prompt: 'Add more solute at the same volume. The molarity…',
    choices: [
      { value: 'rises', label: 'rises' },
      { value: 'falls', label: 'falls' },
      { value: 'same', label: 'stays the same' },
    ],
    answer: 'rises',
    explain: 'More dots in the same box, n grows, V is fixed, so n/V climbs.',
  },
];

const SOLUTION_ACTIVITY: AuthoredActivity = {
  pattern: 'forecast',
  title: 'Molarity is a crowd: particles per litre',
  objectives: [
    'Interpret molarity as local particle density',
    'Distinguish changing solute amount from changing solution volume',
    'Use M = n/V to predict concentration',
  ],
  steps: [
    {
      id: 'predict-water',
      phase: 'predict',
      title: 'Predict dilution',
      lead: 'What happens to molarity when water is added without adding solute?',
      success: 'water-prediction',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read particle density',
      lead: 'Compare particle crowding, probe count, and molarity.',
      reveal: ['model'],
    },
    {
      id: 'change',
      phase: 'act',
      title: 'Change amount and volume',
      lead: 'Change solute and water independently to test M = n/V.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain added solute',
      lead: 'Explain what changes when more solute is added at fixed volume.',
      success: 'solute-explanation',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Build another concentration',
      lead: 'Choose a new amount and volume and compare local density.',
      controls: true,
      reveal: ['model'],
    },
  ],
  questions: SOLUTION_CHALLENGE,
  success: [
    {
      id: 'water-prediction',
      source: 'answer',
      key: 'add-water',
      pendingLabel: 'Commit to a dilution prediction.',
    },
    {
      id: 'solute-explanation',
      source: 'answer',
      key: 'add-solute',
      pendingLabel: 'Explain the effect of adding solute.',
    },
  ],
};

export function SolutionBoxLab({
  moles = 0.5,
  volume = 0.5,
  maxMolarity = 4,
  hue = 178,
  showProbe = true,
  title = 'Molarity is a crowd: particles per litre',
  prompt = 'Add solute (more particles) or add water (same particles, more liquid). M = n / V is the particle density.',
  height = 230,
  objectives = SOLUTION_ACTIVITY.objectives,
  activity,
}: SolutionBoxProps): ReactNode {
  const [n, setN] = useState(clamp(moles, 0.1, 1));
  const [v, setV] = useState(clamp(volume, 0.2, 1));
  const M = n / v;

  const figure = (
    <>
      <div className="chem-scene chem-solution-scene">
        <SolutionField
          dots={Math.round(n * DOTS_PER_MOL)}
          fill={v}
          tint={M / maxMolarity}
          hue={hue}
          height={height}
          width={640}
          vessel={0.6}
          showProbe={showProbe}
          ariaLabel={`solution: ${n.toFixed(1)} moles in ${v.toFixed(1)} litres, ${M.toFixed(2)} molar`}
        />
      </div>
      <LiveRegion>{`${n.toFixed(2)} moles in ${v.toFixed(2)} litres is ${M.toFixed(2)} molar.`}</LiveRegion>
    </>
  );

  const controls = (
    <>
      <Field label="solute (mol)" value={`${n.toFixed(2)} mol`}>
        <Slider value={n} min={0.1} max={1} step={0.05} onChange={setN} ariaLabel="moles of solute" />
      </Field>
      <Field label="water → volume (L)" value={`${v.toFixed(2)} L`}>
        <Slider
          value={v}
          min={0.2}
          max={1}
          step={0.05}
          onChange={setV}
          ariaLabel="solution volume in litres"
        />
      </Field>
    </>
  );

  const runtimeActivity: AuthoredActivity = activity ?? { ...SOLUTION_ACTIVITY, title, objectives };
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtimeActivity}
      activityId="solution-box"
      eyebrow="Solutions and concentration"
      title={title}
      description={prompt}
      status={
        <>
          <span>{n.toFixed(2)} mol</span>
          <span>{v.toFixed(2)} L</span>
        </>
      }
      evidence={<Readout value={`${M.toFixed(2)} mol·L⁻¹`} sub="M = amount of solute ÷ solution volume" />}
      controls={({ sequence }) => (sequence.current.controls ? controls : null)}
      observation="Molarity is particle density: amount changes the numerator while water changes the volume available to the same particles."
      transcript={`${n.toFixed(2)} moles of solute occupy ${v.toFixed(2)} litres, giving ${M.toFixed(2)} moles per litre. The movable probe samples local particle density.`}
    >
      {figure}
    </AuthoredActivityRuntime>
  );
}
