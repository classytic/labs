'use client';

/**
 * VectorBoard — the GENERAL, authorable vector lab (CAIE/IGCSE).
 *
 * A creator declares vectors (tail, components, colour, label, draggable) + how
 * to combine them (`sum` → resultant, tip-to-tail / parallelogram; `diff` →
 * relative velocity, the rain / "V_RC = V_C − V_A" case) + an optional
 * drag-to-match goal. From this one board: resultant addition, component
 * resolution, river-crossing, walking-home, relative-velocity — all as DATA.
 *
 * Built entirely on @classytic/stage primitives (Vector, MovableDot, Axes, vec
 * math, useLearner) + the shared LabeledVector / AngleArc helpers — nothing
 * reinvented. Drag a head, watch the resultant + angle update; land it on the
 * target to solve.
 */

import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Stage, Axes, Vector, Segment, MovableDot, Label, vec, type Vec2 } from '@classytic/stage';
import { LabeledVector, AngleArc, RightAngleMark } from '../../kit/diagram.js';
import { useCheckpoint, useHints, HintLadder, Feedback } from '../../kit/pedagogy.js';
import { LabFrame, Callout, LiveRegion } from '../../kit/frame.js';
import { RichText } from '../../kit/rich.js';
import { toDeg } from '../../core/util.js';

export interface BoardVector {
  id?: string;
  /** Tail anchor (default origin). */
  tail?: Vec2;
  /** Components (dx, dy) from the tail. */
  comp: Vec2;
  color?: string;
  label?: string;
  /** Head is draggable by the learner. */
  drag?: boolean;
}

export interface VectorBoardProps {
  view?: { xMin: number; xMax: number; yMin: number; yMax: number };
  vectors: BoardVector[];
  /** sum → a+b+… resultant; diff → a−b (relative velocity); none → no resultant. */
  combine?: 'sum' | 'diff' | 'none';
  resultantLabel?: string;
  resultantColor?: string;
  show?: { components?: boolean; angle?: boolean; magnitude?: boolean; parallelogram?: boolean };
  /** Drag-to-match: solved when the resultant lands within `tol` of `match`. */
  goal?: { match: Vec2; tol?: number };
  /** Snap dragged heads to this grid (math units). */
  snap?: number;
  /** Learner-visible objectives (goal banner). */
  objectives?: string[];
  /** Progressive hints (each taken docks the score). */
  hints?: string[];
  title?: string;
  prompt?: string;
  height?: number;
}

const ORIGIN: Vec2 = { x: 0, y: 0 };
const PALETTE = ['var(--stage-accent)', 'var(--stage-accent-2)', 'var(--stage-good)'];

/**
 * Frame the board to everything that matters — origin, every arrow tip, the
 * resultant, and the goal — with padding, snapped to integers for clean axes.
 * Computed from the AUTHORED vectors (not live drag state) so the view stays put
 * while the learner drags, and the resultant can never shoot off-frame.
 */
function autoView(vectors: BoardVector[], combine: VectorBoardProps['combine'], goal?: { match: Vec2 }): NonNullable<VectorBoardProps['view']> {
  const comps = vectors.map((v) => v.comp);
  const pts: Vec2[] = [ORIGIN];
  vectors.forEach((v, i) => pts.push(vec.add(v.tail ?? ORIGIN, comps[i] ?? ORIGIN)));
  if (combine === 'diff') pts.push(vec.sub(comps[0] ?? ORIGIN, comps[1] ?? ORIGIN));
  else if (combine !== 'none') pts.push(comps.reduce<Vec2>((a, c) => vec.add(a, c), ORIGIN));
  if (goal) pts.push(goal.match);
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const pad = 1.6;
  return {
    xMin: Math.floor(Math.min(0, ...xs) - pad),
    xMax: Math.ceil(Math.max(0, ...xs) + pad),
    yMin: Math.floor(Math.min(0, ...ys) - pad),
    yMax: Math.ceil(Math.max(0, ...ys) + pad),
  };
}

