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

import { useState, type ReactNode } from 'react';
import { Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, LiveRegion } from '../../kit/frame.js';
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
    prompt: 'At NIGHT, only respiration runs. Which gas does the plant net RELEASE?',
    choices: [{ value: 'co2', label: 'CO₂' }, { value: 'o2', label: 'O₂' }],
    answer: 'co2',
    explain: 'No photosynthesis in the dark, so respiration’s CO₂ output is not reabsorbed.',
  },
  {
    id: 'day',
    prompt: 'By DAY, photosynthesis outpaces respiration. The net gas LEAVING the leaf is…',
    choices: [{ value: 'o2', label: 'O₂' }, { value: 'co2', label: 'CO₂' }],
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
  const day = when === 'day';
  const challenge = useChallenge(RESP_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'respiration' });

  // by day photosynthesis runs (and respiration too, but net is O₂ out); at night only respiration.
  const photoActive = day;
  const net = day ? 'Net exchange: O₂ OUT, CO₂ IN (photosynthesis outpaces respiration)' : 'Net exchange: CO₂ OUT, O₂ IN (only respiration runs in the dark)';

  const flowCard = (label: string, organelle: string, flow: { reactants: Term[]; products: Term[] }, active: boolean, accent: string): ReactNode => (
    <div style={{ borderRadius: 12, border: `1px solid ${active ? accent : 'var(--stage-grid)'}`, background: active ? `color-mix(in oklab, ${accent} 8%, var(--stage-bg))` : 'var(--stage-bg)', opacity: active ? 1 : 0.5, padding: '8px 10px', transition: 'opacity 0.2s' }}>
      <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 700, color: accent }}>{label} <span style={{ color: 'var(--stage-muted)', fontWeight: 400 }}>· {organelle}</span></p>
      <ReactionFlow reactants={flow.reactants} products={flow.products} ariaLabel={label} />
    </div>
  );

  const figure = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {flowCard('Photosynthesis', 'chloroplast (day)', PHOTO, photoActive, 'var(--stage-good)')}
      <p style={{ textAlign: 'center', margin: 0, fontSize: 11, color: 'var(--stage-muted)', fontWeight: 600 }}>↑ products feed ↓ reactants, the same six molecules loop ↑</p>
      {flowCard('Respiration', 'mitochondrion (always)', RESP, true, 'var(--stage-accent-2)')}
    </div>
  );

  const controls = (
    <ControlBar>
      <Chip selected={day} onClick={() => setWhen('day')}>☀ Day</Chip>
      <Chip selected={!day} onClick={() => setWhen('night')}>🌙 Night</Chip>
      <span style={{ fontWeight: 600, color: day ? 'var(--stage-good)' : 'var(--stage-accent-2)' }}>{net}</span>
    </ControlBar>
  );

  const footer = (
    <>
      <ChallengeCard questions={RESP_CHALLENGE} state={challenge} title="Predict the net gas exchange" />
      <LiveRegion>
        {`${day ? 'Day' : 'Night'}. ${net}.`}
      </LiveRegion>
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
