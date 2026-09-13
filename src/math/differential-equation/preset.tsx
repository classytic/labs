'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Axes,
  Grid,
  MovableDot,
  Polyline,
  Segment,
  Stage,
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
import { interpolateSolution, solveOde } from '../ode/core.js';

export interface DifferentialEquationExplorerProps {
  equation?: string;
  xRange?: [number, number];
  yRange?: [number, number];
  initial?: [number, number];
  stepSize?: number;
  probe?: number;
  title?: string;
  height?: number;
}

const fmt = (value: number): string =>
  Number.isFinite(value) ? value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') : '—';

export function DifferentialEquationExplorer({
  equation = 'x - y',
  xRange = [-3, 3],
  yRange = [-3, 3],
  initial: initialProp = [0, 1],
  stepSize: stepProp = 0.4,
  probe: probeProp = 2.5,
  title = 'Trace a solution through a slope field',
  height = 400,
}: DifferentialEquationExplorerProps = {}): ReactNode {
  const [xMin, xMax] = normalizeRange(xRange, [-3, 3]);
  const [yMin, yMax] = normalizeRange(yRange, [-3, 3]);
  const initialValue = useMemo(
    () => ({
      x: valueInRange(initialProp[0], [xMin, xMax], 0),
      y: valueInRange(initialProp[1], [yMin, yMax], 1),
    }),
    [initialProp[0], initialProp[1], xMax, xMin, yMax, yMin],
  );
  const initialStep = clamp(
    Number.isFinite(stepProp) ? stepProp : 0.4,
    0.02,
    Math.max(0.02, (xMax - xMin) / 3),
  );
  const initialProbe = valueInRange(probeProp, [xMin, xMax], Math.min(xMax, 2.5));
  const [initial, setInitial] = useState(initialValue);
  const [stepSize, setStepSize] = useState(initialStep);
  const [probe, setProbe] = useState(initialProbe);
  useEffect(() => {
    setInitial(initialValue);
    setStepSize(initialStep);
    setProbe(initialProbe);
  }, [equation, initialProbe, initialStep, initialValue]);

  const model = useMemo(() => {
    const result = compileExpr(equation);
    if (!result.ast) return { ok: false as const, error: result.error ?? 'Invalid expression' };
    const slope = (x: number, y: number): number => {
      try {
        const value = evaluate(result.ast!, { x, y });
        return Number.isFinite(value) ? value : Number.NaN;
      } catch {
        return Number.NaN;
      }
    };
    return { ok: true as const, slope, latex: toLatex(result.ast) };
  }, [equation]);

  if (!model.ok) return <MathExpressionError title={title} expression={equation} error={model.error} />;

  const euler = solveOde(model.slope, initial, [xMin, xMax], stepSize, 'euler');
  const rk4 = solveOde(model.slope, initial, [xMin, xMax], stepSize, 'rk4');
  const reference = solveOde(model.slope, initial, [xMin, xMax], Math.max(0.005, stepSize / 12), 'rk4');
  const eulerAtProbe = interpolateSolution(euler.points, probe);
  const rk4AtProbe = interpolateSolution(rk4.points, probe);
  const referenceAtProbe = interpolateSolution(reference.points, probe);
  const eulerError = Math.abs(eulerAtProbe - referenceAtProbe);
  const rk4Error = Math.abs(rk4AtProbe - referenceAtProbe);

  const field = (() => {
    const columns = 15,
      rows = 11;
    const dx = (xMax - xMin) / (columns - 1),
      dy = (yMax - yMin) / (rows - 1);
    const halfLength = Math.min(dx, dy) * 0.34;
    const segments: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = [];
    for (let column = 0; column < columns; column++)
      for (let row = 0; row < rows; row++) {
        const x = xMin + column * dx,
          y = yMin + row * dy,
          slope = model.slope(x, y);
        if (!Number.isFinite(slope)) continue;
        const scale = halfLength / Math.hypot(1, slope);
        segments.push({
          from: { x: x - scale, y: y - slope * scale },
          to: { x: x + scale, y: y + slope * scale },
        });
      }
    return segments;
  })();

  const valid = [eulerAtProbe, rk4AtProbe, referenceAtProbe].every(Number.isFinite);
  const figure = (
    <Stage
      view={{ xMin, xMax, yMin, yMax }}
      height={height}
      ariaLabel={`Slope field and numerical solutions for y prime equals ${equation}`}
    >
      <Grid />
      <Axes labels />
      {field.map((line, index) => (
        <Segment key={index} {...line} color="var(--stage-muted)" opacity={0.42} weight={1.2} />
      ))}
      <Polyline points={reference.points} color="var(--stage-fg)" opacity={0.45} weight={2} dashed />
      <Polyline points={euler.points} color="var(--stage-accent-2)" weight={2.5} />
      <Polyline points={rk4.points} color="var(--stage-good)" weight={3} />
      {valid ? (
        <Segment
          from={{ x: probe, y: eulerAtProbe }}
          to={{ x: probe, y: referenceAtProbe }}
          color="var(--stage-danger)"
          weight={2}
        />
      ) : null}
      <MovableDot
        value={initial}
        onMove={(point) => setInitial({ x: clamp(point.x, xMin, xMax), y: clamp(point.y, yMin, yMax) })}
        color="var(--stage-accent)"
        ariaLabel="initial condition"
        step={Math.min(xMax - xMin, yMax - yMin) / 100}
      />
      {valid ? (
        <MovableDot
          value={{ x: probe, y: referenceAtProbe }}
          onMove={(point) => setProbe(clamp(point.x, xMin, xMax))}
          constrain="horizontal"
          range={{ min: xMin, max: xMax }}
          color="var(--stage-fg)"
          ariaLabel="error comparison probe"
          step={(xMax - xMin) / 100}
        />
      ) : null}
    </Stage>
  );

  const stepMax = Math.max(0.1, (xMax - xMin) / 3);
  const controls = (
    <Field label="Step size h" value={stepSize.toFixed(2)}>
      <Slider
        value={stepSize}
        min={0.02}
        max={stepMax}
        step={0.02}
        onChange={setStepSize}
        ariaLabel="numerical integration step size"
      />
    </Field>
  );
  const details = (
    <div className="math-equation-detail">
      <Tex tex={`y'=${model.latex},\quad y(${fmt(initial.x)})=${fmt(initial.y)}`} />
      <Tex tex={'y_{n+1}=y_n+h f(x_n,y_n)\quad\text{(Euler)}'} />
      <p>
        RK4 samples four slopes inside each step and combines them; the faint reference uses RK4 with a much
        smaller step.
      </p>
    </div>
  );
  const reset = (): void => {
    setInitial(initialValue);
    setStepSize(initialStep);
    setProbe(initialProbe);
  };
  const state =
    euler.state === 'complete' && rk4.state === 'complete'
      ? 'Solutions traced'
      : 'Solution left the safe range';

  return (
    <MathActivity
      className="math-differential-equation"
      eyebrow="Calculus · differential equations"
      title={title}
      description="The little line segments encode y′ = f(x,y). Drag the initial condition, then change h to see how numerical methods follow that local direction field."
      status={
        <>
          <strong>{state}</strong>
          <span>
            <Tex tex={`y'=${model.latex}`} />
          </span>
          <span>h {stepSize.toFixed(2)}</span>
        </>
      }
      figure={figure}
      measurements={
        <>
          <div className="math-result-probe">
            <span>Error at x = {probe.toFixed(2)}</span>
            <strong>Euler {Number.isFinite(eulerError) ? eulerError.toExponential(2) : '—'}</strong>
            <small>
              RK4 {Number.isFinite(rk4Error) ? rk4Error.toExponential(2) : '—'} · reference y{' '}
              {fmt(referenceAtProbe)}
            </small>
          </div>
          <div className="math-slope-legend">
            <span data-line="field">Slope field</span>
            <span data-line="euler">Euler</span>
            <span data-line="rk4">RK4</span>
            <span data-line="reference">Fine reference</span>
          </div>
          <p className="math-explain">
            A smaller step samples the changing slope more often. RK4 usually gains much more accuracy per
            step than Euler.
          </p>
        </>
      }
      controls={controls}
      conclusion={
        Number.isFinite(eulerError) && eulerError < 0.02
          ? 'At this scale Euler and the fine reference nearly agree.'
          : 'The visible separation is accumulated numerical error; reduce h or compare RK4.'
      }
      transport={
        <MathResetTransport
          onReset={reset}
          state="Drag either point or refine h"
          detail={`initial (${fmt(initial.x)}, ${fmt(initial.y)})`}
        />
      }
      details={details}
      graphLabel="Slope field with Euler, Runge-Kutta, and reference solution curves"
      inspectorLabel="Numerical error"
    />
  );
}