export function VectorBoardLab({
  view: viewProp,
  vectors,
  combine = 'sum',
  resultantLabel = 'R',
  resultantColor = 'var(--stage-warn)',
  show = { angle: true, magnitude: true },
  goal,
  snap = 1,
  objectives,
  hints: hintList,
  title = 'Vectors',
  prompt = 'Drag the arrow heads.',
  height = 320,
}: VectorBoardProps): ReactNode {
  const [comps, setComps] = useState<Vec2[]>(() => vectors.map((v) => v.comp));
  useEffect(() => { setComps(vectors.map((v) => v.comp)); }, [vectors]);

  const view = useMemo(() => viewProp ?? autoView(vectors, combine, goal), [viewProp, vectors, combine, goal]);

  const tailOf = (i: number): Vec2 => vectors[i]?.tail ?? ORIGIN;
  const tipOf = (i: number): Vec2 => vec.add(tailOf(i), comps[i] ?? ORIGIN);
  const snapV = (v: number): number => (snap ? Math.round(v / snap) * snap : v);

  // resultant (from origin)
  const resultant = useMemo<Vec2 | null>(() => {
    if (combine === 'none' || comps.length === 0) return null;
    if (combine === 'diff') return vec.sub(comps[0] ?? ORIGIN, comps[1] ?? ORIGIN);
    return comps.reduce<Vec2>((acc, c) => vec.add(acc, c), ORIGIN);
  }, [comps, combine]);

  const tol = goal?.tol ?? 0.45;
  const solved = !!(goal && resultant && vec.dist(resultant, goal.match) <= tol);

  const hints = useHints(hintList);
  useCheckpoint({ solved, activity: 'vector-board', hintsUsed: hints.count });

  const resMag = resultant ? vec.mag(resultant) : 0;
  const resDeg = resultant ? Math.round(toDeg(vec.angle(resultant))) : 0;
  const resColor = solved ? 'var(--stage-good)' : resultantColor;
  // a lone summed vector already IS the resultant — don't draw/label a duplicate
  const showResultant = !!resultant && !(combine === 'sum' && vectors.length === 1);

  // misconception: right magnitude, wrong direction (a common drag-to-match error)
  const misconception = goal && !solved && resultant && Math.abs(vec.mag(resultant) - vec.mag(goal.match)) < tol
    ? 'Right length — now fix the direction (rotate it onto the target).'
    : undefined;

  const figure = (
    <Stage view={view} height={height} preserveAspect ariaLabel={`${title}; resultant magnitude ${resMag.toFixed(1)} at ${resDeg} degrees`}>
        <Axes labels />

        {/* faint target the learner is matching */}
        {goal && <Vector tail={ORIGIN} tip={goal.match} color="var(--stage-good)" weight={2} opacity={0.28} />}

        {/* parallelogram construction (a + b law) */}
        {show.parallelogram && combine === 'sum' && resultant && comps.length === 2 && (
          <>
            <Segment from={comps[0] ?? ORIGIN} to={resultant} color="var(--stage-muted)" dashed weight={1.2} opacity={0.6} />
            <Segment from={comps[1] ?? ORIGIN} to={resultant} color="var(--stage-muted)" dashed weight={1.2} opacity={0.6} />
          </>
        )}

        {/* authored vectors — magnitude label anchored ⅔ along the shaft (out
            near the fanned-apart TIPS, NOT the shared origin where every label
            would pile up) and pushed perpendicular off the line. Shown as
            |a| = 4.1 so it can't be read as a coordinate. */}
        {vectors.map((v, i) => {
          const col = v.color ?? PALETTE[i % PALETTE.length];
          const c = comps[i];
          if (!c) return null;
          const t = tailOf(i);
          const magStr = vec.mag(c).toFixed(1);
          const text = v.label ? (show.magnitude ? `|${v.label}| = ${magStr}` : v.label) : (show.magnitude ? magStr : '');
          // anchor along the shaft, then push perpendicular onto the side AWAY
          // from the resultant (the busy centre) — so labels land in the empty
          // wedges, never on a shaft, the handle, or each other.
          const at = { x: t.x + c.x * 0.62, y: t.y + c.y * 0.62 };
          const L = Math.hypot(c.x, c.y) || 1;
          let pmx = -c.y / L, pmy = c.x / L;          // math-space unit perpendicular
          const ref = resultant ?? { x: c.x, y: c.y };
          if (pmx * (ref.x - at.x) + pmy * (ref.y - at.y) > 0) { pmx = -pmx; pmy = -pmy; }
          const dx = pmx * 26;
          const dy = -pmy * 26;                        // screen y is flipped
          return (
            <Fragment key={v.id ?? i}>
              <LabeledVector tail={t} comp={c} color={col} />
              {text && <Label x={at.x} y={at.y} text={text} color={col} dx={dx} dy={dy} size={12} />}
            </Fragment>
          );
        })}

        {/* resultant — skip the duplicate when it IS a lone input vector */}
        {resultant && (
          <>
            {show.components && (
              <>
                <Segment from={ORIGIN} to={{ x: resultant.x, y: 0 }} color="var(--stage-muted)" dashed weight={1.2} opacity={0.7} />
                <Segment from={{ x: resultant.x, y: 0 }} to={resultant} color="var(--stage-muted)" dashed weight={1.2} opacity={0.7} />
                <RightAngleMark at={{ x: resultant.x, y: 0 }} u={{ x: -Math.sign(resultant.x || 1), y: 0 }} v={{ x: 0, y: Math.sign(resultant.y || 1) }} />
              </>
            )}
            {showResultant && (
              <>
                <LabeledVector tail={ORIGIN} comp={resultant} color={resColor} weight={3.5} />
                <Label x={resultant.x} y={resultant.y} text={resultantLabel} color={resColor} dx={12} dy={-10} size={13} />
              </>
            )}
            {show.angle && <AngleArc at={ORIGIN} from={{ x: 1, y: 0 }} to={resultant} label={`${Math.abs(resDeg)}°`} />}
          </>
        )}

        {/* draggable heads (drawn last so they sit on top) */}
        {vectors.map((v, i) => (
          v.drag
            ? <MovableDot key={`d${v.id ?? i}`} value={tipOf(i)} onMove={(p) => setComps((cs) => cs.map((c, j) => (j === i ? { x: snapV(p.x) - tailOf(i).x, y: snapV(p.y) - tailOf(i).y } : c)))} range={{ min: Math.min(view.xMin, view.yMin), max: Math.max(view.xMax, view.yMax) }} color={v.color ?? PALETTE[i % PALETTE.length]} ariaLabel={`${v.label ?? 'vector'} head`} />
            : null
        ))}
    </Stage>
  );

  const footer = (
    <>
      <Callout tone={solved ? 'result' : 'info'}>
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}><RichText>{resultantLabel}</RichText> = {resMag.toFixed(1)} @ {resDeg}°</span>
        {goal && <Feedback ok={solved} misconception={misconception} okText="On target" tryText="Match the target" />}
      </Callout>
      {goal && <HintLadder hints={hints} />}
      <LiveRegion>{goal ? (solved ? 'On target' : misconception ?? `Resultant ${resMag.toFixed(1)} at ${resDeg} degrees`) : ''}</LiveRegion>
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} footer={footer}>{figure}</LabFrame>;
}
