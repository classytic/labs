'use client';

/**
 * RiverBoat, the classic "boat crossing a flowing river" vector problem, the one
 * that trips students on component resolution. A boat aims across the current at a
 * heading θ; the river carries it downstream. Walk the steps to SEE why you add
 * the boat and current velocities tip-to-tail, then resolve the resultant into
 * an "across" component (v_b·cosθ, sets crossing time) and a "downstream"
 * component (v_c − v_b·sinθ, sets the drift). Aim upstream at θ = arcsin(v_c/v_b)
 * and the drift cancels, you land straight across.
 *
 * Now on the @classytic/stage engine (SVG vectors via the shared `LabeledVector`
 * helper, accessible, themed); keeps the agent `useControlSurface` seam.
 */

import { useEffect, useState, type ReactNode } from 'react';
import {
  Stage,
  Grid,
  Segment,
  Dot,
  Label,
  Polygon,
  useControlSurface,
  useCoords,
  fmt,
  type ViewBox,
} from '@classytic/stage';
import { Slider, Chip } from '../kit/controls.js';
import { crossing, regime, strategies } from './river-crossing.js';
import { LabeledVector } from '../kit/diagram/annotations.js';
import { Field } from '../kit/frame.js';
import { Tex } from '../core/tex.js';
import { num, clamp, toRad, toDeg } from '../core/util.js';
import { SceneSurface } from './mechanics/presentation.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../kit/activity-authoring.js';

/**
 * A small boat anchored at the launch point (math origin), heading `thetaDeg`
 * upstream from straight-across. Fixed on-screen size (a constant glyph, like an
 * angle mark), rotated via a transform with static local coordinates, nose
 * points along +across, so rotate(−θ) aims it upstream. SSR-safe: no
 * transcendental-derived coordinate is serialized.
 */
function BoatGlyph({ thetaDeg }: { thetaDeg: number }): ReactNode {
  const c = useCoords();
  const [ox, oy] = c.toPx(0, 0);
  const hull = 'var(--stage-metal)';
  const edge = 'color-mix(in oklab, var(--stage-metal) 60%, black)';
  const sheen = 'color-mix(in oklab, var(--stage-sheen) 50%, transparent)';
  return (
    <g transform={`translate(${fmt(ox)},${fmt(oy)}) rotate(${fmt(-thetaDeg)})`}>
      {/* wake trailing the stern */}
      <path
        d="M -2.4 10 L -3.6 18 M 2.4 10 L 3.6 18"
        fill="none"
        stroke={sheen}
        strokeWidth={1.1}
        strokeDasharray="2 3"
        opacity={0.6}
        strokeLinecap="round"
      />
      {/* contact shadow on the water */}
      <ellipse
        cx={0}
        cy={2}
        rx={6.5}
        ry={9}
        fill="color-mix(in oklab, black 60%, transparent)"
        opacity={0.12}
      />
      {/* hull, nose up (+across) */}
      <path
        d="M 0 -12 C 4.6 -5 5.6 4 4 10 L -4 10 C -5.6 4 -4.6 -5 0 -12 Z"
        fill={hull}
        stroke={edge}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {/* port-side specular */}
      <path
        d="M -3.2 7 C -4.4 2 -3.4 -3 0 -8.5"
        fill="none"
        stroke={sheen}
        strokeWidth={0.9}
        opacity={0.55}
      />
      {/* cabin / console */}
      <rect
        x={-2.6}
        y={-1.5}
        width={5.2}
        height={4}
        rx={1.2}
        fill="var(--stage-bg)"
        stroke={edge}
        strokeWidth={0.6}
      />
      {/* bow light */}
      <circle cx={0} cy={-9} r={1.1} fill="var(--stage-accent)" />
    </g>
  );
}

/**
 * Wave streaks drifting downstream, illustrating the current. Drift speed scales
 * with `current` (vᵧ), a still river is calm, a fast one streams. Animated with
 * a CSS keyframe (declarative, SSR-safe, honours prefers-reduced-motion); the
 * dash period equals the keyframe translate, so the loop is seamless.
 */
