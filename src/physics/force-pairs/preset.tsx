'use client';

/**
 * ForcePairsLab, Newton's third law drawn as TWO BODIES, never one.
 *
 * The whole difficulty of the third law is a drawing habit. A learner who has only ever seen
 * "action and reaction" written as two arrows on one picture concludes that they cancel, and then
 * cannot explain why anything ever accelerates. So this figure refuses to draw them together:
 * each body sits inside its own dashed system boundary, with a visible gap between the two, and
 * every arrow that belongs to a body is drawn INSIDE that body's boundary. Nothing in the figure
 * can be added up across the gap, because the gap is the point. The only thing that crosses it is
 * a hairline marking the one interaction the two forces come from.
 *
 * Three things the figure has to carry, in the order they matter:
 *   1. DIFFERENT BODIES. "force A on B" lives in B's box; "force B on A" lives in A's box. The
 *      names are written out in words rather than as F_AB subscripts, because a subscript at a
 *      legible base size drops below the 12 px on-screen floor, and because "A on B" is the
 *      sentence a learner has to be able to say out loud.
 *   2. EQUAL FORCES, UNEQUAL ACCELERATIONS. The force arrows are drawn from the force slider ONLY:
 *      dragging either mass slider does not move them by a pixel. The acceleration arrows below
 *      are normalised so the larger one always spans the same distance, which makes their LENGTH
 *      RATIO exactly the mass ratio, F/m_A : F/m_B. That contrast, seen in one glance while a mass
 *      slider moves, is the horse-and-cart resolution.
 *   3. NOT EVERY EQUAL-AND-OPPOSITE PAIR IS A PAIR. Weight and the table's push act on the SAME
 *      body, so they fail test 1. Drawing that counter-example would need a third body and a
 *      vertical axis and would wreck the figure, so it lives in the explain step instead, where
 *      the learner meets it as a question rather than as decoration.
 *
 * The bodies are drawn the same size whatever their mass. A body that grew with its mass would
 * invite exactly the reading the lab exists to kill, that the bigger thing pushes harder; the
 * mass is a number under each body instead, and the size difference the learner is meant to feel
 * shows up only where it belongs, in the acceleration arrows.
 *
 * Every scenario is frictionless on purpose (ice, orbit, vacuum). On a rough floor a = F/m is a
 * lie, since the ground supplies a second horizontal force, and a lab whose arithmetic the learner
 * cannot reproduce teaches nothing. A person pushing a crate therefore happens in a space station.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Circle, Label, Polygon, Polyline, Segment, type Vec2 } from '@classytic/stage';
import { Control, Field } from '../../kit/frame.js';
import { Segmented, Slider } from '../../kit/controls.js';
import { Tex } from '../../core/tex.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { MechanicsVector, SceneSurface } from '../mechanics/presentation.js';

const FORCE = 'var(--stage-accent)';
const ACCEL = 'var(--stage-warn)';
const BODY = 'var(--stage-fg)';
const SOFT = 'var(--stage-muted)';
const METAL = 'var(--stage-metal)';

/** Scene geometry, in the Stage's own units. Kept together so a tweak cannot desynchronise. */
const VIEW = { xMin: -11, xMax: 11, yMin: -3, yMax: 5.4 };
const BODY_X = 5.6; // |x| of each body's centre — the two are mirror images about the gap
const Y_FORCE = 2.05; // body centre height; force arrows leave from here
const Y_ACCEL = -1.35; // acceleration arrows sit in their own band below each body
const PANEL_GAP = 0.35; // half-width of the empty channel between the two system boundaries
const PANEL_X = 10.9;
const PANEL_TOP = 4.75;
const PANEL_BOTTOM = -2.5;
const F_MAX = 400;
const A_ARROW_MAX = 4.8;
const A_ARROW_MIN = 0.5; // keeps a 1 kg-vs-120 kg arrow visible; the printed number stays exact

export type ForcePairsScenario = 'skaters' | 'push' | 'rocket';
type GlyphKind = 'person' | 'crate' | 'rocket' | 'gas';

interface ScenarioSpec {
  chip: string;
  status: string;
  nameA: string;
  nameB: string;
  glyphA: GlyphKind;
  glyphB: GlyphKind;
  /** What crosses the gap: the single interaction both forces come from. */
  contact: string;
}

