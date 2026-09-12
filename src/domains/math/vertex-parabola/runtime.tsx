'use client';

/** Vertex-parabola runtime — adapter: default the stretch factor a. */
import type { ReactNode } from 'react';
import { VertexParabolaLab } from '../../../math/parabola/index.js';

export default function VertexParabola(a: Record<string, unknown>): ReactNode {
  return <VertexParabolaLab a={typeof a.a === 'number' ? a.a : 1} />;
}
