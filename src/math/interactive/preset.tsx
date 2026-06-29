'use client';

/**
 * InteractiveProblem, the authorable engine: a CREATOR writes a config (equations,
 * params, derived quantities, an optional ask+check) and gets a live, graded
 * interactive graph. No bespoke component per question, the same engine plots any
 * equations, exposes params as sliders, DERIVES what the question needs (roots,
 * intersections, tangent/normal, area) from the symbolic engine, and CHECKS the
 * student's answer symbolically + numerically.
 *
 * This is the spine that makes exam questions AUTHORED CONFIGS, not code. Things a
 * plotter can't draw (phasors, triangles, 3D) are separate authorable representations.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Stage, Grid, Axes, Plot, Dot, Segment, compileExpr, type CompiledExpr } from '@classytic/stage';
import { roots, intersections, tangentAt, normalAt, areaBetween, type Fn1 } from '../../kit/expr-analysis.js';
import { checkAnswer, type AnswerSpec } from '../../kit/answer-check.js';
import { Slider } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { AskBox } from '../../kit/pedagogy.js';

const PALETTE = ['var(--stage-accent)', 'var(--stage-accent-2)', 'var(--stage-good)', 'var(--stage-warn)'];
const C_DERIVED = 'var(--stage-good)';

export interface ProblemParam { name: string; min: number; max: number; step?: number; value: number; label?: string }
export interface ProblemEquation { expr: string; color?: string }

/** A quantity the engine computes live from the equations + params. */
export type Derived =
  | { kind: 'intersections'; of: [number, number]; label?: string }
  | { kind: 'roots'; of: number; label?: string }
  | { kind: 'tangent'; of: number; at: number | string }
  | { kind: 'normal'; of: number; at: number | string }
  | { kind: 'area'; between: [number, number]; from: number | string; to: number | string; label?: string };

export interface ProblemAsk { prompt: string; answer: AnswerSpec; placeholder?: string }

export interface InteractiveProblemProps {
  equations: (string | ProblemEquation)[];
  params?: ProblemParam[];
  xRange?: [number, number];
  yRange?: [number, number] | 'auto';
  derive?: Derived[];
  ask?: ProblemAsk;
  title?: string;
  prompt?: string;
  height?: number;
  /** Reporting id for useCheckpoint (defaults to 'interactive-problem'). */
  activity?: string;
}

interface Curve { expr: string; color: string; fn: Fn1; compiled: CompiledExpr | null }

function autoY(curves: Curve[], xMin: number, xMax: number): [number, number] {
  const ys: number[] = [];
  for (const cu of curves) {
    if (!cu.compiled) continue;
    for (let i = 0; i <= 200; i++) { const y = cu.fn(xMin + ((xMax - xMin) * i) / 200); if (Number.isFinite(y)) ys.push(y); }
  }
  if (!ys.length) return [-10, 10];
  ys.sort((a, b) => a - b);
  const lo = ys[Math.floor(ys.length * 0.02)] ?? 0;
  const hi = ys[Math.floor(ys.length * 0.98)] ?? 0;
  let min = Math.min(lo, 0), max = Math.max(hi, 0);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12;
  return [min - pad, max + pad];
}

export function InteractiveProblem({
  equations, params = [], xRange = [-6.5, 6.5], yRange = 'auto', derive = [], ask,
  title = 'Interactive problem', prompt, height = 340, activity = 'interactive-problem',
}: InteractiveProblemProps): ReactNode {
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(params.map((p) => [p.name, p.value])));

  const resolve = (v: number | string): number => (typeof v === 'number' ? v : vals[v] ?? NaN);

  const curves = useMemo<Curve[]>(() => {
    return equations.map((e, i) => {
      const eq = typeof e === 'string' ? { expr: e } : e;
      const c = compileExpr(eq.expr);
      const compiled = c.error !== undefined ? null : c;
      const fn: Fn1 = (x) => (compiled ? compiled.fn({ ...vals, x }) : NaN);
      return { expr: eq.expr, color: eq.color ?? PALETTE[i % PALETTE.length]!, fn, compiled };
    });
  }, [equations, vals]);

  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange === 'auto' ? autoY(curves, xMin, xMax) : yRange;

  // ── derive the quantities the question needs, live ──────────────────────────
  const overlays: ReactNode[] = [];
  const readouts: { label: string; value: string }[] = [];
  derive.forEach((d, di) => {
    if (d.kind === 'intersections') {
      const [i, j] = d.of;
      const pts = intersections(curves[i]!.fn, curves[j]!.fn, xMin, xMax);
      pts.forEach((p, k) => overlays.push(<Dot key={`x${di}-${k}`} x={p.x} y={p.y} r={5} color={C_DERIVED} />));
      readouts.push({ label: d.label ?? 'intersection points', value: String(pts.length) });
    } else if (d.kind === 'roots') {
      const rs = roots(curves[d.of]!.fn, xMin, xMax);
      rs.forEach((x, k) => overlays.push(<Dot key={`r${di}-${k}`} x={x} y={0} r={5} color={C_DERIVED} />));
      readouts.push({ label: d.label ?? 'roots', value: rs.map((x) => x.toFixed(2)).join(', ') || 'none' });
    } else if (d.kind === 'tangent' || d.kind === 'normal') {
      const c = curves[d.of]!;
      if (c.compiled) {
        const line = (d.kind === 'tangent' ? tangentAt : normalAt)(c.compiled.ast, resolve(d.at), 'x', vals);
        if (line) {
          overlays.push(<Plot.OfX key={`l${di}`} y={line.f} color={C_DERIVED} weight={2} dashed />);
          overlays.push(<Dot key={`lp${di}`} x={line.at.x} y={line.at.y} r={5} color={C_DERIVED} />);
          readouts.push({ label: d.kind, value: `y = ${line.m.toFixed(2)}x ${line.c < 0 ? '−' : '+'} ${Math.abs(line.c).toFixed(2)}` });
        }
      }
    } else if (d.kind === 'area') {
      const [i, j] = d.between;
      const A = areaBetween(curves[i]!.fn, curves[j]!.fn, resolve(d.from), resolve(d.to));
      readouts.push({ label: d.label ?? 'area', value: A.toFixed(3) });
    }
  });

  const figure = (
    <Stage view={{ xMin, xMax, yMin, yMax }} height={height} preserveAspect={false} ariaLabel={title}>
      <Grid />
      <Axes />
      {curves.map((cu, i) => cu.compiled && <Plot.OfX key={i} y={cu.fn} color={cu.color} weight={2.5} />)}
      {overlays}
    </Stage>
  );

  const aside = readouts.length ? (
    <Callout tone="result">
      <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
        {readouts.map((r, i) => <span key={i} style={{ fontSize: 13 }}>{r.label}: <strong>{r.value}</strong></span>)}
      </div>
    </Callout>
  ) : undefined;

  const controls = params.length ? (
    <ControlBar>
      {params.map((p) => (
        <Field key={p.name} label={p.label ?? p.name} value={(vals[p.name] ?? p.value).toFixed(p.step && p.step < 1 ? 2 : 0)}>
          <Slider value={vals[p.name] ?? p.value} min={p.min} max={p.max} step={p.step ?? 1} onChange={(n) => setVals((v) => ({ ...v, [p.name]: n }))} ariaLabel={p.label ?? p.name} />
        </Field>
      ))}
    </ControlBar>
  ) : undefined;

  const footer = ask ? (
    <AskBox prompt={ask.prompt} placeholder={ask.placeholder} activity={activity} check={(r) => checkAnswer(ask.answer, r)} />
  ) : undefined;

  return <LabFrame title={title} prompt={prompt} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
