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
import { LabFrame, ControlBar, Field, LiveRegion } from '../../kit/frame.js';
import { Slider } from '../../kit/controls.js';
import { clamp } from '../../core/util.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { SolutionField } from './field.js';

export interface SolutionBoxProps {
  moles?: number;
  volume?: number;
  /** Tint scaling: the molarity that reads as fully saturated colour. */
  maxMolarity?: number;
  hue?: number;
  showProbe?: boolean;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}

const DOTS_PER_MOL = 200;

/** Predict how M = n/V responds to changing the numerator vs the denominator, the core molarity misconception. */
const SOLUTION_CHALLENGE: ChallengeQuestion[] = [
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

export function SolutionBoxLab({
  moles = 0.5, volume = 0.5, maxMolarity = 4, hue = 178, showProbe = true,
  title = 'Molarity is a crowd: particles per litre',
  prompt = 'Add solute (more dots) or add water (same dots, bigger box). M = n / V is the dot density.',
  height = 230, objectives,
}: SolutionBoxProps): ReactNode {
  const [n, setN] = useState(clamp(moles, 0.1, 1));
  const [v, setV] = useState(clamp(volume, 0.2, 1));
  const M = n / v;
  const challenge = useChallenge(SOLUTION_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'solution-box' });

  const figure = (
    <>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <SolutionField dots={Math.round(n * DOTS_PER_MOL)} fill={v} tint={M / maxMolarity} hue={hue} height={height} showProbe={showProbe} ariaLabel={`solution: ${n.toFixed(1)} moles in ${v.toFixed(1)} litres, ${M.toFixed(2)} molar`} />
      </div>
      <LiveRegion>
        {`${n.toFixed(2)} moles in ${v.toFixed(2)} litres is ${M.toFixed(2)} molar.`}
      </LiveRegion>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="solute (mol)" value={`${n.toFixed(2)} mol`}>
        <Slider value={n} min={0.1} max={1} step={0.05} onChange={setN} ariaLabel="moles of solute" />
      </Field>
      <Field label="water → volume (L)" value={`${v.toFixed(2)} L`}>
        <Slider value={v} min={0.2} max={1} step={0.05} onChange={setV} ariaLabel="solution volume in litres" />
      </Field>
      <Field label="M = n/V" value={<span style={{ color: 'var(--stage-accent)' }}>{M.toFixed(2)} mol·L⁻¹</span>}><span /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={<ChallengeCard questions={SOLUTION_CHALLENGE} state={challenge} title="Predict" />}>{figure}</LabFrame>;
}
