'use client';

/** Reading runtime — adapter: coerce the questions + glossary arrays (may round-trip as strings). */
import type { ReactNode } from 'react';
import { ReadingLab } from '../../../language/reading/index.js';
import {
  coerceArray,
  DEMO_READING_PASSAGE,
  DEMO_READING_Q,
  type ReadingQuestion,
  type GlossEntry,
} from '../shared.js';

export default function Reading(a: Record<string, unknown>): ReactNode {
  const gloss = coerceArray<GlossEntry>(a.gloss, []);
  return (
    <ReadingLab
      passage={typeof a.passage === 'string' ? a.passage : DEMO_READING_PASSAGE}
      questions={coerceArray<ReadingQuestion>(a.questions, DEMO_READING_Q)}
      gloss={gloss.length ? gloss : undefined}
      objectives={a.objectives as string[] | undefined}
      hints={a.hints as string[] | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
