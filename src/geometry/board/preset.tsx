'use client';

/**
 * GeometryBoard, a declarative interactive-geometry engine, now on the
 * @classytic/stage scene model. A creator describes a CONSTRUCTION as a list of
 * `GeoElement`s; we convert it to a portable SceneDoc and let stage's resolver
 * do the dependency math (circle/line intersection, midpoints) + dragging +
 * a11y. The canvas geometry math is gone, stage already owns it.
 *
 *   <GeometryBoard scene={[
 *     { type:'point', id:'A', x:3, y:0, draggable:true },
 *     { type:'circle', id:'cA', center:'A', radius:3.2 },
 *     { type:'intersect', id:'P', of:['cA','cB'], pick:0 },
 *   ]} />
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Scene, type SceneDoc, type SceneElement, type ViewBox } from '@classytic/stage';
import { LabFrame } from '../../kit/frame.js';

type View = ViewBox;

export type GeoElement =
  | { type: 'point'; id: string; x: number; y: number; draggable?: boolean; label?: string; color?: string }
  | { type: 'circle'; id: string; center: string; radius?: number; through?: string; color?: string }
  | { type: 'line'; id?: string; through: [string, string]; color?: string; dashed?: boolean }
  | { type: 'segment'; id?: string; from: string; to: string; color?: string; label?: string; dashed?: boolean }
  | { type: 'intersect'; id: string; of: [string, string]; pick?: 0 | 1; label?: string; color?: string }
  | { type: 'midpoint'; id: string; of: [string, string]; label?: string; color?: string }
  | { type: 'measure'; kind: 'distance'; of: [string, string]; label?: string };

export interface GeometryBoardProps {
  scene?: GeoElement[];
  view?: View;
  title?: string;
  prompt?: string;
  subtitle?: string;
  height?: number;
}

const DEFAULT_VIEW: View = { xMin: -1, xMax: 11, yMin: -5, yMax: 5 };

/** Convert a declarative geometry construction into a portable SceneDoc. Stable
 *  ids (index-based for unnamed segments/lines/measures) keep resolve continuity. */
export function geoSceneToDoc(scene: GeoElement[], view: View): SceneDoc {
  const elements: SceneElement[] = scene.map((el, i): SceneElement => {
    switch (el.type) {
      case 'point':
        return { id: el.id, kind: 'point', label: el.label, style: { color: el.color }, free: { at: { x: el.x, y: el.y }, draggable: el.draggable } };
      case 'circle':
        return { id: el.id, kind: 'circle', style: { color: el.color }, def: { op: 'circle', center: { ref: el.center }, ...(el.radius != null ? { radius: el.radius } : {}), ...(el.through ? { through: { ref: el.through } } : {}) } };
      case 'line':
        return { id: el.id ?? `l${i}`, kind: 'line', style: { color: el.color, dashed: el.dashed }, def: { op: 'line', through: [{ ref: el.through[0] }, { ref: el.through[1] }] } };
      case 'segment':
        return { id: el.id ?? `s${i}`, kind: 'segment', label: el.label, style: { color: el.color, dashed: el.dashed }, def: { op: 'segment', from: { ref: el.from }, to: { ref: el.to } } };
      case 'intersect':
        return { id: el.id, kind: 'point', label: el.label, style: { color: el.color }, def: { op: 'intersect', of: [{ ref: el.of[0] }, { ref: el.of[1] }], pick: el.pick ?? 0 } };
      case 'midpoint':
        return { id: el.id, kind: 'point', label: el.label, style: { color: el.color }, def: { op: 'midpoint', of: [{ ref: el.of[0] }, { ref: el.of[1] }] } };
      case 'measure':
        return { id: `d${i}`, kind: 'measure', label: el.label, def: { op: 'distance', of: [{ ref: el.of[0] }, { ref: el.of[1] }] } };
    }
  });
  return { schemaVersion: 2, type: 'stage-scene', view, elements, bindings: [] };
}

export function GeometryBoard({
  scene = [],
  view = DEFAULT_VIEW,
  title = 'Geometry construction',
  prompt = 'Drag the points to explore the construction.',
  height = 360,
}: GeometryBoardProps): ReactNode {
  const initial = useMemo(() => geoSceneToDoc(scene, view), [scene, view]);
  const [doc, setDoc] = useState<SceneDoc>(initial);
  useEffect(() => { setDoc(initial); }, [initial]);

  const figure = (
    <Scene doc={doc} onChange={setDoc} interactive showGrid showAxes height={height} ariaLabel={title} />
  );

  return <LabFrame title={title} prompt={prompt}>{figure}</LabFrame>;
}
