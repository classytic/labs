'use client';

/** Solid-net runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { SolidNetLab, type SolidNetProps } from '../../../math/solid-net/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <SolidNetLab {...(p as SolidNetProps)} />;
}
