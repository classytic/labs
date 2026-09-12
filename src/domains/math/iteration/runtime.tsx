'use client';

/** Iteration runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { IterationLab, type IterationProps } from '../../../math/iteration/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <IterationLab {...(p as IterationProps)} />;
}