const SCENARIOS: Record<ForcePairsScenario, ScenarioSpec> = {
  skaters: {
    chip: 'two skaters',
    status: 'skaters on ice',
    nameA: 'skater A',
    nameB: 'skater B',
    glyphA: 'person',
    glyphB: 'person',
    contact: 'palms in contact',
  },
  push: {
    chip: 'person + crate',
    status: 'astronaut and crate',
    nameA: 'astronaut',
    nameB: 'crate',
    glyphA: 'person',
    glyphB: 'crate',
    contact: 'hand on crate',
  },
  rocket: {
    chip: 'rocket + exhaust',
    status: 'rocket and exhaust',
    nameA: 'rocket',
    nameB: 'exhaust gas',
    glyphA: 'rocket',
    glyphB: 'gas',
    contact: 'gas thrown out of the nozzle',
  },
};

const FORCE_PAIRS_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Newton\u2019s third law: the pair acts on two bodies',
  objectives: [
    'Name the two bodies a force pair acts on',
    'Keep the pair equal while the masses differ',
    'Explain why equal forces do not cancel',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict who pushes harder',
      lead: 'Commit before you touch a slider.',
      success: 'pair-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Make the masses very different',
      lead: 'Drag either mass slider and watch the two force arrows, not the bodies.',
      controls: true,
      reveal: ['model'],
      success: 'mass-changed',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Compare the two bands of arrows',
      lead: 'The force arrows stayed the same length. The acceleration arrows did not.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Decide what is not a pair',
      lead: 'A pair needs two bodies. Equal and opposite is not enough, so test this everyday case before you trust the rule.',
      reveal: ['model', 'evidence'],
      success: 'not-a-pair-answer',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Find the same pair somewhere else',
      lead: 'Switch the situation. The bodies change; the rule that the two arrows sit in different boxes does not.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'scenario-changed',
    },
  ],
  questions: [
    {
      id: 'pair',
      prompt: 'A heavy skater and a light skater push apart on ice. While their hands are touching\u2026',
      choices: [
        {
          value: 'equal',
          label: 'each pushes the other equally hard, and the lighter one speeds up more',
        },
        { value: 'heavier', label: 'the heavier skater pushes harder' },
        { value: 'cancel', label: 'the forces are equal and opposite, so they cancel and neither moves' },
        { value: 'lighter', label: 'the lighter skater pushes harder, which is why she flies off' },
      ],
      answer: 'equal',
      explain:
        'One contact, one pair, two equal forces. They cannot cancel, because they act on different bodies: the push on the heavy skater is the only horizontal force on her, and the push on the light skater is the only one on him. Same force, smaller mass, bigger acceleration.',
      tryAgain:
        'Two forces only cancel when they act on the same body. Check which body each of these two forces is applied to.',
    },
    {
      id: 'not-a-pair',
      prompt:
        'A book rests on a table. Earth pulls the book down with 12 N; the table pushes the book up with 12 N. Are those two a Newton\u2019s-third-law pair?',
      choices: [
        { value: 'same-body', label: 'No \u2014 both of them act on the book, so they are not a pair' },
        { value: 'yes', label: 'Yes \u2014 they are equal and opposite' },
        { value: 'not-equal', label: 'No \u2014 they are not really equal, or the book would float' },
      ],
      answer: 'same-body',
      explain:
        'They balance on one body, which is Newton\u2019s first law, not the third. The partner of the book\u2019s weight is the book pulling the Earth up. The partner of the table\u2019s push on the book is the book pushing down on the table. Each real pair has one arrow in each box.',
      tryAgain: 'Draw the two boxes. If both arrows land in the same box, it is not a pair.',
    },
  ],
  success: [
    {
      id: 'pair-answer',
      source: 'answer',
      key: 'pair',
      operator: 'eq',
      value: 'equal',
      pendingLabel: 'Predict which skater pushes harder.',
    },
    {
      id: 'mass-changed',
      source: 'metric',
      key: 'massChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change one of the two masses.',
    },
    {
      id: 'not-a-pair-answer',
      source: 'answer',
      key: 'not-a-pair',
      operator: 'eq',
      value: 'same-body',
      pendingLabel: 'Decide whether weight and the table\u2019s push are a pair.',
    },
    {
      id: 'scenario-changed',
      source: 'metric',
      key: 'scenarioChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Switch to another situation.',
    },
  ],
};

