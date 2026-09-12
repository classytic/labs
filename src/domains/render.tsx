'use client';

/**
 * LIGHT learner render map for migrated labs — tag → per-lab lazy component. Built from the
 * GENERATED pure loader map (render-map.ts), NOT from the manifests, so importing this pulls
 * zero schemas/zod and only tiny per-lab loaders: a lesson player downloads only the labs it
 * renders. Free of `@classytic/cms-ui` (no editor code) — each value renders `<LabRuntime>`.
 */

import type { ReactNode } from 'react';
import { LabRuntime } from '../lab-def/lab-runtime.js';
import { labRuntimeLoaders, labTags, type LabRuntimeLoader } from './render-map.js';

const wrap = (loader: LabRuntimeLoader): ((attrs: Record<string, unknown>) => ReactNode) => {
  function LabTag(attrs: Record<string, unknown>): ReactNode {
    return <LabRuntime loader={loader} attributes={attrs} />;
  }
  return LabTag;
};

/** tag → render component (per-lab lazy). */
export const manifestComponents: Record<string, (attrs: Record<string, unknown>) => ReactNode> =
  Object.fromEntries(
    Object.entries(labRuntimeLoaders).map(([id, loader]) => [labTags[id] ?? id, wrap(loader)]),
  );

/** Same components keyed by lab KEY (the gallery preview resolves by key). */
export const manifestComponentsByKey: Record<string, (attrs: Record<string, unknown>) => ReactNode> =
  Object.fromEntries(Object.entries(labRuntimeLoaders).map(([id, loader]) => [id, wrap(loader)]));
