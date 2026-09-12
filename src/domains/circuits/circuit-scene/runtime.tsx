'use client';

/** Circuit-scene runtime — render the stored doc as an operable CircuitPlayer (tap switches). */
import type { ReactNode } from 'react';
import { CircuitPlayer } from '../../../build/CircuitPlayer.js';
import { type CircuitDoc } from '../../../build/contract.js';

const EMPTY_DOC: CircuitDoc = { parts: [], nodes: [], size: { w: 560, h: 300 } };

export default function CircuitScene(a: Record<string, unknown>): ReactNode {
  const title = typeof a.title === 'string' ? a.title : 'Interactive circuit';
  return (
    <CircuitPlayer
      doc={(a.doc as unknown as CircuitDoc | undefined) ?? EMPTY_DOC}
      flow={a.flow !== false}
      ariaLabel={typeof a.ariaLabel === 'string' ? a.ariaLabel : title}
    />
  );
}
