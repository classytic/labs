'use client';

import type { ReactNode } from 'react';
import { CrystalLatticeLab } from '../../../chem/crystal-lattice/index.js';
import type { CrystalLatticeKind } from '../../../chem/crystal-lattice/core.js';

export default function CrystalLatticeRuntime(props: Record<string, unknown>): ReactNode {
  return (
    <CrystalLatticeLab
      lattice={(props.lattice as CrystalLatticeKind | undefined) ?? 'face-centred'}
      repetitions={typeof props.repetitions === 'number' ? props.repetitions : 1}
      showPlane={props.showPlane === true}
      yaw={typeof props.yaw === 'number' ? props.yaw : undefined}
      pitch={typeof props.pitch === 'number' ? props.pitch : undefined}
      title={typeof props.title === 'string' ? props.title : undefined}
      prompt={typeof props.prompt === 'string' ? props.prompt : undefined}
    />
  );
}
