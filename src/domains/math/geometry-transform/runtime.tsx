'use client';

/** Geometry-transform runtime — adapter: build the discriminated Transform from the flat authored
 *  fields (only the fields for the chosen kind matter). */
import type { ReactNode } from 'react';
import { TransformLab, type Transform, type ReflectAxis } from '../../../math/transform/index.js';

export default function GeoTransform(a: Record<string, unknown>): ReactNode {
  const kind = (a.kind as 'translate' | 'reflect' | 'rotate' | 'enlarge') ?? 'translate';
  const transform: Transform =
    kind === 'translate'
      ? { kind, by: { x: (a.byX as number) ?? 5, y: (a.byY as number) ?? 1 } }
      : kind === 'reflect'
        ? { kind, axis: (a.axis as ReflectAxis) ?? 'y' }
        : kind === 'rotate'
          ? { kind, deg: (a.deg as number) ?? 90, about: { x: 0, y: 0 } }
          : { kind: 'enlarge', k: (a.k as number) ?? 2, about: { x: 0, y: 0 } };
  return (
    <TransformLab
      transform={transform}
      title={a.title as string | undefined}
      prompt={a.prompt as string | undefined}
      activity={a.activity as string | undefined}
    />
  );
}
