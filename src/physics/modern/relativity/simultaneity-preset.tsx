'use client';

import { useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import {
  AuthoredActivityRuntime,
  AuthoredMetricGate,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import { Segmented, Slider } from '../../../kit/controls.js';
import { Field, Readout, Stat, StatList } from '../../../kit/frame.js';
import { Arrow, Ball, FigTag, FigText, Figure, Ground, HUE, Ray, Track } from '../../../kit/figure/index.js';
import { simultaneityActivity } from './simultaneity-activity.js';
import { simultaneityState } from './simultaneity-core.js';
import { ClockFace, TrainCar } from './scene-primitives.js';
import { ExperimentTransport, useExperimentTimeline } from '../shared/experiment-transport.js';

export interface RelativitySimultaneityLabProps {
  beta?: number;
  separationM?: number;
  title?: string;
  prompt?: string;
  activity?: AuthoredActivity;
}

const W = 720;
const H = 348;
const RAIL_Y = 236;
const REAR_X = 155;
const FRONT_X = 565;
const CAR_X = 166;
const CAR_Y = 140;
const CAR_W = 384;
const OBSERVER_Y = CAR_Y + 36;
const CLOCK_Y = 298;
/** Nanoseconds of train time per full turn of a clock's long hand. */
const NS_PER_TURN = 3000;

/** A lightning strike on the embankment: an event flash plus its expanding light front. */
function Strike({ x, progress }: { x: number; progress: number }): ReactNode {
  const r = 18 + progress * 172;
  return (
    <g>
      <Track
        d={`M ${x - r} ${RAIL_Y} A ${r} ${r} 0 0 1 ${x + r} ${RAIL_Y}`}
        dashed={false}
        color={HUE[2]}
        weight="line"
        opacity={0.85}
      />
      <Ball
        cx={x}
        cy={RAIL_Y}
        r={7}
        color={HUE[2]}
        flash={Math.max(0, 1 - progress * 3)}
        flashColor={HUE[2]}
      />
    </g>
  );
}

function Clock({
  x,
  side,
  frame,
  timeNs,
  earlier,
}: {
  x: number;
  side: 'rear' | 'front';
  frame: 'platform' | 'train';
  timeNs: number;
  earlier: boolean;
}): ReactNode {
  const tx = side === 'rear' ? x + 28 : x - 28;
  const anchor = side === 'rear' ? 'start' : 'end';
  return (
    <g>
      {earlier && (
        <FigTag x={x} y={262} color={HUE.good} anchor="middle">
          earlier
        </FigTag>
      )}
      <ClockFace
        cx={x}
        cy={CLOCK_Y}
        r={20}
        turns={frame === 'train' ? timeNs / NS_PER_TURN : 0}
        active={earlier}
      />
      <FigText x={tx} y={CLOCK_Y - 8} anchor={anchor} size="eyebrow" tone="soft">
        {side} · {frame} clock
      </FigText>
      <FigText x={tx} y={CLOCK_Y + 13} anchor={anchor} size="measure">
        {frame === 'train' ? 't′' : 't'} = {timeNs.toFixed(1)} ns
      </FigText>
    </g>
  );
}

function SimultaneityScene({
  beta,
  first,
  trainTimes,
  phase,
  progress,
}: {
  beta: number;
  first: 'left' | 'right' | 'simultaneous';
  trainTimes: { left: number; right: number };
  phase: string;
  progress: number;
}): ReactNode {
  const showMotion = phase !== 'predict' && Math.abs(beta) > 0.005,
    showLedger = ['observe', 'explain', 'transfer'].includes(phase),
    showLight = phase === 'explain',
    direction = beta >= 0 ? 1 : -1,
    offset = beta * 36 * progress,
    observerX = CAR_X + CAR_W / 2 + offset,
    frame = showLedger ? 'train' : 'platform';
  return (
    <Figure
      viewBox={[W, H]}
      domain="physics"
      label={`Train at beta ${beta.toFixed(2)}. ${first} event is earlier in the train frame.`}
    >
      {showMotion && (
        <Arrow
          x1={360 - 55 * direction}
          y1={110}
          x2={360 + 55 * direction}
          y2={110}
          color={HUE[1]}
          weight="edge"
          head={9}
          label="v"
        />
      )}
      <Ground x1={70} x2={650} y={RAIL_Y} />
      <TrainCar offset={offset} x={CAR_X} y={CAR_Y} width={CAR_W} />
      <Ball cx={observerX} cy={OBSERVER_Y} r={7} color={HUE.ink} />
      {showLight && (
        <>
          <Ray
            x1={REAR_X}
            y1={RAIL_Y}
            x2={observerX}
            y2={OBSERVER_Y}
            color={HUE[2]}
            width={4}
            opacity={0.8}
          />
          <Ray
            x1={FRONT_X}
            y1={RAIL_Y}
            x2={observerX}
            y2={OBSERVER_Y}
            color={HUE[2]}
            width={4}
            opacity={0.8}
          />
        </>
      )}
      <Strike x={REAR_X} progress={progress} />
      <Strike x={FRONT_X} progress={progress} />

      <Clock
        x={REAR_X}
        side="rear"
        frame={frame}
        timeNs={showLedger ? trainTimes.left : 0}
        earlier={showLedger && first === 'left'}
      />
      <Clock
        x={FRONT_X}
        side="front"
        frame={frame}
        timeNs={showLedger ? trainTimes.right : 0}
        earlier={showLedger && first === 'right'}
      />

      {/* legend */}
      <Ball cx={80} cy={336} r={5} color={HUE[2]} />
      <FigText x={92} y={336} baseline="middle" size="note" tone="soft">
        strike event
      </FigText>
      <Track d="M 200 340 A 8 8 0 0 1 216 340" dashed={false} color={HUE[2]} weight="line" />
      <FigText x={224} y={336} baseline="middle" size="note" tone="soft">
        light front
      </FigText>
      <Ball cx={330} cy={336} r={5} color={HUE.ink} />
      <FigText x={342} y={336} baseline="middle" size="note" tone="soft">
        midpoint observer
      </FigText>
    </Figure>
  );
}

export function RelativitySimultaneityLab({
  beta: initial = 0.6,
  separationM = 300,
  title = 'Two lightning strikes: whose “now” wins?',
  prompt = 'Platform clocks mark two separated flashes simultaneously. Transform the same events into the moving train frame and compare their assigned times.',
  activity,
}: RelativitySimultaneityLabProps = {}): ReactNode {
  const [beta, setBeta] = useState(initial),
    state = simultaneityState(beta, separationM),
    delta = Math.abs(state.train.deltaTimeNs);
  const timeline = useExperimentTimeline({ durationMs: 3600, stops: [0, 0.5, 1] });
  const controls = (
    <>
      <Field label="train speed β" value={beta.toFixed(2)}>
        <Slider
          value={beta}
          min={-0.9}
          max={0.9}
          step={0.01}
          onChange={(value) => {
            timeline.reset();
            setBeta(value);
          }}
          ariaLabel="train velocity as a fraction of light speed"
        />
      </Field>
      <Field label="direction">
        <Segmented
          ariaLabel="direction"
          value={beta < 0 ? 'left' : beta > 0 ? 'right' : 'rest'}
          onChange={(next) => {
            timeline.reset();
            if (next === 'rest') setBeta(0);
            else setBeta(next === 'left' ? -Math.max(0.1, Math.abs(beta)) : Math.max(0.1, Math.abs(beta)));
          }}
          options={[
            { value: 'left', label: '← left' },
            { value: 'rest', label: 'at rest' },
            { value: 'right', label: 'right →' },
          ]}
        />
      </Field>
      <ExperimentTransport
        timeline={timeline}
        label="event comparison"
        detail={`${Math.round(timeline.progress * 100)}% · ${state.firstInTrain} first`}
      />
    </>
  );
  const evidence = (
    <>
      <Readout
        label="train Δt′ (front − rear)"
        value={`${state.train.deltaTimeNs.toFixed(1)} ns`}
        sub={
          state.firstInTrain === 'simultaneous'
            ? 'simultaneous in both frames'
            : `${state.firstInTrain} event is earlier`
        }
      />
      <StatList>
        <Stat label="platform Δt" value="0.0 ns" />
        <Stat label="event separation" value={`${separationM} m`} />
      </StatList>
    </>
  );
  const showControls = (context: AuthoredActivityContext): ReactNode =>
    ['act', 'transfer'].includes(context.sequence.current.phase) ? controls : null;
  const showEvidence = (context: AuthoredActivityContext): ReactNode =>
    ['observe', 'explain', 'transfer'].includes(context.sequence.current.phase) ? evidence : null;
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={activity ?? simultaneityActivity}
      activityId="relativity-simultaneity"
      eyebrow="Modern physics · special relativity"
      title={title}
      description={prompt}
      status={<span>β {beta.toFixed(2)}</span>}
      controls={showControls}
      evidence={showEvidence}
      observation={
        beta === 0
          ? 'At rest, both frames share the same simultaneity slice.'
          : `The event pair is unchanged; the moving frame assigns the ${state.firstInTrain} event ${delta.toFixed(1)} ns earlier.`
      }
    >
      {(context) => (
        <>
          <AuthoredMetricGate
            conditionId="comparison-complete"
            met={timeline.progress >= 1}
            complete={context.complete}
          />
          <SimultaneityScene
            beta={beta}
            first={state.firstInTrain}
            trainTimes={{ left: state.train.left.ct * 1e9, right: state.train.right.ct * 1e9 }}
            phase={context.sequence.current.phase}
            progress={timeline.progress}
          />
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
