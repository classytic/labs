'use client';

/** Partial-fractions runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { PartialFractions, type PartialFractionsProps } from '../../../math/partial-fractions/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <PartialFractions {...(p as PartialFractionsProps)} />;
}
