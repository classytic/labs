'use client';

/**
 * TransformLab, the geometry-transformation lab that was missing entirely: translate,
 * reflect, rotate, enlarge, one authorable lab switched by `kind` (the same one-lab-many-
 * modes shape as StraightLineLab). The learner reads the move, fills its parameters from a
 * tile tray ("translate by (▢,▢)", "rotate ▢ about O"), and on a correct fill the shape
 * FLIES to the ghost targets, the reward that makes "send the points to the targets" land.
 *
 * Almost no new engine code: the math is stage core (`vec.rotateAbout` / `vec.lerp` + a
 * 6-line applyTf), the drawing is `Polygon`/`Point`/`Circle`/`Vector`, and the answer UI is
 * the shared inline slot engine (`useSlotFill` + `Blank` + `SlotTray`). A creator sets the
 * shape, the transform, and the distractor tiles, no code.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Polygon, Polyline, Point, Circle, Vector, Label, vec, type Vec2 } from '@classytic/stage';
import { CoordPlane } from '../../kit/coords.js';
import { LabFrame } from '../../kit/frame.js';
import { useSlotFill, Blank, SlotTray, type FillSlot } from '../../kit/slot-fill.js';
import { useReducedMotion } from '../../kit/anim.js';

export type TransformKind = 'translate' | 'reflect' | 'rotate' | 'enlarge';
export type ReflectAxis = 'x' | 'y' | 'y=x' | 'y=-x';

export interface Transform {
  kind: TransformKind;
  /** translate */ by?: Vec2;
  /** reflect */ axis?: ReflectAxis;
  /** rotate (deg, anticlockwise) */ deg?: number;
  /** enlarge (scale factor) */ k?: number;
  /** rotate/enlarge centre (default origin). */ about?: Vec2;
}

export interface TransformProps {
  /** The shape to transform (≥3 pts → filled polygon; else just points). */
  shape?: Vec2[];
  transform?: Transform;
  view?: { xMin: number; xMax: number; yMin: number; yMax: number };
  height?: number;
  /** Extra wrong tiles for the tray (translate). */
  distractors?: number[];
  title?: string;
  prompt?: string;
  activity?: string;
}

const C_SRC = 'var(--stage-accent)';
const C_IMG = 'var(--stage-good)';
const C_GHOST = 'var(--stage-muted)';

/** Apply a transform to a point. Pure, all from stage core math. */
export function applyTf(p: Vec2, t: Transform): Vec2 {
  const o = t.about ?? { x: 0, y: 0 };
  switch (t.kind) {
    case 'translate': return { x: p.x + (t.by?.x ?? 0), y: p.y + (t.by?.y ?? 0) };
    case 'reflect':
      switch (t.axis ?? 'y') {
        case 'x': return { x: p.x, y: -p.y };
        case 'y': return { x: -p.x, y: p.y };
        case 'y=x': return { x: p.y, y: p.x };
        case 'y=-x': return { x: -p.y, y: -p.x };
      }
      return p;
    case 'rotate': return vec.rotateAbout(p, o, ((t.deg ?? 0) * Math.PI) / 180);
    case 'enlarge': return { x: o.x + (p.x - o.x) * (t.k ?? 1), y: o.y + (p.y - o.y) * (t.k ?? 1) };
  }
}

const AXIS_LABEL: Record<ReflectAxis, string> = { x: 'x-axis', y: 'y-axis', 'y=x': 'y = x', 'y=-x': 'y = −x' };
const easeOut = (t: number): number => 1 - (1 - t) ** 3;

const DEFAULTS: Record<TransformKind, Transform> = {
  translate: { kind: 'translate', by: { x: 5, y: 1 } },
  reflect: { kind: 'reflect', axis: 'y' },
  rotate: { kind: 'rotate', deg: 90, about: { x: 0, y: 0 } },
  enlarge: { kind: 'enlarge', k: 2, about: { x: 0, y: 0 } },
};
const PROMPTS: Record<TransformKind, string> = {
  translate: 'Complete the translation to send the shape onto the targets.',
  reflect: 'Pick the mirror line that lands the shape on the targets.',
  rotate: 'Pick the turn (about O) that lands the shape on the targets.',
  enlarge: 'Pick the scale factor (centre O) that lands the shape on the targets.',
};

