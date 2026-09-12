'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Axes,
  Grid,
  MovableDot,
  Plot,
  Point,
  Segment,
  Stage,
  compileExpr,
  differentiate,
  evaluate,
  simplify,
  toLatex,
  useFrameLoop,
  useInView,
  type Node,
} from '@classytic/stage';
import { Tex } from '../../core/tex.js';
import { clamp } from '../../core/util.js';
import { derivativeAt, functionViewport, normalizeRange, valueInRange } from '../calculus/core.js';
import { MathActivity, MathExpressionError, MathRunTransport } from '../activity.js';
import { newtonStep, type NewtonState } from '../root-finding/core.js';

export interface NewtonMethodExplorerProps {
  equation?: string;
  xRange?: [number, number];
  startX?: number;
  maxSteps?: number;
  title?: string;
  height?: number;
}

const fmt = (value: number): string =>
  Number.isFinite(value) ? value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '') : '—';

export function NewtonMethodExplorer({
  equation = 'x^3 - x - 2',
  xRange = [-3, 3],
  startX = 1.8,
  maxSteps: maxStepsInit = 12,
  title = 'Find a root with tangents',
  height = 360,
}: NewtonMethodExplorerProps = {}): ReactNode {
  const [xMin, xMax] = normalizeRange(xRange, [-3, 3]);
  const initialX = valueInRange(startX, [xMin, xMax], 1.8);
  const maxSteps = Math.round(clamp(Number.isFinite(maxStepsInit) ? maxStepsInit : 12, 1, 30));
  const [points, setPoints] = useState<number[]>([initialX]);
  const [state, setState] = useState<NewtonState | 'ready' | 'paused'>('ready');
  const [running, setRunning] = useState(false);
  const elapsed = useRef(0);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  useEffect(() => {
    setPoints([initialX]);
    setState('ready');
    setRunning(false);
  }, [initialX, equation, xMin, xMax, maxSteps]);

  const model = useMemo(() => {
    const result = compileExpr(equation);
    if (!result.ast) return { ok: false as const, error: result.error ?? 'Invalid expression' };
    const ast = result.ast;
    const fn = (x: number): number => evaluate(ast, { x });
    let derivativeNode: Node | null = null;
    try {
      const node = differentiate(ast, 'x');
      derivativeNode = node ? simplify(node) : null;
    } catch {
      derivativeNode = null;
    }
    const derivative = derivativeNode
      ? (x: number): number => evaluate(derivativeNode!, { x })
      : (x: number): number => derivativeAt(fn, x);
    return {
      ok: true as const,
      fn,
      derivative,
      latex: toLatex(ast),
      derivativeLatex: derivativeNode ? toLatex(derivativeNode) : null,
    };
  }, [equation]);

  const advance = useCallback((): void => {
    if (!model.ok) return;
    setPoints((history) => {
      if (history.length - 1 >= maxSteps) {
        setState('max-steps');
        setRunning(false);
        return history;
      }
      const current = history[history.length - 1]!;
      const result = newtonStep(model.fn, model.derivative, current);
      if (result.state !== 'running') {
        setState(result.state);
        setRunning(false);
        return history;
      }
      if (history.some((value) => Math.abs(value - result.nextX) <= 1e-7 * (1 + Math.abs(result.nextX)))) {
        setState('cycle');
        setRunning(false);
        return history;
      }
      setState('running');
      return [...history, result.nextX];
    });
  }, [maxSteps, model]);

  useFrameLoop(
    (frame) => {
      elapsed.current += frame.dtMs;
      if (elapsed.current < 650) return;
      elapsed.current = 0;
      advance();
    },
    { running: running && model.ok && inView },
  );

  if (!model.ok) return <MathExpressionError title={title} expression={equation} error={model.error} />;
  const { fn, derivative, latex, derivativeLatex } = model;
  const view = functionViewport(fn, [xMin, xMax]);
  const currentX = points[points.length - 1]!;
  const currentY = fn(currentX);
  const slope = derivative(currentX);
  const currentStep = newtonStep(fn, derivative, currentX);
  const stateLabel =
    state === 'converged'
      ? 'Root found'
      : state === 'flat-derivative'
        ? 'Tangent is flat'
        : state === 'diverged'
          ? 'Iteration diverged'
          : state === 'cycle'
            ? 'Cycle detected'
            : state === 'max-steps'
              ? 'Iteration limit'
              : running
                ? 'Iterating'
                : points.length > 1
                  ? 'Paused'
                  : 'Ready';

  const figure = (
    <div ref={viewRef}>
      <Stage
        view={{ xMin, xMax, ...view }}
        height={height}
        preserveAspect={false}
        ariaLabel={`Newton method on ${equation}; current estimate ${fmt(currentX)}`}
      >
        <Grid />
        <Axes labels />
        <Plot.OfX y={fn} domain={[xMin, xMax]} color="var(--stage-accent)" weight={2.75} />
        {points.slice(0, -1).map((x, index, arr) => {
          const y = fn(x);
          const next = points[index + 1]!;
          // Fade the tangent history by recency so the LATEST step reads clearly and older steps
          // recede to a faint trail — otherwise a non-converging run tangles into an orange mess.
          const recency = (index + 1) / arr.length; // oldest → ~1/n, newest → 1
          const op = 0.18 + 0.72 * recency;
          return (
            <Fragment key={`${index}-${x}`}>
              <Segment
                from={{ x, y }}
                to={{ x: next, y: 0 }}
                color="var(--stage-accent-2)"
                weight={1.5}
                opacity={op}
              />
              <Segment
                from={{ x: next, y: 0 }}
                to={{ x: next, y: fn(next) }}
                color="var(--stage-muted)"
                weight={1}
                dashed
                opacity={op * 0.7}
              />
              <Point x={x} y={y} r={3} color="var(--stage-accent-2)" opacity={op} />
            </Fragment>
          );
        })}
        {Number.isFinite(currentStep.nextX) && currentStep.state === 'running' ? (
          <Segment
            from={{ x: currentX, y: currentY }}
            to={{ x: currentStep.nextX, y: 0 }}
            color="var(--stage-good)"
            weight={2.5}
          />
        ) : null}
        <Point x={currentX} y={currentY} r={5} color="var(--stage-good)" />
        <MovableDot
          value={{ x: currentX, y: 0 }}
          constrain="horizontal"
          onMove={(point) => {
            const next = clamp(point.x, xMin, xMax);
            setPoints([next]);
            setState('ready');
            setRunning(false);
          }}
          color="var(--stage-fg)"
          ariaLabel="starting estimate on x axis"
        />
      </Stage>
    </div>
  );

  const reset = (): void => {
    setPoints([initialX]);
    setState('ready');
    setRunning(false);
  };
  const terminal = ['converged', 'flat-derivative', 'diverged', 'cycle', 'max-steps'].includes(state);
  const transport = (
    <MathRunTransport
      running={running}
      onReset={reset}
      onStep={advance}
      onToggle={() => {
        setRunning((value) => !value);
        setState(running ? 'paused' : 'running');
      }}
      state={stateLabel}
      detail={`iteration ${points.length - 1} of ${maxSteps}`}
      disabled={terminal}
      resetLabel="Reset Newton method"
      stepLabel="Take one Newton tangent step"
    />
  );
  const details = (
    <>
      <div className="math-equation-detail">
        <Tex tex={`f(x)=${latex}`} />
        {derivativeLatex ? <Tex tex={`f'(x)=${derivativeLatex}`} /> : null}
        <Tex tex={`x_{n+1}=x_n-\\frac{f(x_n)}{f'(x_n)}`} />
      </div>
      <div className="math-iteration-ledger">
        <span>n</span>
        <span>xₙ</span>
        <span>|f(xₙ)|</span>
        {points.map((x, index) => (
          <Fragment key={`${index}-${x}`}>
            <span>{index}</span>
            <span>{fmt(x)}</span>
            <span>{Math.abs(fn(x)).toExponential(2)}</span>
          </Fragment>
        ))}
      </div>
    </>
  );

  return (
    <MathActivity
      className="math-newton-method"
      eyebrow="Calculus · numerical solving"
      title={title}
      description="Each tangent meets the x-axis at the next estimate. Step through the recurrence and watch the error shrink—or diagnose why it fails."
      status={
        <>
          <strong>{stateLabel}</strong>
          <span>|f(x)| {Number.isFinite(currentY) ? Math.abs(currentY).toExponential(2) : '—'}</span>
          <span>n {points.length - 1}</span>
        </>
      }
      figure={figure}
      measurements={
        <>
          <div className="math-result-probe">
            <span>Current estimate</span>
            <strong>x = {fmt(currentX)}</strong>
            <small>
              f(x) {fmt(currentY)} · slope {fmt(slope)}
            </small>
          </div>
          <p className="math-explain">
            The tangent is a local linear approximation. Its x-intercept becomes the next guess.
          </p>
        </>
      }
      conclusion={
        state === 'converged'
          ? 'The residual is below tolerance, so the current estimate is a root.'
          : state === 'flat-derivative'
            ? 'The tangent is too flat to produce a reliable next intercept. Choose another starting value.'
            : state === 'cycle'
              ? 'The estimates repeated instead of approaching a root. Choose another start.'
              : state === 'diverged'
                ? 'The next estimate became unsafe. Choose a start closer to a root.'
                : 'Take another tangent step and compare the new residual.'
      }
      transport={transport}
      details={details}
      graphLabel="Function graph with Newton tangent iterations"
      inspectorLabel="Root estimate"
    />
  );
}