function RiverWaves({ view, W, current }: { view: ViewBox; W: number; current: number }): ReactNode {
  const c = useCoords();
  if (current <= 0.01) return null;
  const leftX = c.toPx(view.xMin, 0)[0] - 40;
  const rightX = c.toPx(view.xMax, 0)[0] + 40;
  const speed = current * c.sx(1) * 0.3; // px/s
  const dur = Math.max(1.2, Math.min(14, 28 / speed)); // dash period (28px) / speed
  const ys = [0.16, 0.38, 0.6, 0.82, 0.96].map((f) => c.toPx(0, f * W)[1]);
  return (
    <g className="lab-river-wave" style={{ animationDuration: `${dur}s` }}>
      {ys.map((y, i) => (
        <line
          key={i}
          x1={fmt(leftX)}
          y1={fmt(y)}
          x2={fmt(rightX)}
          y2={fmt(y)}
          stroke="var(--stage-accent)"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeDasharray="10 18"
          strokeDashoffset={i % 2 ? 9 : 0}
          opacity={0.42}
        />
      ))}
    </g>
  );
}

const STEPS = [
  'Aim the boat across, this is its velocity through the water.',
  'The river flows, pushing the boat downstream at vᵧ.',
  'Add them tip-to-tail: the resultant is the boat’s true path over the ground.',
  'Resolve the resultant: across = vᵦ·cos θ, downstream = vᵧ − vᵦ·sin θ.',
  'Across speed sets the crossing time; the leftover downstream speed is the drift.',
];

const RIVER_ACTIVITY: AuthoredActivity = {
  pattern: 'scenario',
  title: 'Plan a river crossing',
  objectives: [
    'Add boat and current velocity vectors',
    'Resolve the resultant into crossing and drift components',
    'Choose a heading that controls the landing point',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the landing side',
      lead: 'Decide whether the boat lands upstream, straight across, or downstream.',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Build the vector sum',
      lead: 'Reveal the tip-to-tail construction.',
      controls: true,
      reveal: ['model'],
      success: 'construction-seen',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read crossing and drift',
      lead: 'Connect the resultant components to time and landing position.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the landing point',
      lead: 'Use across and downstream components in your explanation.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Aim for a new landing',
      lead: 'Change heading or current and compare the result.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'heading-changed',
    },
  ],
  success: [
    {
      id: 'construction-seen',
      source: 'metric',
      key: 'constructionSeen',
      operator: 'eq',
      value: true,
      pendingLabel: 'Reveal the complete vector construction.',
    },
    {
      id: 'heading-changed',
      source: 'metric',
      key: 'headingChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change the boat heading.',
    },
  ],
};

