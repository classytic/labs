'use client';

/**
 * SolidSliceLab — the right triangle hiding inside a solid, lifted out onto the page.
 *
 * 3D trigonometry is not hard trigonometry. It is ordinary trigonometry on a triangle nobody has
 * drawn, and that is the whole difficulty: given a cuboid and "find angle VAC", a learner has to
 * decide which three of eight corners matter, and no amount of practice with the sine rule helps
 * with that. Textbooks answer it with a second, smaller picture of the triangle printed beside the
 * solid, and the reader has to trust that the two pictures are the same thing.
 *
 * So this lab does not print two pictures. It prints one, and moves it. The triangle is highlighted
 * where it lives inside the solid, and a single control carries it out until it lies flat beside
 * the solid with its sides labelled. Every intermediate position is drawn, so the flat triangle is
 * not a claim about the solid, it is the same three points a moment later.
 *
 * Turning the view is the other half. A 3D drawing is a lie about depth, and the only way to see
 * that the base diagonal really is horizontal is to rotate it and watch it stay in the base.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Label, Dot } from '@classytic/stage';
import { Activity } from '../../kit/activity.js';
import { Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';
import { project } from '../lines-in-space/core.js';
import { corners, edges, sliceFor, type Dims, type SolidKind, type Target, type V3 } from './core.js';

const show = (v: number): string => {
  const r = Math.round(v * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2).replace(/0$/, '');
};

export interface SolidSliceProps {
  solid?: SolidKind;
  length?: number;
  width?: number;
  height?: number;
  target?: Target;
  /** Starting turn of the view, in degrees. The learner can change it. */
  yaw?: number;
  /** Where the carry-out control starts, 0 inside the solid and 1 flat on the page. */
  lift?: number;
  unit?: string;
  title?: string;
  prompt?: string;
  height_?: number;
}

interface P2 {
  x: number;
  y: number;
}

