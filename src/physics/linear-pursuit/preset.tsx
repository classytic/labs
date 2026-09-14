'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useFrameLoop, useInView } from '@classytic/stage';
import { Field, Readout, Stat, StatList } from '../../kit/frame.js';
import { ActivitySelect, Slider } from '../../kit/controls.js';
import {
  Figure,
  FigText,
  Ground,
  Guide,
  HUE,
  PlotFrame,
  Curve,
  Marker,
  scale,
} from '../../kit/figure/index.js';
import { MechanicsActivity } from '../mechanics/activity.js';
import { SimulationTransport } from '../mechanics/presentation.js';
import { firstLinearMeeting, linearPositionAt, type LinearPursuitState } from './core.js';
import { LinearVehicle, type VehicleKind } from './vehicle.js';

export type LinearPursuitScenario = 'bus-car' | 'train-car' | 'cars';

export interface LinearPursuitProps {
  scenario?: LinearPursuitScenario;
  headStartM?: number;
  delayS?: number;
  leaderSpeed?: number;
  chaserSpeed?: number;
  chaserAcceleration?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

const vehicleKinds = (scenario: LinearPursuitScenario): [VehicleKind, VehicleKind] =>
  scenario === 'bus-car' ? ['bus', 'car'] : scenario === 'train-car' ? ['train', 'car'] : ['car', 'car'];

export function LinearPursuitLab({
  scenario: initialScenario = 'bus-car',
  headStartM = 120,
  delayS = 4,
  leaderSpeed = 12,
  chaserSpeed = 8,
  chaserAcceleration = 1.8,
  title = 'Catch-up motion: where do they meet?',
  prompt = 'A vehicle leaves first. The chaser starts behind, may wait, then accelerates. Connect the road scene to the intersection of their position–time paths.',
  activity = 'linear-pursuit',
}: LinearPursuitProps = {}): ReactNode {
  const [scenario, setScenario] = useState(initialScenario);
  const [headStart, setHeadStart] = useState(headStartM);
  const [delay, setDelay] = useState(delayS);
  const [acceleration, setAcceleration] = useState(chaserAcceleration);
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);
  const startRef = useRef<number | null>(null);
  const { ref, inView } = useInView<HTMLDivElement>();

  const state: LinearPursuitState = {
    leader: { position: headStart, speed: leaderSpeed },
    chaser: { position: 0, speed: chaserSpeed, acceleration, startTime: delay },
  };
  const meetingTime = firstLinearMeeting(state, 120);
  const duration = meetingTime ?? 40;
  const shownTime = Math.min(time, duration);
  const leaderX = linearPositionAt(state.leader, shownTime);
  const chaserX = linearPositionAt(state.chaser, shownTime);
  const meetingX = meetingTime == null ? null : linearPositionAt(state.leader, meetingTime);
  const [leaderKind, chaserKind] = vehicleKinds(scenario);

  useFrameLoop(
    (frame) => {
      if (startRef.current == null) startRef.current = frame.timeMs - time * 1000;
      const next = Math.min(duration, (frame.timeMs - startRef.current) / 1000);
      setTime(next);
      if (next >= duration) setRunning(false);
    },
    { running: running && inView },
  );

  const reset = (): void => {
    setRunning(false);
    setTime(0);
    startRef.current = null;
  };
  const change = (fn: () => void): void => {
    fn();
    reset();
  };
  const toggle = (): void => {
    if (shownTime >= duration) setTime(0);
    startRef.current = null;
    setRunning((value) => !value);
  };

  const maxDistance = Math.max(headStart + leaderSpeed * duration, meetingX ?? 0, 200) * 1.08;
  const roadX = (x: number): number => 55 + (Math.max(0, x) / maxDistance) * 530;
  const plot = { x: 68, y: 210, w: 500, h: 112 };
  const map = scale(plot, [0, Math.max(10, duration)], [0, maxDistance]);
  const samples = Array.from({ length: 61 }, (_, index) => (duration * index) / 60);
  const leaderPath = samples.map((t) => [map.x(t), map.y(linearPositionAt(state.leader, t))] as const);
  const chaserPath = samples.map((t) => [map.x(t), map.y(linearPositionAt(state.chaser, t))] as const);

