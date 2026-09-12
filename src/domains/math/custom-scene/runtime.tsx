'use client';

/** Custom-scene runtime — registering the scene IS the effect (idempotent): it makes the skin
 *  available to any lab rendered below, then shows a "ready" confirmation. */
import type { ReactNode } from 'react';
import { registerDataScene } from '../../../kit/data-scene.js';
import { customSceneSpec } from './shared.js';

export default function CustomScene(a: Record<string, unknown>): ReactNode {
  const spec = customSceneSpec(a);
  registerDataScene(spec);
  return (
    <div
      className="not-prose"
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 13,
        color: 'var(--stage-good)',
        border: '1px solid var(--stage-good)',
      }}
    >
      ✓ Scene “{spec.name}” is ready, choose it in a lab’s scene list below.
    </div>
  );
}
