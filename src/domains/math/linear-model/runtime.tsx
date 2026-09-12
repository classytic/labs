'use client';

/** Linear-model runtime — adapter: derive the `given` inputs from predictX (0 … predictX-1). */
import type { ReactNode } from 'react';
import { LinearModelLab, type LinearModelProps } from '../../../math/linear-model/index.js';

export default function LinearModel(a: Record<string, unknown>): ReactNode {
  const p = a as Partial<LinearModelProps> & { predictX?: number };
  const predictX = typeof p.predictX === 'number' ? p.predictX : 2;
  const given = Array.from({ length: Math.max(1, predictX) }, (_, i) => i);
  return <LinearModelLab {...p} predictX={predictX} given={given} />;
}