export function TransformLab(props: TransformProps = {}): ReactNode {
  const kind: TransformKind = props.transform?.kind ?? 'translate';
  const tf: Transform = props.transform ?? DEFAULTS[kind];
  const {
    shape = [{ x: -4, y: 0 }, { x: -2, y: 0 }, { x: -2, y: 2 }],
    view = { xMin: -6, xMax: 6, yMin: -4, yMax: 6 }, height = 380,
    title = 'Transformations', prompt = PROMPTS[kind], activity = `transform-${kind}`,
  } = props;

  const targets = shape.map((p) => applyTf(p, tf));

  // ── per-kind answer slots + tile tray ───────────────────────────────────────
  let slots: FillSlot[];
  let tiles: (string | number)[];
  if (kind === 'translate') {
    const bx = tf.by?.x ?? 0, by = tf.by?.y ?? 0;
    slots = [{ id: 'dx', answer: bx }, { id: 'dy', answer: by }];
    const lo = Math.min(-3, bx - 2, by - 2), hi = Math.max(3, bx + 2, by + 2);
    const pool = new Set<number>([bx, by, ...(props.distractors ?? [])]);
    for (let v = lo; v <= hi; v++) pool.add(v);
    tiles = [...pool].sort((a, b) => a - b);
  } else if (kind === 'reflect') {
    const ax = tf.axis ?? 'y';
    slots = [{ id: 'axis', answer: AXIS_LABEL[ax] }];
    tiles = ['x-axis', 'y-axis', 'y = x', 'y = −x'];
  } else if (kind === 'rotate') {
    const d = tf.deg ?? 90;
    slots = [{ id: 'deg', answer: `${d}°` }];
    tiles = ['90°', '180°', '270°'];
  } else {
    const k = tf.k ?? 2;
    slots = [{ id: 'k', answer: String(k) }];
    tiles = ['2', '3', '4'];
  }

  const reduce = useReducedMotion();
  const [prog, setProg] = useState(0);
  const fill = useSlotFill(slots, tiles, activity);
  const solved = fill.solved;

  useEffect(() => {
    if (!solved) { setProg(0); return; }
    if (reduce) { setProg(1); return; }
    let raf = 0; let start = 0;
    const tick = (now: number): void => {
      if (!start) start = now;
      const e = Math.min(1, (now - start) / 700);
      setProg(easeOut(e));
      if (e < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [solved, reduce]);

  const current = shape.map((p, i) => vec.lerp(p, targets[i]!, prog));
  const isPoly = shape.length >= 3;
  const about = tf.about ?? { x: 0, y: 0 };

  const figure = (
    <CoordPlane view={view} height={height} stepX={1} stepY={1} ariaLabel={`${title}: ${kind}`}>
      {/* ghost targets (where the shape must land) */}
      {isPoly
        ? <Polyline points={[...targets, targets[0]!]} color={C_GHOST} weight={1.5} dashed opacity={0.7} />
        : null}
      {targets.map((t, i) => <Circle key={`t${i}`} center={t} r={0.26} color={C_GHOST} weight={2} fill="none" />)}

      {/* centre marker for rotate/enlarge */}
      {(kind === 'rotate' || kind === 'enlarge') && (
        <>
          <Point x={about.x} y={about.y} r={4} color={C_GHOST} />
          <Label x={about.x} y={about.y} text="O" dx={-10} dy={-8} size={12} color={C_GHOST} />
        </>
      )}

      {/* the moving shape */}
      {isPoly && <Polygon points={current} color={solved ? C_IMG : C_SRC} fill={solved ? C_IMG : C_SRC} fillOpacity={0.18} weight={2.5} />}
      {current.map((p, i) => <Point key={`p${i}`} x={p.x} y={p.y} r={6} color={solved ? C_IMG : C_SRC} />)}

      {/* translation arrows from each source vertex (a visible hint of the move) */}
      {kind === 'translate' && prog < 0.05 && shape.map((p, i) => (
        <Vector key={`v${i}`} tail={p} tip={targets[i]!} color={C_GHOST} weight={1.5} opacity={0.5} />
      ))}
    </CoordPlane>
  );

  // ── the inline instruction with blanks ──────────────────────────────────────
  const instruction = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontWeight: 700, fontSize: 16 }}>
      {kind === 'translate' && <>translate by ( <Blank fill={fill} id="dx" /> , <Blank fill={fill} id="dy" /> )</>}
      {kind === 'reflect' && <>reflect in the <Blank fill={fill} id="axis" width={72} /></>}
      {kind === 'rotate' && <>rotate <Blank fill={fill} id="deg" /> anticlockwise about O</>}
      {kind === 'enlarge' && <>enlarge by scale factor <Blank fill={fill} id="k" /> , centre O</>}
    </span>
  );

  const footer = (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center', marginTop: 4 }}>
      {instruction}
      <SlotTray fill={fill} />
      {solved && <p role="status" style={{ margin: 0, color: 'var(--stage-good)', fontWeight: 700 }}>✓ Landed on the targets.</p>}
    </div>
  );

  return <LabFrame title={title} prompt={prompt} footer={footer}>{figure}</LabFrame>;
}
