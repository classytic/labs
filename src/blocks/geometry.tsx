/**
 * @classytic/labs/blocks — geometry lab block specs.
 *
 * `defineBlock` editor adapters for the geometry labs (one domain per file; the
 * registry is assembled in `./index.ts`). Each spec pairs a zod schema with a
 * render `Component` that, in `mode === 'editing'`, shows the authoring kit
 * (`./authoring`). `@classytic/cms-ui` + `zod` are optional peers touched only
 * by the blocks layer.
 */

import { defineBlock } from '@classytic/cms-ui/contract';
import { z } from 'zod';
import { ConfigPanel, ConfigRow, TextField, NumField } from './authoring.js';
import { IntersectingCircles, GeometryBoard, GeometryBuilder, type GeoElement } from '../geometry/index.js';

// The general geometry authoring tool: creators DECLARE a construction.
const DEFAULT_SCENE: GeoElement[] = [
  { type: 'point', id: 'A', x: 3, y: 0, draggable: true, label: 'A' },
  { type: 'point', id: 'B', x: 6, y: 0, draggable: true, label: 'B' },
  { type: 'circle', id: 'cA', center: 'A', radius: 3 },
  { type: 'circle', id: 'cB', center: 'B', radius: 3 },
  { type: 'intersect', id: 'P', of: ['cA', 'cB'], pick: 0, label: 'P' },
  { type: 'intersect', id: 'Q', of: ['cA', 'cB'], pick: 1, label: 'Q' },
  { type: 'segment', from: 'P', to: 'Q', label: 'chord' },
  { type: 'measure', kind: 'distance', of: ['P', 'Q'], label: '|PQ|' },
];
const asScene = (raw: unknown): GeoElement[] => (Array.isArray(raw) && raw.length ? (raw as GeoElement[]) : DEFAULT_SCENE);

export const GeometryBoardBlock = defineBlock({
  key: 'geometry-board',
  void: true,
  label: 'Geometry board',
  description: 'Build a construction — points, circles, lines & computed intersections. Drag points live.',
  category: 'interactive',
  schema: z.object({
    scene: z.array(z.record(z.string(), z.unknown())).optional(),
    title: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const scene = asScene(attributes.scene);
    const title = attributes.title ?? 'Geometry';
    if (mode !== 'editing' || !updateAttributes) return <GeometryBoard scene={scene} title={title} />;
    // Visual click-to-build authoring (no id/coordinate typing).
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-muted-foreground">Title</span>
          <TextField value={title} onChange={(v) => updateAttributes({ title: v })} className="flex-1" />
        </div>
        <GeometryBuilder
          scene={scene}
          title={title}
          onChange={(s) => updateAttributes({ scene: s as unknown as Record<string, unknown>[] })}
        />
      </div>
    );
  },
});

export const IntersectingCirclesBlock = defineBlock({
  key: 'intersecting-circles',
  void: true,
  label: 'Intersecting circles',
  description: 'Common chord of two circles — drag the centres, chord length by Pythagoras.',
  category: 'interactive',
  schema: z.object({ r1: z.number().optional(), r2: z.number().optional(), title: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const r1 = typeof attributes.r1 === 'number' ? attributes.r1 : 3.2;
    const r2 = typeof attributes.r2 === 'number' ? attributes.r2 : 2.8;
    const title = attributes.title ?? 'Common chord of two circles';
    const widget = <IntersectingCircles r1={r1} r2={r2} title={title} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={title} onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="r₁ / r₂">
            <NumField value={r1} onChange={(v) => updateAttributes({ r1: v })} />
            <NumField value={r2} onChange={(v) => updateAttributes({ r2: v })} />
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const geometryBlocks = [
  GeometryBoardBlock,
  IntersectingCirclesBlock,
] as const;

export const geometryComponents = {
  GeometryBoard,
  IntersectingCircles,
} as const;
