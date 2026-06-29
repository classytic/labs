'use client';

/**
 * GeometryBuilder, a visual, click-to-build editor for a `GeometryBoard` scene.
 *
 * Pick a tool, click the board: drop points, connect them into segments/lines,
 * draw circles (centre → through-point), mark the intersection of two
 * circles/lines, add midpoints and distance measures, drag points to move them,
 * or delete. It emits the SAME declarative `GeoElement[]` scene the board renders.
 *
 * Now on the @classytic/stage engine: the construction is converted to a SceneDoc
 * and rendered with stage's resolver + `renderElements` (SVG, accessible, real
 * draggable points), the canvas geometry math is gone. `GeometryBoard` is the
 * read-only render of this editor's output.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Dot, resolve, renderElements, isVec2, isCircleVal, isLineVal, ToolIcon, type IconName, type SceneDoc, type Vec2 } from '@classytic/stage';
import { geoSceneToDoc, type GeoElement } from './board/index.js';

type Tool = 'select' | 'point' | 'segment' | 'line' | 'circle' | 'intersect' | 'midpoint' | 'measure' | 'delete';

const TOOLS: { id: Tool; icon: IconName; label: string; hint: string }[] = [
  { id: 'select', icon: 'select', label: 'move', hint: 'drag a point to move it' },
  { id: 'point', icon: 'point', label: 'point', hint: 'click empty space to place a point' },
  { id: 'segment', icon: 'segment', label: 'segment', hint: 'click two points' },
  { id: 'line', icon: 'line', label: 'line', hint: 'click two points' },
  { id: 'circle', icon: 'circle', label: 'circle', hint: 'click centre, then a point on it' },
  { id: 'intersect', icon: 'intersect', label: 'intersect', hint: 'click two circles/lines' },
  { id: 'midpoint', icon: 'midpoint', label: 'midpoint', hint: 'click two points' },
  { id: 'measure', icon: 'measure', label: 'measure', hint: 'click two points' },
  { id: 'delete', icon: 'delete', label: 'delete', hint: 'click a point to remove it' },
];

const VIEW = { xMin: -8, xMax: 8, yMin: -5.5, yMax: 5.5 };
const snap = (v: number): number => Math.round(v * 2) / 2;
const POINT_KINDS = new Set(['point', 'intersect', 'midpoint']);

const nextPointId = (scene: GeoElement[]): string => {
  const used = new Set(scene.filter((e) => e.type === 'point').map((e) => (e as { id: string }).id));
  for (const ch of 'ABCDEFGHJKLMNOPQRSTUVWXYZ') if (!used.has(ch)) return ch;
  return `P${scene.length}`;
};
const nextId = (scene: GeoElement[], prefix: string): string => {
  let i = 1;
  const ids = new Set(scene.map((e) => (e as { id?: string }).id).filter(Boolean));
  while (ids.has(`${prefix}${i}`)) i++;
  return `${prefix}${i}`;
};

export interface GeometryBuilderProps {
  scene?: GeoElement[];
  onChange?: (scene: GeoElement[]) => void;
  title?: string;
  height?: number;
}

export function GeometryBuilder({ scene = [], onChange, title = 'Build a construction', height = 380 }: GeometryBuilderProps = {}): ReactNode {
  const [tool, setTool] = useState<Tool>('point');
  const [pending, setPending] = useState<string[]>([]); // selected ids awaiting a 2nd click

  const set = (next: GeoElement[]): void => onChange?.(next);

  const doc: SceneDoc = useMemo(() => geoSceneToDoc(scene, VIEW), [scene]);
  const resolved = useMemo(() => resolve(doc), [doc]);

  // resolved point positions for hit-testing (free + derived points)
  const points = useMemo(() => {
    const m = new Map<string, Vec2>();
    for (const el of scene) {
      if (!POINT_KINDS.has(el.type)) continue;
      const id = (el as { id: string }).id;
      const v = resolved.values.get(id);
      if (isVec2(v)) m.set(id, v);
    }
    return m;
  }, [scene, resolved]);

  const pointAt = (mx: number, my: number): string | null => {
    let best: string | null = null, bestD = 0.5;
    for (const [id, p] of points) { const d = Math.hypot(mx - p.x, my - p.y); if (d < bestD) { bestD = d; best = id; } }
    return best;
  };
  const elementAt = (mx: number, my: number): string | null => {
    let best: string | null = null, bestD = 0.4;
    for (const el of scene) {
      const id = (el as { id?: string }).id;
      if (!id) continue;
      const v = resolved.values.get(id);
      if (isCircleVal(v)) {
        const d = Math.abs(Math.hypot(mx - v.center.x, my - v.center.y) - v.r);
        if (d < bestD) { bestD = d; best = id; }
      } else if (isLineVal(v) && v.kind === 'line') {
        const dx = v.b.x - v.a.x, dy = v.b.y - v.a.y, L = Math.hypot(dx, dy) || 1;
        const dist = Math.abs((dy * (mx - v.a.x) - dx * (my - v.a.y)) / L);
        if (dist < bestD) { bestD = dist; best = id; }
      }
    }
    return best;
  };

  const onBuild = (p: [number, number]): void => {
    const [mx, my] = p;
    if (tool === 'select') return; // drag handled by renderElements' MovableDots
    if (tool === 'point') { const id = nextPointId(scene); set([...scene, { type: 'point', id, x: snap(mx), y: snap(my), draggable: true, label: id }]); return; }
    if (tool === 'delete') {
      const eid = pointAt(mx, my) ?? elementAt(mx, my);
      if (eid) set(scene.filter((el) => (el as { id?: string }).id !== eid));
      return;
    }
    if (tool === 'segment' || tool === 'line' || tool === 'midpoint' || tool === 'measure') {
      const pid = pointAt(mx, my); if (!pid) return;
      const next = [...pending, pid];
      if (next.length < 2) { setPending(next); return; }
      const a = next[0] as string, b = next[1] as string;
      if (tool === 'segment') set([...scene, { type: 'segment', from: a, to: b, color: 'var(--stage-good)' }]);
      else if (tool === 'line') set([...scene, { type: 'line', id: nextId(scene, 'l'), through: [a, b], color: 'var(--stage-fg)' }]);
      else if (tool === 'midpoint') { const id = nextId(scene, 'M'); set([...scene, { type: 'midpoint', id, of: [a, b], label: id }]); }
      else set([...scene, { type: 'measure', kind: 'distance', of: [a, b], label: `|${a}${b}|` }]);
      setPending([]);
      return;
    }
    if (tool === 'circle') {
      const pid = pointAt(mx, my); if (!pid) return;
      const next = [...pending, pid];
      if (next.length < 2) { setPending(next); return; }
      set([...scene, { type: 'circle', id: nextId(scene, 'c'), center: next[0] as string, through: next[1] as string, color: 'var(--stage-accent)' }]);
      setPending([]);
      return;
    }
    if (tool === 'intersect') {
      const eid = elementAt(mx, my); if (!eid) return;
      const next = [...pending, eid];
      if (next.length < 2) { setPending(next); return; }
      const id1 = nextId(scene, 'X');
      const add: GeoElement[] = [{ type: 'intersect', id: id1, of: [next[0] as string, next[1] as string], pick: 0, label: id1, color: 'var(--stage-warn)' }];
      const a = scene.find((el) => (el as { id?: string }).id === next[0]);
      const b = scene.find((el) => (el as { id?: string }).id === next[1]);
      if (a?.type === 'circle' && b?.type === 'circle') { const id2 = nextId([...scene, ...add], 'X'); add.push({ type: 'intersect', id: id2, of: [next[0] as string, next[1] as string], pick: 1, label: id2, color: 'var(--stage-warn)' }); }
      set([...scene, ...add]);
      setPending([]);
    }
  };

  // drag-to-move (select tool): renderElements drives free MovableDots through this
  const onPointMove = (id: string, p: Vec2, phase: 'move' | 'commit'): void => {
    const x = phase === 'commit' ? snap(p.x) : p.x;
    const y = phase === 'commit' ? snap(p.y) : p.y;
    set(scene.map((el) => (el.type === 'point' && el.id === id ? { ...el, x, y } : el)));
  };

  const hint = TOOLS.find((t) => t.id === tool)?.hint ?? '';

  return (
    <div className="not-prose my-4 overflow-hidden rounded-xl border border-border/70 bg-card">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 bg-muted/30 px-3 py-2">
        <span className="mr-1 text-sm font-semibold">{title}</span>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTool(t.id); setPending([]); }}
            className={[
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition',
              tool === t.id ? 'bg-primary text-primary-foreground' : 'border border-border/60 bg-background text-foreground hover:bg-muted',
            ].join(' ')}
          >
            <ToolIcon name={t.icon} />{t.label}
          </button>
        ))}
        <button type="button" onClick={() => set([])} className="ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive">clear</button>
      </div>
      <p className="px-3 pt-1.5 text-xs text-muted-foreground">{hint}{pending.length ? ` · ${pending.length} selected` : ''}</p>
      <Stage view={VIEW} height={height} onPointerMath={onBuild} ariaLabel={`Geometry construction editor, ${tool} tool`} className="cursor-crosshair">
        <Grid />
        <Axes />
        {renderElements(doc, resolved, { draggablePoints: tool === 'select', onPointMove })}
        {pending.map((id) => { const p = points.get(id); return p ? <Dot key={`sel-${id}`} x={p.x} y={p.y} r={8} color="var(--stage-warn)" opacity={0.6} /> : null; })}
      </Stage>
    </div>
  );
}
