'use client';

/**
 * ObliqueTriangle, the sine rule, the cosine rule, and the ambiguous case in one picture.
 *
 * A textbook prints the ambiguous case as a sentence: "sin B = k has two solutions, so check
 * whether both give a triangle." A learner reads that, nods, and then loses the mark in the exam,
 * because a sentence about two solutions does not look like anything. Here the second triangle is
 * DRAWN, sharing the given angle and the two given sides with the first, and the slider on side `a`
 * swings it: too short and nothing closes, a little longer and two triangles appear at once, longer
 * still and the second one folds away behind the angle. That progression is the concept.
 *
 * The other thing this lab does that prose cannot is make the RULE CHOICE visible. The given parts
 * are drawn in the accent colour and the found parts in the neutral one, so "do I have a side and
 * the angle facing it?" becomes something you look at rather than something you recall. See
 * ./core.ts for why that question, and not the case letters, is the one worth teaching.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Segment, Polyline, Dot, Label, type Vec2 } from '@classytic/stage';
import { AngleArc } from '../../kit/diagram/annotations.js';
import { ActivitySelect, Slider } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Activity } from '../../kit/activity.js';
import {
  ambiguityNote,
  ruleFor,
  solveAAS,
  solveSAS,
  solveSSA,
  solveSSS,
  vertices,
  type GivenCase,
  type Triangle,
} from './core.js';

export interface ObliqueTriangleProps {
  /** Which shape of given data to open on. */
  given?: GivenCase;
  /** Restrict the selector to these cases, for a lesson that teaches one rule at a time. */
  cases?: GivenCase[];
  title?: string;
  prompt?: string;
  activity?: string;
}

const CASE_LABEL: Record<GivenCase, string> = {
  sss: 'Three sides',
  sas: 'Two sides + angle between',
  aas: 'Two angles + a side',
  ssa: 'Two sides + angle not between',
};

const C_GIVEN = 'var(--stage-accent)';
const C_FOUND = 'var(--stage-fg)';
const C_SECOND = 'var(--stage-warn)';

const fmt = (n: number): string => (Math.abs(n) >= 100 ? n.toFixed(0) : n.toFixed(1));

/**
 * The substitution the chosen rule actually makes, with this case's numbers in it.
 *
 * The Readout must not repeat the "which rule" callout underneath it (the design rulebook's
 * say-it-once fault). The rule REASON belongs in the callout; the headline's sub-line is the right
 * home for the working, which is the thing a learner has to reproduce on paper and the thing no
 * amount of restating the reason will teach them.
 */
function working(kind: GivenCase, t: Triangle | undefined): string {
  if (!t) return 'No triangle closes on this data, so there is nothing to substitute into.';
  if (kind === 'sss')
    return `cos A = (b² + c² − a²) / 2bc = (${fmt(t.b)}² + ${fmt(t.c)}² − ${fmt(t.a)}²) / ${fmt(2 * t.b * t.c)}`;
  if (kind === 'sas')
    return `a² = b² + c² − 2bc cos A = ${fmt(t.b)}² + ${fmt(t.c)}² − ${fmt(2 * t.b * t.c)} cos ${fmt(t.A)}°`;
  return `a / sin A = ${fmt(t.a)} / sin ${fmt(t.A)}° = ${fmt(t.a / Math.sin((t.A * Math.PI) / 180))}, the ratio every side shares`;
}

/**
 * One complete triangle, with the given parts in the accent colour and the found parts neutral.
 *
 * Used for the three unambiguous cases only. The ambiguous case draws its shared parts once and
 * its differing parts per solution, which this component cannot express: passing it two triangles
 * made the second one recolour side b, a side that in fact belongs to both.
 */
