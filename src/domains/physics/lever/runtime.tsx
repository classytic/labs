'use client';

/** Lever runtime — adapter: map the authored knowns into the engine lab's items[] API. */
import type { ReactNode } from 'react';
import { LeverBalanceLab, type LeverItemSpec } from '../../../physics/lever/index.js';

export default function LeverLab({
  knownWeight = 4,
  knownDist = 3,
  unknownDist = 2,
  controlId,
}: {
  knownWeight?: number;
  knownDist?: number;
  unknownDist?: number;
  controlId?: string;
}): ReactNode {
  const items: LeverItemSpec[] = [
    { side: 'L', dist: knownDist, weight: knownWeight },
    { side: 'R', dist: unknownDist, weight: 'unknown' },
  ];
  return <LeverBalanceLab items={items} maxWeight={12} controlId={controlId} />;
}
