'use client';

/**
 * IntegralExplorer — the integral as "area under the curve," on @classytic/stage.
 * Shades f(x) over [a,b] with n Riemann rectangles (SVG Polygons); drag the
 * endpoints, crank n, switch left/mid/right, and watch the estimate converge to
 * the Simpson reference. Reuses the pure `riemannSum`/`integrate` helpers.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Plot, Polygon, MovableDot, compileExpr, evaluate, toLatex } from '@classytic/stage';
import { LabStyles, Slider } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field } from '../../kit/frame.js';
import { Tex } from '../../core/tex.js';
import { riemannSum, integrate } from '../../core/numeric.js';
import { clamp } from '../../core/util.js';

type Mode = 'left' | 'mid' | 'right';
const MODES: Mode[] = ['left', 'mid', 'right'];

export interface IntegralExplorerProps {
  equation?: string;
  xRange?: [number, number];
  a?: number;
  b?: number;
  n?: number;
  title?: string;
  height?: number;
}

export function IntegralExplorer({ equation = '0.4*x^2 + 0.5', xRange = [-1, 4], a: aInit = 0, b: bInit = 3, n: nInit = 8, title = 'The integral is an area', height = 340 }: IntegralExplorerProps = {}): ReactNode {
  const [xMin, xMax] = xRange;
  const [a, setA] = useState(clamp(aInit, xMin, xMax));
  const [b, setB] = useState(clamp(bInit, xMin, xMax));
  const [n, setN] = useState(nInit);
  const [mode, setMode] = useState<Mode>('mid');
  useEffect(() => { setA(clamp(aInit, xMin, xMax)); }, [aInit, xMin, xMax]);
  useEffect(() => { setB(clamp(bInit, xMin, xMax)); }, [bInit, xMin, xMax]);
  useEffect(() => { setN(nInit); }, [nInit]);

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
  for (let i = 0; i <= 200; i++) { const y = f(xMin + ((xMax - xMin) * i) / 200); if (Number.isFinite(y)) ys.push(y); }
  ys.sort((p, q) => p - q);
  let yMin = Math.min(ys[Math.floor(ys.length * 0.02)] ?? -1, 0);
  let yMax = Math.max(ys[Math.floor(ys.length * 0.98)] ?? 1, 0);
  if (yMin === yMax) { yMin -= 1; yMax += 1; }
  const pad = (yMax - yMin) * 0.12;
  [yMin, yMax] = [yMin - pad, yMax + pad];

  const lo = Math.min(a, b), hi = Math.max(a, b);
  const dx = n > 0 ? (hi - lo) / n : 0;
  const rects: { pts: { x: number; y: number }[]; pos: boolean }[] = [];
  for (let i = 0; i < n; i++) {
    const xl = lo + i * dx;
    const sx = mode === 'left' ? xl : mode === 'right' ? xl + dx : xl + dx / 2;
    const fy = f(sx);
    if (!Number.isFinite(fy)) continue;
    rects.push({ pts: [{ x: xl, y: 0 }, { x: xl + dx, y: 0 }, { x: xl + dx, y: fy }, { x: xl, y: fy }], pos: fy >= 0 });
  }
  const approx = riemannSum(f, [lo, hi], n, mode);
  const reference = integrate(f, [lo, hi], 1000);

  const figure = (
    <>
      <LabStyles />
      <Stage view={{ xMin, xMax, yMin, yMax }} height={height} ariaLabel={`Riemann sum of ${equation} over [${lo.toFixed(1)}, ${hi.toFixed(1)}]`}>
        <Grid />
        {rects.map((r, i) => (
          <Polygon key={i} points={r.pts} color={r.pos ? 'var(--stage-accent)' : 'var(--stage-danger)'} fill={r.pos ? 'var(--stage-accent)' : 'var(--stage-danger)'} fillOpacity={0.26} weight={1} />
        ))}
        <Axes />
        <Plot.OfX y={f} domain={[xMin, xMax]} color="var(--stage-fg)" weight={2.5} />
        <MovableDot value={{ x: a, y: 0 }} onMove={(p) => setA(clamp(p.x, xMin, xMax))} constrain="horizontal" color="var(--stage-good)" ariaLabel="left endpoint a" />
        <MovableDot value={{ x: b, y: 0 }} onMove={(p) => setB(clamp(p.x, xMin, xMax))} constrain="horizontal" color="var(--stage-good)" ariaLabel="right endpoint b" />
      </Stage>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="rectangles n" value={<strong>{n}</strong>}>
        <Slider value={n} min={1} max={80} step={1} onChange={(v) => setN(Math.round(v))} ariaLabel="number of rectangles" />
      </Field>
      <button type="button" className="lab-chip" onClick={() => setMode((mm) => MODES[(MODES.indexOf(mm) + 1) % 3] as Mode)}>{mode} sum</button>
      <span style={{ opacity: 0.8 }}>sum <strong>{approx.toFixed(3)}</strong></span>
      <span style={{ color: 'var(--stage-good)', fontWeight: 600 }}><Tex tex={`\\int \\approx ${reference.toFixed(3)}`} /></span>
    </ControlBar>
  );

  const footer = (
    <div style={{ padding: '8px 2px 0', fontSize: 14 }}>
      <Tex tex={`\\int_{${lo.toFixed(1)}}^{${hi.toFixed(1)}}\\left(${fLatex}\\right)\\,dx \\approx ${approx.toFixed(3)}`} />
    </div>
  );

  return <LabFrame title={title} controls={controls} footer={footer}>{figure}</LabFrame>;
}
