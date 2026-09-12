'use client';

/**
 * GravityDrop, drop identical balls on three worlds; stronger gravity wins.
 * On the @classytic/stage engine (SVG): three lanes in a fixed coordinate box,
 * the balls fall on the engine clock, landing times appear as they hit.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Label, useFrameLoop, useInView, useCoords, fmt } from '@classytic/stage';
import { Slider, Chip } from '../kit/controls.js';
import { Field } from '../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../kit/activity-authoring.js';
import { SceneSurface } from './mechanics/presentation.js';

const num = (v: number | string | undefined, fb: number): number => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? (n as number) : fb;
};

/**
 * A falling ball: a shaded sphere (tone fill + top-left specular) with a motion
 * trail whose length scales with speed, so the eye reads Jupiter's ball as
 * genuinely faster than the Moon's. Drawn in pixels (project the math centre
 * first); the trail and highlight are constant-quality regardless of zoom.
 */
function PlanetBall({
  cx,
  y,
  rPx,
  tone,
  vNorm,
}: {
  cx: number;
  y: number;
  rPx: number;
  tone: string;
  vNorm: number;
}): ReactNode {
  const c = useCoords();
  const [px, py] = c.toPx(cx, y);
  const rp = rPx;
  const trail = Math.min(1, vNorm) * rp * 5.5;
  return (
    <g>
      {trail > 2 && (
        <line
          x1={fmt(px)}
          y1={fmt(py - rp * 0.4)}
          x2={fmt(px)}
          y2={fmt(py - rp * 0.4 - trail)}
          stroke={tone}
          strokeWidth={rp * 1.3}
          strokeLinecap="round"
          opacity={0.16}
        />
      )}
      <circle cx={fmt(px)} cy={fmt(py)} r={rp} fill={tone} />
      <circle
        cx={fmt(px - rp * 0.32)}
        cy={fmt(py - rp * 0.32)}
        r={rp * 0.4}
        fill="var(--stage-sheen)"
        opacity={0.55}
      />
    </g>
  );
}

const WORLDS = [
  { name: 'Moon', g: 1.6, tone: 'var(--stage-fg)' },
  { name: 'Earth', g: 9.8, tone: 'var(--stage-accent)' },
  { name: 'Jupiter', g: 24.8, tone: 'var(--stage-accent-2)' },
];

export interface GravityDropProps {
  height?: number | string;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

const GRAVITY_DROP_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Same drop, three worlds',
  objectives: [
    'Rank fall times from gravitational field strength',
    'Connect acceleration to changing speed',
    'Transfer the comparison to a new drop height',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Rank the landings',
      lead: 'Order the worlds before releasing the balls.',
      success: 'ranking-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Release together',
      lead: 'Start all three balls from the same height.',
      controls: true,
      reveal: ['model'],
      success: 'all-landed',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Compare the motion',
      lead: 'Use position, trails, and landing times as evidence.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the order',
      lead: 'Connect stronger gravitational field to greater acceleration.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Change the height',
      lead: 'Choose a new height and test whether the ranking changes.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'height-changed',
    },
  ],
  questions: [
    {
      id: 'ranking',
      kind: 'ordering',
      prompt: 'Order the worlds from first landing to last landing.',
      items: [
        { value: 'jupiter', label: 'Jupiter' },
        { value: 'earth', label: 'Earth' },
        { value: 'moon', label: 'Moon' },
      ],
      answer: ['jupiter', 'earth', 'moon'],
      explain: 'For the same height, larger g gives a shorter fall time.',
    },
  ],
  success: [
    {
      id: 'ranking-answer',
      source: 'answer',
      key: 'ranking',
      operator: 'eq',
      value: 'jupiter,earth,moon',
      pendingLabel: 'Rank all three worlds.',
    },
    {
      id: 'all-landed',
      source: 'metric',
      key: 'landed',
      operator: 'eq',
      value: true,
      pendingLabel: 'Run the drop until all three balls land.',
    },
    {
      id: 'height-changed',
      source: 'metric',
      key: 'heightChanged',
      operator: 'eq',
      value: true,
      pendingLabel: 'Change the drop height.',
    },
  ],
};

// Fixed coordinate box: 3 lanes wide, top y=10 → ground y=0.
const TOP = 10;

