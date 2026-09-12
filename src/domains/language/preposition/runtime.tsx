'use client';

/** Preposition runtime — adapter: coerce the items array (may round-trip as a JSON string). */
import type { ReactNode } from 'react';
import { PrepositionSceneLab } from '../../../language/preposition-scene/index.js';
import { coerceArray, DEMO_PREP, type PrepItem } from '../shared.js';

export default function Preposition(a: Record<string, unknown>): ReactNode {
  return (
    <PrepositionSceneLab
      items={coerceArray<PrepItem>(a.items, DEMO_PREP)}
      objectives={a.objectives as string[] | undefined}
      hints={a.hints as string[] | undefined}
      lang={a.lang as string | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
