'use client';

/** Bearings runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { BearingsLab, type BearingsProps } from '../../../math/bearings/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <BearingsLab {...(p as BearingsProps)} />;
}
