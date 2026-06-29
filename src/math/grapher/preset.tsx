'use client';

/**
 * Grapher, a creator-authored equation/function plotter on the @classytic/stage
 * engine. A creator types one or more formulas in `x` (and named params), optionally
 * exposes params as sliders, and gets a clean auto-scaled multi-curve plot.
 *
 * Framed, labelled axes (NOT through-origin) so it reads cleanly for ANY window , 
 * including off-origin ranges like x∈[250,400] where a 0-axis would sit off-screen.
 * Supports a LOG y-scale: essential for exponentials (e.g. Arrhenius rate ∝ e^(−Eₐ/RT)),
 * where a linear axis collapses the curve onto the baseline but a log axis makes it a
 * clean straight-ish line. Accessible (SVG + aria), themeable.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Stage, Segment, Label, Plot, compileExpr, type CompiledExpr } from '@classytic/stage';
import { LabStyles, Slider } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field } from '../../kit/frame.js';

const PALETTE = ['var(--stage-accent)', 'var(--stage-accent-2)', 'var(--stage-good)', 'var(--stage-warn)'];

export interface GraphEquation {
  /** Formula in `x` and any params, e.g. `a*sin(b*x + c)`. */
  expr: string;
  color?: string;
}
export interface GraphParam {
  name: string;
  min: number;
  max: number;
  step?: number;
  value: number;
}
export interface GrapherProps {
  equations?: (GraphEquation | string)[] | string;
  params?: GraphParam[];
  xRange?: [number, number];
  yRange?: [number, number] | 'auto';
  /** `log` plots log₁₀(y) with decade ticks, for exponentials/rates. */
  yScale?: 'linear' | 'log';
  title?: string;
  subtitle?: string;
  height?: number;
  grid?: boolean;
}

interface Curve { expr: string; color: string; compiled: CompiledExpr | null; error?: string }

function normalizeEquations(input: GrapherProps['equations']): GraphEquation[] {
  const arr = Array.isArray(input) ? input : typeof input === 'string' ? [input] : [];
  const eqs = arr
    .map((e) => (typeof e === 'string' ? { expr: e } : e))
    .filter((e): e is GraphEquation => !!e && typeof e.expr === 'string' && e.expr.trim().length > 0);
  return eqs.length ? eqs : [{ expr: 'sin(x)' }];
}

/** Nice round linear tick values across [min,max]. */
function niceTicks(min: number, max: number, target = 6): number[] {
  const span = max - min;
  if (!(span > 0) || !Number.isFinite(span)) return [];
  const raw = span / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-6 ? 0 : v);
  return out;
}
/** Integer (decade) ticks for a log axis, falls back to nice ticks for a sub-decade window. */
function decadeTicks(min: number, max: number): number[] {
  const lo = Math.ceil(min - 1e-9), hi = Math.floor(max + 1e-9);
  const out: number[] = [];
  for (let v = lo; v <= hi; v++) out.push(v);
  return out.length >= 2 ? out : niceTicks(min, max, 5);
}
const fmtNum = (v: number): string => {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e4 || a < 1e-3) return v.toExponential(0).replace('e+', 'e');
  return String(+v.toFixed(a < 1 ? 3 : a < 10 ? 2 : a < 100 ? 1 : 0));
};

/** Auto window in DISPLAY space (after the y-transform), trimmed so spikes don't flatten the curve. */
function autoRange(curves: Curve[], scope: Record<string, number>, xMin: number, xMax: number, disp: (y: number) => number): [number, number] {
  const ys: number[] = [];
  const probe: Record<string, number> = { ...scope };
  for (const cu of curves) {
    if (!cu.compiled) continue;
    for (let i = 0; i <= 240; i++) {
      probe.x = xMin + ((xMax - xMin) * i) / 240;
      const d = disp(cu.compiled.fn(probe));
      if (Number.isFinite(d)) ys.push(d);
    }
  }
  if (!ys.length) return [0, 1];
  ys.sort((a, b) => a - b);
  let lo = ys[Math.floor(ys.length * 0.01)] ?? ys[0]!;
  let hi = ys[Math.min(ys.length - 1, Math.ceil(ys.length * 0.99))] ?? ys[ys.length - 1]!;
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.08;
  return [lo - pad, hi + pad];
}

