'use client';

/** Intercept runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { InterceptLab, type InterceptProps } from '../../../physics/intercept/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <InterceptLab {...(p as InterceptProps)} />;
}
