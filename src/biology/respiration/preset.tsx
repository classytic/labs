'use client';

/**
 * RespirationLab, photosynthesis ⇌ respiration: one runs the other backwards.
 *
 * Two reaction flows, stacked, drawn with the SHARED MoleculeGlyph + ReactionFlow
 * engine: photosynthesis (6CO₂ + 6H₂O + light → glucose + 6O₂) and respiration
 * (glucose + 6O₂ → 6CO₂ + 6H₂O + ATP). The products of one are literally the
 * reactants of the other, the closed loop is impossible to forget. A day/night
 * toggle shows the NET gas exchange: by day photosynthesis outpaces respiration
 * (net O₂ out); at night only respiration runs (net CO₂ out).
 *
 * Reuses kit/reaction (single source of truth shared with chemistry). Tokenized.
 */

import { useState, type CSSProperties, type ReactNode } from 'react';
import { Moon, RotateCcw, Sun } from 'lucide-react';
import { IconButton, Segmented } from '../../kit/controls.js';
import { Activity } from '../../kit/activity.js';
import { ReactionFlow, type Term } from '../../kit/reaction.js';
import { useCheckpoint, useChallenge, ChallengeCard, type ChallengeQuestion } from '../../kit/pedagogy.js';

export interface RespirationProps {
  mode?: 'day' | 'night';
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const PHOTO: { reactants: Term[]; products: Term[] } = {
  reactants: [{ kind: 'co2', coef: 6 }, { kind: 'h2o', coef: 6 }, { kind: 'light' }],
  products: [{ kind: 'glucose' }, { kind: 'o2', coef: 6 }],
};
const RESP: { reactants: Term[]; products: Term[] } = {
  reactants: [{ kind: 'glucose' }, { kind: 'o2', coef: 6 }],
  products: [{ kind: 'co2', coef: 6 }, { kind: 'h2o', coef: 6 }, { kind: 'atp' }],
};

const RESP_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'night',
    prompt: 'After dark, only respiration runs. Which gas does the plant release on balance?',
    choices: [
      { value: 'co2', label: 'CO₂' },
      { value: 'o2', label: 'O₂' },
    ],
    answer: 'co2',
    explain: 'No photosynthesis in the dark, so respiration’s CO₂ output is not reabsorbed.',
  },
  {
    id: 'day',
    prompt: 'In daylight, photosynthesis outpaces respiration. The net gas leaving the leaf is…',
    choices: [
      { value: 'o2', label: 'O₂' },
      { value: 'co2', label: 'CO₂' },
    ],
    answer: 'o2',
    explain: 'Photosynthesis fixes more CO₂ than respiration makes, and releases more O₂ than it uses.',
  },
];

export function RespirationLab({
  mode = 'day',
  title = 'Photosynthesis ⇌ Respiration: one runs the other backwards',
  prompt = 'The products of one are the reactants of the other. Flip day/night to see the net gas exchange.',
  objectives,
}: RespirationProps): ReactNode {
  const [when, setWhen] = useState(mode);
  const [seen, setSeen] = useState(() => new Set([mode]));
  const day = when === 'day';
  const challenge = useChallenge(RESP_CHALLENGE);
  useCheckpoint({
    solved: challenge.allCorrect && seen.has('day') && seen.has('night'),
    activity: 'respiration',
  });
  const choose = (value: 'day' | 'night'): void => {
    setWhen(value);
    setSeen((current) => new Set(current).add(value));
  };
  const reset = (): void => {
    setWhen(mode);
    setSeen(new Set([mode]));
    challenge.reset();
  };

  // by day photosynthesis runs (and respiration too, but net is O₂ out); at night only respiration.
  const photoActive = day;
  const net = day
    ? 'Net exchange: O₂ OUT, CO₂ IN (photosynthesis outpaces respiration)'
    : 'Net exchange: CO₂ OUT, O₂ IN (only respiration runs in the dark)';

  const flowCard = (
    label: string,
    organelle: string,
    flow: { reactants: Term[]; products: Term[] },
    active: boolean,
    accent: string,
  ): ReactNode => (
    <div
      className="biology-process-card"
      data-active={active || undefined}
      style={{ '--biology-process-accent': accent } as CSSProperties}
    >
      <p className="biology-process-heading">
        {label} <span>· {organelle}</span>
      </p>
      <ReactionFlow reactants={flow.reactants} products={flow.products} ariaLabel={label} />
    </div>
  );

  const figure = (
    <div className="biology-process-stack">
      {flowCard('Photosynthesis', 'chloroplast (day)', PHOTO, photoActive, 'var(--stage-good)')}
      <p className="biology-process-note">↑ products feed ↓ reactants, the same six molecules loop ↑</p>
      {flowCard('Respiration', 'mitochondrion (always)', RESP, true, 'var(--stage-accent-2)')}
    </div>
  );

  const explanation = (
    <section className="lab-authored-task" aria-label="Predict net gas exchange">
      <ChallengeCard questions={RESP_CHALLENGE} state={challenge} title="Predict the net gas exchange" />
    </section>
  );

  return (
    <Activity.Root className="biology-respiration-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading eyebrow="Cellular energetics" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{day ? 'daylight' : 'darkness'}</strong>
        <span>{day ? 'photosynthesis + respiration' : 'respiration only'}</span>
        <span>{seen.size} of 2 conditions compared</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Photosynthesis and respiration reaction loop">{figure}</Activity.Canvas>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Net exchange</span>
        <div>{net}</div>
      </Activity.Feedback>
      {explanation}
      <Activity.LiveRegion>{`${day ? 'Day' : 'Night'}. ${net}. ${seen.size} of 2 conditions compared.`}</Activity.LiveRegion>
      <Activity.Transport>
        <IconButton label="Reset day and night comparison" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state" aria-live="polite">
          <strong>{seen.size === 2 ? 'Comparison complete' : 'Compare both conditions'}</strong>
          <span>{day ? 'day' : 'night'}</span>
        </div>
        <Segmented
          ariaLabel="Light condition"
          value={day ? 'day' : 'night'}
          onChange={choose}
          options={[
            {
              value: 'day',
              label: (
                <>
                  <Sun aria-hidden="true" />
                  Day
                </>
              ),
            },
            {
              value: 'night',
              label: (
                <>
                  <Moon aria-hidden="true" />
                  Night
                </>
              ),
            },
          ]}
        />
      </Activity.Transport>
    </Activity.Root>
  );
}
