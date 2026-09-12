'use client';

import { createElement, type ReactNode } from 'react';
import type { LabDomain } from './catalog.js';
import { manifestComponentsByKey } from '../domains/blocks.js';

export interface LazyLabProps {
  domain?: LabDomain;
  blockKey: string;
  fallback?: ReactNode;
  attributes: Record<string, unknown>;
  mode?: string;
  updateAttributes?: (patch: Record<string, unknown>) => void;
  children?: ReactNode;
}

/** Resolve exclusively through the per-lab manifest registry. */
export function LazyLab({ blockKey, attributes }: LazyLabProps): ReactNode {
  const Component = manifestComponentsByKey[blockKey];
  if (Component) return createElement(Component, attributes);
  return (
    <div role="alert" className="lab-load-error">
      Unknown lab “{blockKey}”. Regenerate the manifest registry.
    </div>
  );
}
