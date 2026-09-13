'use client';

/**
 * VectorScene, a GENERAL vector-algebra board (not one problem), now on the
 * @classytic/stage engine (SVG arrows, draggable tips, accessible).
 *
 * A creator declares named vectors; some are draggable (drag the tip to set
 * direction & magnitude), some are *derived* (sum or difference of others), and
 * any vector can be anchored tip-to-tail on another. The board shows the arrows,
 * optional dashed component (sin/cos) decomposition, and per-vector magnitude +
 * angle. One authored scene each = river crossing, rain-on-a-walker, relative
 * velocity, force balance, projectile components, … thousands of problems from
 * one tool.
 *
 *   <VectorScene vectors={[
 *     { id:'boat', dx:0, dy:4, draggable:true, label:'boat' },
 *     { id:'cur',  dx:2, dy:0, label:'current' },
 *     { id:'R', combine:{op:'add', of:['boat','cur']}, label:'resultant', components:true },
 *   ]} />
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Stage, Grid, Axes, Dot, MovableDot } from '@classytic/stage';
import { LabeledVector } from '../kit/diagram/annotations.js';
import { clamp, toDeg } from '../core/util.js';
import { MechanicsActivity } from './mechanics/activity.js';
import { ResetTransport, SceneSurface } from './mechanics/presentation.js';

type Vec = { x: number; y: number };

export interface SceneVector {
  id: string;
  /** Base components (ignored if `combine` is set). */
  dx?: number;
  dy?: number;
  /** Anchor the tail at another vector's tip (tip-to-tail); default = origin. */
  from?: string;
  /** Derived: components = of[0] (op) of[1]. */
  combine?: { op: 'add' | 'sub'; of: [string, string] };
  /** Drag the tip to set dx,dy (base vectors only). */
  draggable?: boolean;
  /** Show dashed x/y component decomposition. */
  components?: boolean;
  color?: string;
  label?: string;
}

export interface VectorSceneProps {
  vectors?: SceneVector[];
  view?: { xMin: number; xMax: number; yMin: number; yMax: number };
  title?: string;
  height?: number;
}

const DEFAULT: SceneVector[] = [
  { id: 'a', dx: 3, dy: 1, draggable: true, label: 'a', color: 'var(--stage-accent)' },
  { id: 'b', dx: 1, dy: 3, draggable: true, label: 'b', color: 'var(--stage-accent-2)' },
  {
    id: 'R',
    combine: { op: 'add', of: ['a', 'b'] },
    label: 'a + b',
    color: 'var(--stage-good)',
    components: true,
  },
];

interface Resolved {
  id: string;
  tail: Vec;
  comp: Vec;
  color: string;
  label?: string;
  components?: boolean;
  draggable?: boolean;
}

function resolveScene(vectors: SceneVector[], overrides: Record<string, Vec>): Resolved[] {
  const comp = new Map<string, Vec>();
  const tail = new Map<string, Vec>();
  const out: Resolved[] = [];
  for (const v of vectors) {
    let c: Vec;
    if (v.combine) {
      const a = comp.get(v.combine.of[0]) ?? { x: 0, y: 0 };
      const b = comp.get(v.combine.of[1]) ?? { x: 0, y: 0 };
      c = v.combine.op === 'sub' ? { x: a.x - b.x, y: a.y - b.y } : { x: a.x + b.x, y: a.y + b.y };
    } else {
      c = overrides[v.id] ?? { x: v.dx ?? 0, y: v.dy ?? 0 };
    }
    comp.set(v.id, c);
    const anchor =
      v.from && tail.has(v.from)
        ? {
            x: (tail.get(v.from) as Vec).x + (comp.get(v.from) as Vec).x,
            y: (tail.get(v.from) as Vec).y + (comp.get(v.from) as Vec).y,
          }
        : { x: 0, y: 0 };
    tail.set(v.id, anchor);
    out.push({
      id: v.id,
      tail: anchor,
      comp: c,
      color: v.color ?? 'var(--stage-accent)',
      label: v.label,
      components: v.components,
      draggable: v.draggable && !v.combine,
    });
  }
  return out;
}

