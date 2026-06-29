'use client';

/**
 * ReactionProfile, an energy vs. reaction-coordinate diagram.
 *
 * Reactants plateau → activation-energy hump (transition state) → products
 * plateau. Tune ΔH (exothermic vs endothermic) and the activation energy Eₐ; flip
 * the catalyst to lower the hump (a faster route, same ΔH).
 *
 * Now on the @classytic/stage engine (SVG curves + labels, accessible, themed).
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Segment, Polyline, Label, type Vec2 } from '@classytic/stage';
import { Slider, Chip } from '../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../kit/frame.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../kit/pedagogy.js';
import { num, clamp } from '../core/util.js';

export interface ReactionProfileProps {
  /** Products − reactants energy. Negative = exothermic. */
  deltaH?: number | string;
  /** Activation energy (hump height above reactants). */
  activationEnergy?: number | string;
  catalyst?: boolean;
  title?: string;
  height?: number;
}

/** y(t) for t∈[0,1]: flat reactants → peak → flat products. */
function profile(reactE: number, prodE: number, peakE: number): (t: number) => number {
  return (t) => {
    if (t < 0.25) return reactE;
    if (t > 0.75) return prodE;
    const u = (t - 0.25) / 0.5;
    const base = reactE + (prodE - reactE) * u;
    return base + (peakE - Math.max(reactE, prodE)) * Math.sin(u * Math.PI);
  };
}

function sample(f: (t: number) => number): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i <= 120; i++) { const t = i / 120; pts.push({ x: t, y: f(t) }); }
  return pts;
}

/** The predict/classify activity, read straight off the diagram the learner just tuned. */
const CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'type',
    prompt: 'When the products end up LOWER in energy than the reactants, the reaction is…',
    choices: [{ value: 'exo', label: 'exothermic' }, { value: 'endo', label: 'endothermic' }],
    answer: 'exo',
    explain: 'Energy is released to the surroundings, so ΔH is negative.',
  },
  {
    id: 'catalyst',
    prompt: 'A catalyst opens the lower (green) path. What does it actually change?',
    choices: [
      { value: 'ea', label: 'lowers Eₐ only' },
      { value: 'dh', label: 'lowers ΔH' },
      { value: 'both', label: 'both' },
    ],
    answer: 'ea',
    explain: 'The reactant and product levels are unchanged, only the hump (Eₐ) drops, so ΔH is the same.',
  },
];

export function ReactionProfile({ deltaH, activationEnergy, catalyst: catalystInit = false, title = 'Reaction energy profile', height = 320 }: ReactionProfileProps = {}): ReactNode {
  const [dH, setDH] = useState(clamp(num(deltaH, -40), -80, 80));
  const [ea, setEa] = useState(clamp(num(activationEnergy, 60), 5, 120));
  const [catalyst, setCatalyst] = useState(catalystInit);
  useEffect(() => { setDH(clamp(num(deltaH, -40), -80, 80)); }, [deltaH]);
  useEffect(() => { setEa(clamp(num(activationEnergy, 60), 5, 120)); }, [activationEnergy]);
  useEffect(() => { setCatalyst(catalystInit); }, [catalystInit]);

  const challenge = useChallenge(CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'reaction-profile' });

  const reactE = 0, prodE = dH;
  const peakE = Math.max(reactE, prodE) + ea;
  const peakCat = Math.max(reactE, prodE) + ea * 0.45;
  const lo = Math.min(reactE, prodE) - 15;
  const hi = peakE + 15;
  const view = { xMin: 0, xMax: 1, yMin: lo, yMax: hi };
  const exo = dH < 0;

  const figure = (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 4 }}>
      <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 11, opacity: 0.6, padding: '4px 0' }}>energy →</span>
      <div style={{ flex: 1 }}>
        <Stage view={view} height={height} preserveAspect={false} ariaLabel={`Energy profile, ΔH ${dH} kJ, activation ${ea} kJ${catalyst ? ', catalysed' : ''}`}>
          {/* axes */}
          <Segment from={{ x: 0, y: lo }} to={{ x: 0, y: hi }} color="var(--stage-fg)" opacity={0.4} weight={1.5} />
          <Segment from={{ x: 0, y: lo }} to={{ x: 1, y: lo }} color="var(--stage-fg)" opacity={0.4} weight={1.5} />
          {/* ΔH levels */}
          <Segment from={{ x: 0.25, y: reactE }} to={{ x: 1, y: reactE }} color="var(--stage-fg)" opacity={0.35} weight={1} dashed />
          <Segment from={{ x: 0.75, y: prodE }} to={{ x: 1, y: prodE }} color="var(--stage-fg)" opacity={0.35} weight={1} dashed />
          {/* curves */}
          {catalyst && <Polyline points={sample(profile(reactE, prodE, peakCat))} color="var(--stage-good)" weight={2.5} dashed />}
          <Polyline points={sample(profile(reactE, prodE, peakE))} color="var(--stage-accent)" weight={2.5} />
          <Label x={0.02} y={reactE} text="reactants" color="var(--stage-fg)" anchor="start" dy={-8} size={11} />
          <Label x={0.78} y={prodE} text="products" color="var(--stage-fg)" anchor="start" dy={-8} size={11} />
        </Stage>
        <p style={{ textAlign: 'center', fontSize: 11, opacity: 0.6, margin: '2px 0 0' }}>reaction coordinate →</p>
      </div>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label="ΔH"><Slider value={dH} min={-80} max={80} step={1} onChange={setDH} ariaLabel="enthalpy change" style={{ width: 110 }} /></Field>
      <Field label="Eₐ"><Slider value={ea} min={5} max={120} step={1} onChange={setEa} ariaLabel="activation energy" style={{ width: 110 }} /></Field>
      <Chip selected={catalyst} onClick={() => setCatalyst((c) => !c)}>catalyst</Chip>
    </ControlBar>
  );

  const aside = (
    <Callout tone="result">
      <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
        <span>ΔH {dH > 0 ? '+' : ''}{dH.toFixed(0)} kJ</span>
        <span style={{ color: exo ? 'var(--stage-good)' : 'var(--stage-warn)' }}>{exo ? 'exothermic' : 'endothermic'}</span>
      </span>
    </Callout>
  );

  return (
    <LabFrame
      title={title}
      prompt="Tune ΔH and the activation energy. A catalyst lowers the hump (green), a faster path, same ΔH."
      aside={aside}
      controls={controls}
      footer={<ChallengeCard questions={CHALLENGE} state={challenge} title="Predict" />}
    >
      {figure}
    </LabFrame>
  );
}
