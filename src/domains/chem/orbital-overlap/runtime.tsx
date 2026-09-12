'use client';
import type { ReactNode } from 'react';
import {
  OrbitalOverlapLab,
  type OverlapMode,
  type OverlapPhase,
} from '../../../chem/orbital-overlap/index.js';
export default function Runtime(p: Record<string, unknown>): ReactNode {
  return (
    <OrbitalOverlapLab
      mode={p.mode as OverlapMode}
      phase={p.phase as OverlapPhase}
      separation={p.separation as number}
      yaw={p.yaw as number}
      pitch={p.pitch as number}
    />
  );
}
