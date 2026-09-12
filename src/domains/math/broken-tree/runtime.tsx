'use client';

/** Broken-tree runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { BrokenTreeLab, type BrokenTreeProps } from '../../../math/broken-tree/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <BrokenTreeLab {...(p as BrokenTreeProps)} />;
}
