'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Axes,
  Grid,
  MovableDot,
  Polyline,
  Stage,
  Vector,
  compileExpr,
  evaluate,
  toLatex,
} from '@classytic/stage';
import { Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { Tex } from '../../core/tex.js';
import { clamp } from '../../core/util.js';
import { MathActivity, MathExpressionError, MathResetTransport } from '../activity.js';
import { normalizeRange, valueInRange } from '../calculus/core.js';
import { solvePhaseSystem, type PhaseField, type PhasePoint } from '../ode/system.js';

export interface PhasePortraitExplorerProps {
  dx?: string;
  dy?: string;
  xRange?: [number, number];
  yRange?: [number, number];
  initial?: [number, number];
  duration?: number;
  stepSize?: number;
  title?: string;
  height?: number;
}

const fmt = (value: number): string =>
  Number.isFinite(value) ? value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') : '—';
const distance = (a: PhasePoint | undefined, b: PhasePoint | undefined): number =>
  a && b ? Math.hypot(a.x - b.x, a.y - b.y) : Number.NaN;

export function PhasePortraitExplorer({
  dx = 'y',
  dy = '-x - 0.25*y',
  xRange = [-4, 4],
  yRange = [-4, 4],
  initial: initialProp = [3, 0],
  duration: durationProp = 10,
  stepSize: stepProp = 0.16,
  title = 'See a system evolve in state space',
  height = 420,
}: PhasePortraitExplorerProps = {}): ReactNode {
  const [xMin, xMax] = normalizeRange(xRange, [-4, 4]),
    [yMin, yMax] = normalizeRange(yRange, [-4, 4]);
  const initialValue = useMemo(
    () => ({
      x: valueInRange(initialProp[0], [xMin, xMax], 3),
      y: valueInRange(initialProp[1], [yMin, yMax], 0),
    }),
    [initialProp[0], initialProp[1], xMax, xMin, yMax, yMin],
  );
  const initialDuration = clamp(Number.isFinite(durationProp) ? durationProp : 10, 1, 40);
  const initialStep = clamp(Number.isFinite(stepProp) ? stepProp : 0.16, 0.02, 1);
  const [initial, setInitial] = useState(initialValue),
    [duration, setDuration] = useState(initialDuration),
    [stepSize, setStepSize] = useState(initialStep);
  useEffect(() => {
    setInitial(initialValue);
    setDuration(initialDuration);
    setStepSize(initialStep);
  }, [dx, dy, initialDuration, initialStep, initialValue]);

  const model = useMemo(() => {
    const xResult = compileExpr(dx),
      yResult = compileExpr(dy);
    if (!xResult.ast || !yResult.ast)
      return { ok: false as const, error: xResult.error ?? yResult.error ?? 'Invalid system expression' };
    const field: PhaseField = (x, y, t) => {
      try {
        return { dx: evaluate(xResult.ast!, { x, y, t }), dy: evaluate(yResult.ast!, { x, y, t }) };
      } catch {
        return { dx: Number.NaN, dy: Number.NaN };
      }
    };
    return { ok: true as const, field, dxLatex: toLatex(xResult.ast), dyLatex: toLatex(yResult.ast) };
  }, [dx, dy]);
  if (!model.ok) return <MathExpressionError title={title} error={model.error} />;

  const rk4 = solvePhaseSystem(model.field, initial, duration, stepSize, 'rk4');
  const euler = solvePhaseSystem(model.field, initial, duration, stepSize, 'euler');
  const reference = solvePhaseSystem(model.field, initial, duration, Math.max(0.005, stepSize / 10), 'rk4');
  const endpointError = distance(euler.points.at(-1), reference.points.at(-1));
  const rk4Error = distance(rk4.points.at(-1), reference.points.at(-1));
  const derivative = model.field(initial.x, initial.y, 0),
    speed = Math.hypot(derivative.dx, derivative.dy);
  const inside = (point: PhasePoint): boolean =>
    point.x >= xMin - 1 && point.x <= xMax + 1 && point.y >= yMin - 1 && point.y <= yMax + 1;
  const visibleRk4 = rk4.points.filter(inside),
    visibleEuler = euler.points.filter(inside);

  const columns = 13,
    rows = 11,
    cellX = (xMax - xMin) / (columns - 1),
    cellY = (yMax - yMin) / (rows - 1),
    arrowLength = Math.min(cellX, cellY) * 0.34;
  const vectors: Array<{ tail: { x: number; y: number }; tip: { x: number; y: number }; speed: number }> = [];
  for (let column = 0; column < columns; column++)
    for (let row = 0; row < rows; row++) {
      const x = xMin + column * cellX,
        y = yMin + row * cellY,
        value = model.field(x, y, 0),
        magnitude = Math.hypot(value.dx, value.dy);
      if (!(magnitude > 1e-10 && Number.isFinite(magnitude))) continue;
      vectors.push({
        tail: {
          x: x - (arrowLength * value.dx) / magnitude / 2,
          y: y - (arrowLength * value.dy) / magnitude / 2,
        },
        tip: {
          x: x + (arrowLength * value.dx) / magnitude / 2,
          y: y + (arrowLength * value.dy) / magnitude / 2,
        },
        speed: magnitude,
      });
    }
  const seedScaleX = (xMax - xMin) * 0.28,
    seedScaleY = (yMax - yMin) * 0.28;
  const contextSeeds = [
    [-seedScaleX, 0],
    [seedScaleX, 0],
    [0, -seedScaleY],
    [0, seedScaleY],
  ] as const;
  const context = contextSeeds.map(([x, y]) =>
    solvePhaseSystem(
      model.field,
      { x, y },
      Math.min(duration, 8),
      Math.max(stepSize, 0.12),
      'rk4',
    ).points.filter(inside),
  );

  const figure = (
    <Stage
      view={{ xMin, xMax, yMin, yMax }}
      height={height}
      ariaLabel={`Phase portrait for dx over dt equals ${dx}, dy over dt equals ${dy}`}
    >
      <Grid />
      <Axes />
      {vectors.map((vector, index) => (
        <Vector
          key={index}
          tail={vector.tail}
          tip={vector.tip}
          color="var(--stage-muted)"
          opacity={0.42}
          weight={1.1}
        />
      ))}
      {context.map((points, index) => (
        <Polyline key={index} points={points} color="var(--stage-muted)" opacity={0.35} weight={1.5} />
      ))}
      <Polyline points={visibleEuler} color="var(--stage-accent-2)" opacity={0.72} weight={2} dashed />
      <Polyline points={visibleRk4} color="var(--stage-good)" weight={3} />
      <MovableDot
        value={initial}
        onMove={(point) => setInitial({ x: clamp(point.x, xMin, xMax), y: clamp(point.y, yMin, yMax) })}
        color="var(--stage-accent)"
        ariaLabel="initial state in phase space"
        step={Math.min(cellX, cellY) / 10}
      />
    </Stage>
  );

  const controls = (
    <>
      <Field label="Trace time" value={`${duration.toFixed(1)} s`}>
        <Slider
          value={duration}
          min={1}
          max={40}
          step={0.5}
          onChange={setDuration}
          ariaLabel="trajectory duration"
        />
      </Field>
      <Field label="Solver step h" value={stepSize.toFixed(2)}>
        <Slider
          value={stepSize}
          min={0.02}
          max={1}
          step={0.02}
          onChange={setStepSize}
          ariaLabel="phase solver step size"
        />
      </Field>
    </>
  );
  const details = (
    <div className="math-equation-detail">
      <Tex tex={`\frac{dx}{dt}=${model.dxLatex},\qquad \frac{dy}{dt}=${model.dyLatex}`} />
      <p>
        Every arrow is the instantaneous state velocity (dx/dt, dy/dt). A trajectory stays tangent to those
        arrows as time advances.
      </p>
    </div>
  );
  const reset = (): void => {
    setInitial(initialValue);
    setDuration(initialDuration);
    setStepSize(initialStep);
  };

  return (
    <MathActivity
      className="math-phase-portrait"
      eyebrow="Calculus · dynamical systems"
      title={title}
      description="Each point is an entire system state—not a moment on an ordinary graph. Drag the initial state and watch the flow reveal cycles, attraction, repulsion, or damping."
      status={
        <>
          <strong>{rk4.state === 'complete' ? 'Trajectory traced' : 'Trace stopped safely'}</strong>
          <span>
            state ({fmt(initial.x)}, {fmt(initial.y)})
          </span>
          <span>speed {fmt(speed)}</span>
        </>
      }
      figure={figure}
      measurements={
        <>
          <div className="math-result-probe">
            <span>Forward-endpoint error</span>
            <strong>Euler {Number.isFinite(endpointError) ? endpointError.toExponential(2) : '—'}</strong>
            <small>
              RK4 {Number.isFinite(rk4Error) ? rk4Error.toExponential(2) : '—'} · duration ±
              {duration.toFixed(1)}
            </small>
          </div>
          <div className="math-slope-legend">
            <span data-line="field">Flow direction</span>
            <span data-line="euler">Euler</span>
            <span data-line="rk4">RK4 trajectory</span>
          </div>
          <p className="math-explain">
            The green curve follows the system both forward and backward from the draggable state. Neighboring
            faint curves reveal the larger flow.
          </p>
        </>
      }
      controls={controls}
      conclusion={
        speed < 0.05
          ? 'This state is near an equilibrium: both derivatives are nearly zero.'
          : 'The system state moves in the direction of the local arrow; its whole history forms the trajectory.'
      }
      transport={
        <MathResetTransport
          onReset={reset}
          state="Drag the state to launch another trajectory"
          detail={`dx/dt ${fmt(derivative.dx)} · dy/dt ${fmt(derivative.dy)}`}
        />
      }
      details={details}
      graphLabel="Vector field and trajectories in the x-y phase plane"
      inspectorLabel="System behavior"
    />
  );
}
