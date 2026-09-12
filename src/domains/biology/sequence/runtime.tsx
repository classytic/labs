'use client';

/** Sequence runtime — adapter: default the process kind (a raw MDX attr may be missing) before
 *  handing the template to the base-pairing lab. */
import type { ReactNode } from 'react';
import { SequenceLab } from '../../../biology/sequence/index.js';
import type { SequenceKind } from '../../../biology/sequence/core.js';

export default function Sequence(a: Record<string, unknown>): ReactNode {
  const kind = (a.kind as SequenceKind) ?? 'replication';
  return (
    <SequenceLab
      kind={kind}
      template={a.template as string[] | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
      objectives={a.objectives as string[] | undefined}
    />
  );
}
