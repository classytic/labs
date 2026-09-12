'use client';

/** Growing-pattern runtime — adapter: default the per-step a, constant b, and figures shown. */
import type { ReactNode } from 'react';
import { GrowingPatternLab } from '../../../math/pattern/index.js';

export default function GrowingPattern(a: Record<string, unknown>): ReactNode {
  return (
    <GrowingPatternLab
      a={typeof a.a === 'number' ? a.a : 2}
      b={typeof a.b === 'number' ? a.b : 3}
      steps={typeof a.steps === 'number' ? a.steps : 4}
      controlId={a.controlId as string | undefined}
    />
  );
}
