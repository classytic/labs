'use client';

/** Cloze runtime — adapter: coerce the items array (may round-trip as a JSON string). */
import type { ReactNode } from 'react';
import { ClozeLab } from '../../../language/cloze/index.js';
import { coerceArray, DEMO_CLOZE, type ClozeItem } from '../shared.js';

export default function Cloze(a: Record<string, unknown>): ReactNode {
  return (
    <ClozeLab
      items={coerceArray<ClozeItem>(a.items, DEMO_CLOZE)}
      lang={a.lang as string | undefined}
      objectives={a.objectives as string[] | undefined}
      hints={a.hints as string[] | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
