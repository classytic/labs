'use client';

/**
 * CoupleTorqueLab — the turning effect that has no resultant force, and no pivot.
 *
 * The `lever` lab is a single-pivot balance with every force pointing down, so the pivot there is
 * a real hinge and the answer genuinely depends on it. That is exactly why it cannot teach a
 * couple, and why this lab exists. A couple is the case a learner never meets on a see-saw: two
 * equal, ANTIPARALLEL forces on one body. Their vector sum is zero, so nothing pushes the body
 * anywhere, and yet it turns.
 *
 * The whole lab is built around the one demonstration that makes a couple stop being a formula:
 *   • the pivot is DRAGGABLE, anywhere, including clean off the end of the bar where no part of
 *     the object even is;
 *   • the two individual moments are displayed live, and they visibly trade size as you drag —
 *     one of them will go NEGATIVE once the pivot passes a force, meaning that force now turns
 *     the body the other way about your chosen point;
 *   • their total never moves off F·d.
 * Algebraically the pivot cancels: M1 + M2 = F(d/2 + x) + F(d/2 - x) = F·d. The learner should
 * see that cancellation happen as a physical fact before meeting it as a line of algebra, which
 * is why the drag is the centrepiece and the algebra is only the explain step.
 *
 * The geometry is arranged so that d is unmistakably the PERPENDICULAR GAP BETWEEN THE TWO LINES
 * OF ACTION, not a distance to any pivot: the two lines of action are drawn full height as the
 * only dashed verticals in the scene, d is measured between THEM, and the moment arms from the
 * pivot are drawn separately, at the pivot's own height, in the pivot's colour. Because both
 * forces are vertical, sliding the pivot up and down changes neither moment — a second reading of
 * "only the perpendicular offset counts" that costs no extra chrome.
 *
 * A faint rotated ghost of the bar says the remaining thing a static diagram usually cannot: with
 * zero resultant force the centre of mass does not accelerate, so a free body under a couple spins
 * about its own centre. The pivot marker is a place to TAKE MOMENTS, never an axle.
 */

import { useState, type ReactNode } from 'react';
import {
  Stage,
  Segment,
  Polyline,
  Polygon,
  Vector,
  Dot,
  Label,
  MovableDot,
  type Vec2,
} from '@classytic/stage';
import { Field, Readout, Stat, StatList } from '../../kit/frame.js';
import { Slider, Segmented } from '../../kit/controls.js';
import { Tex } from '../../core/tex.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { MechanicsVector, SceneSurface } from '../mechanics/presentation.js';

/** The down-force (left) and the up-force (right). Two hues, so the ledger rows read at a glance. */
const C_DOWN = 'var(--stage-accent)';
const C_UP = 'var(--stage-accent-2)';
/** The pivot and everything that belongs to it (its moment arms). It is the thing that moves. */
const C_PIVOT = 'var(--stage-warn)';
const C_NEUTRAL = 'var(--stage-muted)';

/** Metres of bar sticking out past each force, so the hands sit ON the bar rather than at its tips. */
const OVERHANG = 0.08;
/** Half-thickness of the bar, in metres. */
const BAR_T = 0.033;
/** How far the ghost bar is rotated, in degrees — enough to read as "it turns", not as a new state. */
const TURN_DEG = 15;

