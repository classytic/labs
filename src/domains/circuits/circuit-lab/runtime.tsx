'use client';

/** Circuit-lab runtime — adapter: CircuitLab has no internal defaults, so coerce each field
 *  (a raw MDX attr may be missing) to the lab's starting values. */
import type { ReactNode } from 'react';
import { CircuitLab, type CircuitLabProps } from '../../../circuits/circuit-lab.js';

export default function CircuitLabRuntime(a: Record<string, unknown>): ReactNode {
  return (
    <CircuitLab
      voltage={typeof a.voltage === 'number' ? a.voltage : 12}
      r1={typeof a.r1 === 'number' ? a.r1 : 100}
      r2={typeof a.r2 === 'number' ? a.r2 : 200}
      mode={a.mode === 'parallel' ? 'parallel' : 'series'}
      title={(a.title as string) ?? 'Series & parallel: how V and I divide'}
      prompt={typeof a.prompt === 'string' ? a.prompt : undefined}
      height={typeof a.height === 'number' ? a.height : undefined}
      activity={a.activity as CircuitLabProps['activity']}
    />
  );
}
