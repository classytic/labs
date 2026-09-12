'use client';

/** Geometry board AUTHORING — the visual click-to-build editor (its own chunk, editor-only).
 *  Renders GeometryBuilder + a title field; no id/coordinate typing. */
import type { ReactNode } from 'react';
import { GeometryBuilder } from '../../../geometry/builder.js';
import { TextField } from '../../../blocks/authoring.js';
import { asScene } from './scene.js';

export default function GeometryBoardAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const scene = asScene(value.scene);
  const title = (value.title as string) ?? 'Geometry';
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-muted-foreground">Title</span>
        <TextField value={title} onChange={(v) => onChange({ title: v })} className="flex-1" />
      </div>
      <GeometryBuilder
        scene={scene}
        title={title}
        onChange={(s) => onChange({ scene: s as unknown as Record<string, unknown>[] })}
      />
    </div>
  );
}
