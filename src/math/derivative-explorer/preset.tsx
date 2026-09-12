'use client';

/**
 * DerivativeExplorer, "the derivative is a slope," on the @classytic/stage
 * engine. Plot f(x); drag the point along the curve and shrink the gap h to
 * watch the SECANT collapse onto the TANGENT (exact f'(x) from the shared expr
 * engine's symbolic `differentiate`, numerical fallback). Replaces the canvas
 * version, now SVG, accessible, themed, KaTeX formulas via the Tex primitive.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Stage,
  Grid,
  Axes,
  Plot,
  Segment,
  MovableDot,
  compileExpr,
  differentiate,
  simplify,
  toLatex,
  evaluate,
  type Node,
} from '@classytic/stage';
import { Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { Tex } from '../../core/tex.js';
import { clamp } from '../../core/util.js';
import {
  derivativeAt,
  functionViewport,
  normalizeRange,
  secantSlope,
  valueInRange,
} from '../calculus/core.js';
import { MathActivity, MathExpressionError, MathResetTransport } from '../activity.js';

export interface DerivativeExplorerProps {
  equation?: string;
  xRange?: [number, number];
  startX?: number;
  title?: string;
  height?: number;
}

export function DerivativeExplorer({
  equation = '0.15*x^3 - x',
  xRange = [-4, 4],
  startX = 1,
  title = 'The derivative is a slope',
  height = 340,
}: DerivativeExplorerProps = {}): ReactNode {
  const [xMin, xMax] = normalizeRange(xRange, [-4, 4]);
  const initialX = valueInRange(startX, [xMin, xMax], 1);
  const [x0, setX0] = useState(initialX);
  const [h, setH] = useState(1.2);
  useEffect(() => {
    setX0(initialX);
  }, [initialX]);

  const model = useMemo(() => {
    const res = compileExpr(equation);
    if (!res.ast) return { ok: false as const, error: res.error ?? 'Invalid expression' };
    const ast = res.ast;
    const f = (x: number): number => evaluate(ast, { x });
    let dNode: Node | null = null;
    try {
      const d = differentiate(ast, 'x');
      dNode = d ? simplify(d) : null;
    } catch {
      dNode = null;
    }
    const slopeAt = dNode
      ? (x: number): number => evaluate(dNode!, { x })
      : (x: number): number => derivativeAt(f, x);
    return {
      ok: true as const,
      f,
      fLatex: toLatex(ast),
      dfLatex: dNode ? toLatex(dNode) : null,
      slopeAt,
      symbolic: dNode !== null,
    };
  }, [equation]);

  if (!model.ok) return <MathExpressionError title={title} expression={equation} error={model.error} />;

  const { f, slopeAt, fLatex, dfLatex, symbolic } = model;
  const { yMin, yMax } = functionViewport(f, [xMin, xMax]);
  const y0 = f(x0);
  const roomRight = xMax - x0;
  const direction = roomRight >= Math.min(h, (xMax - xMin) / 20) ? 1 : -1;
  const available = direction > 0 ? roomRight : x0 - xMin;
  const effectiveH = direction * Math.min(h, Math.max(0.001, available));
  const x1 = x0 + effectiveH;
  const y1 = f(x1);
  const secant = secantSlope(f, x0, effectiveH);
  const m = slopeAt(x0);
  const error = Math.abs(secant - m);
  const lineY = (slope: number, atX: number): number => y0 + slope * (atX - x0);

  const figure = (
    <Stage
      view={{ xMin, xMax, yMin, yMax }}
      height={height}
      preserveAspect={false}
      ariaLabel={`Tangent to ${equation} at x = ${x0.toFixed(2)}`}
    >
      <Grid />
      <Axes labels />
      <Plot.OfX y={f} domain={[xMin, xMax]} color="var(--stage-accent)" weight={3} />
      {Number.isFinite(y0) && Number.isFinite(y1) && (
        <Segment
          from={{ x: xMin, y: lineY(secant, xMin) }}
          to={{ x: xMax, y: lineY(secant, xMax) }}
          color="var(--stage-accent-2)"
          weight={2}
        />
      )}
      {Number.isFinite(y0) && Number.isFinite(m) && (
        <Segment
          from={{ x: xMin, y: lineY(m, xMin) }}
          to={{ x: xMax, y: lineY(m, xMax) }}
          color="var(--stage-good)"
          weight={2}
          dashed
        />
      )}
      <MovableDot
        value={{ x: x0, y: y0 }}
        onMove={(p) => setX0(clamp(p.x, xMin, xMax))}
        color="var(--stage-fg)"
        ariaLabel="point on the curve"
      />
    </Stage>
  );

  const controls = (
    <>
      <Field label="Secant gap h" value={Math.abs(effectiveH).toFixed(2)}>
        <Slider value={h} min={0.05} max={3} step={0.05} onChange={setH} ariaLabel="secant gap h" />
      </Field>
    </>
  );

  const details = (
    <div className="math-equation-detail">
      <span className="math-equation-line">
        <span className="math-equation-label">f(x) =</span> <Tex tex={fLatex} />
      </span>
      {dfLatex && (
        <span className="math-equation-line math-equation-derivative">
          <span className="math-equation-label">f′(x) =</span> <Tex tex={dfLatex} />
        </span>
      )}
    </div>
  );

  const reset = (): void => {
    setX0(initialX);
    setH(1.2);
  };
  return (
    <MathActivity
      className="math-derivative-explorer"
      eyebrow="Calculus · derivatives"
      title={title}
      description="Move the point, then shrink h. The secant line approaches the tangent and its slope approaches the derivative."
      status={
        <>
          <strong>{error < 0.02 ? 'Tangent resolved' : 'Secant approaching'}</strong>
          <span>x {x0.toFixed(2)}</span>
          <span>h {Math.abs(effectiveH).toFixed(2)}</span>
          <span>{symbolic ? 'symbolic derivative' : 'numerical derivative'}</span>
        </>
      }
      figure={figure}
      measurements={
        <>
          <div className="math-result-probe">
            <span>Instantaneous rate</span>
            <strong>f′(x) = {Number.isFinite(m) ? m.toFixed(3) : '—'}</strong>
            <small>
              secant {Number.isFinite(secant) ? secant.toFixed(3) : '—'} · error{' '}
              {Number.isFinite(error) ? error.toFixed(3) : '—'}
            </small>
          </div>
          <div className="math-slope-legend">
            <span data-line="secant">Secant</span>
            <span data-line="tangent">Tangent</span>
          </div>
        </>
      }
      controls={controls}
      conclusion={
        error < 0.02
          ? 'The secant and tangent slopes now nearly agree: this is the derivative as a limit.'
          : 'Reduce h to make the secant slope converge toward the instantaneous tangent slope.'
      }
      transport={
        <MathResetTransport
          onReset={reset}
          state="Drag the point or refine h"
          detail={`slope ${Number.isFinite(m) ? m.toFixed(3) : '—'}`}
        />
      }
      details={details}
      graphLabel="Function, secant, and tangent graph"
      inspectorLabel="Slope convergence"
    />
  );
}
