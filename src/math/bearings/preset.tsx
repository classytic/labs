'use client';

/**
 * Bearings, drawn the way an exam diagram is drawn.
 *
 * The topic is missing from our courses entirely, and it is the one place where a learner fluent in
 * trigonometry still loses marks, because a bearing runs CLOCKWISE FROM NORTH while every angle
 * they have met before runs anticlockwise from the x-axis. Reading that difference off a sentence
 * is hopeless; seeing the arc sweep the other way, from a north line rather than from the
 * horizontal, is immediate.
 *
 * So the figure insists on the two things a candidate must draw and usually does not:
 *   a dashed NORTH LINE at every turning point, because a bearing is meaningless without the
 *   reference it is measured from, and the second leg's bearing is measured from a NEW north line
 *   at the turn, not from the first one;
 *   the arc drawn the long way round when the bearing exceeds 180 degrees, so the sweep is visibly
 *   clockwise at 250 degrees rather than quietly becoming the short way back.
 *
 * The closing part of every bearings question, "how far is the ship from port and on what bearing",
 * is the cosine rule on the triangle the two legs make. See math/oblique-triangle for that rule and
 * ./core.ts for why the interior angle at the turn is not the difference of the two bearings.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Segment, Polyline, Dot, Label, type Vec2 } from '@classytic/stage';
import { Slider } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Activity } from '../../kit/activity.js';
import { backBearing, formatBearing, journey, resultant, turnAngle, type Leg, type Point } from './core.js';

export interface BearingsProps {
  /** Names of the three places, in order of visiting. */
  places?: [string, string, string];
  firstBearing?: number;
  firstDistance?: number;
  secondBearing?: number;
  secondDistance?: number;
  /** Unit of distance, e.g. "km". */
  unit?: string;
  title?: string;
  prompt?: string;
  activity?: string;
}

const C_LEG = 'var(--stage-accent)';
const C_LEG_2 = 'var(--stage-success)';
const C_HOME = 'var(--stage-warn)';
const C_NORTH = 'var(--stage-muted)';

const fmt = (n: number): string => (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(1));

const P = (p: Point): Vec2 => ({ x: p.east, y: p.north });

/**
 * The bearing arc: always clockwise from north, however large the bearing.
 *
 * Drawn in data space rather than with the kit's AngleArc, which always takes the SHORT way round
 * between two directions. For a bearing of 250 degrees the short way is anticlockwise, which is
 * precisely the misconception this lab exists to prevent.
 */
function BearingArc({ at, bearing, radius }: { at: Point; bearing: number; radius: number }): ReactNode {
  const steps = Math.max(8, Math.round(bearing / 5));
  const points: Vec2[] = Array.from({ length: steps + 1 }, (_, i) => {
    const b = (bearing * i) / steps;
    const rad = (b * Math.PI) / 180;
    return { x: at.east + radius * Math.sin(rad), y: at.north + radius * Math.cos(rad) };
  });
  return <Polyline points={points} color={C_LEG} weight={1.4} opacity={0.9} />;
}

/** The dashed north line a bearing is measured from. Every turning point gets its own. */
function NorthLine({ at, length }: { at: Point; length: number }): ReactNode {
  return (
    <>
      <Segment from={P(at)} to={{ x: at.east, y: at.north + length }} color={C_NORTH} weight={1.2} dashed />
      <Label x={at.east} y={at.north + length} text="N" color={C_NORTH} size={12} dy={-6} />
    </>
  );
}

function midpointLabel(
  from: Point,
  to: Point,
  distance: number,
  side: 1 | -1,
): { x: number; y: number } {
  const dx = to.east - from.east;
  const dy = to.north - from.north;
  const length = Math.hypot(dx, dy) || 1;
  const offset = Math.max(distance * 0.08, 0.45);
  return {
    x: (from.east + to.east) / 2 + side * (-dy / length) * offset,
    y: (from.north + to.north) / 2 + side * (dx / length) * offset,
  };
}

