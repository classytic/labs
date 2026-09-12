'use client';

/** Venturi runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { VenturiLab, type VenturiProps } from '../../../physics/venturi/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <VenturiLab {...(p as VenturiProps)} />;
}