export interface RiverBoatProps {
  boatSpeed?: number | string;
  current?: number | string;
  riverWidth?: number | string;
  title?: string;
  height?: number;
  /** Register an agent-control surface under this id (see `useControlSurface`). */
  controlId?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

export function RiverBoat({
  boatSpeed,
  current,
  riverWidth,
  title = 'Crossing a flowing river',
  height = 360,
  controlId,
  prompt = 'Add the boat’s velocity through the water to the river current, then connect the resultant to crossing time and downstream drift.',
  objectives,
  activity = 'river-boat',
}: RiverBoatProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'river-boat';
  const authoredActivity = typeof activity === 'string' ? RIVER_ACTIVITY : activity;
  const W = clamp(num(riverWidth, 8), 3, 14);
  const [vb, setVb] = useState(clamp(num(boatSpeed, 4), 0.5, 10));
  const [vc, setVc] = useState(clamp(num(current, 2), 0, 8));
  const [theta, setTheta] = useState(0); // degrees upstream from straight-across
  const [step, setStep] = useState(0);
  useEffect(() => {
    setVb(clamp(num(boatSpeed, 4), 0.5, 10));
  }, [boatSpeed]);
  useEffect(() => {
    setVc(clamp(num(current, 2), 0, 8));
  }, [current]);

  // Agent-control surface: a voice/AI agent can drive this widget by id.
  useControlSurface(controlId, {
    heading: {
      type: 'number',
      label: 'heading θ (° upstream)',
      min: -60,
      max: 60,
      get: () => theta,
      set: setTheta,
    },
    boatSpeed: {
      type: 'number',
      label: 'boat speed',
      min: 0.5,
      max: 10,
      unit: 'm/s',
      get: () => vb,
      set: setVb,
    },
    current: { type: 'number', label: 'current', min: 0, max: 8, unit: 'm/s', get: () => vc, set: setVc },
    step: {
      type: 'number',
      label: 'walkthrough step',
      min: 0,
      max: STEPS.length - 1,
      get: () => step,
      set: (v) => setStep(Math.round(v)),
    },
    aimStraight: {
      type: 'action',
      label: 'aim to land straight across',
      invoke: () => setTheta(toDeg(Math.asin(clamp(vc / vb, -1, 1)))),
    },
  });

  const rad = toRad(theta);
  const across = vb * Math.cos(rad); // +y velocity
  const downstream = vc - vb * Math.sin(rad); // +x velocity (net)
  const cross = across > 1e-3;
  const tCross = cross ? W / across : Infinity;
  const drift = cross ? downstream * tCross : Infinity;

  const view = { xMin: -3, xMax: 15, yMin: -2, yMax: W + 3 };
  const boatV = { x: -vb * Math.sin(rad), y: vb * Math.cos(rad) };
  const curV = { x: vc, y: 0 };
  const resV = { x: boatV.x + curV.x, y: boatV.y + curV.y };

  // The three aims a learner can hold, and which of them the current physically allows. See
  // river-crossing.ts: the strategy that dies at v = u is the point of the whole topic, so it
  // stays on screen and says why rather than disappearing when its regime ends.
  const aims = strategies(vb, vc);
  const here = regime(vb, vc);
  const outcomes = aims.map((aim) => ({
    aim,
    result: aim.headingDeg === null ? null : crossing(vb, vc, aim.headingDeg, W),
  }));

  const figure = (
    <SceneSurface className="physics-river-boat-scene" tone="grid">
      <Stage
        view={view}
        height={height}
        ariaLabel={`River-crossing vector diagram, step ${step + 1} of ${STEPS.length}`}
      >
        <Grid />
        {/* river band + banks */}
        <Polygon
          points={[
            { x: view.xMin, y: 0 },
            { x: view.xMax, y: 0 },
            { x: view.xMax, y: W },
            { x: view.xMin, y: W },
          ]}
          color="none"
          fill="var(--stage-accent)"
          fillOpacity={0.1}
        />
        <RiverWaves view={view} W={W} current={vc} />
        <Segment
          from={{ x: view.xMin, y: 0 }}
          to={{ x: view.xMax, y: 0 }}
          color="var(--stage-fg)"
          opacity={0.4}
          weight={2}
        />
        <Segment
          from={{ x: view.xMin, y: W }}
          to={{ x: view.xMax, y: W }}
          color="var(--stage-fg)"
          opacity={0.4}
          weight={2}
        />
        <Label
          x={view.xMax - 1}
          y={0}
          text="start bank"
          color="var(--stage-fg)"
          anchor="end"
          dy={14}
          size={12}
        />
        <Label
          x={view.xMax - 1}
          y={W}
          text="far bank"
          color="var(--stage-fg)"
          anchor="end"
          dy={-10}
          size={12}
        />
        <Dot x={0} y={W} r={4} color="var(--stage-fg)" opacity={0.5} />
        {/* boat velocity through water (step 0+) */}
        <LabeledVector tail={{ x: 0, y: 0 }} comp={boatV} color="var(--stage-accent)" label="boat vᵦ" />
        {/* current from origin (step 1+) */}
        {step >= 1 && (
          <LabeledVector tail={{ x: 0, y: 0 }} comp={curV} color="var(--stage-accent-2)" label="current vᵧ" />
        )}
        {/* tip-to-tail current + resultant (step 2+) */}
        {step >= 2 && <LabeledVector tail={boatV} comp={curV} color="var(--stage-accent-2)" weight={1.5} />}
        {step >= 2 && (
          <LabeledVector
            tail={{ x: 0, y: 0 }}
            comp={resV}
            color="var(--stage-good)"
            weight={3}
            components={step >= 3}
            label="resultant"
          />
        )}
        {/* actual path to far bank + landing (step 4+) */}
        {step >= 4 && cross && (
          <Segment
            from={{ x: 0, y: 0 }}
            to={{ x: drift, y: W }}
            color="var(--stage-good)"
            weight={1.5}
            dashed
          />
        )}
        {step >= 4 && cross && <Dot x={drift} y={W} r={6} color="var(--stage-good)" />}
        {step >= 4 && cross && (
          <Label x={drift} y={W} text="lands here" color="var(--stage-good)" dy={-12} size={12} />
        )}
        <BoatGlyph thetaDeg={theta} /> {/* the boat */}
      </Stage>
    </SceneSurface>
  );

  const aside = (
    <>
      <div className="physics-probe">
        <span>{cross ? 'Predicted landing' : 'No crossing'}</span>
        <strong>{cross ? `${drift.toFixed(1)} m downstream` : 'Aim less upstream'}</strong>
        <small>{cross ? `crossing time ${tCross.toFixed(1)} s` : 'across speed is zero'}</small>
      </div>
      <div className="physics-thermal-model">
        <Tex tex={`v_{across} = v_b\\cos\\theta = ${across.toFixed(2)}`} />
        <Tex tex={`v_{down} = v_c - v_b\\sin\\theta = ${downstream.toFixed(2)}`} />
        {cross && <Tex tex={`t = W/(v_b\\cos\\theta) = ${tCross.toFixed(1)}\\,\\text{s}`} />}
      </div>
    </>
  );

  const controls = (
    <>
      <div className="lab-field-row">
        <Chip selected={false} onClick={() => setStep((value) => Math.max(0, value - 1))}>
          Previous construction
        </Chip>
        <Chip
          selected={step === STEPS.length - 1}
          onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}
        >
          {step === STEPS.length - 1 ? 'Construction complete' : 'Reveal next vector'}
        </Chip>
        <Chip
          selected={false}
          onClick={() => {
            setVb(clamp(num(boatSpeed, 4), 0.5, 10));
            setVc(clamp(num(current, 2), 0, 8));
            setTheta(0);
            setStep(0);
          }}
        >
          Reset
        </Chip>
      </div>
      <div className="lab-field-row physics-river-aims">
        {aims.map((aim) => (
          <Chip
            key={aim.id}
            selected={aim.headingDeg !== null && Math.abs(theta - aim.headingDeg) < 0.5}
            disabled={aim.headingDeg === null}
            title={aim.unavailable}
            onClick={() => aim.headingDeg !== null && setTheta(aim.headingDeg)}
          >
            {aim.label}
          </Chip>
        ))}
      </div>
      {/* The dead aim explains itself in words, because a greyed-out button on its own reads as
          a broken interface rather than as physics that ran out. */}
      {aims
        .filter((aim) => aim.unavailable)
        .map((aim) => (
          <p key={aim.id} className="physics-river-why">
            <strong>{aim.label}:</strong> {aim.unavailable}
          </p>
        ))}
      {/* Both aims, side by side and always. A slider shows you one state at a time, so the
          trade-off between fastest and straightest is exactly what a learner never sees: by the
          time they reach the second aim, the first one's numbers are gone. */}
      <table className="physics-river-compare">
        <caption>What each aim costs</caption>
        <thead>
          <tr>
            <th scope="col">Aim</th>
            <th scope="col">θ</th>
            <th scope="col">time</th>
            <th scope="col">lands</th>
          </tr>
        </thead>
        <tbody>
          {outcomes.map(({ aim, result }) => (
            <tr key={aim.id} data-dead={result === null || undefined}>
              <th scope="row">{aim.label}</th>
              <td>{aim.headingDeg === null ? '—' : `${aim.headingDeg.toFixed(0)}°`}</td>
              <td>{result?.lands ? `${result.time.toFixed(1)} s` : '—'}</td>
              <td>{result?.lands ? `${result.drift.toFixed(1)} m` : 'never crosses'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Field label="boat vᵦ" value={vb.toFixed(1)}>
        <Slider value={vb} min={0.5} max={10} step={0.1} onChange={setVb} ariaLabel="boat speed" />
      </Field>
      <Field label="current vᵧ" value={vc.toFixed(1)}>
        <Slider value={vc} min={0} max={8} step={0.1} onChange={setVc} ariaLabel="current speed" />
      </Field>
      <Field label="θ (° up)" value={theta.toFixed(0)}>
        <Slider value={theta} min={-60} max={60} step={1} onChange={setTheta} ariaLabel="heading upstream" />
      </Field>
    </>
  );

  return (
    <AuthoredActivityRuntime
      className="physics-river-boat"
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Vectors and motion"
      title={title}
      description={prompt}
      status={
        <>
          <span>
            {here === 'current-wins'
              ? 'Current outruns the boat'
              : here === 'balanced'
                ? 'Boat and current matched'
                : Math.abs(downstream) < 0.02
                  ? 'Straight crossing'
                  : downstream > 0
                    ? 'Drifting downstream'
                    : 'Aiming past upstream'}
          </span>
          <span>
            construction {step + 1}/{STEPS.length}
          </span>
          <span>t {cross ? `${tCross.toFixed(1)} s` : '—'}</span>
          <span>drift {cross ? `${drift.toFixed(1)} m` : '—'}</span>
        </>
      }
      evidence={aside}
      controls={controls}
      observation={STEPS[step]}
      transcript={
        <p>{`Boat speed ${vb.toFixed(1)}, current ${vc.toFixed(1)}, heading ${theta.toFixed(0)} degrees. ${cross ? `Crossing time ${tCross.toFixed(1)} seconds and drift ${drift.toFixed(1)} metres.` : 'The boat does not cross.'}`}</p>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="construction-seen"
            met={step === STEPS.length - 1}
            complete={complete}
          />
          <AuthoredMetricGate conditionId="heading-changed" met={theta !== 0} complete={complete} />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