export function BearingsLab({
  places = ['Port', 'Buoy', 'Ship'],
  firstBearing = 60,
  firstDistance = 8,
  secondBearing = 150,
  secondDistance = 6,
  unit = 'km',
  title = 'Bearings: clockwise from north, always three figures',
  prompt = 'A bearing is measured clockwise from a north line, so it needs a north line to be measured from. The second leg gets its own north line at the turn, and that is the step most answers miss.',
  activity = 'bearings',
}: BearingsProps = {}): ReactNode {
  const [b1, setB1] = useState(firstBearing);
  const [b2, setB2] = useState(secondBearing);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const start: Point = { east: 0, north: 0 };
  const legs: Leg[] = [
    { bearing: b1, distance: firstDistance },
    { bearing: b2, distance: secondDistance },
  ];
  const points = journey(start, legs);
  const [origin, turn, end] = points as [Point, Point, Point];
  const r = resultant(start, legs);
  const interior = turnAngle(legs[0]!, legs[1]!);

  // Solved once the learner has steered a bearing into each quadrant of the compass. Reaching all
  // four means they have driven the arc past 180 degrees, where the clockwise convention actually
  // bites and the short-way-round intuition fails.
  const quadrant = `q${Math.floor(b2 / 90)}`;
  useEffect(() => {
    setSeen((s) => (s.has(quadrant) ? s : new Set(s).add(quadrant)));
  }, [quadrant]);
  useCheckpoint({ solved: seen.size >= 4, activity });

  // Size everything off the journey's own extent, not off a coordinate magnitude: a journey that
  // happens to sit far from the origin is not a bigger journey, and scaling by |east| left the
  // route as a small tangle in the middle of an empty frame.
  const legSpan = Math.max(
    Math.max(...points.map((p) => p.east)) - Math.min(...points.map((p) => p.east)),
    Math.max(...points.map((p) => p.north)) - Math.min(...points.map((p) => p.north)),
    firstDistance,
  );
  const northLen = legSpan * 0.4;
  const arcR = legSpan * 0.18;
  const firstDistanceLabel = midpointLabel(origin, turn, firstDistance, 1);
  const secondDistanceLabel = midpointLabel(turn, end, secondDistance, -1);
  // Crop to everything actually drawn: the route, the north lines above each turning point, and
  // the bearing arcs, which reach a full radius in every direction once a bearing passes 180.
  const marks: Vec2[] = [
    ...points.map(P),
    ...[origin, turn].flatMap((p) => [
      { x: p.east, y: p.north + northLen },
      { x: p.east - arcR, y: p.north - arcR },
      { x: p.east + arcR, y: p.north + arcR },
    ]),
  ];
  const xs = marks.map((p) => p.x);
  const ys = marks.map((p) => p.y);
  const pad = legSpan * 0.12;
  const view = {
    xMin: Math.min(...xs) - pad,
    xMax: Math.max(...xs) + pad,
    yMin: Math.min(...ys) - pad,
    yMax: Math.max(...ys) + pad,
  };

  const figure = (
    <Stage
      view={view}
      height={300}
      ariaLabel={`Journey from ${places[0]} on bearing ${formatBearing(b1)} then ${formatBearing(b2)}`}
    >
      {/* A north line at BOTH the start and the turn. Drawing only one is the classic diagram
          error: it silently invites measuring the second bearing from the first leg. */}
      <NorthLine at={origin} length={northLen} />
      <NorthLine at={turn} length={northLen} />

      <BearingArc at={origin} bearing={b1} radius={arcR} />
      <BearingArc at={turn} bearing={b2} radius={arcR} />

      {/* The two legs, then the direct line home, which is the side the cosine rule finds. */}
      <Segment from={P(origin)} to={P(turn)} color={C_LEG} weight={3} />
      <Segment from={P(turn)} to={P(end)} color={C_LEG_2} weight={3} />
      <Segment from={P(end)} to={P(origin)} color={C_HOME} weight={1.6} dashed />

      {points.map((p, i) => (
        <Dot
          key={i}
          x={p.east}
          y={p.north}
          r={4.5}
          color={i === 2 ? C_HOME : i === 1 ? C_LEG_2 : C_LEG}
        />
      ))}
      <Label x={origin.east} y={origin.north} text={places[0]} color={C_LEG} size={11} dx={-30} dy={13} />
      <Label x={turn.east} y={turn.north} text={places[1]} color={C_LEG_2} size={11} dx={28} dy={-15} />
      <Label x={end.east} y={end.north} text={places[2]} color={C_HOME} size={11} dx={22} dy={12} />

      {/* Each bearing labelled ON its own arc, so the number is attached to the sweep it names. */}
      <Label
        x={origin.east + arcR * 1.28 * Math.sin((b1 * Math.PI) / 360)}
        y={origin.north + arcR * 1.28 * Math.cos((b1 * Math.PI) / 360)}
        text={formatBearing(b1)}
        color={C_LEG}
        size={11}
        dx={8}
      />
      <Label
        x={turn.east + arcR * 1.32 * Math.sin((b2 * Math.PI) / 360)}
        y={turn.north + arcR * 1.32 * Math.cos((b2 * Math.PI) / 360)}
        text={formatBearing(b2)}
        color={C_LEG_2}
        size={11}
        dx={8}
      />
      <Label
        x={firstDistanceLabel.x}
        y={firstDistanceLabel.y}
        text={`${fmt(firstDistance)} ${unit}`}
        color={C_LEG}
        size={10}
      />
      <Label
        x={secondDistanceLabel.x}
        y={secondDistanceLabel.y}
        text={`${fmt(secondDistance)} ${unit}`}
        color={C_LEG_2}
        size={10}
      />
      <Label
        x={(origin.east + end.east) / 2}
        y={(origin.north + end.north) / 2}
        text={`${fmt(r.distance)} ${unit}`}
        color={C_HOME}
        size={10}
        dy={14}
      />
    </Stage>
  );

  return (
    <Activity.Root className="math-bearings">
      <Activity.Header>
        <Activity.Heading eyebrow="Trigonometry" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{formatBearing(b1)}</strong>
        <span>then {formatBearing(b2)}</span>
        <span>
          angle at {places[1]} is {fmt(interior)}°
        </span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Map of the journey">{figure}</Activity.Canvas>
        <Activity.Dock>
          <Field label={`${places[0]} to ${places[1]}`} value={formatBearing(b1)}>
            <Slider value={b1} min={0} max={359} step={1} onChange={setB1} ariaLabel="first bearing" />
          </Field>
          <Field label={`${places[1]} to ${places[2]}`} value={formatBearing(b2)}>
            <Slider value={b2} min={0} max={359} step={1} onChange={setB2} ariaLabel="second bearing" />
          </Field>
        </Activity.Dock>
        <Readout
          value={`${fmt(r.distance)} ${unit} on ${formatBearing(r.bearing)}`}
          sub={`by the cosine rule on ${fmt(firstDistance)}, ${fmt(secondDistance)} and the ${fmt(interior)}° angle between them`}
        />
      </Activity.Workspace>
      <Activity.Feedback>
        <span>The way back</span>
        <div>
          {places[0]} lies on a bearing of {formatBearing(r.homeBearing)} from {places[2]}, which is{' '}
          {formatBearing(r.bearing)} turned through 180°. Read the question carefully: the bearing OF A FROM B
          is the reverse of the bearing of B from A, and a swapped pair answers a different question
          perfectly.
        </div>
      </Activity.Feedback>
      <LiveRegion>
        {`${places[2]} is ${fmt(r.distance)} ${unit} from ${places[0]} on a bearing of ${formatBearing(r.bearing)}. Back bearing ${formatBearing(backBearing(r.bearing))}.`}
      </LiveRegion>
    </Activity.Root>
  );
}
