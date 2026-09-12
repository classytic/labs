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
import { Field, StatList, Stat } from '../kit/frame.js';
import { AuthoredActivityRuntime } from '../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../kit/activity-authoring.js';
import { num, clamp } from '../core/util.js';

export interface ReactionProfileProps {
  /** Products − reactants energy. Negative = exothermic. */
  deltaH?: number | string;
  /** Activation energy (hump height above reactants). */
  activationEnergy?: number | string;
  catalyst?: boolean;
  title?: string;
  height?: number;
  activity?: AuthoredActivity;
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
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    pts.push({ x: t, y: f(t) });
  }
  return pts;
}

/** The predict/classify activity, read straight off the diagram the learner just tuned. */
const QUESTIONS: NonNullable<AuthoredActivity['questions']> = [
  {
    id: 'type',
    prompt: 'When the products end up lower in energy than the reactants, the reaction is…',
    kind: 'choice',
    choices: [
      { value: 'exo', label: 'exothermic' },
      { value: 'endo', label: 'endothermic' },
    ],
    answer: 'exo',
    explain: 'Energy is released to the surroundings, so ΔH is negative.',
  },
  {
    id: 'catalyst',
    prompt: 'A catalyst opens the lower (green) path. What does it actually change?',
    kind: 'choice',
    choices: [
      { value: 'ea', label: 'lowers Eₐ only' },
      { value: 'dh', label: 'lowers ΔH' },
      { value: 'both', label: 'both' },
    ],
    answer: 'ea',
    explain: 'The reactant and product levels are unchanged, only the hump (Eₐ) drops, so ΔH is the same.',
  },
];
const ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Reaction energy profile',
  objectives: ['Distinguish ΔH from activation energy', 'Explain how a catalyst changes the pathway'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the energy change',
      lead: 'Read the relative reactant and product levels before tuning the model.',
      success: 'profile-prediction',
    },
    {
      id: 'explore',
      phase: 'act',
      title: 'Compare reaction pathways',
      lead: 'Change ΔH and Eₐ, then switch on the catalyst.',
      controls: true,
      reveal: ['model'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the catalyst',
      lead: 'Use the two pathways as evidence.',
      success: 'catalyst-explanation',
    },
  ],
  questions: QUESTIONS,
  success: [
    { id: 'profile-prediction', source: 'answer', key: 'type', operator: 'eq', value: 'exo' },
    { id: 'catalyst-explanation', source: 'answer', key: 'catalyst', operator: 'eq', value: 'ea' },
  ],
};

export function ReactionProfile({
  deltaH,
  activationEnergy,
  catalyst: catalystInit = false,
  title = 'Reaction energy profile',
  height = 320,
  activity = ACTIVITY,
}: ReactionProfileProps = {}): ReactNode {
  const [dH, setDH] = useState(clamp(num(deltaH, -40), -80, 80));
  const [ea, setEa] = useState(clamp(num(activationEnergy, 60), 5, 120));
  const [catalyst, setCatalyst] = useState(catalystInit);
  useEffect(() => {
    setDH(clamp(num(deltaH, -40), -80, 80));
  }, [deltaH]);
  useEffect(() => {
    setEa(clamp(num(activationEnergy, 60), 5, 120));
  }, [activationEnergy]);
  useEffect(() => {
    setCatalyst(catalystInit);
  }, [catalystInit]);

  const reactE = 0,
    prodE = dH;
  const peakE = Math.max(reactE, prodE) + ea;
  const peakCat = Math.max(reactE, prodE) + ea * 0.45;
  const lo = Math.min(reactE, prodE) - 15;
  const hi = peakE + 15;
  const view = { xMin: 0, xMax: 1, yMin: lo, yMax: hi };
  const exo = dH < 0;

  const figure = (
    <div className="chem-profile-scene">
      <span className="chem-axis-y">energy →</span>
      <div>
        <Stage
          view={view}
          height={height}
          preserveAspect={false}
          ariaLabel={`Energy profile, ΔH ${dH} kJ, activation ${ea} kJ${catalyst ? ', catalysed' : ''}`}
        >
          {/* axes */}
          <Segment
            from={{ x: 0, y: lo }}
            to={{ x: 0, y: hi }}
            color="var(--stage-fg)"
            opacity={0.4}
            weight={1.5}
          />
          <Segment
            from={{ x: 0, y: lo }}
            to={{ x: 1, y: lo }}
            color="var(--stage-fg)"
            opacity={0.4}
            weight={1.5}
          />
          {/* ΔH levels */}
          <Segment
            from={{ x: 0.25, y: reactE }}
            to={{ x: 1, y: reactE }}
            color="var(--stage-fg)"
            opacity={0.35}
            weight={1}
            dashed
          />
          <Segment
            from={{ x: 0.75, y: prodE }}
            to={{ x: 1, y: prodE }}
            color="var(--stage-fg)"
            opacity={0.35}
            weight={1}
            dashed
          />
          {/* curves */}
          {catalyst && (
            <Polyline
              points={sample(profile(reactE, prodE, peakCat))}
              color="var(--stage-good)"
              weight={2.5}
              dashed
            />
          )}
          <Polyline points={sample(profile(reactE, prodE, peakE))} color="var(--stage-accent)" weight={2.5} />
          <Label
            x={0.02}
            y={reactE}
            text="reactants"
            color="var(--stage-fg)"
            anchor="start"
            dy={-8}
            size={11}
          />
          <Label
            x={0.78}
            y={prodE}
            text="products"
            color="var(--stage-fg)"
            anchor="start"
            dy={-8}
            size={11}
          />
        </Stage>
        <p className="chem-axis-x">reaction coordinate →</p>
      </div>
    </div>
  );

  const controls = (
    <>
      <Field label="ΔH">
        <Slider value={dH} min={-80} max={80} step={1} onChange={setDH} ariaLabel="enthalpy change" />
      </Field>
      <Field label="Eₐ">
        <Slider value={ea} min={5} max={120} step={1} onChange={setEa} ariaLabel="activation energy" />
      </Field>
      <Chip selected={catalyst} onClick={() => setCatalyst((c) => !c)}>
        catalyst
      </Chip>
    </>
  );

  const aside = (
    <StatList>
      <Stat label="ΔH" value={`${dH > 0 ? '+' : ''}${dH.toFixed(0)} kJ`} />
      <Stat label="type" value={exo ? 'exothermic' : 'endothermic'} tone={exo ? 'good' : 'warn'} />
    </StatList>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={activity}
      activityId="reaction-profile"
      eyebrow="Chemical energetics"
      title={title}
      description="Tune ΔH and activation energy. Compare the uncatalysed and catalysed pathways."
      status={
        <>
          <span>{exo ? 'exothermic' : 'endothermic'}</span>
          <span>ΔH {dH} kJ</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={
        <>A catalyst lowers the activation barrier without changing the reactant, product, or ΔH levels.</>
      }
      transcript={
        <p>
          {exo ? 'Products lie below reactants.' : 'Products lie above reactants.'} Activation energy is {ea}{' '}
          kJ; catalyst {catalyst ? 'on' : 'off'}.
        </p>
      }
    >
      {figure}
    </AuthoredActivityRuntime>
  );
}
