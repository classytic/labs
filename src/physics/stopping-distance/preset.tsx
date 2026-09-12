'use client';

/**
 * StoppingDistanceLab, "Drive & Brake", the two-distance stopping tape.
 *
 * A car cruises at v; a hazard appears; the driver REACTS (constant speed for
 * t_react → a blue THINKING stripe), then BRAKES at a (→ a red BRAKING stripe)
 * to a stop. The road paints the two stripes as the car passes, and stacked v–t
 * and s–t graphs draw underneath sharing ONE playhead with the car, so the
 * v–t area visibly IS the distance. "Double the speed" keeps a ghost of the last
 * run so the learner sees thinking double (linear) while braking quadruples (v²).
 *
 * The single biggest exam-killer (s–t vs v–t, and stopping distance as one black
 * box) dies on screen. Time-dependent, so the integrator lives here (frame loop);
 * tokenized SVG; honours prefers-reduced-motion (jumps to the end + scrub).
 */

import { useRef, useState, type ReactNode } from 'react';
import {
  Stage,
  Segment,
  Polyline,
  Polygon,
  Dot,
  Label,
  MovableDot,
  useFrameLoop,
  useCoords,
  fmt,
  type Vec2,
} from '@classytic/stage';
import { useReducedMotion } from '../../kit/anim.js';
import { Slider, Chip, StatusPill } from '../../kit/controls.js';
import { HintLadder, useHints } from '../../kit/pedagogy.js';
import { Field, LiveRegion } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { MechanicsVector, SceneSurface } from '../mechanics/presentation.js';
import { stoppingMetrics, stoppingPositionAt, stoppingSpeedAt } from '../mechanics/core.js';

const STOPPING_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Why does doubling speed more than double stopping distance?',
  objectives: [
    'Separate reaction distance from braking distance',
    'Relate braking distance to speed squared',
    'Transfer the model to a safer driving decision',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the scaling',
      lead: 'Commit before running the car.',
      success: 'scaling-answer',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Run the stopping test',
      lead: 'Drive once and watch the reaction and braking phases.',
      controls: true,
      reveal: ['model'],
      success: 'run-finished',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the stopping tape',
      lead: 'Compare the two painted distances and open the synchronized graphs.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the curved growth',
      lead: 'Use the velocity-time area to explain why braking distance grows quadratically.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Test a faster approach',
      lead: 'Double the speed and compare the new stopping tape with the previous run.',
      controls: true,
      reveal: ['model', 'evidence'],
      success: 'speed-compared',
    },
  ],
  questions: [
    {
      id: 'scaling',
      prompt: 'If speed doubles while reaction time and braking stay unchanged, what happens?',
      choices: [
        { value: 'double', label: 'Both distances double' },
        { value: 'mixed', label: 'Reaction doubles; braking quadruples' },
        { value: 'quadruple', label: 'Both distances quadruple' },
      ],
      answer: 'mixed',
      explain: 'Reaction distance is v·t, while braking distance is proportional to v².',
    },
  ],
  success: [
    {
      id: 'scaling-answer',
      source: 'answer',
      key: 'scaling',
      operator: 'eq',
      value: 'mixed',
      pendingLabel: 'Choose how each distance scales.',
    },
    {
      id: 'run-finished',
      source: 'metric',
      key: 'finished',
      operator: 'eq',
      value: true,
      pendingLabel: 'Run the car until it stops.',
    },
    {
      id: 'speed-compared',
      source: 'metric',
      key: 'speedCompared',
      operator: 'eq',
      value: true,
      pendingLabel: 'Use ×2 speed and run the comparison.',
    },
  ],
};

export interface StoppingDistanceProps {
  speed?: number;
  reactionTime?: number;
  deceleration?: number;
  maxSpeed?: number;
  predict?: boolean;
  showGraphs?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  activity?: string | AuthoredActivity;
}

interface Run {
  v: number;
  dThink: number;
  dBrake: number;
  dTotal: number;
}

