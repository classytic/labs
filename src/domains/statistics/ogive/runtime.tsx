'use client';

/** Ogive runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { OgiveLab, type OgiveProps } from '../../../statistics/ogive/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <OgiveLab {...(p as OgiveProps)} />;
}
