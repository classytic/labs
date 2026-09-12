'use client';

/** System-solve runtime — adapter: build the two unknowns + two clue rows from the flat scalars. */
import type { ReactNode } from 'react';
import { SystemSolveLab } from '../../../math/system-solve/index.js';

export default function SystemSolve(a: Record<string, unknown>): ReactNode {
  const num = (k: string, d: number): number => (typeof a[k] === 'number' ? (a[k] as number) : d);
  const str = (k: string, d: string): string => (typeof a[k] === 'string' ? (a[k] as string) : d);
  const unknowns = [
    {
      sym: str('symA', '🍍'),
      label: str('labelA', 'Pineapple'),
      color: 'var(--stage-warn)',
      answer: num('answerA', 5),
    },
    {
      sym: str('symB', '🥭'),
      label: str('labelB', 'Mango'),
      color: 'var(--stage-good)',
      answer: num('answerB', 2),
    },
  ];
  const clues = [{ coeffs: [num('a0', 2), num('b0', 1)] }, { coeffs: [num('a1', 1), num('b1', 1)] }];
  return (
    <SystemSolveLab
      scene={str('scene', 'receipt')}
      unknowns={unknowns}
      clues={clues}
      currency={a.currency as string | undefined}
      unit={a.unit as string | undefined}
      store={a.store as string | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
      activity={a.activity as string | undefined}
    />
  );
}