/** A compact tokenized side-view car centred on the road point (x, 0). */
function Car({ x }: { x: number }): ReactNode {
  const c = useCoords();
  const [px, py] = c.toPx(x, 0);
  const s = c.sx(1); // px per metre
  const u = Math.max(0.6, s); // body unit (keep legible when zoomed out)
  const edge = 'color-mix(in oklab, var(--stage-accent-2) 58%, black)';
  const glass = 'color-mix(in oklab, var(--stage-accent-2) 30%, var(--stage-bg))';
  return (
    <g transform={`translate(${fmt(px)},${fmt(py)})`}>
      <ellipse cx={0} cy={-0.2 * u} rx={3.4 * u} ry={0.5 * u} fill="#000" opacity={0.14} />
      <path
        d={`M ${-3.2 * u} ${-1.2 * u} Q ${-3.5 * u} ${-1.2 * u} ${-3.5 * u} ${-1.9 * u} L ${-3.5 * u} ${-2.2 * u} Q ${-3.5 * u} ${-2.9 * u} ${-2.9 * u} ${-3.0 * u} L ${2.8 * u} ${-3.0 * u} Q ${3.5 * u} ${-2.9 * u} ${3.5 * u} ${-2.05 * u} L ${3.5 * u} ${-1.5 * u} Q ${3.5 * u} ${-1.2 * u} ${3.1 * u} ${-1.2 * u} Z`}
        fill="var(--stage-accent-2)"
        stroke={edge}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path
        d={`M ${-1.9 * u} ${-3.0 * u} Q ${-1.6 * u} ${-4.3 * u} ${-0.4 * u} ${-4.3 * u} L ${1.2 * u} ${-4.3 * u} Q ${2.1 * u} ${-4.3 * u} ${2.5 * u} ${-3.0 * u} Z`}
        fill="var(--stage-accent-2)"
        stroke={edge}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path
        d={`M ${-1.6 * u} ${-3.1 * u} Q ${-1.4 * u} ${-4.0 * u} ${-0.4 * u} ${-4.0 * u} L ${0.0 * u} ${-4.0 * u} L ${0.0 * u} ${-3.1 * u} Z`}
        fill={glass}
      />
      <path
        d={`M ${0.3 * u} ${-3.1 * u} L ${0.3 * u} ${-4.0 * u} L ${1.1 * u} ${-4.0 * u} Q ${1.9 * u} ${-4.0 * u} ${2.2 * u} ${-3.1 * u} Z`}
        fill={glass}
      />
      <circle cx={3.35 * u} cy={-1.9 * u} r={0.42 * u} fill="#ffd36b" />
      {[-1.9, 2.0].map((wx) => (
        <g key={wx}>
          <circle cx={wx * u} cy={-0.6 * u} r={0.95 * u} fill="#2b2b2b" />
          <circle cx={wx * u} cy={-0.6 * u} r={0.45 * u} fill="var(--stage-metal)" />
        </g>
      ))}
    </g>
  );
}

