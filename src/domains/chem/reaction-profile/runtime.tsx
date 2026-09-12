'use client';

/** Reaction-profile runtime — adapter: coerce ΔH / Eₐ / catalyst / title to the lab's defaults. */
import type { ReactNode } from 'react';
import { ReactionProfile } from '../../../chem/reaction-profile.js';

export default function ReactionProfileRuntime(a: Record<string, unknown>): ReactNode {
  return (
    <ReactionProfile
      deltaH={typeof a.deltaH === 'number' ? a.deltaH : -40}
      activationEnergy={typeof a.activationEnergy === 'number' ? a.activationEnergy : 60}
      catalyst={a.catalyst === true}
      title={(a.title as string) ?? 'Reaction energy profile'}
    />
  );
}
