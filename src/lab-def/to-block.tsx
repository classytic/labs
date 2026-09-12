'use client';

/**
 * manifestToBlock — a `LabManifest` → a cms-ui `CmsBlock`.
 *
 * Unlike the current lazy authoring path (blocks/lazy.tsx), which reconstructs blocks
 * with `z.any()` and so LOSES validation/defaults/hints (review finding #3), this uses
 * the manifest's REAL schema: the editing panel is the schema-driven `LabConfig` (with
 * inline validation + `.describe()` hints), and the runtime is the per-lab lazy chunk.
 */

import type { ReactNode } from 'react';
import { defineBlock, type CmsBlock } from '@classytic/cms-ui/contract';
import { parseAuthoredAttrs } from './attrs.js';
import { LabConfig } from '../blocks/lab-config.js';
import { LabRenderBoundary, LabRuntime } from './lab-runtime.js';
import { LabAuthoring } from './lab-authoring.js';
import { labTag, type LabManifest } from './define-lab.js';

export function manifestToBlock(manifest: LabManifest): CmsBlock {
  const loader = manifest.loadRuntime as () => Promise<{
    default: (attrs: Record<string, unknown>) => ReactNode;
  }>;
  return defineBlock({
    key: manifest.id,
    void: true,
    tag: manifest.tag ?? labTag(manifest.id),
    label: manifest.title,
    description: manifest.description,
    category: 'interactive',
    // Inserted via the visual gallery, not the `/` menu (keeps the slash list short).
    slash: false,
    // The REAL schema — authoring validates and round-trips defaults, not `z.any()`.
    schema: manifest.schema,
    /**
     * Repair structured attributes on read: MDX accepts any JS expression, but the editor's
     * round-trip reads them with `JSON.parse`, so an ordinary object literal (`{items:[…]}`,
     * unquoted keys) arrives as a raw string and the lab throws. See `parseAuthoredValue`.
     */
    fromAttrs: parseAuthoredAttrs,
    Component: ({ attributes, mode, updateAttributes, children }) => {
      // Editing any value changes the signature, which clears a caught render error.
      const resetKey = mode === 'editing' ? JSON.stringify(attributes) : undefined;
      const runtime = (
        <LabRenderBoundary {...(resetKey === undefined ? {} : { resetKey })}>
          <LabRuntime loader={loader} attributes={attributes} />
        </LabRenderBoundary>
      );
      if (mode !== 'editing' || !updateAttributes)
        return (
          <>
            {runtime}
            {children}
          </>
        );
      const onChange = updateAttributes as (patch: Record<string, unknown>) => void;
      // A custom visual editor (loadAuthoring) beats the auto-form when the schema can't
      // express it (e.g. a construction builder); otherwise the schema-driven LabConfig.
      const panel = manifest.loadAuthoring ? (
        <LabAuthoring loader={manifest.loadAuthoring} value={attributes} onChange={onChange} />
      ) : (
        <LabConfig
          schema={manifest.schema}
          value={attributes}
          onChange={onChange}
          {...(manifest.omit ? { omit: manifest.omit } : {})}
        />
      );
      return (
        <div>
          {panel}
          {runtime}
        </div>
      );
    },
  }) as CmsBlock;
}
