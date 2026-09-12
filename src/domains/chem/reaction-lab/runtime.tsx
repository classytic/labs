'use client';

/** Reaction-lab runtime — adapter: default the two atom labels and derive the title from them. */
import type { ReactNode } from 'react';
import { ReactionLab } from '../../../chem/reaction-lab.js';

export default function ReactionLabRuntime(a: Record<string, unknown>): ReactNode {
  const aa = typeof a.a === 'string' && a.a ? a.a : 'A';
  const bb = typeof a.b === 'string' && a.b ? a.b : 'B';
  return <ReactionLab a={aa} b={bb} title={(a.title as string) ?? `${aa} + ${bb} → ${aa}–${bb}`} />;
}
