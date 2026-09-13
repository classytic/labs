'use client';

/** Radian-wrap runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { RadianWrapLab, type RadianWrapProps } from '../../../math/radian-wrap/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <RadianWrapLab {...(p as RadianWrapProps)} />;
}
