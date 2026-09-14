'use client';

/** Cone-frustum runtime — adapter: default the cone, the starting cut and the target share. */
import type { ReactNode } from 'react';
import { ConeFrustumLab } from '../../../math/cone-frustum/index.js';

export default function ConeFrustum(a: Record<string, unknown>): ReactNode {
  return (
    <ConeFrustumLab
      radius={typeof a.radius === 'number' ? a.radius : 3}
      height={typeof a.height === 'number' ? a.height : 6}
      cut={typeof a.cut === 'number' ? a.cut : undefined}
      targetShare={typeof a.targetShare === 'number' ? a.targetShare : 0.5}
      unit={typeof a.unit === 'string' ? a.unit : 'cm'}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
