'use client';

import type { ReactNode } from 'react';
import { MolecularGeometryLab } from '../../../chem/molecular-geometry/index.js';
import type { MoleculeKey } from '../../../chem/molecular-geometry/core.js';

export default function MolecularGeometryRuntime(props: Record<string, unknown>): ReactNode {
  return (
    <MolecularGeometryLab
      molecule={(props.molecule as MoleculeKey | undefined) ?? 'h2o'}
      yaw={typeof props.yaw === 'number' ? props.yaw : 28}
      pitch={typeof props.pitch === 'number' ? props.pitch : -18}
      showLonePairs={props.showLonePairs !== false}
      showDipoles={props.showDipoles !== false}
      showDomains={props.showDomains === true}
      showHybridOrbitals={props.showHybridOrbitals === true}
      title={typeof props.title === 'string' ? props.title : undefined}
      prompt={typeof props.prompt === 'string' ? props.prompt : undefined}
    />
  );
}
