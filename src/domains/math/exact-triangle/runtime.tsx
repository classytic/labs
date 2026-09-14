'use client';

/** Exact-triangle runtime — adapter: default the shape, the angle read off it and the cut. */
import type { ReactNode } from 'react';
import { ExactTriangleLab } from '../../../math/exact-triangle/index.js';

export default function ExactTriangle(a: Record<string, unknown>): ReactNode {
  const angle = a.angle === 30 || a.angle === 45 || a.angle === 60 ? a.angle : undefined;
  return (
    <ExactTriangleLab
      shape={a.shape === 'half-square' ? 'half-square' : 'half-equilateral'}
      angle={angle}
      cut={typeof a.cut === 'number' ? a.cut : 0}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
    />
  );
}
