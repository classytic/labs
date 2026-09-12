'use client';

/** Sentence-builder runtime — adapter: coerce the tiles array (may round-trip as a JSON string). */
import type { ReactNode } from 'react';
import { SentenceBuilderLab } from '../../../language/sentence-builder/index.js';
import { coerceArray, DEMO_SENTENCE, type SentenceTile } from '../shared.js';

export default function SentenceBuilder(a: Record<string, unknown>): ReactNode {
  return (
    <SentenceBuilderLab
      tiles={coerceArray<SentenceTile>(a.tiles, DEMO_SENTENCE)}
      prompt={a.prompt as string | undefined}
      promptDir={a.promptDir as 'ltr' | 'rtl' | undefined}
      targetDir={a.targetDir as 'ltr' | 'rtl' | undefined}
      lang={a.lang as string | undefined}
      title={a.title as string | undefined}
      objectives={a.objectives as string[] | undefined}
      hints={a.hints as string[] | undefined}
    />
  );
}
