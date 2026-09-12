'use client';
import type { ReactNode } from 'react';
import {
  StereochemistryLab,
  type Enantiomer,
  type StereochemistryMolecule,
} from '../../../chem/stereochemistry/index.js';
export default function StereochemistryRuntime(props: Record<string, unknown>): ReactNode {
  return (
    <StereochemistryLab
      molecule={(props.molecule as StereochemistryMolecule | undefined) ?? 'lactic-acid'}
      enantiomer={(props.enantiomer as Enantiomer | undefined) ?? 'R'}
      yaw={typeof props.yaw === 'number' ? props.yaw : undefined}
      pitch={typeof props.pitch === 'number' ? props.pitch : undefined}
      compareMirror={props.compareMirror !== false}
      showPriorities={props.showPriorities !== false}
      title={typeof props.title === 'string' ? props.title : undefined}
      prompt={typeof props.prompt === 'string' ? props.prompt : undefined}
    />
  );
}
