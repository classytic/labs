'use client';

/** Oblique-triangle runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { ObliqueTriangle, type ObliqueTriangleProps } from '../../../math/oblique-triangle/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <ObliqueTriangle {...(p as ObliqueTriangleProps)} />;
}