  const figure = (
    <div ref={ref}>
      <Figure
        viewBox={[640, 360]}
        domain="physics"
        label={`One-dimensional pursuit at ${shownTime.toFixed(1)} seconds`}
      >
        <FigText x={42} y={30} size="note" tone="soft">
          road position
        </FigText>
        <Ground x1={35} x2={605} y={142} />
        <Guide x1={roadX(0)} y1={105} x2={roadX(0)} y2={151} />
        {meetingX != null ? (
          <Guide x1={roadX(meetingX)} y1={53} x2={roadX(meetingX)} y2={151} color={HUE.good} />
        ) : null}
        <LinearVehicle x={roadX(chaserX)} y={138} kind={chaserKind} color={HUE[1]} label="chaser" />
        <LinearVehicle x={roadX(leaderX)} y={86} kind={leaderKind} color={HUE[2]} label="leader" />
        <FigText x={roadX(0)} y={166} anchor="middle" size="note" tone="soft">
          start
        </FigText>
        {meetingX != null ? (
          <FigText x={roadX(meetingX)} y={45} anchor="middle" size="note" tone="good">
            meeting point
          </FigText>
        ) : null}
        <PlotFrame {...plot} title="position–time" xLabel="time" yLabel="position" arrows={false}>
          <Curve points={leaderPath} color={HUE[2]} />
          <Curve points={chaserPath} color={HUE[1]} />
          <Marker x={map.x(shownTime)} y={map.y(leaderX)} color={HUE[2]} />
          <Marker x={map.x(shownTime)} y={map.y(chaserX)} color={HUE[1]} />
        </PlotFrame>
      </Figure>
    </div>
  );

  const controls = (
    <>
      <Field label="vehicles">
        <ActivitySelect
          ariaLabel="vehicle scenario"
          value={scenario}
          onChange={(value) => change(() => setScenario(value as LinearPursuitScenario))}
          options={[
            { value: 'bus-car', label: 'bus + car' },
            { value: 'train-car', label: 'train + car' },
            { value: 'cars', label: 'two cars' },
          ]}
        />
      </Field>
      <Field label="head start" value={`${headStart} m`}>
        <Slider
          value={headStart}
          min={20}
          max={240}
          step={10}
          onChange={(value) => change(() => setHeadStart(value))}
          ariaLabel="leader head start in metres"
        />
      </Field>
      <Field label="start delay" value={`${delay} s`}>
        <Slider
          value={delay}
          min={0}
          max={12}
          step={1}
          onChange={(value) => change(() => setDelay(value))}
          ariaLabel="chaser start delay in seconds"
        />
      </Field>
      <Field label="chaser acceleration" value={`${acceleration.toFixed(1)} m/s²`}>
        <Slider
          value={acceleration}
          min={0}
          max={4}
          step={0.2}
          onChange={(value) => change(() => setAcceleration(value))}
          ariaLabel="chaser acceleration"
        />
      </Field>
    </>
  );

  const evidence =
    meetingTime == null ? (
      <Readout
        label="No meeting in the modeled interval"
        value="paths do not intersect"
        sub="Increase the chaser acceleration or reduce the head start."
      />
    ) : (
      <StatList>
        <Stat label="Meeting time" value={`${meetingTime.toFixed(1)} s`} />
        <Stat label="Meeting position" value={`${meetingX!.toFixed(0)} m`} />
        <Stat label="Current gap" value={`${Math.max(0, leaderX - chaserX).toFixed(0)} m`} />
      </StatList>
    );

  return (
    <MechanicsActivity
      activity={activity}
      className="physics-linear-pursuit"
      eyebrow="One-dimensional motion"
      title={title}
      prompt={prompt}
      status={
        <>
          <span>{shownTime.toFixed(1)} s</span>
          <span>gap {Math.max(0, leaderX - chaserX).toFixed(0)} m</span>
        </>
      }
      figure={figure}
      instruments={evidence}
      controls={controls}
      transport={
        <SimulationTransport
          running={running}
          onReset={reset}
          onToggle={toggle}
          state={
            meetingTime == null
              ? 'No meeting'
              : shownTime >= duration
                ? 'Met'
                : shownTime < delay
                  ? 'Waiting'
                  : 'Closing'
          }
          detail={meetingTime == null ? undefined : `${meetingTime.toFixed(1)} s`}
          startLabel="Run"
        />
      }
      feedback="The meeting is the same event in both representations: the vehicles share one road position exactly where their position–time paths intersect."
    />
  );
}