const round2 = (v: number): number => Math.round(v * 100) / 100;
/** A true minus sign, so a negative moment lines up in a tabular column instead of reading as a dash. */
const signed = (v: number): string => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(2)}`;

const COUPLE_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'A couple turns without pushing',
  objectives: [
    'Show that two equal, opposite forces have zero resultant but a real turning effect',
    'Take moments about any point and still get F d',
    'Measure d as the perpendicular gap between the two lines of action',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict what moving the pivot does',
      lead: 'Commit before you drag anything.',
      success: 'pivot-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Drag the pivot',
      lead: 'Take moments about a different point. Watch each moment, then watch the total.',
      controls: true,
      reveal: ['model'],
      success: 'pivot-moved',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Find what does change the couple',
      lead: 'One moment grows as the other shrinks. Now change F or d and watch the total finally move.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'couple-changed',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain why the pivot cancels',
      lead: 'The pivot sits at x. One moment is F(d/2 + x), the other is F(d/2 - x). Add them: where did x go?',
      reveal: ['model', 'evidence'],
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Take moments off the bar entirely',
      lead: 'Drag the pivot past the end of the bar, to a point where the object is not. The couple is still F d.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'pivot-off-body',
    },
  ],
  questions: [
    {
      id: 'pivot',
      prompt:
        'A tap handle is turned by two equal, opposite forces on its two ends. The forces stay exactly where they are, but you take moments about a different point of the handle. The total turning effect…',
      choices: [
        { value: 'same', label: 'stays exactly the same' },
        { value: 'centre', label: 'is biggest about the centre of the handle' },
        { value: 'atforce', label: 'falls to zero when the pivot sits on one of the forces' },
        { value: 'off', label: 'is zero for a point off the handle' },
      ],
      answer: 'same',
      explain:
        'Each moment changes, and one of them reverses once the pivot passes it. The sum is F d about every point, on the handle or off it, because the pivot position cancels when the two moments are added.',
    },
  ],
  success: [
    {
      id: 'pivot-answer',
      source: 'answer',
      key: 'pivot',
      operator: 'eq',
      value: 'same',
      pendingLabel: 'Predict what taking moments about a different point does.',
    },
    {
      id: 'pivot-moved',
      source: 'metric',
      key: 'pivotMoved',
      operator: 'eq',
      value: true,
      pendingLabel: 'Drag the pivot to a different point.',
    },
    {
      id: 'couple-changed',
      source: 'metric',
      key: 'coupleChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change the force or the separation.',
    },
    {
      id: 'pivot-off-body',
      source: 'metric',
      key: 'pivotOffBody',
      operator: 'eq',
      value: true,
      pendingLabel: 'Drag the pivot past the end of the bar.',
    },
  ],
};

export interface CoupleTorqueProps {
  /** Size of EACH force, N. The two are always equal and opposite — that is what makes it a couple. */
  forceN?: number;
  /** Perpendicular separation of the two lines of action, m. */
  separationM?: number;
  /** Where the pivot starts along the bar, m from the centre. */
  pivotX?: number;
  /** Where the pivot starts across the bar, m. Both forces are vertical, so this changes nothing. */
  pivotY?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

export function CoupleTorqueLab({
  forceN = 8,
  separationM = 0.3,
  pivotX = 0,
  pivotY = 0,
  title = 'The torque of a couple',
  prompt = 'Two equal, opposite forces. Their resultant is zero, so nothing pushes the bar anywhere, yet it turns. Drag the pivot anywhere you like, even off the bar, and watch the total turning effect refuse to change.',
  objectives,
  activity = 'couple-torque',
}: CoupleTorqueProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'couple-torque';
  const authoredActivity = typeof activity === 'string' ? COUPLE_ACTIVITY : activity;
  const [force, setForce] = useState(forceN);
  const [sep, setSep] = useState(separationM);
  const [pivot, setPivot] = useState<Vec2>({ x: pivotX, y: pivotY });

  const half = sep / 2; // each line of action sits this far from the centre
  const halfLen = half + OVERHANG; // half the drawn bar
  const px = pivot.x;

  // The two moments about the CHOSEN point, anticlockwise positive. `m1` is the downward force on
  // the left, `m2` the upward force on the right. Only the horizontal offset appears: both forces
  // are vertical, so the pivot's height cancels out of r x F entirely.
  const m1 = force * (half + px);
  const m2 = force * (half - px);
  const couple = force * sep; // === m1 + m2, for every px. This is the whole lab.
  const offBody = Math.abs(px) > halfLen + 0.005;
  const reversed = m1 < 0 || m2 < 0;

  // Arrow length in metres: an offset plus a term in F, so a small force is still visible and a
  // large one still fits under the top of the view.
  const arrow = 0.045 + 0.0125 * force;
  const bar: Vec2[] = [
    { x: -halfLen, y: -BAR_T },
    { x: halfLen, y: -BAR_T },
    { x: halfLen, y: BAR_T },
    { x: -halfLen, y: BAR_T },
  ];
  const turn = (TURN_DEG * Math.PI) / 180;
  const spun = (p: Vec2): Vec2 => ({
    x: p.x * Math.cos(turn) - p.y * Math.sin(turn),
    y: p.x * Math.sin(turn) + p.y * Math.cos(turn),
  });
  const ghost = [...bar, bar[0]!].map(spun);
  // A short arc from the real right-hand tip to the ghost tip: the sense of the turn, drawn where
  // there is nothing else, well outside both force arrows.
  const arcPts: Vec2[] = Array.from({ length: 9 }, (_, i) => {
    const t = (turn * i) / 8;
    return { x: halfLen * Math.cos(t), y: halfLen * Math.sin(t) };
  });

  const view = { xMin: -0.6, xMax: 0.6, yMin: -0.34, yMax: 0.3 };
  const r1 = Math.abs(half + px);
  const r2 = Math.abs(half - px);

  const figure = (
    <SceneSurface className="physics-couple-scene" tone="grid">
      <Stage
        view={view}
        height={340}
        ariaLabel="Two equal opposite forces on a bar, with a movable point about which moments are taken"
      >
        {/* The body, and the faint ghost of where a pure couple takes it: a turn about its own
            centre, with the centre going nowhere because the resultant force is zero. */}
        <Polyline points={ghost} color={C_PIVOT} opacity={0.2} weight={2} dashed />
        <Polyline points={arcPts.slice(0, 8)} color={C_PIVOT} opacity={0.82} weight={2.25} />
        <Vector tail={arcPts[7]!} tip={arcPts[8]!} color={C_PIVOT} opacity={0.9} weight={2.25} />
        <Polygon
          points={bar}
          color="var(--stage-metal)"
          fill="var(--stage-fg)"
          fillOpacity={0.07}
          weight={2}
        />
        <Segment
          from={{ x: -halfLen + 0.035, y: -BAR_T }}
          to={{ x: -halfLen + 0.035, y: BAR_T }}
          color={C_DOWN}
          weight={4}
        />
        <Segment
          from={{ x: halfLen - 0.035, y: -BAR_T }}
          to={{ x: halfLen - 0.035, y: BAR_T }}
          color={C_UP}
          weight={4}
        />
        <Dot x={0} y={0} r={3.5} color="var(--stage-fg)" />

        {/* The two LINES OF ACTION. They are the only dashed verticals in the scene, because d is
            measured between them and nothing else. */}
        <Segment
          from={{ x: -half, y: -0.275 }}
          to={{ x: -half, y: 0.265 }}
          color={C_NEUTRAL}
          opacity={0.55}
          weight={1.5}
          dashed
        />
        <Segment
          from={{ x: half, y: -0.275 }}
          to={{ x: half, y: 0.265 }}
          color={C_NEUTRAL}
          opacity={0.55}
          weight={1.5}
          dashed
        />

        {/* The couple itself: equal magnitudes, opposite directions, applied on the bar. */}
        <MechanicsVector
          tail={{ x: -half, y: 0 }}
          tip={{ x: -half, y: -arrow }}
          color={C_DOWN}
          label="F₁"
          labelAt={{ x: -half, y: -arrow }}
          labelDx={-12}
          labelDy={8}
          active
        />
        <MechanicsVector
          tail={{ x: half, y: 0 }}
          tip={{ x: half, y: arrow }}
          color={C_UP}
          label="F₂"
          labelAt={{ x: half, y: arrow }}
          labelDx={12}
          labelDy={-7}
          active
        />
        <Dot x={-half} y={0} r={5} color={C_DOWN} />
        <Dot x={half} y={0} r={5} color={C_UP} />

        {/* Point one of the lab, in one line, in the empty band above the bar. The ghost and the
            arc carry the second half of it visually, so it is never said twice. */}
        <Label x={0} y={0.285} text="τ = Fd" color={C_PIVOT} size={14} weight={700} />

        {/* d, measured between the LINES, not to the pivot — the misconception this lab has to kill. */}
        <Vector tail={{ x: 0, y: -0.265 }} tip={{ x: -half, y: -0.265 }} color={C_NEUTRAL} weight={1.5} />
        <Vector tail={{ x: 0, y: -0.265 }} tip={{ x: half, y: -0.265 }} color={C_NEUTRAL} weight={1.5} />
        <Label x={0} y={-0.265} dy={-11} text="d" size={14} />

        {/* The moment arms, drawn at the PIVOT'S OWN height. Sliding the pivot up or down leaves
            both horizontal gaps identical, which is why neither moment changes. */}
        <Segment
          from={{ x: px, y: pivot.y }}
          to={{ x: -half, y: pivot.y }}
          color={C_PIVOT}
          weight={1.5}
          dashed
        />
        <Segment
          from={{ x: px, y: pivot.y }}
          to={{ x: half, y: pivot.y }}
          color={C_PIVOT}
          weight={1.5}
          dashed
        />
        {/* The two arm labels are STAGGERED vertically on purpose: with the pivot near the centre
            their midpoints are only d/2 apart, which is narrower than the labels themselves. */}
        {r1 > 0.1 && <Label x={(px - half) / 2} y={pivot.y} dy={-11} text="r₁" color={C_PIVOT} size={13} />}
        {r2 > 0.1 && <Label x={(px + half) / 2} y={pivot.y} dy={-27} text="r₂" color={C_PIVOT} size={13} />}
        <Label x={px} y={pivot.y} dy={22} text="O" color={C_PIVOT} size={12} weight={650} />
        {/* Deliberately NOT clamped to the bar: dragging it into empty space, where the object is
            not, and still reading F d is the demonstration. */}
        <MovableDot
          value={pivot}
          onMove={(p) =>
            setPivot({
              x: Math.min(0.55, Math.max(-0.55, round2(p.x))),
              y: Math.min(0.22, Math.max(-0.22, round2(p.y))),
            })
          }
          step={0.05}
          color={C_PIVOT}
          r={7}
          ariaLabel="pivot: the point moments are taken about, drag it anywhere"
          readout={(v) => {
            const a = force * (half + v.x);
            const b = force * (half - v.x);
            return `M₁ ${signed(a)} · M₂ ${signed(b)}`;
          }}
        />
      </Stage>
    </SceneSurface>
  );

  const evidence = (
    <>
      <Readout
        label="Total moment about the pivot"
        value={`${couple.toFixed(2)} N m`}
        sub="the two moments added, and also F × d"
      />
      <StatList>
        <Stat label="Moment of F₁ (down)" value={`${signed(m1)} N m`} />
        <Stat label="Moment of F₂ (up)" value={`${signed(m2)} N m`} />
        <Stat label="Pivot at x" value={`${signed(px)} m${offBody ? ' (off the bar)' : ''}`} />
      </StatList>
      <p className="physics-explain">
        Both routes agree because the pivot cancels in the algebra:{' '}
        <Tex tex={'M_1+M_2=F\\left(\\tfrac{d}{2}+x\\right)+F\\left(\\tfrac{d}{2}-x\\right)=Fd'} />. A couple
        has no pivot of its own, so it is the one turning effect you can quote without naming a point.
      </p>
    </>
  );

  const controls = (
    <>
      <Field label="pivot">
        <Segmented
          ariaLabel="pivot"
          // The pivot is also draggable, so it can sit at none of the three presets: 'custom'
          // is that fourth state, deliberately absent from `options` so nothing reads as active.
          value={
            Math.abs(px) < 0.005
              ? 'centre'
              : Math.abs(px - half) < 0.005
                ? 'onF2'
                : offBody
                  ? 'off'
                  : 'custom'
          }
          onChange={(v) => {
            if (v === 'centre') setPivot({ ...pivot, x: 0 });
            else if (v === 'onF2') setPivot({ ...pivot, x: round2(half) });
            else if (v === 'off') setPivot({ ...pivot, x: Math.min(0.55, round2(halfLen + 0.14)) });
          }}
          options={[
            { value: 'centre', label: 'centre' },
            { value: 'onF2', label: 'on F₂' },
            { value: 'off', label: 'off the bar' },
          ]}
        />
      </Field>
      <Field label="each force" value={`${force.toFixed(1)} N`}>
        <Slider
          value={force}
          min={2}
          max={14}
          step={0.5}
          onChange={setForce}
          ariaLabel="size of each of the two forces"
        />
      </Field>
      <Field label="separation" value={`${sep.toFixed(2)} m`}>
        <Slider
          value={sep}
          min={0.1}
          max={0.5}
          step={0.02}
          onChange={(v) => setSep(round2(v))}
          ariaLabel="perpendicular separation of the two lines of action"
        />
      </Field>
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Mechanics"
      title={title}
      description={prompt}
      status={
        <>
          <span>F {force.toFixed(1)} N</span>
          <span>d {sep.toFixed(2)} m</span>
        </>
      }
      evidence={evidence}
      controls={controls}
      observation={
        reversed
          ? 'The pivot has passed one of the forces, so that force now turns the bar the other way about your point and its moment has gone negative. The other moment grew by exactly as much, and the total is still F d.'
          : offBody
            ? 'You are taking moments about a point where none of the object is, and the answer has not changed. A couple belongs to the pair of forces, not to any axis.'
            : 'Slide the pivot and the two moments trade size, one growing by exactly what the other loses. Only F and d move the total, which is why a couple is quoted as F d with no pivot named.'
      }
      transcript={
        <p>
          {`Two ${force.toFixed(1)} newton forces act in opposite directions, ${sep.toFixed(2)} metres apart. About the point ${px.toFixed(2)} metres from the centre, the downward force gives ${m1.toFixed(2)} and the upward force gives ${m2.toFixed(2)} newton metres, a total of ${couple.toFixed(2)} newton metres. The resultant force on the bar is zero.`}
        </p>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="pivot-moved"
            met={Math.abs(px - pivotX) > 0.02}
            complete={complete}
          />
          <AuthoredMetricGate
            conditionId="couple-changed"
            met={force !== forceN || sep !== separationM}
            complete={complete}
          />
          <AuthoredMetricGate conditionId="pivot-off-body" met={offBody} complete={complete} />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