function TriangleShape({
  t,
  tone,
  givenSides,
  showAngleA,
}: {
  t: Triangle;
  tone: string;
  givenSides: ReadonlyArray<'a' | 'b' | 'c'>;
  showAngleA: boolean;
}): ReactNode {
  const v = vertices(t);
  const P = (p: [number, number]): Vec2 => ({ x: p[0], y: p[1] });
  const mid = (p: [number, number], q: [number, number]): Vec2 => ({
    x: (p[0] + q[0]) / 2,
    y: (p[1] + q[1]) / 2,
  });
  const colour = (side: 'a' | 'b' | 'c'): string => (givenSides.includes(side) ? C_GIVEN : C_FOUND);
  const weight = (side: 'a' | 'b' | 'c'): number => (givenSides.includes(side) ? 3 : 1.8);

  return (
    <>
      {/* c joins A to B, b joins A to C, a joins B to C: the pairing the whole topic rests on. */}
      <Segment from={P(v.A)} to={P(v.B)} color={colour('c')} weight={weight('c')} />
      <Segment from={P(v.A)} to={P(v.C)} color={colour('b')} weight={weight('b')} />
      <Segment from={P(v.B)} to={P(v.C)} color={colour('a')} weight={weight('a')} />
      <Label
        x={mid(v.A, v.B).x}
        y={mid(v.A, v.B).y}
        text={`c ${fmt(t.c)}`}
        color={colour('c')}
        size={12}
        dy={16}
      />
      <Label
        x={mid(v.A, v.C).x}
        y={mid(v.A, v.C).y}
        text={`b ${fmt(t.b)}`}
        color={colour('b')}
        size={12}
        dx={-18}
      />
      <Label
        x={mid(v.B, v.C).x}
        y={mid(v.B, v.C).y}
        text={`a ${fmt(t.a)}`}
        color={colour('a')}
        size={12}
        dx={18}
      />
      {showAngleA ? (
        <AngleArc
          at={P(v.A)}
          from={{ x: 1, y: 0 }}
          to={{ x: v.C[0], y: v.C[1] }}
          rPx={26}
          label={`A ${fmt(t.A)}°`}
        />
      ) : null}
      <Dot x={v.B[0]} y={v.B[1]} r={3.5} color={tone} />
      <Label x={v.B[0]} y={v.B[1]} text={`B ${fmt(t.B)}°`} color={tone} size={11} dy={-10} dx={10} />
      <Label x={v.C[0]} y={v.C[1]} text={`C ${fmt(t.C)}°`} color={tone} size={11} dy={-8} />
    </>
  );
}

