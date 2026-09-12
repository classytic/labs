'use client';

/** Battery runtime — adapter: coerce EMF + title (a raw MDX attr may be missing). */
import type { ReactNode } from 'react';
import { Battery } from '../../../chem/battery.js';

export default function BatteryRuntime(a: Record<string, unknown>): ReactNode {
  return (
    <Battery
      emf={typeof a.emf === 'number' ? a.emf : 1.1}
      title={(a.title as string) ?? 'Galvanic cell: electrons on the move'}
    />
  );
}
