'use client';

/**
 * ConeFrustumLab — cut the top off a cone and watch which quantity actually halves.
 *
 * A bucket, a lampshade, a paper cup: the exam calls it a frustum and asks for its volume. Students
 * reach for a formula, find none, and stall. There is nothing to find, because a frustum is a
 * subtraction: the whole cone minus the small cone taken off the top.
 *
 * The obstacle is not the subtraction, it is a wrong expectation about scale. Asked where to cut so
 * that half the volume comes away, almost everyone says halfway up. Halfway up removes an EIGHTH,
 * because the small cone is similar and volume follows k³. Told this, a learner nods and forgets it
 * by the next question. So this lab does not tell them: it hands them the cut, states the target as
 * a share of the volume, and lets them hunt for it. The answer arrives as a surprise, near the base,
 * and a surprise is remembered.
 *
 * Both pieces stay on screen the whole time, in their own colours, with k and k³ read out beside
 * them. The point to leave with is that one ratio describes the small cone completely.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Ellipse, Label, MovableDot } from '@classytic/stage';
import { Activity } from '../../kit/activity.js';
import { Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';
import { frustumParts, type ConeDims } from './core.js';

const show = (v: number, dp = 1): string => {
  const r = Number(v.toFixed(dp));
  return Number.isInteger(r) ? String(r) : r.toFixed(dp);
};

/** How much a circle seen from slightly above is squashed. Constant, so the two rims agree. */
const SQUASH = 0.26;

/**
 * The near half of a rim, as points.
 *
 * Closing a cone's outline with a straight chord between the two base corners draws a line across
 * the middle of the base that is not an edge of anything. Following the front of the ellipse
 * instead gives the silhouette the solid actually has, and it meets the drawn rim exactly.
 */
function frontArc(cy: number, rx: number, ry: number, rightToLeft: boolean): { x: number; y: number }[] {
  const STEPS = 24;
  return Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = (Math.PI * i) / STEPS;
    const a = rightToLeft ? t : Math.PI - t;
    return { x: rx * Math.cos(a), y: cy - ry * Math.sin(a) };
  });
}

export interface ConeFrustumProps {
  /** Base radius of the whole cone. */
  radius?: number;
  /** Vertical height of the whole cone. */
  height?: number;
  /** Where the cut starts, as a height above the base. */
  cut?: number;
  /** The share of the VOLUME the learner is asked to carry away in the top piece. */
  targetShare?: number;
  unit?: string;
  title?: string;
  prompt?: string;
  height_?: number;
}