function autoView(vectors: SceneVector[]): NonNullable<VectorSceneProps['view']> {
  const r = resolveScene(vectors, {});
  const xs = [0],
    ys = [0];
  for (const v of r) {
    xs.push(v.tail.x, v.tail.x + v.comp.x);
    ys.push(v.tail.y, v.tail.y + v.comp.y);
  }
  const pad = 1.5;
  const span = Math.max(2, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2,
    cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const half = span / 2 + pad;
  return { xMin: cx - half, xMax: cx + half, yMin: cy - half, yMax: cy + half };
}

export function VectorScene({
  vectors,
  view,
  title = 'Vectors',
  height = 340,
}: VectorSceneProps = {}): ReactNode {
  const vecs = vectors && vectors.length ? vectors : DEFAULT;
  const [overrides, setOverrides] = useState<Record<string, Vec>>({});
  const key = vecs.map((v) => `${v.id}:${v.dx},${v.dy}`).join('|');
  useEffect(() => {
    setOverrides({});
  }, [key]);

  const v = view ?? autoView(vecs);
  const resolved = resolveScene(vecs, overrides);
  const drawable = resolved.filter((r) => Math.hypot(r.comp.x, r.comp.y) > 1e-6);
  const draggables = resolved.filter((r) => r.draggable);
  const labelled = drawable.filter((r) => r.label);

  const figure = (
    <SceneSurface className="physics-vector-scene" tone="grid">
      <Stage
        view={v}
        height={height}
        ariaLabel={`Vector diagram: ${drawable.map((r) => r.label ?? r.id).join(', ')}`}
      >
        <Grid />
        <Axes />
        <Dot x={0} y={0} r={3} color="var(--stage-fg)" opacity={0.6} />
        {drawable.map((r) => (
          <LabeledVector
            key={r.id}
            tail={r.tail}
            comp={r.comp}
            color={r.color}
            label={r.label ? r.id : undefined}
            components={r.components}
          />
        ))}
        {draggables.map((r) => (
          <MovableDot
            key={`h-${r.id}`}
            value={{ x: r.tail.x + r.comp.x, y: r.tail.y + r.comp.y }}
            onMove={(p) =>
              setOverrides((o) => ({
                ...o,
                [r.id]: { x: clamp(p.x - r.tail.x, -50, 50), y: clamp(p.y - r.tail.y, -50, 50) },
              }))
            }
            color={r.color}
            ariaLabel={`tip of vector ${r.label ?? r.id}`}
          />
        ))}
      </Stage>
    </SceneSurface>
  );
  const aside =
    labelled.length > 0 ? (
      <div className="physics-vector-readout">
        {labelled.map((r) => {
          const mag = Math.hypot(r.comp.x, r.comp.y);
          const ang = toDeg(Math.atan2(r.comp.y, r.comp.x));
          return (
            <span key={r.id} style={{ '--vector-color': r.color } as CSSProperties}>
              <i aria-hidden="true" />
              <span>{r.label}</span>
              <strong>{mag.toFixed(1)}</strong>
              <small>{ang.toFixed(0)}°</small>
            </span>
          );
        })}
      </div>
    ) : undefined;

  const reset = (): void => setOverrides({});
  const primary = labelled[labelled.length - 1];
  const primaryMag = primary ? Math.hypot(primary.comp.x, primary.comp.y) : 0;
  const primaryAngle = primary ? toDeg(Math.atan2(primary.comp.y, primary.comp.x)) : 0;
  return (
    <MechanicsActivity
      className="physics-vector-scene"
      eyebrow="Vectors and motion"
      title={title}
      prompt={
        draggables.length > 0
          ? 'Drag a vector’s tip to change it; derived sums and components update live.'
          : 'Read the authored vector relationships and component construction.'
      }
      status={
        <>
          <strong>{draggables.length ? 'Interactive scene' : 'Authored scene'}</strong>
          <span>{drawable.length} vectors</span>
          {primary ? (
            <span>
              {primary.label} {primaryMag.toFixed(1)} ∠ {primaryAngle.toFixed(0)}°
            </span>
          ) : null}
        </>
      }
      figure={figure}
      instruments={aside ?? <p className="physics-explain">No labelled vectors in this scene.</p>}
      controls={
        <p className="physics-explain">
          {draggables.length
            ? 'Drag the visible handles; dependent vectors recompute from the authored add/subtract relationships.'
            : 'This scene is locked by the author for explanation or assessment.'}
        </p>
      }
      feedback="Every derived arrow is calculated from the authored vector graph, so one scene can model resultants, relative motion, components, or force balance."
      transport={
        <ResetTransport
          onReset={reset}
          state={draggables.length ? 'Drag to explore' : 'Reference scene'}
          detail={`${drawable.length} vector${drawable.length === 1 ? '' : 's'}`}
          resetLabel="Reset vector scene"
        />
      }
      canvasLabel="Authorable vector algebra scene"
      inspectorLabel="Vector measurements and scene guidance"
    />
  );
}