export interface ForcePairsProps {
  /** Which interaction opens first. */
  scenario?: ForcePairsScenario;
  /** Size of the interaction force, N. Both members of the pair always have this size. */
  forceN?: number;
  /** Mass of body A, kg. */
  massAKg?: number;
  /** Mass of body B, kg. */
  massBKg?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

/** 1 significant place below 100, none above, so a 400 m/s² arrow does not print as 400.0. */
const fmtA = (a: number): string => (a >= 100 ? a.toFixed(0) : a.toFixed(1));

/**
 * One body, drawn facing its partner. `dir` is +1 when the other body lies to the right, so a
 * single set of coordinates serves both halves of the mirror-image figure.
 */
function BodyGlyph({ kind, cx, dir }: { kind: GlyphKind; cx: number; dir: 1 | -1 }): ReactNode {
  if (kind === 'person') {
    const hx = cx - dir * 0.35;
    return (
      <>
        <Circle center={{ x: hx, y: 3 }} r={0.42} color={BODY} fill={BODY} fillOpacity={0.85} weight={2} />
        <Polyline
          points={[
            { x: hx, y: 2.58 },
            { x: cx - dir * 0.5, y: 1.5 },
          ]}
          color={BODY}
          weight={3.5}
        />
        {/* the arm reaches toward the partner: the force pair has a visible place to happen */}
        <Polyline
          points={[
            { x: cx - dir * 0.42, y: 2.35 },
            { x: cx + dir * 0.35, y: 2.18 },
            { x: cx + dir * 1.15, y: 2.05 },
          ]}
          color={BODY}
          weight={3.5}
        />
        <Polyline
          points={[
            { x: cx - dir * 1.05, y: 0.85 },
            { x: cx - dir * 0.5, y: 1.5 },
            { x: cx + dir * 0.15, y: 0.9 },
          ]}
          color={BODY}
          weight={3.5}
        />
      </>
    );
  }
  if (kind === 'crate') {
    return (
      <>
        <Polygon
          points={[
            { x: cx - 1.35, y: 0.85 },
            { x: cx + 1.35, y: 0.85 },
            { x: cx + 1.35, y: 3.25 },
            { x: cx - 1.35, y: 3.25 },
          ]}
          color={METAL}
          fill={METAL}
          fillOpacity={0.22}
          weight={2.5}
        />
        <Segment from={{ x: cx - 1.35, y: 0.85 }} to={{ x: cx + 1.35, y: 3.25 }} color={METAL} weight={1.5} />
        <Segment from={{ x: cx - 1.35, y: 3.25 }} to={{ x: cx + 1.35, y: 0.85 }} color={METAL} weight={1.5} />
      </>
    );
  }
  if (kind === 'rocket') {
    // the nose points AWAY from the partner, i.e. the way the rocket is about to accelerate
    const n = -dir;
    return (
      <>
        <Polygon
          points={[
            { x: cx + n * 1.75, y: Y_FORCE },
            { x: cx + n * 0.55, y: Y_FORCE + 0.72 },
            { x: cx - n * 1.25, y: Y_FORCE + 0.72 },
            { x: cx - n * 1.25, y: Y_FORCE - 0.72 },
            { x: cx + n * 0.55, y: Y_FORCE - 0.72 },
          ]}
          color={BODY}
          fill={BODY}
          fillOpacity={0.14}
          weight={2.5}
        />
        <Polygon
          points={[
            { x: cx - n * 0.55, y: Y_FORCE + 0.72 },
            { x: cx - n * 1.45, y: Y_FORCE + 1.35 },
            { x: cx - n * 1.45, y: Y_FORCE + 0.72 },
          ]}
          color={BODY}
          fill={BODY}
          fillOpacity={0.14}
          weight={2}
        />
        <Polygon
          points={[
            { x: cx - n * 0.55, y: Y_FORCE - 0.72 },
            { x: cx - n * 1.45, y: Y_FORCE - 1.35 },
            { x: cx - n * 1.45, y: Y_FORCE - 0.72 },
          ]}
          color={BODY}
          fill={BODY}
          fillOpacity={0.14}
          weight={2}
        />
      </>
    );
  }
  // a puff of exhaust: a body made of gas is still a body, and it still gets its own box
  const puffs: [number, number, number][] = [
    [0, 0, 0.62],
    [-0.95, 0.5, 0.45],
    [0.95, -0.45, 0.45],
    [-0.75, -0.62, 0.38],
    [0.8, 0.65, 0.4],
    [1.65, 0.15, 0.3],
    [-1.65, -0.1, 0.32],
  ];
  return (
    <>
      {puffs.map(([dx, dy, r], i) => (
        <Circle
          key={i}
          center={{ x: cx + dx, y: Y_FORCE + dy }}
          r={r}
          color={METAL}
          fill={METAL}
          fillOpacity={0.24}
          weight={1.75}
        />
      ))}
    </>
  );
}

/** The dashed system boundary that makes "different bodies" structural rather than captioned. */
function SystemBox({ x0, x1 }: { x0: number; x1: number }): ReactNode {
  const corners: Vec2[] = [
    { x: x0, y: PANEL_BOTTOM },
    { x: x1, y: PANEL_BOTTOM },
    { x: x1, y: PANEL_TOP },
    { x: x0, y: PANEL_TOP },
  ];
  return (
    <>
      <Polygon points={corners} color="transparent" fill={BODY} fillOpacity={0.035} weight={0} />
      <Polyline points={[...corners, corners[0]!]} color={SOFT} weight={1.25} opacity={0.5} dashed />
    </>
  );
}

export function ForcePairsLab({
  scenario: scenario0 = 'skaters',
  forceN = 200,
  massAKg = 80,
  massBKg = 20,
  title = 'Newton\u2019s third law: force pairs',
  prompt = 'Every push is shared by two bodies. Separate them and the two forces can never be added together, however different the masses are.',
  objectives,
  activity = 'force-pairs',
}: ForcePairsProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'force-pairs';
  const authoredActivity = typeof activity === 'string' ? FORCE_PAIRS_ACTIVITY : activity;
  const [scenario, setScenario] = useState<ForcePairsScenario>(scenario0);
  const [force, setForce] = useState(forceN);
  const [massA, setMassA] = useState(massAKg);
  const [massB, setMassB] = useState(massBKg);

  const scene = SCENARIOS[scenario];
  const accelA = force / massA;
  const accelB = force / massB;

  // Force arrows read the FORCE slider and nothing else: that independence from mass is the lesson.
  // The 2.8 floor keeps the head clear of the widest glyph (the rocket nose) at the smallest force.
  const forceLen = 2.8 + 2 * (force / F_MAX);
  // Accelerations are normalised to the larger one, so the two lengths are in the ratio m_B : m_A.
  const accelMax = Math.max(accelA, accelB);
  const accelLen = (a: number): number => Math.max(A_ARROW_MIN, A_ARROW_MAX * (a / accelMax));
  const lenA = accelLen(accelA);
  const lenB = accelLen(accelB);

  // Both halves are mirror images about the gap: a pushed pair always flies apart.
  const forceLabelX = (BODY_X + 1.6 + BODY_X + forceLen) / 2;

  const figure = (
    <SceneSurface>
      <Stage
        view={VIEW}
        height={340}
        preserveAspect={false}
        ariaLabel="Two separated bodies, each inside its own boundary, each carrying one force of the pair and its own acceleration"
      >
        <SystemBox x0={-PANEL_X} x1={-PANEL_GAP} />
        <SystemBox x0={PANEL_GAP} x1={PANEL_X} />
        <Label x={0} y={5.1} text="two different bodies" color={BODY} size={14} weight={700} />

        {/* the ONE interaction, drawn crossing the gap so the pair has a visible common origin */}
        <Segment
          from={{ x: -3.8, y: Y_FORCE }}
          to={{ x: 3.8, y: Y_FORCE }}
          color={SOFT}
          weight={1.25}
          opacity={0.55}
          dashed
        />
        <Label x={0} y={2.62} text={scene.contact} color={SOFT} size={13} weight={600} />

        <BodyGlyph kind={scene.glyphA} cx={-BODY_X} dir={1} />
        <BodyGlyph kind={scene.glyphB} cx={BODY_X} dir={-1} />

        {/* the pair: same length, opposite directions, one inside each boundary */}
        <MechanicsVector
          tail={{ x: -BODY_X, y: Y_FORCE }}
          tip={{ x: -BODY_X - forceLen, y: Y_FORCE }}
          color={FORCE}
          weight={3.5}
          label={`force B on A · ${force} N`}
          labelAt={{ x: -forceLabelX, y: 4.12 }}
          active
        />
        <MechanicsVector
          tail={{ x: BODY_X, y: Y_FORCE }}
          tip={{ x: BODY_X + forceLen, y: Y_FORCE }}
          color={FORCE}
          weight={3.5}
          label={`force A on B · ${force} N`}
          labelAt={{ x: forceLabelX, y: 4.12 }}
          active
        />

        <Label
          x={-BODY_X}
          y={0.28}
          text={`A \u00b7 ${scene.nameA} \u00b7 ${massA} kg`}
          color={BODY}
          size={14}
          weight={650}
        />
        <Label
          x={BODY_X}
          y={0.28}
          text={`B \u00b7 ${scene.nameB} \u00b7 ${massB} kg`}
          color={BODY}
          size={14}
          weight={650}
        />

        {/* the consequence band: same force in, different motion out */}
        <MechanicsVector
          tail={{ x: -BODY_X, y: Y_ACCEL }}
          tip={{ x: -BODY_X - lenA, y: Y_ACCEL }}
          color={ACCEL}
          weight={2.5}
          label={`a = ${fmtA(accelA)} m/s\u00b2`}
          labelAt={{ x: -BODY_X - lenA / 2, y: -0.55 }}
        />
        <MechanicsVector
          tail={{ x: BODY_X, y: Y_ACCEL }}
          tip={{ x: BODY_X + lenB, y: Y_ACCEL }}
          color={ACCEL}
          weight={2.5}
          label={`a = ${fmtA(accelB)} m/s\u00b2`}
          labelAt={{ x: BODY_X + lenB / 2, y: -0.55 }}
        />
      </Stage>
    </SceneSurface>
  );

  const instruments = (
    <>
      <div className="physics-probe">
        <span>The pair</span>
        <strong className="physics-equation-result">
          <Tex tex={`F_{\\text{A on B}}=F_{\\text{B on A}}=${force}\\,\\mathrm{N}`} />
        </strong>
        <small>One interaction, two forces, one applied to each body</small>
      </div>
      <div className="physics-probe">
        <span>What each body does</span>
        <strong className="physics-equation-result">
          <Tex
            tex={`a_A=\\frac{${force}}{${massA}}=${fmtA(accelA)}\\quad a_B=\\frac{${force}}{${massB}}=${fmtA(accelB)}\\ \\mathrm{m/s^2}`}
          />
        </strong>
        <small>
          {massA === massB
            ? 'Equal masses, so the two accelerations match as well'
            : `The ${massA > massB ? 'lighter' : 'heavier'} body accelerates ${fmtA(Math.max(accelA, accelB) / Math.min(accelA, accelB))} times as fast, from the same force`}
        </small>
      </div>
      <p className="physics-explain">
        Horse and cart: the horse pulls the cart forward and the cart pulls the horse back just as hard, yet
        the cart still moves, because the horse&rsquo;s pull is the only one of those two forces applied{' '}
        <em>to the cart</em>.
      </p>
    </>
  );

  const controls = (
    <>
      <Control name="situation">
        <div className="lab-segmented-field">
          <span className="lab-field-label">situation</span>
          <Segmented
            ariaLabel="interaction"
            value={scenario}
            onChange={setScenario}
            options={(Object.keys(SCENARIOS) as ForcePairsScenario[]).map((key) => ({
              value: key,
              label: SCENARIOS[key].chip,
            }))}
          />
        </div>
      </Control>
      <Field label="push force" value={`${force} N`}>
        <Slider
          value={force}
          min={10}
          max={F_MAX}
          step={10}
          onChange={setForce}
          ariaLabel="size of the interaction force in newtons"
        />
      </Field>
      <Field label="mass A" value={`${massA} kg`}>
        <Slider
          value={massA}
          min={1}
          max={120}
          step={1}
          onChange={setMassA}
          ariaLabel={`mass of body A in kilograms`}
        />
      </Field>
      <Field label="mass B" value={`${massB} kg`}>
        <Slider
          value={massB}
          min={1}
          max={120}
          step={1}
          onChange={setMassB}
          ariaLabel={`mass of body B in kilograms`}
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
          <span>{scene.status}</span>
          <span>F {force} N</span>
          <span>
            {massA} : {massB} kg
          </span>
        </>
      }
      evidence={instruments}
      controls={controls}
      observation={({ sequence }) =>
        sequence.current.phase === 'explain'
          ? 'Equal and opposite is not the test. Two bodies is the test: weight and the table\u2019s push both act on the book, so they balance it rather than pair with it.'
          : 'The two force arrows keep the same length however far apart you drag the masses. They cannot cancel, because each one is the only member of the pair inside its own box.'
      }
      transcript={
        <p>
          {`${scene.nameA} and ${scene.nameB} interact once. ${scene.nameB} pushes ${scene.nameA} with ${force} newtons, and ${scene.nameA} pushes ${scene.nameB} back with the same ${force} newtons in the opposite direction. Because ${scene.nameA} has a mass of ${massA} kilograms it accelerates at ${fmtA(accelA)} metres per second squared, while ${scene.nameB} at ${massB} kilograms accelerates at ${fmtA(accelB)}.`}
        </p>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="mass-changed"
            met={massA !== massAKg || massB !== massBKg}
            complete={complete}
          />
          <AuthoredMetricGate
            conditionId="scenario-changed"
            met={scenario !== scenario0}
            complete={complete}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
