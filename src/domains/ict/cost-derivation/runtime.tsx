'use client';

/** Cost-derivation runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { CostDerivationLab, type CostDerivationProps } from '../../../algorithms/cost-derivation/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <CostDerivationLab {...(p as CostDerivationProps)} />;
}