export function ConeFrustumLab({
  radius = 3,
  height = 6,
  cut,
  targetShare = 0.5,
  unit = 'cm',
  title = 'Cut the top off a cone',
  prompt = 'Slide the cut until the piece you remove is the share of the volume asked for.',
  height_ = 360,
}: ConeFrustumProps = {}): ReactNode {
  const dims: ConeDims = { radius, height };
  const [c, setC] = useState(clamp(cut ?? height * 0.55, 0.05 * height, 0.95 * height));

  const parts = useMemo(() => frustumParts(dims, c), [radius, height, c]);
  const target = clamp(targetShare, 0.02, 0.98);

  /**
   * Graded on the SHARE, not on the cut, because the share is what was asked for. Relative
   * tolerance, as everywhere else: 4% of the target rather than a fixed window, so a small target
   * is not trivially easy and a large one is not impossible.
   */
  const solved = Math.abs(parts.removedShare - target) <= target * 0.04;
  useCheckpoint({ solved, activity: `cone-frustum:${target}` });

  const apex = { x: 0, y: height };
  const baseL = { x: -radius, y: 0 };
  const baseR = { x: radius, y: 0 };
  const cutL = { x: -parts.topRadius, y: parts.cut };
  const cutR = { x: parts.topRadius, y: parts.cut };

  const figure = (
    <Stage
      view={{
        xMin: -radius - 2.2,
        xMax: radius + 2.2,
        yMin: -radius * SQUASH - 1.4,
        yMax: height + 1.1,
      }}
      height={height_}
      preserveAspect={false}
      ariaLabel={`A cone of radius ${show(radius)} and height ${show(height)} ${unit}, cut ${show(parts.cut)} ${unit} above the base. The removed top cone holds ${show(parts.removedShare * 100)} per cent of the volume.`}
    >
      {/* The frustum: the piece that stays. It is the answer, so it carries the accent. */}
      <Polygon
        points={[
          cutL,
          baseL,
          ...frontArc(0, radius, radius * SQUASH, false),
          baseR,
          cutR,
          ...frontArc(parts.cut, parts.topRadius, parts.topRadius * SQUASH, true),
        ]}
        color="var(--stage-accent)"
        fill="var(--stage-accent)"
        fillOpacity={0.2}
        weight={2}
      />

      {/* The piece carried away, drawn in the same picture so the subtraction is visible. */}
      <Polygon
        points={[
          cutL,
          apex,
          cutR,
          ...frontArc(parts.cut, parts.topRadius, parts.topRadius * SQUASH, true),
        ]}
        color="var(--stage-good)"
        fill="var(--stage-good)"
        fillOpacity={0.12}
        weight={2}
      />

      {/* Rims last, so a circle reads as a circle rather than as the edge of a fill. */}
      <Ellipse
        center={{ x: 0, y: 0 }}
        rx={radius}
        ry={radius * SQUASH}
        color="var(--stage-accent)"
        fill="var(--stage-accent)"
        fillOpacity={0.08}
        weight={2}
      />
      <Ellipse
        center={{ x: 0, y: parts.cut }}
        rx={parts.topRadius}
        ry={parts.topRadius * SQUASH}
        color="var(--stage-good)"
        fill="var(--stage-good)"
        fillOpacity={0.1}
        weight={2}
      />

      {/* The axis, faint: it carries the two heights without competing with the solid. */}
      <Segment from={{ x: 0, y: 0 }} to={apex} color="var(--stage-fg)" opacity={0.28} weight={1} />

      <Segment
        from={{ x: 0, y: 0 }}
        to={baseR}
        color="var(--stage-fg)"
        opacity={0.35}
        weight={1}
      />

      {/*
        H is dimensioned OUTSIDE the solid. On the axis it collided with whatever the cut happened
        to be near, and at the halfway cut it landed exactly on the rim and was read as "H = .6".
        A dimension line to the left of the cone cannot collide with anything that moves.
      */}
      <Segment
        from={{ x: -radius - 1.1, y: 0 }}
        to={{ x: -radius - 1.1, y: height }}
        color="var(--stage-muted)"
        opacity={0.55}
        weight={1}
      />
      <Segment
        from={{ x: -radius - 1.35, y: 0 }}
        to={{ x: -radius - 0.85, y: 0 }}
        color="var(--stage-muted)"
        opacity={0.55}
        weight={1}
      />
      <Segment
        from={{ x: -radius - 1.35, y: height }}
        to={{ x: -radius - 0.85, y: height }}
        color="var(--stage-muted)"
        opacity={0.55}
        weight={1}
      />
      <Label
        x={-radius - 1.1}
        y={height / 2}
        text={`H = ${show(height)}`}
        color="var(--stage-muted)"
        size={12}
        dx={-24}
      />

      {/*
        h is dimensioned outside on the RIGHT, opposite H. Inside the small cone there is no room:
        the sloping edge runs through any label placed at mid-height. Facing H across the drawing
        also puts the two heights side by side, which is the comparison k = h/H asks for.
      */}
      <Segment
        from={{ x: radius + 1.1, y: parts.cut }}
        to={{ x: radius + 1.1, y: height }}
        color="var(--stage-good)"
        opacity={0.6}
        weight={1}
      />
      <Segment
        from={{ x: radius + 0.85, y: parts.cut }}
        to={{ x: radius + 1.35, y: parts.cut }}
        color="var(--stage-good)"
        opacity={0.6}
        weight={1}
      />
      <Segment
        from={{ x: radius + 0.85, y: height }}
        to={{ x: radius + 1.35, y: height }}
        color="var(--stage-good)"
        opacity={0.6}
        weight={1}
      />
      <Label
        x={radius + 1.1}
        y={(parts.cut + height) / 2}
        text={`h = ${show(parts.topHeight)}`}
        color="var(--stage-good)"
        size={12}
        dx={26}
      />

      <Label
        x={radius / 2}
        y={0}
        text={`R = ${show(radius)}`}
        color="var(--stage-muted)"
        size={12}
        dy={32}
      />
      <Label
        x={-parts.topRadius / 2}
        y={parts.cut}
        text={`r = ${show(parts.topRadius)}`}
        color="var(--stage-good)"
        size={12}
        dy={-14}
      />

      <MovableDot
        value={{ x: 0, y: parts.cut }}
        onMove={(p) => setC(clamp(p.y, 0.05 * height, 0.95 * height))}
        constrain="vertical"
        color="var(--stage-good)"
        ariaLabel="the cut, drag up or down the axis of the cone"
      />
    </Stage>
  );

  const pct = (v: number): string => `${show(v * 100)}%`;

  return (
    <Activity.Root className="math-cone-frustum-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Similar solids" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{solved ? 'That is the cut' : 'Find the cut'}</strong>
        <span>k = {show(parts.k, 2)}</span>
        <span>removed {pct(parts.removedShare)}</span>
        <span>target {pct(target)}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="A cone with a smaller cone cut from its top">{figure}</Activity.Canvas>
        <Activity.Dock>
          <Field label="cut above the base" value={`${show(parts.cut)} ${unit}`}>
            <Slider
              value={Math.round((parts.cut / height) * 100)}
              min={5}
              max={95}
              step={1}
              onChange={(v) => setC((v / 100) * height)}
              ariaLabel="height of the cut above the base"
            />
          </Field>
        </Activity.Dock>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>{solved ? 'Complete' : 'Observe'}</span>
        <div>
          {solved
            ? `The cut sits ${show(parts.cut)} ${unit} above the base, so the small cone keeps ${show(parts.k, 2)} of every length and ${pct(parts.removedShare)} of the volume. The frustum left behind is ${show(parts.frustumVolume)} ${unit}³.`
            : `Every length of the small cone is ${show(parts.k, 2)} of the whole, so its volume is ${show(parts.k, 2)}³ = ${show(parts.removedShare, 3)} of it. Move the cut and watch the cube, not the height.`}
        </div>
      </Activity.Feedback>
      <Activity.LiveRegion>
        {`Cut ${show(parts.cut)} ${unit} above the base, k is ${show(parts.k, 2)}, removed share ${pct(parts.removedShare)}, frustum volume ${show(parts.frustumVolume)} cubic ${unit}`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>
            {solved
              ? 'A frustum is a subtraction'
              : `Carry away ${pct(target)} of the volume`}
          </strong>
          <span>
            {solved
              ? `${show(parts.fullVolume)} − ${show(parts.topVolume)} = ${show(parts.frustumVolume)} ${unit}³`
              : `it is not ${pct(target)} of the height`}
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