export function StoppingDistanceLab({
  speed = 20,
  reactionTime = 0.7,
  deceleration = 6,
  maxSpeed = 40,
  predict = false,
  showGraphs = false,
  title = 'Drive & Brake: the two-distance stopping tape',
  prompt = 'A hazard appears: react, then brake. Watch the road paint thinking (blue) + braking (red).',
  objectives,
  hints = [],
  activity = 'stopping-distance',
}: StoppingDistanceProps): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'stopping-distance';
  const authoredActivity = typeof activity === 'string' ? STOPPING_ACTIVITY : activity;
  const [v, setV] = useState(speed);
  const [tr, setTr] = useState(reactionTime);
  const [a, setA] = useState(deceleration);
  const [t, setT] = useState(0);
  const [driving, setDriving] = useState(false);
  const [graphs, setGraphs] = useState(showGraphs);
  const [revealed, setRevealed] = useState(!predict);
  const [finished, setFinished] = useState(false);
  const [ghost, setGhost] = useState<Run | null>(null);
  const [guess, setGuess] = useState(40);
  const startRef = useRef<number | null>(null);
  const reduce = useReducedMotion();
  const hl = useHints(hints);

  const metrics = stoppingMetrics(v, tr, a);
  const tThink = metrics.reactionDuration;
  const tBrake = metrics.brakingDuration;
  const tTotal = metrics.totalDuration;
  const dThink = metrics.reactionDistance;
  const dBrake = metrics.brakingDistance;
  const dTotal = metrics.totalDistance;

  const posAt = (tt: number): number => stoppingPositionAt(tt, v, tr, a);
  const velAt = (tt: number): number => stoppingSpeedAt(tt, v, tr, a);

  useFrameLoop(
    (f) => {
      if (startRef.current === null) startRef.current = f.timeMs;
      const tt = (f.timeMs - startRef.current) / 1000;
      if (tt >= tTotal) {
        setT(tTotal);
        setDriving(false);
        setRevealed(true);
        setFinished(true);
      } else setT(tt);
      // Finite and explicitly started by the learner; it must finish even when an
      // embedded scroll container gives IntersectionObserver a false negative.
    },
    { running: driving },
  );

  const drive = (): void => {
    startRef.current = null;
    if (reduce) {
      setT(tTotal);
      setRevealed(true);
      setFinished(true);
      return;
    }
    setT(0);
    setFinished(false);
    setDriving(true);
  };
  const change =
    (set: (n: number) => void) =>
    (n: number): void => {
      set(n);
      setDriving(false);
      setT(0);
      setFinished(false);
      setRevealed(!predict);
    };
  const doubleSpeed = (): void => {
    setGhost({ v, dThink, dBrake, dTotal });
    change(setV)(Math.min(maxSpeed, v * 2));
  };

  const carX = posAt(t);
  const showRed = carX > dThink + 1e-6;
  const band = (x0: number, x1: number, color: string, op = 0.5): ReactNode =>
    x1 > x0 + 1e-6 ? (
      <Polygon
        points={[
          { x: x0, y: 0 },
          { x: x1, y: 0 },
          { x: x1, y: 1.4 },
          { x: x0, y: 1.4 },
        ]}
        color={color}
        fill={color}
        fillOpacity={op}
        weight={0}
      />
    ) : null;

  const sceneMax = Math.max(dTotal * 1.18, (ghost?.dTotal ?? 0) * 1.18, 30);
  const sceneView = { xMin: -3, xMax: sceneMax, yMin: -2, yMax: 9 };

  // graph sampling
  const vtArea: Vec2[] = [
    { x: 0, y: 0 },
    { x: 0, y: v },
    { x: tThink, y: v },
    { x: tTotal, y: 0 },
  ];
  const stPts: Vec2[] = [];
  {
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const tt = (tTotal * i) / N;
      stPts.push({ x: tt, y: posAt(tt) });
    }
  }
  const vGraphView = { xMin: -tTotal * 0.06, xMax: tTotal * 1.08, yMin: -v * 0.12, yMax: v * 1.18 };
  const sGraphView = { xMin: -tTotal * 0.06, xMax: tTotal * 1.08, yMin: -dTotal * 0.1, yMax: dTotal * 1.15 };

  const figure = (
    <div className="physics-visual-stack">
      {/* scene */}
      <SceneSurface
        tone="grid"
        data-state={driving ? (t < tThink ? 'thinking' : 'braking') : finished ? 'stopped' : 'ready'}
      >
        <Stage
          view={sceneView}
          height={170}
          preserveAspect={false}
          ariaLabel={`Car at ${v} m/s; thinking ${dThink.toFixed(0)} m, braking ${dBrake.toFixed(0)} m`}
        >
          <Segment
            from={{ x: sceneView.xMin, y: 0 }}
            to={{ x: sceneMax, y: 0 }}
            color="var(--stage-fg)"
            opacity={0.5}
            weight={2}
          />
          {/* ghost of the previous run (faint) for the doubling comparison */}
          {ghost && (
            <Polygon
              points={[
                { x: 0, y: 1.55 },
                { x: ghost.dTotal, y: 1.55 },
                { x: ghost.dTotal, y: 2.0 },
                { x: 0, y: 2.0 },
              ]}
              color="var(--stage-muted)"
              fill="var(--stage-muted)"
              fillOpacity={0.25}
              weight={0}
            />
          )}
          {ghost && (
            <Label
              x={ghost.dTotal / 2}
              y={2.0}
              text={`last run: ${ghost.dTotal.toFixed(0)} m`}
              color="var(--stage-muted)"
              size={10}
              dy={-8}
            />
          )}
          {/* painted stripes (reveal-gated) */}
          {revealed && band(0, Math.min(carX, dThink), 'var(--stage-accent)')}
          {revealed && showRed && band(dThink, carX, 'var(--stage-warn)')}
          {revealed && t >= tTotal && (
            <Label
              x={dThink / 2}
              y={0.7}
              text={`think ${dThink.toFixed(0)} m`}
              color="var(--stage-accent)"
              size={11}
            />
          )}
          {revealed && t >= tTotal && dBrake > 0 && (
            <Label
              x={dThink + dBrake / 2}
              y={0.7}
              text={`brake ${dBrake.toFixed(0)} m`}
              color="var(--stage-warn)"
              size={11}
            />
          )}
          {/* hazard line at the stop point */}
          <Segment
            from={{ x: dTotal, y: 0 }}
            to={{ x: dTotal, y: 3 }}
            color="var(--stage-danger)"
            weight={2}
            dashed
          />
          <Label x={dTotal} y={3} text="required stop point" color="var(--stage-danger)" size={10} dy={-9} />
          {/* predict: drag a guess flag before revealing */}
          {predict && !revealed && (
            <MovableDot
              value={{ x: guess, y: 3 }}
              onMove={(p) => setGuess(Math.max(0, p.x))}
              constrain="horizontal"
              range={{ min: 0, max: sceneMax }}
              color="var(--stage-accent)"
              ariaLabel="your stopping-distance guess"
            />
          )}
          {predict && !revealed && (
            <Label x={guess} y={3} text="your guess" color="var(--stage-accent)" size={11} dy={-14} />
          )}
          <Car x={carX} />
          {velAt(t) > 0.1 && (
            <MechanicsVector
              tail={{ x: carX, y: 3.7 }}
              tip={{ x: carX + Math.max(sceneMax * 0.035, (velAt(t) / v) * sceneMax * 0.09), y: 3.7 }}
              color={t < tThink ? 'var(--stage-accent)' : 'var(--stage-warn)'}
              label={`${velAt(t).toFixed(0)} m/s`}
              labelDy={-9}
              labelSize={11}
              active={driving}
            />
          )}
        </Stage>
      </SceneSurface>

      {/* graphs, an opt-in layer (off by default); stacked so they never overflow */}
      {graphs && (
        <div className="physics-stopping-graphs">
          <div className="physics-trace-card">
            <p className="physics-trace-label">v–t · area = distance</p>
            <Stage view={vGraphView} height={130} preserveAspect={false} ariaLabel="velocity-time graph">
              <Segment
                from={{ x: 0, y: 0 }}
                to={{ x: tTotal * 1.05, y: 0 }}
                color="var(--stage-axis)"
                weight={1.5}
              />
              <Segment
                from={{ x: 0, y: 0 }}
                to={{ x: 0, y: v * 1.12 }}
                color="var(--stage-axis)"
                weight={1.5}
              />
              <Polygon
                points={[
                  { x: 0, y: 0 },
                  { x: 0, y: v },
                  { x: tThink, y: v },
                  { x: tThink, y: 0 },
                ]}
                color="var(--stage-accent)"
                fill="var(--stage-accent)"
                fillOpacity={0.22}
                weight={0}
              />
              <Polygon
                points={[
                  { x: tThink, y: 0 },
                  { x: tThink, y: v },
                  { x: tTotal, y: 0 },
                ]}
                color="var(--stage-warn)"
                fill="var(--stage-warn)"
                fillOpacity={0.22}
                weight={0}
              />
              <Polyline points={vtArea.slice(1)} color="var(--stage-fg)" weight={2} />
              <Segment
                from={{ x: t, y: 0 }}
                to={{ x: t, y: v * 1.1 }}
                color="var(--stage-good)"
                weight={1.5}
                opacity={0.7}
              />
              <Dot x={t} y={velAt(t)} r={5} color="var(--stage-good)" />
            </Stage>
          </div>
          <div className="physics-trace-card">
            <p className="physics-trace-label">s–t · slope = speed</p>
            <Stage view={sGraphView} height={130} preserveAspect={false} ariaLabel="distance-time graph">
              <Segment
                from={{ x: 0, y: 0 }}
                to={{ x: tTotal * 1.05, y: 0 }}
                color="var(--stage-axis)"
                weight={1.5}
              />
              <Segment
                from={{ x: 0, y: 0 }}
                to={{ x: 0, y: dTotal * 1.1 }}
                color="var(--stage-axis)"
                weight={1.5}
              />
              <Polyline points={stPts} color="var(--stage-accent-2)" weight={2.5} />
              <Segment
                from={{ x: t, y: 0 }}
                to={{ x: t, y: dTotal * 1.08 }}
                color="var(--stage-good)"
                weight={1.5}
                opacity={0.7}
              />
              <Dot x={t} y={posAt(t)} r={5} color="var(--stage-good)" />
            </Stage>
          </div>
        </div>
      )}
    </div>
  );

  const controls = (
    <>
      <Chip selected={driving} onClick={driving ? () => setDriving(false) : drive}>
        {driving ? 'Pause' : finished ? 'Run again' : 'Drive'}
      </Chip>
      <Chip
        selected={false}
        onClick={() => {
          setDriving(false);
          setT(0);
          setFinished(false);
          setRevealed(!predict);
          startRef.current = null;
        }}
      >
        Reset
      </Chip>
      <Chip selected={false} onClick={doubleSpeed}>
        ×2 speed
      </Chip>
      <Chip selected={graphs} onClick={() => setGraphs((g) => !g)}>
        v–t / s–t graphs
      </Chip>
      {!driving && tTotal > 0 && (
        <Field label="scrub">
          <Slider
            value={Math.min(t, tTotal)}
            min={0}
            max={tTotal}
            step={tTotal / 120}
            onChange={(x) => {
              setRevealed(true);
              setT(x);
            }}
            ariaLabel="scrub time"
          />
        </Field>
      )}
      <Field label="speed" value={`${v} m/s`}>
        <Slider
          value={v}
          min={5}
          max={maxSpeed}
          step={1}
          onChange={change(setV)}
          ariaLabel="cruising speed (m/s)"
        />
      </Field>
      <Field label="reaction" value={`${tr.toFixed(1)} s`}>
        <Slider
          value={tr}
          min={0.2}
          max={2}
          step={0.1}
          onChange={change(setTr)}
          ariaLabel="reaction time (s)"
        />
      </Field>
      <Field label="brake" value={`${a} m/s²`}>
        <Slider
          value={a}
          min={2}
          max={10}
          step={0.5}
          onChange={change(setA)}
          ariaLabel="braking deceleration (m/s²)"
        />
      </Field>
    </>
  );

  const footer = (
    <>
      {predict && revealed && t >= tTotal && (
        <StatusPill ok={Math.abs(guess - dTotal) <= Math.max(3, dTotal * 0.1)}>
          {Math.abs(guess - dTotal) <= Math.max(3, dTotal * 0.1)
            ? `✓ Close! Actual ${dTotal.toFixed(0)} m`
            : `Actual ${dTotal.toFixed(0)} m (you guessed ${guess.toFixed(0)})`}
        </StatusPill>
      )}
      <HintLadder hints={hl} />
      <LiveRegion>{`At ${v} metres per second: thinking ${dThink.toFixed(0)} metres, braking ${dBrake.toFixed(0)} metres, total ${dTotal.toFixed(0)} metres.`}</LiveRegion>
    </>
  );

  const instruments = (
    <>
      <div className="physics-probe">
        <span>Stopping tape</span>
        <strong>{dTotal.toFixed(1)} m total</strong>
        <small>
          {dThink.toFixed(1)} m reaction + {dBrake.toFixed(1)} m braking
        </small>
      </div>
      <LiveRegion>{`At ${v} metres per second: thinking ${dThink.toFixed(0)} metres, braking ${dBrake.toFixed(0)} metres, total ${dTotal.toFixed(0)} metres.`}</LiveRegion>
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
          <span>{driving ? (t <= tThink ? 'Reacting' : 'Braking') : finished ? 'Stopped' : 'Ready'}</span>
          <span>
            {carX.toFixed(1)} / {dTotal.toFixed(1)} m
          </span>
        </>
      }
      evidence={instruments}
      controls={controls}
      observation="Reaction distance grows directly with speed; braking distance grows with speed squared. The velocity-time area shows why doubling speed can make the full stopping tape far more than twice as long."
      transcript={
        <p>{`At ${v} metres per second, the car travels ${dThink.toFixed(1)} metres during reaction and ${dBrake.toFixed(1)} metres while braking.`}</p>
      }
      support={<>{footer}</>}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="run-finished" met={finished} complete={complete} />
          <AuthoredMetricGate
            conditionId="speed-compared"
            met={ghost !== null && finished}
            complete={complete}
          />
          {figure}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