export function Grapher({ equations, params = [], xRange = [-6.5, 6.5], yRange = 'auto', yScale = 'linear', title = 'Graph', subtitle, height = 320, grid = true }: GrapherProps = {}): ReactNode {
  const isLog = yScale === 'log';
  const disp = (y: number): number => (isLog ? (y > 0 ? Math.log10(y) : NaN) : y);

  const curves = useMemo<Curve[]>(() => normalizeEquations(equations).map((eq, i) => {
    const res = compileExpr(eq.expr);
    const compiled = typeof res.fn === 'function' ? (res as CompiledExpr) : null;
    return { expr: eq.expr, color: eq.color ?? PALETTE[i % PALETTE.length]!, compiled, error: res.error };
  }), [equations]);

  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(params.map((p) => [p.name, p.value])));
  const paramKey = params.map((p) => `${p.name}:${p.value}`).join('|');
  useEffect(() => { setValues(Object.fromEntries(params.map((p) => [p.name, p.value]))); }, [paramKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const [xMin, xMax] = xRange;
  const [dispMin, dispMax] = yRange === 'auto'
    ? autoRange(curves, values, xMin, xMax, disp)
    : (isLog ? [Math.log10(Math.max(1e-300, yRange[0])), Math.log10(Math.max(1e-300, yRange[1]))] as [number, number] : yRange);

  // gutters around the data box so edge tick labels have room (axes are a FRAME, not through-origin)
  const spanX = xMax - xMin, spanD = dispMax - dispMin;
  const view = { xMin: xMin - spanX * 0.13, xMax: xMax + spanX * 0.02, yMin: dispMin - spanD * 0.15, yMax: dispMax + spanD * 0.05 };
  const xTicks = niceTicks(xMin, xMax, 6);
  const yTicks = isLog ? decadeTicks(dispMin, dispMax) : niceTicks(dispMin, dispMax, 5);
  const yLabel = (d: number): string => (isLog ? (Number.isInteger(d) ? `1e${d}` : `1e${d.toFixed(1)}`) : fmtNum(d));
  const errors = curves.filter((c) => c.error);

  const figure = (
    <>
      <LabStyles />
      <Stage view={view} height={height} preserveAspect={false} ariaLabel={`Graph of ${curves.map((c) => c.expr).join(', ')}${isLog ? ', log scale' : ''}`}>
        {/* gridlines */}
        {grid && yTicks.map((y) => <Segment key={`gy${y}`} from={{ x: xMin, y }} to={{ x: xMax, y }} color="var(--stage-grid)" opacity={0.6} weight={1} />)}
        {grid && xTicks.map((x) => <Segment key={`gx${x}`} from={{ x, y: dispMin }} to={{ x, y: dispMax }} color="var(--stage-grid)" opacity={0.6} weight={1} />)}
        {/* frame box: solid left+bottom, faint top+right */}
        <Segment from={{ x: xMin, y: dispMin }} to={{ x: xMax, y: dispMin }} color="var(--stage-fg)" opacity={0.55} weight={1.5} />
        <Segment from={{ x: xMin, y: dispMin }} to={{ x: xMin, y: dispMax }} color="var(--stage-fg)" opacity={0.55} weight={1.5} />
        <Segment from={{ x: xMin, y: dispMax }} to={{ x: xMax, y: dispMax }} color="var(--stage-fg)" opacity={0.16} weight={1} />
        <Segment from={{ x: xMax, y: dispMin }} to={{ x: xMax, y: dispMax }} color="var(--stage-fg)" opacity={0.16} weight={1} />
        {/* tick labels */}
        {xTicks.map((x) => <Label key={`lx${x}`} x={x} y={dispMin} text={fmtNum(x)} dy={15} anchor="middle" size={11} color="var(--stage-muted)" />)}
        {yTicks.map((y) => <Label key={`ly${y}`} x={xMin} y={y} text={yLabel(y)} dx={-7} anchor="end" baseline="middle" size={11} color="var(--stage-muted)" />)}
        {isLog && <Label x={xMin} y={dispMax} text="log scale" dx={4} dy={-4} anchor="start" size={10} color="var(--stage-muted)" />}
        {/* curves */}
        {curves.map((cu, i) => cu.compiled
          ? <Plot.OfX key={i} y={(x) => disp(cu.compiled!.fn({ ...values, x }))} domain={[xMin, xMax]} color={cu.color} weight={3} />
          : null)}
      </Stage>
      {subtitle && <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--stage-muted)', margin: '4px 0 0' }}>{subtitle}</p>}
    </>
  );

  const controls = params.length > 0 ? (
    <ControlBar>
      {params.map((p) => (
        <Field key={p.name} label={p.name} value={<strong style={{ fontVariantNumeric: 'tabular-nums' }}>{(values[p.name] ?? p.value).toFixed(2)}</strong>}>
          <Slider value={values[p.name] ?? p.value} min={p.min} max={p.max} step={p.step ?? 0.1} onChange={(v) => setValues((prev) => ({ ...prev, [p.name]: v }))} ariaLabel={`parameter ${p.name}`} />
        </Field>
      ))}
    </ControlBar>
  ) : undefined;

  const footer = (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', padding: '6px 2px', fontSize: 13 }}>
        {curves.map((cu, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'ui-monospace, monospace', opacity: 0.85 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: cu.color }} />
            y = {cu.expr}
          </span>
        ))}
      </div>
      {errors.length > 0 && (
        <div style={{ padding: '2px', fontSize: 12, color: 'var(--stage-danger)' }}>
          {errors.map((e, i) => <div key={i}>“{e.expr}”, {e.error}</div>)}
        </div>
      )}
    </>
  );

  return <LabFrame title={title || undefined} controls={controls} footer={footer}>{figure}</LabFrame>;
}
