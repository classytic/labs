'use client';

/**
 * LimitExplorer — "what value does f approach as x → c?", on @classytic/stage.
 * Plots f(x), drops a dashed line at x = c, and walks dots in from both sides
 * (h = 1, 0.1, 0.01, 0.001). When the two sides converge to one value, that's
 * the limit — even where f(c) itself is a hole. Reuses `estimateOneSidedLimit`.
 */

import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Plot, Segment, Point, MovableDot, compileExpr, evaluate, toLatex } from '@classytic/stage';
import { LabStyles } from '../../kit/controls.js';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { Tex } from '../../core/tex.js';
import { estimateOneSidedLimit } from '../../core/numeric.js';
import { clamp } from '../../core/util.js';

const STEPS = [1, 0.1, 0.01, 0.001];
const fmt = (v: number): string => (Number.isFinite(v) ? v.toFixed(4) : '—');

export interface LimitExplorerProps {
  equation?: string;
  xRange?: [number, number];
  c?: number;
  title?: string;
  height?: number;
}

export function LimitExplorer({ equation = '(x^2 - 1)/(x - 1)', xRange = [-1, 3], c: cInit = 1, title = 'Approaching a limit', height = 320 }: LimitExplorerProps = {}): ReactNode {
  const [xMin, xMax] = xRange;
  const [c, setC] = useState(clamp(cInit, xMin, xMax));
  useEffect(() => { setC(clamp(cInit, xMin, xMax)); }, [cInit, xMin, xMax]);

  const model = useMemo(() => {
    const res = compileExpr(equation);
    if (!res.ast) return { ok: false as const, error: res.error ?? 'Invalid expression' };
    const ast = res.ast;
    return { ok: true as const, f: (x: number): number => evaluate(ast, { x }), fLatex: toLatex(ast) };
  }, [equation]);

  if (!model.ok) {
    return <div className="not-prose"><p style={{ fontWeight: 600 }}>{title}</p><div style={{ padding: 12, fontSize: 13, color: 'var(--stage-danger)' }}>“{equation}” — {model.error}</div></div>;
  }
  const { f, fLatex } = model;

  const ys: number[] = [];
  for (let i = 0; i <= 240; i++) { const y = f(xMin + ((xMax - xMin) * i) / 240); if (Number.isFinite(y)) ys.push(y); }
  ys.sort((p, q) => p - q);
  let yMin = ys[Math.floor(ys.length * 0.04)] ?? -1;
  let yMax = ys[Math.floor(ys.length * 0.96)] ?? 1;
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const pad = (yMax - yMin) * 0.15;
  [yMin, yMax] = [yMin - pad, yMax + pad];

  const left = estimateOneSidedLimit(f, c, -1);
  const right = estimateOneSidedLimit(f, c, 1);
  const agrees = left.converging && right.converging && Math.abs(left.value - right.value) < 1e-2 * (1 + Math.abs(left.value));
  const estimate = agrees ? (left.value + right.value) / 2 : Number.NaN;
  const atC = f(c);

  const figure = (
    <>
      <LabStyles />
      <Stage view={{ xMin, xMax, yMin, yMax }} height={height} ariaLabel={`Limit of ${equation} as x approaches ${c.toFixed(2)}`}>
        <Grid />
        <Axes />
        <Plot.OfX y={f} domain={[xMin, xMax]} color="var(--stage-accent)" weight={2.5} />
        <Segment from={{ x: c, y: yMin }} to={{ x: c, y: yMax }} color="var(--stage-muted)" weight={1} dashed />
        {STEPS.map((hstep, i) => {
          const r = 4 - i * 0.6;
          const yl = f(c - hstep); const yr = f(c + hstep);
          return (
            <Fragment key={hstep}>
              {Number.isFinite(yl) && <Point x={c - hstep} y={yl} r={r} color="var(--stage-accent-2)" />}
              {Number.isFinite(yr) && <Point x={c + hstep} y={yr} r={r} color="var(--stage-good)" />}
            </Fragment>
          );
        })}
        <MovableDot value={{ x: c, y: 0 }} onMove={(p) => setC(clamp(p.x, xMin, xMax))} constrain="horizontal" color="var(--stage-fg)" ariaLabel="approach point c" />
      </Stage>
    </>
  );

  const controls = (
    <ControlBar>
      <span style={{ opacity: 0.8 }}>c = <strong>{c.toFixed(3)}</strong></span>
      <span style={{ color: 'var(--stage-good)', fontWeight: 600 }}>{agrees ? <Tex tex={`\\text{limit} \\approx ${estimate.toFixed(3)}`} /> : 'limit DNE'}</span>
      {!Number.isFinite(atC) && <span style={{ opacity: 0.65 }}>f({+c.toFixed(2)}) is a hole</span>}
    </ControlBar>
  );

  const footer = (
    <>
      <div style={{ padding: '8px 2px 0', fontSize: 14 }}>
        <Tex tex={`\\lim_{x \\to ${(+c.toFixed(2))}} ${fLatex.includes('frac') ? fLatex : `\\left(${fLatex}\\right)`} ${agrees ? `\\approx ${(+estimate.toFixed(3))}` : '\\text{ does not exist}'}`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '1px 16px', padding: '6px 2px', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
        <span style={{ opacity: 0.6 }}><Tex tex="h" /></span><span style={{ opacity: 0.6 }}><Tex tex="f(c-h)" /></span><span style={{ opacity: 0.6 }}><Tex tex="f(c+h)" /></span>
        {STEPS.map((h) => (
          <Fragment key={h}>
            <span>{h}</span>
            <span style={{ color: 'var(--stage-accent-2)' }}>{fmt(f(c - h))}</span>
            <span style={{ color: 'var(--stage-good)' }}>{fmt(f(c + h))}</span>
          </Fragment>
        ))}
      </div>
    </>
  );

  return <LabFrame title={title} controls={controls} footer={footer}>{figure}</LabFrame>;
}
