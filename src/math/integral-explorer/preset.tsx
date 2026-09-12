'use client';

/**
 * IntegralExplorer, the integral as "area under the curve," on @classytic/stage.
 * Shades f(x) over [a,b] with n Riemann rectangles (SVG Polygons); drag the
 * endpoints, crank n, switch left/mid/right, and watch the estimate converge to
 * the Simpson reference. Reuses the pure `riemannSum`/`integrate` helpers.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Stage,
  Grid,
  Axes,
  Plot,
  Polygon,
  MovableDot,
  compileExpr,
  evaluate,
  toLatex,
} from '@classytic/stage';
import { Chip, Slider } from '../../kit/controls.js';
import { Control, Field } from '../../kit/frame.js';
import { Tex } from '../../core/tex.js';
import { integrate } from '../../core/numeric.js';
import { clamp } from '../../core/util.js';
import {
  functionViewport,
  normalizeRange,
  riemannEstimate,
  riemannSlices,
  valueInRange,
  type RiemannMode,
} from '../calculus/core.js';
import { MathActivity, MathExpressionError, MathResetTransport } from '../activity.js';

const MODES: RiemannMode[] = ['left', 'mid', 'right'];

export interface IntegralExplorerProps {
  equation?: string;
  xRange?: [number, number];
  a?: number;
  b?: number;
  n?: number;
  title?: string;
  height?: number;
}

const safeRectangleCount = (value: number): number =>
  Math.round(clamp(Number.isFinite(value) ? value : 8, 1, 80));

export function IntegralExplorer({
  equation = '0.4*x^2 + 0.5',
  xRange = [-1, 4],
  a: aInit = 0,
  b: bInit = 3,
  n: nInit = 8,
  title = 'The integral is an area',
  height = 340,
}: IntegralExplorerProps = {}): ReactNode {
  const [xMin, xMax] = normalizeRange(xRange, [-1, 4]);
  const initialA = valueInRange(aInit, [xMin, xMax], 0);
  const initialB = valueInRange(bInit, [xMin, xMax], 3);
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const [n, setN] = useState(safeRectangleCount(nInit));
  const [mode, setMode] = useState<RiemannMode>('mid');
  useEffect(() => {
    setA(initialA);
  }, [initialA]);
  useEffect(() => {
    setB(initialB);
  }, [initialB]);
  useEffect(() => {
    setN(safeRectangleCount(nInit));
  }, [nInit]);

  const model = useMemo(() => {
    const res = compileExpr(equation);
    if (!res.ast) return { ok: false as const, error: res.error ?? 'Invalid expression' };
    const ast = res.ast;
    return { ok: true as const, f: (x: number): number => evaluate(ast, { x }), fLatex: toLatex(ast) };
  }, [equation]);

  if (!model.ok) return <MathExpressionError title={title} expression={equation} error={model.error} />;
  const { f, fLatex } = model;

  const { yMin, yMax } = functionViewport(f, [xMin, xMax]);
  const rects = riemannSlices(f, a, b, n, mode);
  const approx = riemannEstimate(f, a, b, n, mode);
  const reference = integrate(f, [a, b], 1000);
  const error = Math.abs(approx - reference);

  const figure = (
    <Stage
      view={{ xMin, xMax, yMin, yMax }}
      height={height}
      preserveAspect={false}
      ariaLabel={`Riemann sum of ${equation} from ${a.toFixed(1)} to ${b.toFixed(1)}`}
    >
      <Grid />
      {rects.map((r, i) => (
        <Polygon
          key={i}
          points={[
            { x: r.x0, y: 0 },
            { x: r.x1, y: 0 },
            { x: r.x1, y: r.height },
            { x: r.x0, y: r.height },
          ]}
          color={r.height >= 0 ? 'var(--stage-accent)' : 'var(--stage-danger)'}
          fill={r.height >= 0 ? 'var(--stage-accent)' : 'var(--stage-danger)'}
          fillOpacity={0.26}
          weight={1}
        />
      ))}
      <Axes labels />
      <Plot.OfX y={f} domain={[xMin, xMax]} color="var(--stage-fg)" weight={2.5} />
      <MovableDot
        value={{ x: a, y: 0 }}
        onMove={(p) => setA(clamp(p.x, xMin, xMax))}
        constrain="horizontal"
        color="var(--stage-good)"
        ariaLabel="left endpoint a"
      />
      <MovableDot
        value={{ x: b, y: 0 }}
        onMove={(p) => setB(clamp(p.x, xMin, xMax))}
        constrain="horizontal"
        color="var(--stage-good)"
        ariaLabel="right endpoint b"
      />
    </Stage>
  );

  const controls = (
    <>
      <Field label="Rectangles n" name="rectangles" value={<strong>{n}</strong>}>
        <Slider
          value={n}
          min={1}
          max={80}
          step={1}
          onChange={(v) => setN(Math.round(v))}
          ariaLabel="number of rectangles"
        />
      </Field>
      <Control name="sampling method">
        <div className="math-mode-picker" role="group" aria-label="rectangle sampling method">
          {MODES.map((value) => (
            <Chip
              key={value}
              selected={mode === value}
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
            >
              {value}
            </Chip>
          ))}
        </div>
      </Control>
    </>
  );

  const details = (
    <div className="math-equation-detail">
      <Tex
        tex={`\\int_{${a.toFixed(1)}}^{${b.toFixed(1)}}\\left(${fLatex}\\right)\\,dx \\approx ${approx.toFixed(3)}`}
      />
    </div>
  );

  const reset = (): void => {
    setA(initialA);
    setB(initialB);
    setN(safeRectangleCount(nInit));
    setMode('mid');
  };
  return (
    <MathActivity
      className="math-integral-explorer"
      eyebrow="Calculus · integrals"
      title={title}
      description="Move the bounds, choose where each rectangle samples the function, and increase n to watch the signed area estimate converge."
      status={
        <>
          <strong>{error < 0.01 ? 'Estimate converged' : `${mode} rectangles`}</strong>
          <span>a {a.toFixed(2)}</span>
          <span>b {b.toFixed(2)}</span>
          <span>n {n}</span>
        </>
      }
      figure={figure}
      measurements={
        <>
          <div className="math-result-probe">
            <span>Signed accumulation</span>
            <strong>
              <Tex tex={`S_${n} = ${Number.isFinite(approx) ? approx.toFixed(3) : '\\text{undefined}'}`} />
            </strong>
            <small>
              reference {Number.isFinite(reference) ? reference.toFixed(3) : '—'} · error{' '}
              {Number.isFinite(error) ? error.toFixed(4) : '—'}
            </small>
          </div>
          <p className="math-explain">
            Area above the axis contributes positively; area below contributes negatively. Reversing the
            bounds reverses the sign.
          </p>
        </>
      }
      controls={controls}
      conclusion={
        error < 0.01
          ? `The ${mode}-rectangle estimate has converged: adding rectangles no longer changes it noticeably.`
          : 'Increase the rectangle count or compare sampling methods to reduce approximation error.'
      }
      transport={
        <MathResetTransport
          onReset={reset}
          state="Refine the partition"
          detail={`${mode} · Δx ${((b - a) / Math.max(1, n)).toFixed(3)}`}
        />
      }
      details={details}
      graphLabel="Function graph with signed Riemann rectangles"
      inspectorLabel="Accumulation estimate"
    />
  );
}
