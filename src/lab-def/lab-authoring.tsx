'use client';

/**
 * LabAuthoring — lazily render a lab's CUSTOM authoring UI (its own chunk, loaded only in the
 * editor). Same lazy shape as LabRuntime; used by manifestToBlock when a manifest declares
 * `loadAuthoring` instead of falling back to the schema-driven LabConfig.
 */

import { createElement, useEffect, useState, type ReactNode } from 'react';
import type { LabAuthoringComponent } from './define-lab.js';

export interface LabAuthoringProps {
  loader: () => Promise<{ default: LabAuthoringComponent }>;
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}

export function LabAuthoring({ loader, value, onChange }: LabAuthoringProps): ReactNode {
  const [Comp, setComp] = useState<LabAuthoringComponent | null>(null);
  useEffect(() => {
    let alive = true;
    loader().then(
      (mod) => {
        if (alive) setComp(() => mod.default);
      },
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [loader]);
  if (!Comp)
    return (
      <div aria-busy="true" style={{ padding: 8, fontSize: 12, color: 'var(--stage-muted)' }}>
        loading editor…
      </div>
    );
  return createElement(Comp, { value, onChange });
}
