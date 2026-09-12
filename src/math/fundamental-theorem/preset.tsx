'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Axes,
  Grid,
  MovableDot,
  Plot,
  Polygon,
  Segment,
  Stage,
  compileExpr,
  evaluate,
  toLatex,
} from '@classytic/stage';
import { Tex } from '../../core/tex.js';
import { clamp } from '../../core/util.js';
import {
  accumulationAt,
  derivativeAt,
  functionViewport,
  normalizeRange,
  riemannSlices,
  valueInRange,
} from '../calculus/core.js';
import { MathActivity, MathExpressionError, MathResetTransport } from '../activity.js';

export interface FundamentalTheoremExplorerProps {
  equation?: string;
  xRange?: [number, number];
  anchor?: number;
  startX?: number;
  title?: string;
  height?: number;
}

const fmt = (value: number): string => (Number.isFinite(value) ? value.toFixed(3) : '—');

export function FundamentalTheoremExplorer({
  equation = '0.5*x^2 - 1',
  xRange = [-3, 4],
  anchor: anchorInit = -1,
  startX = 2,
  title = 'Area becomes a new function',
  height = 250,
}: FundamentalTheoremExplorerProps = {}): ReactNode {
  const [xMin, xMax] = normalizeRange(xRange, [-3, 4]);
  const anchor = valueInRange(anchorInit, [xMin, xMax], -1);
  const initialX = valueInRange(startX, [xMin, xMax], 2);
  const [x, setX] = useState(initialX);
  useEffect(() => setX(initialX), [initialX]);

  const model = useMemo(() => {
    const result = compileExpr(equation);
    if (!result.ast) return { ok: false as const, error: result.error ?? 'Invalid expression' };
    const ast = result.ast;
    const fn = (at: number): number => evaluate(ast, { x: at });
    const accumulation = (at: number): number => accumulationAt(fn, anchor, at);
    return { ok: true as const, fn, accumulation, latex: toLatex(ast) };
  }, [anchor, equation]);

  if (!model.ok) return <MathExpressionError title={title} expression={equation} error={model.error} />;

  const { fn, accumulation, latex } = model;
  const functionView = functionViewport(fn, [xMin, xMax]);
  const accumulationView = functionViewport(accumulation, [xMin, xMax]);
  const area = accumulation(x);
  const functionValue = fn(x);
  const accumulationSlope = derivativeAt(accumulation, x);
  const agreement = Math.abs(accumulationSlope - functionValue);
  const slices = riemannSlices(fn, anchor, x, 48, 'mid');

  const figure = (
    <div className="math-ftc-stack">
      <div className="math-ftc-plot">
        <span className="math-ftc-label">Original function f</span>
        <Stage
          view={{ xMin, xMax, ...functionView }}
          height={height}
          preserveAspect={false}
          ariaLabel={`Original function ${equation} and accumulated area from ${anchor.toFixed(2)} to ${x.toFixed(2)}`}
        >
          <Grid />
          {slices.map((slice, index) => (
            <Polygon
              key={index}
              points={[
                { x: slice.x0, y: 0 },
                { x: slice.x1, y: 0 },
                { x: slice.x1, y: slice.height },
                { x: slice.x0, y: slice.height },
              ]}
              color={slice.height >= 0 ? 'var(--stage-accent)' : 'var(--stage-danger)'}
              fill={slice.height >= 0 ? 'var(--stage-accent)' : 'var(--stage-danger)'}
              fillOpacity={0.18}
              weight={0.5}
            />
          ))}
          <Axes labels />
          <Plot.OfX y={fn} domain={[xMin, xMax]} color="var(--stage-accent)" weight={2.75} />
          <Segment
            from={{ x: anchor, y: functionView.yMin }}
            to={{ x: anchor, y: functionView.yMax }}
            color="var(--stage-muted)"
            weight={1}
            dashed
          />
          <MovableDot
            value={{ x, y: 0 }}
            onMove={(point) => setX(clamp(point.x, xMin, xMax))}
            constrain="horizontal"
            color="var(--stage-fg)"
            ariaLabel="moving upper integration bound"
          />
        </Stage>
      </div>
      <div className="math-ftc-plot">
        <span className="math-ftc-label">Accumulation A(x)</span>
        <Stage
          view={{ xMin, xMax, ...accumulationView }}
          height={height}
          preserveAspect={false}
          ariaLabel="Accumulation function whose slope matches the original function"
        >
          <Grid />
          <Axes labels />
          <Plot.OfX y={accumulation} domain={[xMin, xMax]} color="var(--stage-good)" weight={2.75} />
          <MovableDot
            value={{ x, y: area }}
            onMove={(point) => setX(clamp(point.x, xMin, xMax))}
            color="var(--stage-good)"
            ariaLabel="point on the accumulation function"
          />
        </Stage>
      </div>
    </div>
  );

  const reset = (): void => setX(initialX);
  const details = (
    <div className="math-equation-detail">
      <Tex tex={`A(x)=\\int_{${anchor.toFixed(2)}}^x \\left(${latex}\\right)\\,dt`} />
      <Tex tex={`A'(${x.toFixed(2)})\\approx ${fmt(accumulationSlope)} = f(${x.toFixed(2)})`} />
    </div>
  );

  return (
    <MathActivity
      className="math-fundamental-theorem"
      eyebrow="Calculus · Fundamental Theorem"
      title={title}
      description="Drag the shared probe. The upper graph accumulates signed area; the lower graph records that area as A(x). Compare its slope with the height of f."
      status={
        <>
          <strong>{agreement < 0.002 ? 'The rates agree' : 'Comparing rates'}</strong>
          <span>x {x.toFixed(2)}</span>
          <span>A(x) {fmt(area)}</span>
        </>
      }
      figure={figure}
      measurements={
        <>
          <div className="math-result-probe">
            <span>Fundamental Theorem</span>
            <strong>A′(x) = f(x)</strong>
            <small>
              A′(x) {fmt(accumulationSlope)} · f(x) {fmt(functionValue)} · difference{' '}
              {agreement.toExponential(1)}
            </small>
          </div>
          <p className="math-explain">
            A thin extra strip has area approximately f(x)·Δx, so the accumulation changes at rate f(x).
          </p>
        </>
      }
      conclusion={
        agreement < 0.002
          ? 'The accumulation graph’s instantaneous slope matches the original function height at the shared x-position.'
          : 'Move the probe away from a discontinuity to compare the two rates.'
      }
      transport={
        <MathResetTransport
          onReset={reset}
          state="Move the shared upper bound"
          detail={`area ${fmt(area)}`}
        />
      }
      details={details}
      graphLabel="Linked function and accumulation graphs"
      inspectorLabel="Area-to-slope connection"
    />
  );
}