export function ObliqueTriangle({
  given = 'ssa',
  cases = ['sss', 'sas', 'aas', 'ssa'],
  title = 'Sine rule, cosine rule, and the triangle that comes in two',
  prompt = 'Ask one question before you pick a rule: do you have a side and the angle facing it? That matching pair runs the sine rule. Without a pair, it is the cosine rule.',
  activity = 'oblique-triangle',
}: ObliqueTriangleProps = {}): ReactNode {
  const [kind, setKind] = useState<GivenCase>(given);
  // One driven number per case, so the slider always changes something the learner is watching.
  const [swing, setSwing] = useState(8);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const choice = ruleFor(kind);

  // Fixed partners chosen so each case is a clean exam-sized question, with `swing` as the one
  // thing that moves. In SSA it is the side that reaches the base, which is the entire point.
  let solutions: Triangle[] = [];
  let givenSides: ReadonlyArray<'a' | 'b' | 'c'> = [];
  let sliderLabel = 'side a';
  let sliderRange: [number, number] = [4, 14];

  if (kind === 'sss') {
    const one = solveSSS(swing, 9, 12);
    solutions = one ? [one] : [];
    givenSides = ['a', 'b', 'c'];
    sliderRange = [4, 20];
  } else if (kind === 'sas') {
    const one = solveSAS(swing, 60, 5);
    solutions = one ? [one] : [];
    givenSides = ['b', 'c'];
    sliderLabel = 'side b';
    sliderRange = [3, 16];
  } else if (kind === 'aas') {
    const one = solveAAS(40, 60, swing);
    solutions = one ? [one] : [];
    givenSides = ['a'];
    sliderRange = [4, 16];
  } else {
    solutions = solveSSA(swing, 10, 40);
    givenSides = ['a', 'b'];
    sliderRange = [4, 14];
  }

  // The ambiguous case earns a sub-line about the COUNT, because that is its whole difficulty.
  // Every other case gets the substitution, so the sub-line never restates the callout below it.
  const note = kind === 'ssa' ? ambiguityNote(swing, 10, 40) : working(kind, solutions[0]);

  // Solved once the learner has met all three SSA outcomes: none, two, one. Reaching all three
  // means they have driven the side through its whole range and watched the count change, which is
  // the only way the ambiguous case stops being a sentence.
  const outcome = kind === 'ssa' ? `ssa-${solutions.length}` : `case-${kind}`;
  useEffect(() => {
    setSeen((s) => (s.has(outcome) ? s : new Set(s).add(outcome)));
  }, [outcome]);
  useCheckpoint({ solved: ['ssa-0', 'ssa-1', 'ssa-2'].every((o) => seen.has(o)), activity });

  // In SSA the apex and the given angle belong to BOTH solutions, so they are drawn once, outside
  // the per-solution loop. Recolouring a shared given side as part of "the second triangle" was the
  // first render's worst bug: it made side b look like it belonged to one answer.
  const apexSSA: Vec2 = {
    x: 10 * Math.cos((40 * Math.PI) / 180),
    y: 10 * Math.sin((40 * Math.PI) / 180),
  };
  // Only the part of the sweep that can actually meet the base is worth drawing: below the base is
  // a region where no triangle closes. Dropping those points is not enough on its own, because a
  // Polyline joins whatever points remain, and a long swing leaves the arc in TWO pieces either
  // side of the dip. Joining them drew a phantom chord straight along the base. So the visible
  // points are grouped into runs and each run is drawn as its own polyline.
  const sweepRuns: Vec2[][] = [];
  for (let i = 0; i <= 60; i++) {
    const th = Math.PI + (Math.PI * i) / 60;
    const p = { x: apexSSA.x + swing * Math.cos(th), y: apexSSA.y + swing * Math.sin(th) };
    if (p.y < 0) {
      if (sweepRuns.at(-1)?.length) sweepRuns.push([]);
      continue;
    }
    if (!sweepRuns.length) sweepRuns.push([]);
    sweepRuns.at(-1)!.push(p);
  }
  const sweep: Vec2[] = sweepRuns.flat();

  // Crop to what is actually on screen rather than to a nominal size, so the triangle fills its
  // frame in every case instead of sitting in a corner of a box sized for the widest one.
  const drawn: Vec2[] = [
    { x: 0, y: 0 },
    ...solutions.flatMap((t) => {
      const v = vertices(t);
      return [
        { x: v.B[0], y: v.B[1] },
        { x: v.C[0], y: v.C[1] },
      ];
    }),
    ...(kind === 'ssa' ? [apexSSA, ...sweep] : []),
  ];
  const xs = drawn.map((p) => p.x);
  const ys = drawn.map((p) => p.y);
  const spanX = Math.max(...xs) - Math.min(...xs) || 1;
  const spanY = Math.max(...ys) - Math.min(...ys) || 1;
  const view = {
    xMin: Math.min(...xs) - spanX * 0.1,
    xMax: Math.max(...xs) + spanX * 0.1,
    // Extra room below the base for the side labels, and above for the apex label.
    yMin: Math.min(...ys) - spanY * 0.24,
    yMax: Math.max(...ys) + spanY * 0.16,
  };

  const figure = (
    <Stage
      view={view}
      height={320}
      ariaLabel={`Triangle from ${CASE_LABEL[kind]}, ${solutions.length} solution${solutions.length === 1 ? '' : 's'}`}
    >
      {/* The base line the swinging side has to reach. Drawing it past the triangle is what makes
          "the side cannot reach" visible when there is no solution at all to draw. */}
      <Segment
        from={{ x: view.xMin, y: 0 }}
        to={{ x: view.xMax, y: 0 }}
        color="var(--stage-grid)"
        weight={1}
      />
      {kind === 'ssa' ? (
        <>
          {/* The arc side `a` sweeps as it hunts for the base. Where it crosses, a triangle closes,
              so the number of crossings IS the number of answers. */}
          {sweepRuns
            .filter((run) => run.length > 1)
            .map((run, i) => (
              <Polyline key={i} points={run} color={C_SECOND} weight={1.2} dashed opacity={0.5} />
            ))}
          {/* Both solutions share the given angle and the given side b, so these are drawn once. */}
          <Segment from={{ x: 0, y: 0 }} to={apexSSA} color={C_GIVEN} weight={3} />
          <Label x={apexSSA.x / 2} y={apexSSA.y / 2} text={`b 10.0`} color={C_GIVEN} size={12} dx={-22} />
          <AngleArc at={{ x: 0, y: 0 }} from={{ x: 1, y: 0 }} to={apexSSA} rPx={26} label="A 40°" />
          <Label
            x={apexSSA.x}
            y={apexSSA.y}
            text={`C, where a = ${fmt(swing)} is hinged`}
            color={C_SECOND}
            size={11}
            dy={-14}
          />
          {solutions.map((t, i) => {
            const v = vertices(t);
            const foot: Vec2 = { x: v.B[0], y: 0 };
            const tone = i === 0 ? C_FOUND : C_SECOND;
            return (
              <g key={i}>
                {/* The given side, swung to this crossing. Same length in both solutions. */}
                <Segment from={apexSSA} to={foot} color={tone} weight={2.4} dashed={i === 1} />
                {/* The third side, which is what the two solutions actually disagree about. */}
                <Segment from={{ x: 0, y: 0 }} to={foot} color={tone} weight={1.6} dashed={i === 1} />
                <Dot x={foot.x} y={0} r={4} color={tone} />
                <Label
                  x={foot.x}
                  y={0}
                  text={`B ${fmt(t.B)}°`}
                  color={tone}
                  size={11}
                  dy={-9}
                  dx={i === 0 ? 14 : -14}
                />
                <Label
                  x={foot.x / 2}
                  y={0}
                  text={`c ${fmt(t.c)}`}
                  color={tone}
                  size={12}
                  dy={i === 0 ? 34 : 17}
                />
              </g>
            );
          })}
        </>
      ) : (
        solutions.map((t, i) => (
          <TriangleShape key={i} t={t} tone={C_FOUND} givenSides={givenSides} showAngleA />
        ))
      )}
    </Stage>
  );

  // The headline is the part this case's rule FINDS, never a by-product. An earlier version led
  // with the area, so a cosine-rule question about side a announced "Area 17.3" in large type.
  const found = (t: Triangle): string =>
    kind === 'sss'
      ? `A = ${fmt(t.A)}°`
      : kind === 'sas'
        ? `a = ${fmt(t.a)}`
        : kind === 'aas'
          ? `b = ${fmt(t.b)}`
          : `B = ${fmt(t.B)}°`;
  const headline =
    solutions.length === 0
      ? 'No triangle closes'
      : solutions.length === 2
        ? 'Two triangles fit the same data'
        : found(solutions[0]!);

  return (
    <Activity.Root className="math-oblique-triangle">
      <Activity.Header>
        <Activity.Heading eyebrow="Trigonometry" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{choice.rule === 'sine' ? 'Sine rule' : 'Cosine rule'}</strong>
        <span>
          {solutions.length} solution{solutions.length === 1 ? '' : 's'}
        </span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Triangle drawn to scale">{figure}</Activity.Canvas>
        <Activity.Dock>
          {/* A dropdown, not a segmented bar: four long case names overflowed the bar and clipped
              the last one, and the rulebook keeps segmented controls for two to four SHORT modes. */}
          <Field label="what you are given">
            <ActivitySelect<GivenCase>
              value={kind}
              options={cases.map((c) => ({ value: c, label: CASE_LABEL[c] }))}
              onChange={(v) => setKind(v)}
              ariaLabel="which parts are given"
            />
          </Field>
          <Field label={sliderLabel} value={fmt(swing)}>
            <Slider
              value={swing}
              min={sliderRange[0]}
              max={sliderRange[1]}
              step={0.5}
              onChange={setSwing}
              ariaLabel={`${sliderLabel} length`}
            />
          </Field>
        </Activity.Dock>
        <Readout value={headline} sub={note} />
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Which rule</span>
        <div>{choice.why}</div>
      </Activity.Feedback>
      <LiveRegion>
        {`${CASE_LABEL[kind]} with ${sliderLabel} ${fmt(swing)}: ${choice.rule} rule, ${solutions.length} triangle${solutions.length === 1 ? '' : 's'}.`}
      </LiveRegion>
    </Activity.Root>
  );
}
