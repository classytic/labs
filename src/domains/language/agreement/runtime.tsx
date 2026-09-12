'use client';

/** Agreement runtime — adapter: coerce the items array (may round-trip as a JSON string). */
import type { ReactNode } from 'react';
import { AgreementLab } from '../../../language/agreement/index.js';
import { coerceArray, DEMO_AGREE, type AgreementItem } from '../shared.js';

export default function Agreement(a: Record<string, unknown>): ReactNode {
  return (
    <AgreementLab
      items={coerceArray<AgreementItem>(a.items, DEMO_AGREE)}
      objectives={a.objectives as string[] | undefined}
      hints={a.hints as string[] | undefined}
      lang={a.lang as string | undefined}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
