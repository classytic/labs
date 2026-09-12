'use client';

import type { ReactNode } from 'react';
import { AtomicOrbitalLab } from '../../../chem/orbitals/index.js';
import type { OrbitalKind } from '../../../chem/orbitals/core.js';

export default function AtomicOrbitalRuntime(props: Record<string, unknown>): ReactNode {
  return (
    <AtomicOrbitalLab
      orbital={(props.orbital as OrbitalKind | undefined) ?? '2p-z'}
      view={props.view === 'cross-section' ? 'cross-section' : 'cloud'}
      yaw={typeof props.yaw === 'number' ? props.yaw : 28}
      pitch={typeof props.pitch === 'number' ? props.pitch : -18}
      samples={typeof props.samples === 'number' ? props.samples : 420}
      title={typeof props.title === 'string' ? props.title : undefined}
      prompt={typeof props.prompt === 'string' ? props.prompt : undefined}
    />
  );
}
