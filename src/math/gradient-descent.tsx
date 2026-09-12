'use client';

/**
 * GradientDescent, the calculus that powers machine learning, made visible.
 *
 * Plots a 2-variable "loss surface" f(x, y) as a heatmap, then walks downhill by
 * the rule that trains every neural net: step opposite the gradient,
 *   (x, y) ← (x, y) − lr · ∇f,   ∇f = [∂f/∂x, ∂f/∂y].
 *
 * The gradient is the engine's EXACT symbolic differentiator ,
 * `differentiate(ast, 'x')` and `differentiate(ast, 'y')`, proving the scalar
 * expr engine already does multivariable partials (numerical fallback otherwise).
 *
 * This is a genuine HIGH-ELEMENT-COUNT figure (a per-pixel-cell heatmap), so it
 * renders on the engine's `<CanvasLayer>` (zero-dep raw Canvas2D, HiDPI, shares
 * the coordinate system + clock) instead of one SVG node per cell, and instead
 * of a heavy GPU dependency. Everything ELSE (controls, KaTeX, theming) is the
 * same kit every other lab uses. Drag the start point, tune the rate, watch it
 * converge, or diverge.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  CanvasLayer,
  useFrameLoop,
  useInView,
  compileExpr,
  differentiate,
  simplify,
  evaluate,
  toLatex,
  type Node,
  type CoordinateSystem,
} from '@classytic/stage';
import { Slider } from '../kit/controls.js';
import { Field } from '../kit/frame.js';
import { Tex } from '../core/tex.js';
import { clamp, lerp } from '../core/util.js';
import { normalizeRange, valueInRange } from './calculus/core.js';
import { gradientStep, type DescentState } from './optimization/core.js';
import { MathActivity, MathExpressionError, MathRunTransport } from './activity.js';

export interface GradientDescentProps {
  /** Loss surface f(x, y), e.g. `x^2 + 2*y^2` or `x^2 + y^2 - x*y`. */
  equation?: string;
  /** Visible square-ish region [min,max] for both axes. Default [-3, 3]. */
  range?: [number, number];
  start?: [number, number];
  learningRate?: number;
  title?: string;
  height?: number;
}

// Perceptual "viridis" colormap, low f = deep purple valley → high f = yellow hills.
// Uniform lightness ramp, so the bowl reads cleanly instead of flooding to one colour.
const VIRIDIS: [number, number, number][] = [
  [68, 1, 84],
  [59, 82, 139],
  [33, 145, 140],
  [94, 201, 98],
  [253, 231, 37],
];
function viridis(t: number): string {
  const x = clamp(t, 0, 1) * (VIRIDIS.length - 1);
  const i = Math.min(VIRIDIS.length - 2, Math.floor(x)),
    f = x - i;
  const a = VIRIDIS[i]!,
    b = VIRIDIS[i + 1]!;
  return `rgb(${Math.round(lerp(a[0], b[0], f))},${Math.round(lerp(a[1], b[1], f))},${Math.round(lerp(a[2], b[2], f))})`;
}

/** Iso-loss contour lines via marching squares on a lattice-sampled value grid. */
function contours(
  ctx: CanvasRenderingContext2D,
  vals: Float64Array,
  cols: number,
  rows: number,
  cell: number,
  levels: number[],
  color: string,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const px = (col: number): number => col * cell,
    py = (r: number): number => r * cell;
  for (const L of levels) {
    for (let r = 0; r < rows - 1; r++) {
      for (let col = 0; col < cols - 1; col++) {
        const tl = vals[r * cols + col]!,
          tr = vals[r * cols + col + 1]!,
          br = vals[(r + 1) * cols + col + 1]!,
          bl = vals[(r + 1) * cols + col]!;
        if (!(Number.isFinite(tl) && Number.isFinite(tr) && Number.isFinite(br) && Number.isFinite(bl)))
          continue;
        const code = (tl >= L ? 8 : 0) | (tr >= L ? 4 : 0) | (br >= L ? 2 : 0) | (bl >= L ? 1 : 0);
        if (code === 0 || code === 15) continue;
        const top = (): [number, number] => [px(col) + cell * ((L - tl) / (tr - tl)), py(r)];
        const bot = (): [number, number] => [px(col) + cell * ((L - bl) / (br - bl)), py(r + 1)];
        const lft = (): [number, number] => [px(col), py(r) + cell * ((L - tl) / (bl - tl))];
        const rgt = (): [number, number] => [px(col + 1), py(r) + cell * ((L - tr) / (br - tr))];
        const seg = (a: [number, number], b: [number, number]): void => {
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
        };
        switch (code) {
          case 1:
          case 14:
            seg(lft(), bot());
            break;
          case 2:
          case 13:
            seg(bot(), rgt());
            break;
          case 3:
          case 12:
            seg(lft(), rgt());
            break;
          case 4:
          case 11:
            seg(top(), rgt());
            break;
          case 6:
          case 9:
            seg(top(), bot());
            break;
          case 7:
          case 8:
            seg(lft(), top());
            break;
          case 5:
            seg(lft(), top());
            seg(bot(), rgt());
            break;
          case 10:
            seg(lft(), bot());
            seg(top(), rgt());
            break;
        }
      }
    }
  }
  ctx.stroke();
  ctx.restore();
}

