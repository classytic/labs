'use client';

/** Error-correct runtime — adapter: coerce the items array (may round-trip as a JSON string). */
import type { ReactNode } from 'react';
import { ErrorCorrectLab } from '../../../language/error-correct/index.js';
import { coerceArray, DEMO_ERRORS, type ErrorItem } from '../shared.js';

export default function ErrorCorrect(a: Record<string, unknown>): ReactNode {
  return (
    <ErrorCorrectLab
      items={coerceArray<ErrorItem>(a.items, DEMO_ERRORS)}
      objectives={a.objectives as string[] | undefined}
      hints={a.hints as string[] | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
