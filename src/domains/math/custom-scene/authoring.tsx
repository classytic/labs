'use client';

/** Custom-scene authoring — the SceneStudio form (emoji / shape) writing the spec back to attrs. */
import type { ReactNode } from 'react';
import { SceneStudio } from '../../../kit/scene-studio.js';
import { customSceneSpec, customSceneAttrs } from './shared.js';

export default function CustomSceneAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const spec = customSceneSpec(value);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <SceneStudio spec={spec} onChange={(s) => onChange(customSceneAttrs(s))} />
      <p style={{ fontSize: 12, color: 'var(--stage-muted)', margin: 0 }}>
        Tip: put this above a lab, then pick “{spec.name}” in that lab’s scene dropdown.
      </p>
    </div>
  );
}