/** A negative-gradient step arrow, in math coords, via raw ctx. */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  c: CoordinateSystem,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
): void {
  const [ax, ay] = c.toPx(x0, y0);
  const [bx, by] = c.toPx(x1, y1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  const ang = Math.atan2(by - ay, bx - ax),
    head = 8;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx - head * Math.cos(ang - 0.4), by - head * Math.sin(ang - 0.4));
  ctx.lineTo(bx - head * Math.cos(ang + 0.4), by - head * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
}

export function GradientDescent({
  equation = 'x^2 + 2*y^2',
  range = [-3, 3],
  start = [2.4, 1.8],
  learningRate = 0.1,
  title = 'Gradient descent',
  height = 360,
}: GradientDescentProps = {}): ReactNode {
  const [lo, hi] = normalizeRange(range, [-3, 3]);
  const safeRate = Number.isFinite(learningRate) ? clamp(learningRate, 0.01, 0.6) : 0.1;
  const [lr, setLr] = useState(safeRate);
  const initialStart: [number, number] = [
    valueInRange(start[0], [lo, hi], 2.4),
    valueInRange(start[1], [lo, hi], 1.8),
  ];
  const [start0, setStart0] = useState<[number, number]>(initialStart);
  const [path, setPath] = useState<[number, number][]>([start0]);
  const [running, setRunning] = useState(false);
  const [descentState, setDescentState] = useState<DescentState | 'ready' | 'max-steps'>('ready');
  const acc = useRef(0);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  // Resync from props so editing block attributes updates the visual.
  const sx = initialStart[0];
  const sy = initialStart[1];
  useEffect(() => {
    setStart0([sx, sy]);
    setPath([[sx, sy]]);
    setRunning(false);
    setDescentState('ready');
  }, [sx, sy]);
  useEffect(() => {
    setLr(safeRate);
  }, [safeRate]);

  const model = useMemo(() => {
    const res = compileExpr(equation);
    if (res.error || !res.ast) return { ok: false as const, error: res.error ?? 'Invalid expression' };
    const ast = res.ast;
    const f = (x: number, y: number): number => evaluate(ast, { x, y });
    const partial = (vn: 'x' | 'y'): ((x: number, y: number) => number) => {
      let node: Node | null = null;
      try {
        const d = differentiate(ast, vn);
        node = d ? simplify(d) : null;
      } catch {
        node = null;
      }
      if (node) return (x, y) => evaluate(node as Node, { x, y });
      const h = 1e-5; // numerical fallback (central difference)
      return (x, y) =>
        vn === 'x' ? (f(x + h, y) - f(x - h, y)) / (2 * h) : (f(x, y + h) - f(x, y - h)) / (2 * h);
    };
    const dxNode = (() => {
      try {
        const d = differentiate(ast, 'x');
        return d ? simplify(d) : null;
      } catch {
        return null;
      }
    })();
    const dyNode = (() => {
      try {
        const d = differentiate(ast, 'y');
        return d ? simplify(d) : null;
      } catch {
        return null;
      }
    })();
    return {
      ok: true as const,
      f,
      fx: partial('x'),
      fy: partial('y'),
      fLatex: toLatex(ast),
      dxLatex: dxNode ? toLatex(dxNode) : null,
      dyLatex: dyNode ? toLatex(dyNode) : null,
    };
  }, [equation]);

  const view = useMemo(() => ({ xMin: lo, xMax: hi, yMin: lo, yMax: hi }), [lo, hi]);
  const coordsOptions = useMemo(() => ({ pad: 8 }), []);
  const cur = path[path.length - 1] ?? start0;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, c: CoordinateSystem) => {
      if (!model.ok) return;
      const { f } = model;
      // Canvas can't read CSS var() in fillStyle, resolve the one themed token we use.
      // Guard getComputedStyle: in a non-DOM test env (jsdom canvas mock) ctx.canvas is not a
      // real Element, which would throw — fall back to the default accent there.
      const css = ctx.canvas instanceof Element ? getComputedStyle(ctx.canvas) : null;
      const accent = css?.getPropertyValue('--stage-accent').trim() || '#5b8cff';

      // sample f on a fine lattice (corners), find range
      const cell = 6;
      const cols = Math.ceil(c.width / cell) + 1;
      const rows = Math.ceil(c.height / cell) + 1;
      const vals = new Float64Array(cols * rows);
      let vmin = Infinity,
        vmax = -Infinity;
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const [mx, my] = c.toMath(col * cell, r * cell);
          const v = f(mx, my);
          vals[r * cols + col] = v;
          if (Number.isFinite(v)) {
            if (v < vmin) vmin = v;
            if (v > vmax) vmax = v;
          }
        }
      }
      const span = vmax - vmin || 1;

      // filled viridis heatmap
      for (let r = 0; r < rows - 1; r++) {
        for (let col = 0; col < cols - 1; col++) {
          const v = vals[r * cols + col]!;
          ctx.fillStyle = viridis(Number.isFinite(v) ? clamp((v - vmin) / span, 0, 1) : 0);
          ctx.fillRect(col * cell, r * cell, cell + 1, cell + 1);
        }
      }

      // topographic iso-loss contour lines
      const levels = Array.from({ length: 11 }, (_, i) => vmin + ((i + 1) / 12) * span);
      contours(ctx, vals, cols, rows, cell, levels, 'rgba(0,0,0,0.32)');

      // faint axes through the origin
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      const oy = c.toPx(0, 0)[1],
        ox = c.toPx(0, 0)[0];
      ctx.beginPath();
      ctx.moveTo(c.toPx(lo, 0)[0], oy);
      ctx.lineTo(c.toPx(hi, 0)[0], oy);
      ctx.moveTo(ox, c.toPx(0, lo)[1]);
      ctx.lineTo(ox, c.toPx(0, hi)[1]);
      ctx.stroke();
      ctx.restore();

      // descent path, dark halo + white core so it reads on any colour
      if (path.length > 1) {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        const trace = (): void => {
          ctx.beginPath();
          path.forEach((p, i) => {
            const [px, py] = c.toPx(p[0], p[1]);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
        };
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 4.5;
        trace();
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 2;
        trace();
      }
      for (const p of path) {
        const [px, py] = c.toPx(p[0], p[1]);
        ctx.beginPath();
        ctx.arc(px, py, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.stroke();
      }

      // negative-gradient (step) arrow, with a soft dark halo
      const [cxx, cyy] = cur;
      const gx = model.fx(cxx, cyy),
        gy = model.fy(cxx, cyy),
        gmag = Math.hypot(gx, gy);
      if (gmag > 1e-4) {
        const scale = Math.min(0.9, (0.9 * (hi - lo)) / 6 / gmag);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.65)';
        ctx.shadowBlur = 4;
        drawArrow(ctx, c, cxx, cyy, cxx - gx * scale, cyy - gy * scale, '#ffffff');
        ctx.restore();
      }
      // current point, white halo + accent core (a clear "ball")
      const [pcx, pcy] = c.toPx(cxx, cyy);
      ctx.beginPath();
      ctx.arc(pcx, pcy, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pcx, pcy, 5, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
    },
    [model, path, cur, lo, hi],
  );

  // animate descent steps (throttled so it's watchable)
  useFrameLoop(
    (frame) => {
      if (!model.ok) return;
      acc.current += frame.dtMs;
      if (acc.current < 90) return;
      acc.current = 0;
      setPath((prev) => {
        const last = prev[prev.length - 1];
        if (!last || prev.length > 250) {
          setRunning(false);
          setDescentState('max-steps');
          return prev;
        }
        const result = gradientStep(model, last, lr);
        setDescentState(result.state);
        if (result.state !== 'running') {
          setRunning(false);
          return prev;
        }
        return [...prev, result.point];
      });
    },
    { running: running && model.ok && inView },
  );

  const step = (): void => {
    if (!model.ok) return;
    setRunning(false);
    setPath((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      const result = gradientStep(model, last, lr);
      setDescentState(result.state);
      return result.state === 'running' ? [...prev, result.point] : prev;
    });
  };

  if (!model.ok)
    return (
      <MathExpressionError title={title ?? 'Gradient descent'} expression={equation} error={model.error} />
    );

  const figure = (
    <div ref={viewRef} className="lab-playwrap">
      <CanvasLayer
        view={view}
        height={height}
        coordsOptions={coordsOptions}
        draw={draw}
        onPointerMath={(m) => {
          setRunning(false);
          setDescentState('ready');
          const p: [number, number] = [clamp(m[0], lo, hi), clamp(m[1], lo, hi)];
          setStart0(p);
          setPath([p]);
        }}
        ariaLabel={`Gradient descent on f(x,y) = ${equation}; drag to set the start point`}
      />
    </div>
  );

  const controls = (
    <Field label="Learning rate" value={<strong>{lr.toFixed(2)}</strong>}>
      <Slider value={lr} min={0.01} max={0.6} step={0.01} onChange={setLr} ariaLabel="learning rate" />
    </Field>
  );

  const details = (
    <div className="math-equation-detail">
      <span className="math-equation-line">
        <span className="math-equation-label">f =</span> <Tex tex={model.fLatex} />
      </span>
      {model.dxLatex && <Tex tex={`\\frac{\\partial f}{\\partial x} = ${model.dxLatex}`} />}
      {model.dyLatex && <Tex tex={`\\frac{\\partial f}{\\partial y} = ${model.dyLatex}`} />}
    </div>
  );

  const loss = model.f(cur[0], cur[1]);
  const gradientMagnitude = Math.hypot(model.fx(cur[0], cur[1]), model.fy(cur[0], cur[1]));
  const reset = (): void => {
    setRunning(false);
    setDescentState('ready');
    setPath([start0]);
  };
  const stateLabel =
    descentState === 'converged'
      ? 'Minimum reached'
      : descentState === 'diverged'
        ? 'Rate diverged'
        : descentState === 'max-steps'
          ? 'Step limit reached'
          : running
            ? 'Descending'
            : path.length > 1
              ? 'Paused'
              : 'Ready';
  const transport = (
    <MathRunTransport
      running={running}
      onReset={reset}
      onStep={step}
      onToggle={() => setRunning((value) => !value)}
      state={stateLabel}
      detail={`${path.length - 1} steps · loss ${Number.isFinite(loss) ? loss.toFixed(4) : '—'}`}
      disabled={descentState === 'converged' || descentState === 'diverged'}
      resetLabel="Reset optimization"
      stepLabel="Take one gradient step"
    />
  );

  return (
    <MathActivity
      className="math-gradient-descent"
      eyebrow="Calculus · optimization"
      title={title}
      description="Place a starting point and follow −∇f downhill. Compare a stable learning rate with one that overshoots or diverges."
      status={
        <>
          <strong>{stateLabel}</strong>
          <span>x {cur[0].toFixed(2)}</span>
          <span>y {cur[1].toFixed(2)}</span>
          <span>step {path.length - 1}</span>
        </>
      }
      figure={figure}
      measurements={
        <>
          <div className="math-result-probe">
            <span>Current loss</span>
            <strong>{Number.isFinite(loss) ? loss.toFixed(4) : '—'}</strong>
            <small>
              gradient magnitude {Number.isFinite(gradientMagnitude) ? gradientMagnitude.toFixed(4) : '—'}
            </small>
          </div>
          <p className="math-explain">
            The gradient points uphill most steeply. Subtracting it moves downhill; the learning rate controls
            the step size.
          </p>
        </>
      }
      controls={controls}
      conclusion={
        descentState === 'converged'
          ? 'The gradient is nearly zero, so the optimizer has reached a stationary point.'
          : descentState === 'diverged'
            ? 'This learning rate produced an unsafe step. Reset and reduce it.'
            : 'Run or step to observe how the loss and gradient shrink along the path.'
      }
      transport={transport}
      details={details}
      graphLabel="Loss heatmap with gradient descent path"
      inspectorLabel="Optimizer state"
    />
  );
}