export function GravityDrop({
  height = 50,
  title = 'Gravity drop: same height, different worlds',
  prompt,
  objectives,
  activity = 'gravity-drop',
}: GravityDropProps): ReactNode {
  const initialHeight = num(height, 50);
  const [fallH, setFallH] = useState(initialHeight);
  const activityId = typeof activity === 'string' ? activity : 'gravity-drop';
  const authoredActivity = typeof activity === 'string' ? GRAVITY_DROP_ACTIVITY : activity;
  const [running, setRunning] = useState(false);
  const [t, setT] = useState(0);
  const startRef = useRef<number | null>(null);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  const maxT = Math.max(...WORLDS.map((wd) => Math.sqrt((2 * fallH) / wd.g)));

  useFrameLoop(
    (f) => {
      if (startRef.current === null) startRef.current = f.timeMs;
      const tt = (f.timeMs - startRef.current) / 1000;
      setT(tt);
      if (tt >= maxT + 0.4) setRunning(false);
    },
    { running: running && inView },
  );

  const drop = (): void => {
    startRef.current = null;
    setT(0);
    setRunning(true);
  };

  const view = { xMin: 0, xMax: WORLDS.length, yMin: -2.5, yMax: TOP + 3.5 };

  const figure = (
    <SceneSurface ref={viewRef} className="physics-gravity-drop-scene" tone="space">
      <Stage
        view={view}
        height={280}
        preserveAspect={false}
        ariaLabel="Identical balls falling on the Moon, Earth, and Jupiter"
      >
        {WORLDS.map((_world, i) => (
          <Segment
            key={`g-${i}`}
            from={{ x: i + 0.5 - 0.4, y: 0 }}
            to={{ x: i + 0.5 + 0.4, y: 0 }}
            color="var(--stage-fg)"
            opacity={0.5}
            weight={1.5}
          />
        ))}
        {WORLDS.map((world, i) => {
          const cx = i + 0.5;
          const tLand = Math.sqrt((2 * fallH) / world.g);
          const tt = Math.min(t, tLand);
          const frac = Math.min((0.5 * world.g * tt * tt) / fallH, 1);
          const ballY = TOP - frac * TOP;
          const refV = Math.sqrt(2 * fallH * Math.max(...WORLDS.map((w) => w.g)));
          const vNorm = tt < tLand ? (world.g * tt) / refV : 0;
          return <PlanetBall key={`b-${i}`} cx={cx} y={ballY} rPx={14} tone={world.tone} vNorm={vNorm} />;
        })}
        {WORLDS.map((world, i) => (
          <Label
            key={`l-${i}`}
            x={i + 0.5}
            y={0}
            text={world.name}
            color="var(--stage-fg)"
            size={13}
            dy={18}
          />
        ))}
        {WORLDS.map((world, i) => (
          <Label
            key={`g-l-${i}`}
            x={i + 0.5}
            y={TOP}
            text={`g = ${world.g} m/s²`}
            color="var(--stage-fg)"
            size={13}
            dy={-22}
          />
        ))}
        {WORLDS.map((world, i) => {
          const tLand = Math.sqrt((2 * fallH) / world.g);
          return t >= tLand ? (
            <Label
              key={`t-${i}`}
              x={i + 0.5}
              y={1.2}
              text={`${tLand.toFixed(1)} s`}
              color="var(--stage-good)"
              size={13}
            />
          ) : null;
        })}
      </Stage>
    </SceneSurface>
  );

  const reset = (): void => {
    startRef.current = null;
    setRunning(false);
    setT(0);
  };
  const landed = WORLDS.filter((world) => t >= Math.sqrt((2 * fallH) / world.g)).length;
  const instruments = (
    <>
      <div className="physics-probe">
        <span>Elapsed time</span>
        <strong>{t.toFixed(1)} s</strong>
        <small>
          {landed} of {WORLDS.length} landed
        </small>
      </div>
      <p className="physics-explain">
        Mass and drop height are identical. Only gravitational field strength changes the acceleration and
        landing time.
      </p>
    </>
  );
  const controls = (
    <>
      <div className="lab-field-row">
        <Chip selected={running} onClick={() => (running ? setRunning(false) : drop())}>
          {running ? 'Pause' : t > 0 ? 'Drop again' : 'Drop'}
        </Chip>
        <Chip selected={false} onClick={reset}>
          Reset
        </Chip>
      </div>
      <Field label="drop height" value={`${fallH.toFixed(0)} m`}>
        <Slider
          value={fallH}
          min={10}
          max={100}
          step={5}
          onChange={(value) => {
            reset();
            setFallH(value);
          }}
          ariaLabel="drop height in metres"
        />
      </Field>
    </>
  );
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={activityId}
      eyebrow="Gravitation"
      title={title}
      description={
        prompt ??
        `Drop identical balls from ${fallH} m on three worlds and compare how gravitational field strength changes the fall.`
      }
      status={
        <>
          <span>{running ? 'Falling' : landed === WORLDS.length ? 'Complete' : 'Ready'}</span>
          <span>{t.toFixed(1)} s</span>
          <span>{landed}/3 landed</span>
        </>
      }
      evidence={instruments}
      controls={controls}
      observation={
        landed === WORLDS.length
          ? 'Jupiter lands first, then Earth, then the Moon because gravitational acceleration is weakest on the Moon.'
          : 'Stronger gravity produces greater acceleration from the same starting height.'
      }
      transcript={
        <p>{`From ${fallH.toFixed(0)} metres, ${landed} of three balls have landed after ${t.toFixed(1)} seconds. Jupiter has g 24.8, Earth 9.8, and the Moon 1.6 metres per second squared.`}</p>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="all-landed" met={landed === WORLDS.length} complete={complete} />
          <AuthoredMetricGate
            conditionId="height-changed"
            met={fallH !== initialHeight}
            complete={complete}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
