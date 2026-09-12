'use client';
import type { ReactNode } from 'react';
import { SpatialLorentzLab, type SpatialFieldMode } from '../../../physics/fields/index.js';
export default function Runtime(p: Record<string, unknown>): ReactNode {
  return (
    <SpatialLorentzLab
      mode={p.mode as SpatialFieldMode}
      charge={p.charge as 1 | -1}
      strength={p.strength as number}
      forwardSpeed={p.forwardSpeed as number}
      axialSpeed={p.axialSpeed as number}
      yaw={p.yaw as number}
      pitch={p.pitch as number}
    />
  );
}
