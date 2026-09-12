'use client';

import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
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
  type Node,
} from '@classytic/stage';
import { Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { Tex } from '../../core/tex.js';
import { clamp } from '../../core/util.js';
import { functionViewport, normalizeRange, valueInRange } from '../calculus/core.js';
import { MathActivity, MathExpressionError, MathResetTransport } from '../activity.js';
import { evaluateTaylor, maxApproximationError, taylorCoefficients } from '../taylor/core.js';

export interface TaylorSeriesExplorerProps {
  equation?: string;
  xRange?: [number, number];
  center?: number;
  order?: number;
  probe?: number;
  title?: string;
  height?: number;
}

const MAX_ORDER = 8;
const fmt = (value: number): string =>
  Number.isFinite(value) ? value.toFixed(5).replace(/0+$/, '').replace(/\.$/, '') : '—';

export function TaylorSeriesExplorer({
  equation = 'sin(x)',
  xRange = [-6.3, 6.3],
  center: centerInit = 0,
  order: orderInit = 5,
  probe: probeInit = 2,
  title = 'Build a function from its derivatives',
  height = 380,
}: TaylorSeriesExplorerProps = {}): ReactNode {
  const [xMin, xMax] = normalizeRange(xRange, [-6.3, 6.3]);
  const initialCenter = valueInRange(centerInit, [xMin, xMax], 0);
  const initialProbe = valueInRange(probeInit, [xMin, xMax], 2);
  const initialOrder = Math.round(clamp(Number.isFinite(orderInit) ? orderInit : 5, 0, MAX_ORDER));
  const [center, setCenter] = useState(initialCenter);
  const [probe, setProbe] = useState(initialProbe);
  const [order, setOrder] = useState(initialOrder);
  useEffect(() => {
    setCenter(initialCenter);
    setProbe(initialProbe);
    setOrder(initialOrder);
  }, [initialCenter, initialOrder, initialProbe, equation]);

  const model = useMemo(() => {
    const result = compileExpr(equation);
    if (!result.ast) return { ok: false as const, error: result.error ?? 'Invalid expression' };
    const nodes: Node[] = [result.ast];
    for (let degree = 1; degree <= MAX_ORDER; degree++) {
      try {
        const next = differentiate(nodes[nodes.length - 1]!, 'x');
        if (!next) break;
        nodes.push(simplify(next));
      } catch {
        break;
      }
    }
    const derivatives = nodes.map(
      (node) =>
        (x: number): number =>
          evaluate(node, { x }),
    );
    return { ok: true as const, fn: derivatives[0]!, derivatives, latex: toLatex(result.ast) };
  }, [equation]);

  if (!model.ok) return <MathExpressionError title={title} expression={equation} error={model.error} />;
  const supportedOrder = model.derivatives.length - 1;
  const effectiveOrder = Math.min(order, supportedOrder);
  const coefficients = taylorCoefficients(model.derivatives, center);
  const approximation = (x: number): number => evaluateTaylor(coefficients, center, x, effectiveOrder);
  const view = functionViewport(model.fn, [xMin, xMax]);
  const actual = model.fn(probe);
  const estimated = approximation(probe);
  const error = Math.abs(actual - estimated);
  const localRadius = Math.max((xMax - xMin) / 8, 0.25);
  const localError = maxApproximationError(model.fn, approximation, [
    Math.max(xMin, center - localRadius),
    Math.min(xMax, center + localRadius),
  ]);

  const figure = (
    <Stage
      view={{ xMin, xMax, ...view }}
      height={height}
      preserveAspect={false}
      ariaLabel={`Taylor polynomial of order ${effectiveOrder} for ${equation}, centered at ${center.toFixed(2)}`}
    >
      <Grid />
      <Axes labels />
      <Plot.OfX y={model.fn} domain={[xMin, xMax]} color="var(--stage-accent)" weight={3} />
      <Plot.OfX y={approximation} domain={[xMin, xMax]} color="var(--stage-good)" weight={2.5} />
      <Segment
        from={{ x: center, y: view.yMin }}
        to={{ x: center, y: view.yMax }}
        color="var(--stage-muted)"
        weight={1}
        dashed
      />
      {Number.isFinite(actual) && Number.isFinite(estimated) ? (
        <Segment
          from={{ x: probe, y: actual }}
          to={{ x: probe, y: estimated }}
          color="var(--stage-danger)"
          weight={2}
        />
      ) : null}
      <Point x={center} y={model.fn(center)} r={5} color="var(--stage-accent-2)" />
      <MovableDot
        value={{ x: probe, y: actual }}
        onMove={(point) => setProbe(clamp(point.x, xMin, xMax))}
        color="var(--stage-fg)"
        ariaLabel="error probe on original function"
      />
    </Stage>
  );

  const controls = (
    <>
      <Field label="Polynomial order" value={effectiveOrder}>
        <Slider
          value={order}
          min={0}
          max={Math.max(0, supportedOrder)}
          step={1}
          onChange={(value) => setOrder(Math.round(value))}
          ariaLabel="Taylor polynomial order"
        />
      </Field>
      <Field label="Expansion center" value={center.toFixed(2)}>
        <Slider
          value={center}
          min={xMin}
          max={xMax}
          step={(xMax - xMin) / 200}
          onChange={setCenter}
          ariaLabel="Taylor expansion center"
        />
      </Field>
    </>
  );
  const details = (
    <>
      <div className="math-equation-detail">
        <Tex tex={`f(x)=${model.latex}`} />
        <Tex
          tex={`T_${effectiveOrder}(x)=\\sum_{k=0}^{${effectiveOrder}}\\frac{f^{(k)}(${center.toFixed(2)})}{k!}(x-${center.toFixed(2)})^k`}
        />
      </div>
      <div className="math-taylor-ledger">
        <span>k</span>
        <span>f⁽ᵏ⁾(a)/k!</span>
        {coefficients.slice(0, effectiveOrder + 1).map((coefficient, index) => (
          <Fragment key={index}>
            <span>{index}</span>
            <span>{fmt(coefficient)}</span>
          </Fragment>
        ))}
      </div>
    </>
  );
  const reset = (): void => {
    setCenter(initialCenter);
    setProbe(initialProbe);
    setOrder(initialOrder);
  };

  return (
    <MathActivity
      className="math-taylor-series"
      eyebrow="Calculus · approximation"
      title={title}
      description="Increase the order to match more derivatives at the center. Move the probe to see where the local polynomial remains accurate—and where it stops."
      status={
        <>
          <strong>{error < 0.01 ? 'Close approximation' : 'Inspecting error'}</strong>
          <span>order {effectiveOrder}</span>
          <span>center {center.toFixed(2)}</span>
          <span>error {error.toExponential(2)}</span>
        </>
      }
      figure={figure}
      measurements={
        <>
          <div className="math-result-probe">
            <span>Error at x = {probe.toFixed(2)}</span>
            <strong>|f − T| = {error.toExponential(3)}</strong>
            <small>
              f {fmt(actual)} · T{effectiveOrder} {fmt(estimated)} · local max {localError.toExponential(2)}
            </small>
          </div>
          <div className="math-slope-legend">
            <span data-line="function">Function f</span>
            <span data-line="tangent">Taylor polynomial</span>
          </div>
          {supportedOrder < order ? (
            <p className="math-explain">
              This expression supports symbolic derivatives through order {supportedOrder}; the displayed
              order was capped accurately.
            </p>
          ) : (
            <p className="math-explain">
              Matching more derivatives improves the approximation near the center, but not necessarily across
              the entire window.
            </p>
          )}
        </>
      }
      controls={controls}
      conclusion={
        error < 0.01
          ? 'At the probe, the polynomial closely matches the function.'
          : 'The approximation is local: move nearer the center or increase the supported order to reduce error.'
      }
      transport={
        <MathResetTransport
          onReset={reset}
          state="Move the probe or refine the polynomial"
          detail={`order ${effectiveOrder} · center ${center.toFixed(2)}`}
        />
      }
      details={details}
      graphLabel="Original function and Taylor polynomial with error probe"
      inspectorLabel="Approximation error"
    />
  );
}