const lerp = (a: P2, b: P2, t: number): P2 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export function SolidSliceLab({
  solid = 'cuboid',
  length = 8,
  width = 6,
  height = 5,
  target = 'space-diagonal',
  yaw: yaw0 = 35,
  lift: lift0 = 0,
  unit = 'cm',
  title = 'The hidden right triangle',
  prompt = 'Turn the solid, then carry the triangle out until it lies flat.',
  height_ = 360,
}: SolidSliceProps = {}): ReactNode {
  const dims: Dims = { length, width, height };
  const [yaw, setYaw] = useState(yaw0);
  const [lift, setLift] = useState(clamp(lift0, 0, 1));

  const slice = useMemo(() => sliceFor(solid, dims, target), [solid, length, width, height, target]);
  const pts = useMemo(() => corners(solid, dims), [solid, length, width, height]);
  const wire = useMemo(() => edges(solid), [solid]);

  const PITCH = 22;
  const to2 = (p: V3): P2 => {
    const q = project(p, yaw, PITCH);
    return { x: q.x, y: q.y };
  };
  const depthOf = (p: V3): number => project(p, yaw, PITCH).depth;

  const screen = pts.map(to2);
  const xs = screen.map((p) => p.x);
  const ys = screen.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  /**
   * Where the triangle lands: to the RIGHT of the solid, right angle at the bottom-right, the two
   * legs along the page axes. That is the orientation every textbook draws it in, so the learner
   * arrives at a picture they will meet again in the mark scheme.
   */
  const gap = (maxX - minX) * 0.35 + 1.5;
  const flatScale = Math.min(1, ((maxY - minY) * 0.9) / Math.max(slice.legA, slice.legB));
  const rx = maxX + gap + slice.legA * flatScale;
  const ry = minY;
  const flat = {
    from: { x: rx - slice.legA * flatScale, y: ry },
    corner: { x: rx, y: ry },
    to: { x: rx, y: ry + slice.legB * flatScale },
  };

  const live = {
    from: lerp(to2(slice.from), flat.from, lift),
    corner: lerp(to2(slice.corner), flat.corner, lift),
    to: lerp(to2(slice.to), flat.to, lift),
  };

  const out = lift > 0.98;
  useCheckpoint({ solved: out, activity: 'solid-slice' });

  // Edges behind the triangle are drawn faint, so the solid reads as solid without hiding the work.
  const ordered = wire
    .flatMap(([i, j]) => {
      const pi = pts[i];
      const pj = pts[j];
      if (!pi || !pj) return [];
      return [{ a: to2(pi), b: to2(pj), d: (depthOf(pi) + depthOf(pj)) / 2 }];
    })
    .sort((x, y) => x.d - y.d);

  const figure = (
    <Stage
      view={{
        xMin: minX - 1.2,
        xMax: rx + 1.8,
        yMin: minY - 1.8,
        yMax: Math.max(maxY, ry + slice.legB * flatScale) + 1.8,
      }}
      height={height_}
      preserveAspect={false}
      ariaLabel={`A ${solid} with the right triangle for ${slice.asks} highlighted, ${out ? 'lifted out flat' : 'still inside the solid'}`}
    >
      {ordered.map(({ a, b, d }, k) => (
        <Segment
          key={`e${k}`}
          from={a}
          to={b}
          color="var(--stage-fg)"
          opacity={d < 0 ? 0.22 : 0.5}
          weight={d < 0 ? 1 : 1.6}
        />
      ))}

      <Polygon
        points={[live.from, live.corner, live.to]}
        color="var(--stage-accent)"
        fill="var(--stage-accent)"
        fillOpacity={0.18}
        weight={2}
      />

      {/* The square that marks the right angle: the single most useful mark on the diagram. */}
      {(() => {
        const MARK = 0.55;
        const along = (p: P2): P2 => {
          const dx = p.x - live.corner.x;
          const dy = p.y - live.corner.y;
          const m = Math.hypot(dx, dy) || 1;
          return { x: live.corner.x + (dx / m) * MARK, y: live.corner.y + (dy / m) * MARK };
        };
        const a = along(live.from);
        const b = along(live.to);
        const c = { x: a.x + (b.x - live.corner.x), y: a.y + (b.y - live.corner.y) };
        return (
          <Polygon
            points={[a, c, b]}
            color="var(--stage-accent)"
            fill="var(--stage-accent)"
            fillOpacity={0}
            weight={1.5}
          />
        );
      })()}

      <Segment
        from={live.from}
        to={live.to}
        color="var(--stage-good)"
        weight={3}
      />

      <Label
        x={(live.from.x + live.corner.x) / 2}
        y={(live.from.y + live.corner.y) / 2}
        text={`${show(slice.legA)} ${unit}`}
        color="var(--stage-muted)"
        size={12}
        dy={18}
      />
      <Label
        x={(live.corner.x + live.to.x) / 2}
        y={(live.corner.y + live.to.y) / 2}
        text={`${show(slice.legB)} ${unit}`}
        color="var(--stage-muted)"
        size={12}
        dx={26}
      />
      <Label
        x={(live.from.x + live.to.x) / 2}
        y={(live.from.y + live.to.y) / 2}
        text={
          slice.valueKind === 'angle'
            ? `${show(slice.hyp)} ${unit}`
            : `? = ${out ? `${show(slice.hyp)} ${unit}` : '…'}`
        }
        color="var(--stage-good)"
        size={13}
        dx={-30}
        dy={-14}
      />
      {slice.valueKind === 'angle' && (
        <Label
          x={live.from.x}
          y={live.from.y}
          text={out ? `${show(slice.angleDeg)}°` : '?'}
          color="var(--stage-good)"
          size={13}
          dx={26}
          dy={-8}
        />
      )}
      <Dot x={live.from.x} y={live.from.y} r={4} color="var(--stage-good)" />
    </Stage>
  );

  return (
    <Activity.Root className="math-solid-slice-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Three dimensions" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{out ? 'Triangle on the page' : 'Triangle still inside'}</strong>
        <span>looking for {slice.asks}</span>
        {out ? (
          <span>
            {show(slice.value)}
            {slice.valueKind === 'angle' ? '°' : ` ${unit}`}
          </span>
        ) : null}
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="A solid with one right triangle highlighted">{figure}</Activity.Canvas>
        <Activity.Dock>
          <Field label="turn" value={`${yaw}°`}>
            <Slider value={yaw} min={-60} max={110} step={5} onChange={setYaw} ariaLabel="turn the solid" />
          </Field>
          <Field label="carry it out" value={`${Math.round(lift * 100)}%`}>
            <Slider
              value={Math.round(lift * 100)}
              min={0}
              max={100}
              step={2}
              onChange={(v) => setLift(clamp(v / 100, 0, 1))}
              ariaLabel="lift the triangle out of the solid"
            />
          </Field>
        </Activity.Dock>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>{out ? 'Complete' : 'Observe'}</span>
        <div>
          {out
            ? `Flat on the page it is an ordinary right triangle: legs ${show(slice.legA)} and ${show(slice.legB)}, and ${slice.legALabel} is the one you had to find first.`
            : `The two legs are the ${slice.legALabel} and the ${slice.legBLabel}. Turn the view and watch which one stays in the base.`}
        </div>
      </Activity.Feedback>
      <Activity.LiveRegion>
        {`${out ? 'Triangle flat on the page' : 'Triangle inside the solid'}, legs ${show(slice.legA)} and ${show(slice.legB)} ${unit}`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{out ? 'Now it is ordinary trigonometry' : 'Carry it out'}</strong>
          <span>{slice.asks}</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
