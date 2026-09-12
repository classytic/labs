'use client';

/** Transform runtime — adapter: coerce the from/to tile arrays (may round-trip as JSON strings). */
import type { ReactNode } from 'react';
import { TransformLab } from '../../../language/transform/index.js';
import { coerceArray, DEMO_TRANSFORM_FROM, DEMO_TRANSFORM_TO, type TransformTile } from '../shared.js';

export default function Transform(a: Record<string, unknown>): ReactNode {
  return (
    <TransformLab
      from={coerceArray<TransformTile>(a.from, DEMO_TRANSFORM_FROM)}
      to={coerceArray<TransformTile>(a.to, DEMO_TRANSFORM_TO)}
      instruction={a.instruction as string | undefined}
      note={a.note as string | undefined}
      lang={a.lang as string | undefined}
      title={a.title as string | undefined}
      targetDir={a.targetDir as 'ltr' | 'rtl' | undefined}
      objectives={a.objectives as string[] | undefined}
      hints={a.hints as string[] | undefined}
    />
  );
}
