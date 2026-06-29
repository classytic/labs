'use client';

/**
 * DerivativeExplorer, "the derivative is a slope," on the @classytic/stage
 * engine. Plot f(x); drag the point along the curve and shrink the gap h to
 * watch the SECANT collapse onto the TANGENT (exact f'(x) from the shared expr
 * engine's symbolic `differentiate`, numerical fallback). Replaces the canvas
 * version, now SVG, accessible, themed, KaTeX formulas via the Tex primitive.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Plot, Segment, MovableDot, compileExpr, differentiate, simplify, toLatex, evaluate, type Node } from '@classytic/stage';
import { LabStyles, Slider } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field } from '../../kit/frame.js';
import { Tex } from '../../core/tex.js';
import { clamp } from '../../core/util.js';

export interface DerivativeExplorerProps {
  equation?: string;
  xRange?: [number, number];
  startX?: number;
  title?: string;
  height?: number;
}

const numericSlope = (f: (x: number) => number, x: number): number => (f(x + 1e-4) - f(x - 1e-4)) / 2e-4;

function autoY(f: (x: number) => number, xMin: number, xMax: number): [number, number] {
  const ys: number[] = [];
  for (let i = 0; i <= 200; i++) { const y = f(xMin + ((xMax - xMin) * i) / 200); if (Number.isFinite(y)) ys.push(y); }
  if (!ys.length) return [-1, 1];
  ys.sort((a, b) => a - b);
  let lo = Math.min(ys[Math.floor(ys.length * 0.02)] ?? -1, 0);
  let hi = Math.max(ys[Math.floor(ys.length * 0.98)] ?? 1, 0);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.15;
  return [lo - pad, hi + pad];
}

export function DerivativeExplorer({ equation = '0.15*x^3 - x', xRange = [-4, 4], startX = 1, title = 'The derivative is a slope', height = 340 }: DerivativeExplorerProps = {}): ReactNode {
  const [xMin, xMax] = xRange;
  const [x0, setX0] = useState(clamp(startX, xMin, xMax));
  const [h, setH] = useState(1.2);
  useEffect(() => { setX0(clamp(startX, xMin, xMax)); }, [startX, xMin, xMax]);

  const model = useMemo(() => {
    const res = compileExpr(equation);
    if (!res.ast) return { ok: false as const, error: res.error ?? 'Invalid expression' };
    const ast = res.ast;
    const f = (x: number): number => evaluate(ast, { x });
    let dNode: Node | null = null;
    try { const d = differentiate(ast, 'x'); dNode = d ? simplify(d) : null; } catch { dNode = null; }
    const slopeAt = dNode ? (x: number): number => evaluate(dNode!, { x }) : (x: number): number => numericSlope(f, x);
    return { ok: true as const, f, fLatex: toLatex(ast), dfLatex: dNode ? toLatex(dNode) : null, slopeAt };
  }, [equation]);

  if (!model.ok) {
    return <div className="not-prose"><p style={{ fontWeight: 600 }}>{title}</p><div style={{ padding: 12, fontSize: 13, color: 'var(--stage-danger)' }}>“{equation}”, {model.error}</div></div>;
  }

  const { f, slopeAt, fLatex, dfLatex } = model;
  const [yMin, yMax] = autoY(f, xMin, xMax);
  const y0 = f(x0);
  const x1 = x0 + h;
  const y1 = f(x1);
  const secant = (y1 - y0) / (x1 - x0);
  const m = slopeAt(x0);
  const lineY = (slope: number, atX: number): number => y0 + slope * (atX - x0);

  const figure = (
    <>
      <LabStyles />
      <Stage view={{ xMin, xMax, yMin, yMax }} height={height} ariaLabel={`Tangent to ${equation} at x = ${x0.toFixed(2)}`}>
        <Grid />
        <Axes />
        <Plot.OfX y={f} domain={[xMin, xMax]} color="var(--stage-accent)" weight={3} />
        {Number.isFinite(y0) && Number.isFinite(y1) && <Segment from={{ x: xMin, y: lineY(secant, xMin) }} to={{ x: xMax, y: lineY(secant, xMax) }} color="var(--stage-accent-2)" weight={2} />}
        {Number.isFinite(y0) && Number.isFinite(m) && <Segment from={{ x: xMin, y: lineY(m, xMin) }} to={{ x: xMax, y: lineY(m, xMax) }} color="var(--stage-good)" weight={2} dashed />}
        <MovableDot value={{ x: x0, y: y0 }} onMove={(p) => setX0(clamp(p.x, xMin, xMax))} color="var(--stage-fg)" ariaLabel="point on the curve" />
      </Stage>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="gap h">
        <Slider value={h} min={0.05} max={3} step={0.05} onChange={setH} ariaLabel="secant gap h" />
      </Field>
      <span style={{ opacity: 0.8 }}>x = <strong>{x0.toFixed(2)}</strong></span>
      <span style={{ opacity: 0.8 }}>secant slope <strong>{Number.isFinite(secant) ? secant.toFixed(2) : ', '}</strong></span>
      <span style={{ color: 'var(--stage-good)', fontWeight: 600 }}>f′(x) = {Number.isFinite(m) ? m.toFixed(2) : ', '}</span>
    </ControlBar>
  );

  const footer = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', padding: '8px 2px 0', fontSize: 14 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ opacity: 0.6 }}>f(x) =</span> <Tex tex={fLatex} /></span>
      {dfLatex && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--stage-good)' }}><span style={{ opacity: 0.7 }}>f′(x) =</span> <Tex tex={dfLatex} /></span>}
    </div>
  );

  return <LabFrame title={title} controls={controls} footer={footer}>{figure}</LabFrame>;
}
