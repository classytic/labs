'use client';

/** River-boat runtime — small adapter: apply the block's defaults, then render the engine lab. */
import type { ReactNode } from 'react';
import { RiverBoat } from '../../../physics/river-boat.js';

export default function RiverBoatLab(a: {
  boatSpeed?: number;
  current?: number;
  riverWidth?: number;
  title?: string;
}): ReactNode {
  return (
    <RiverBoat
      boatSpeed={typeof a.boatSpeed === 'number' ? a.boatSpeed : 4}
      current={typeof a.current === 'number' ? a.current : 2}
      riverWidth={typeof a.riverWidth === 'number' ? a.riverWidth : 8}
      title={a.title ?? 'Crossing a flowing river'}
    />
  );
}
