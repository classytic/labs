'use client';

/** Area-model runtime — adapter: default a, b, and the expand/factor mode. */
import type { ReactNode } from 'react';
import { AreaModelLab } from '../../../math/area-model/index.js';

export default function AreaModel(a: Record<string, unknown>): ReactNode {
  return (
    <AreaModelLab
      a={typeof a.a === 'number' ? a.a : 3}
      b={typeof a.b === 'number' ? a.b : 2}
      mode={a.mode === 'factor' ? 'factor' : 'expand'}
      controlId={a.controlId as string | undefined}
    />
  );
}
