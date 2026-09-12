'use client';

/** Identity-proof runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { IdentityProof, type IdentityProofProps } from '../../../math/identity-proof/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <IdentityProof {...(p as IdentityProofProps)} />;
}
