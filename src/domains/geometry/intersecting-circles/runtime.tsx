'use client';

/** Intersecting-circles runtime — adapter: apply the block's defaults, then render the lab. */
import type { ReactNode } from 'react';
import { IntersectingCircles } from '../../../geometry/intersecting-circles.js';

export default function IntersectingCirclesLab(a: { r1?: number; r2?: number; title?: string }): ReactNode {
  return (
    <IntersectingCircles
      r1={typeof a.r1 === 'number' ? a.r1 : 3.2}
      r2={typeof a.r2 === 'number' ? a.r2 : 2.8}
      title={a.title ?? 'Common chord of two circles'}
    />
  );
}
