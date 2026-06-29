/**
 * @classytic/labs/blocks, math lab block specs.
 *
 * `defineBlock` editor adapters for the math labs (one domain per file; the
 * registry is assembled in `./index.ts`). Each spec pairs a zod schema with a
 * render `Component` that, in `mode === 'editing'`, shows the authoring kit
 * (`./authoring`). `@classytic/cms-ui` + `zod` are optional peers touched only
 * by the blocks layer.
 */

import type { ReactNode } from 'react';
import { z } from 'zod';
import { defineBlock } from '@classytic/cms-ui/contract';
import { ConfigPanel, ConfigRow, ChipToggle, TextField, NumField, SmallButton, SelectField } from './authoring.js';
import { labBlock } from './lab-block.js';
import { listScenes } from '../kit/scenes.js';
import { listClueScenes } from '../kit/clue-scene.js';
import { registerDataScene, type DataSceneSpec } from '../kit/data-scene.js';
import { SceneStudio } from '../kit/scene-studio.js';
// CMS registry: authoring pickers read the live scene registries, so any registerScene/
// registerClueScene a project adds shows up in the dropdowns with no block edits.
const levelSceneOptions = (): string[] => ['none', ...listScenes('level').map((s) => s.name)];
const countSceneOptions = (): string[] => listScenes('count').map((s) => s.name);
const clueSceneOptions = (): string[] => listClueScenes().map((s) => s.name);
import { TrigExplorer, Grapher, DerivativeExplorer, GradientDescent, IntegralExplorer, LimitExplorer, MysteryBucketLab, BalanceAlgebraLab, VertexParabolaLab, AreaModelLab, GrowingPatternLab, FunctionMachineLab, LinearSystemLab, NumberLineLab, Derivation, InteractiveProblem, TriangleTrig, StraightLineLab, CircleLab, ConicLab, DomainRangeLab, LinearModelLab, RateMachineLab, SequencePredict, PercentBarLab, FractionBarLab, RatioShareLab, ComplexPlaneLab, TrigSignsLab, PolynomialSolverLab, TransformLab, ReceiptLab, SystemSolveLab, TRIG_FNS, type TrigFn, type GraphParam, type Derived, type ProblemAsk, type TriangleTrigProps, type StraightLineProps, type CircleProps, type ConicProps, type DomainRangeProps, type LinearModelProps, type SequencePredictProps, type Transform, type ReflectAxis, type ReceiptProps } from '../math/index.js';

const resolveFns = (raw: unknown): TrigFn[] =>
  Array.isArray(raw) && raw.length ? (raw as TrigFn[]) : ['sin', 'cos'];

// ── block specs ─────────────────────────────────────────────────────────────

export const TrigExplorerBlock = defineBlock({
  key: 'trig-explorer',
  void: true,
  label: 'Trig explorer',
  description: 'Unit circle ↔ wave, drag the angle; sin & cos trace out. (tan/cot: use Graph)',
  category: 'interactive',
  schema: z.object({
    functions: z.array(z.enum(['sin', 'cos'])).optional(),
    startDeg: z.number().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const fns = resolveFns(attributes.functions);
    const widget = <TrigExplorer functions={fns} startDeg={attributes.startDeg} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const toggle = (fn: TrigFn): void => {
      const next = fns.includes(fn) ? fns.filter((f) => f !== fn) : [...fns, fn];
      updateAttributes({ functions: next.length ? next : fns });
    };
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Functions">
            {TRIG_FNS.map((fn) => (
              <ChipToggle key={fn} active={fns.includes(fn)} onClick={() => toggle(fn)}>
                {fn}
              </ChipToggle>
            ))}
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

// The headline creator tool: type equations + sliders, plot anything.
const equationSchema = z.union([z.string(), z.object({ expr: z.string(), color: z.string().optional() })]);
const paramSchema = z.object({
  name: z.string(),
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  value: z.number(),
});

const asExprStrings = (raw: unknown): string[] => {
  if (typeof raw === 'string') return [raw];
  if (Array.isArray(raw)) return raw.map((e) => (typeof e === 'string' ? e : String((e as { expr?: string })?.expr ?? '')));
  return ['sin(x)'];
};
const asParams = (raw: unknown): GraphParam[] => (Array.isArray(raw) ? (raw as GraphParam[]) : []);

export const GraphBlock = defineBlock({
  key: 'graph',
  void: true,
  label: 'Graph (equation)',
  description: 'Plot equations you type, y = a·sin(b·x), x^2, … with learner sliders.',
  category: 'interactive',
  schema: z.object({
    equations: z.array(equationSchema).optional(),
    params: z.array(paramSchema).optional(),
    xRange: z.tuple([z.number(), z.number()]).optional(),
    yScale: z.enum(['linear', 'log']).optional(),
    title: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const equations = asExprStrings(attributes.equations);
    const params = asParams(attributes.params);
    const xRange = (attributes.xRange as [number, number] | undefined) ?? [-6.5, 6.5];
    const yScale = attributes.yScale === 'log' ? 'log' : 'linear';
    const title = attributes.title ?? 'Graph';
    const widget = <Grapher equations={equations} params={params} xRange={xRange} yScale={yScale} title={title} />;
    if (mode !== 'editing' || !updateAttributes) return widget;

    const setEq = (i: number, v: string): void => {
      const next = [...equations];
      next[i] = v;
      updateAttributes({ equations: next });
    };
    const setParam = (i: number, patch: Partial<GraphParam>): void => {
      const next = params.map((p, j) => (j === i ? { ...p, ...patch } : p));
      updateAttributes({ params: next });
    };
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title">
            <TextField value={title} onChange={(v) => updateAttributes({ title: v })} className="flex-1" />
          </ConfigRow>

          <div className="space-y-1.5">
            <span className="font-medium text-muted-foreground">Equations (use x and your slider names)</span>
            {equations.map((eq, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">y =</span>
                <TextField value={eq} mono placeholder="a*sin(b*x) + c" onChange={(v) => setEq(i, v)} className="flex-1" />
                {equations.length > 1 && (
                  <SmallButton tone="danger" onClick={() => updateAttributes({ equations: equations.filter((_, j) => j !== i) })}>✕</SmallButton>
                )}
              </div>
            ))}
            <SmallButton onClick={() => updateAttributes({ equations: [...equations, ''] })}>+ equation</SmallButton>
          </div>

          <div className="space-y-1.5">
            <span className="font-medium text-muted-foreground">Sliders (learner-draggable)</span>
            {params.map((p, i) => (
              <div key={i} className="flex flex-wrap items-center gap-1.5">
                <TextField value={p.name} mono placeholder="a" onChange={(v) => setParam(i, { name: v })} className="w-14" />
                <span className="text-muted-foreground">from</span>
                <NumField value={p.min} onChange={(v) => setParam(i, { min: v })} />
                <span className="text-muted-foreground">to</span>
                <NumField value={p.max} onChange={(v) => setParam(i, { max: v })} />
                <span className="text-muted-foreground">=</span>
                <NumField value={p.value} onChange={(v) => setParam(i, { value: v })} />
                <SmallButton tone="danger" onClick={() => updateAttributes({ params: params.filter((_, j) => j !== i) })}>✕</SmallButton>
              </div>
            ))}
            <SmallButton onClick={() => updateAttributes({ params: [...params, { name: nextParamName(params), min: 0, max: 3, value: 1, step: 0.1 }] })}>
              + slider
            </SmallButton>
          </div>

          <ConfigRow label="x window">
            <NumField value={xRange[0]} onChange={(v) => updateAttributes({ xRange: [v, xRange[1]] })} />
            <span className="text-muted-foreground">to</span>
            <NumField value={xRange[1]} onChange={(v) => updateAttributes({ xRange: [xRange[0], v] })} />
          </ConfigRow>
          <ConfigRow label="y scale">
            <ChipToggle active={yScale !== 'log'} onClick={() => updateAttributes({ yScale: 'linear' })}>linear</ChipToggle>
            <ChipToggle active={yScale === 'log'} onClick={() => updateAttributes({ yScale: 'log' })}>log</ChipToggle>
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const DerivativeExplorerBlock = defineBlock({
  key: 'derivative-explorer',
  void: true,
  label: 'Derivative explorer',
  description: 'Drag a point; the secant becomes the exact tangent. Shows f′(x).',
  category: 'interactive',
  schema: z.object({
    equation: z.string().optional(),
    xRange: z.tuple([z.number(), z.number()]).optional(),
    startX: z.number().optional(),
    title: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const equation = typeof attributes.equation === 'string' && attributes.equation.trim() ? attributes.equation : '0.15*x^3 - x';
    const xRange = (attributes.xRange as [number, number] | undefined) ?? [-4, 4];
    const title = attributes.title ?? 'The derivative is a slope';
    const widget = <DerivativeExplorer equation={equation} xRange={xRange} startX={attributes.startX} title={title} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title">
            <TextField value={title} onChange={(v) => updateAttributes({ title: v })} className="flex-1" />
          </ConfigRow>
          <ConfigRow label="f(x) =">
            <TextField value={equation} mono placeholder="0.15*x^3 - x" onChange={(v) => updateAttributes({ equation: v })} className="flex-1" />
          </ConfigRow>
          <ConfigRow label="x window">
            <NumField value={xRange[0]} onChange={(v) => updateAttributes({ xRange: [v, xRange[1]] })} />
            <span className="text-muted-foreground">to</span>
            <NumField value={xRange[1]} onChange={(v) => updateAttributes({ xRange: [xRange[0], v] })} />
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const GradientDescentBlock = defineBlock({
  key: 'gradient-descent',
  void: true,
  label: 'Gradient descent',
  description: 'Walk downhill on a loss surface f(x,y) using exact ∂f/∂x, ∂f/∂y, the calculus behind ML.',
  category: 'interactive',
  schema: z.object({
    equation: z.string().optional(),
    range: z.tuple([z.number(), z.number()]).optional(),
    learningRate: z.number().optional(),
    title: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const equation = typeof attributes.equation === 'string' && attributes.equation.trim() ? attributes.equation : 'x^2 + 2*y^2';
    const range = (attributes.range as [number, number] | undefined) ?? [-3, 3];
    const title = attributes.title ?? 'Gradient descent';
    const widget = <GradientDescent equation={equation} range={range} learningRate={attributes.learningRate} title={title} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title">
            <TextField value={title} onChange={(v) => updateAttributes({ title: v })} className="flex-1" />
          </ConfigRow>
          <ConfigRow label="f(x,y) =">
            <TextField value={equation} mono placeholder="x^2 + 2*y^2" onChange={(v) => updateAttributes({ equation: v })} className="flex-1" />
          </ConfigRow>
          <ConfigRow label="region">
            <NumField value={range[0]} onChange={(v) => updateAttributes({ range: [v, range[1]] })} />
            <span className="text-muted-foreground">to</span>
            <NumField value={range[1]} onChange={(v) => updateAttributes({ range: [range[0], v] })} />
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const IntegralExplorerBlock = defineBlock({
  key: 'integral-explorer',
  void: true,
  label: 'Integral explorer',
  description: 'Area under a curve via Riemann rectangles, drag endpoints, add n, converge.',
  category: 'interactive',
  schema: z.object({
    equation: z.string().optional(),
    xRange: z.tuple([z.number(), z.number()]).optional(),
    a: z.number().optional(),
    b: z.number().optional(),
    n: z.number().optional(),
    title: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const equation = typeof attributes.equation === 'string' && attributes.equation.trim() ? attributes.equation : '0.4*x^2 + 0.5';
    const xRange = (attributes.xRange as [number, number] | undefined) ?? [-1, 4];
    const title = attributes.title ?? 'The integral is an area';
    const widget = <IntegralExplorer equation={equation} xRange={xRange} a={attributes.a} b={attributes.b} n={attributes.n} title={title} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={title} onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="f(x) ="><TextField value={equation} mono placeholder="0.4*x^2 + 0.5" onChange={(v) => updateAttributes({ equation: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="x window">
            <NumField value={xRange[0]} onChange={(v) => updateAttributes({ xRange: [v, xRange[1]] })} />
            <span className="text-muted-foreground">to</span>
            <NumField value={xRange[1]} onChange={(v) => updateAttributes({ xRange: [xRange[0], v] })} />
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const LimitExplorerBlock = defineBlock({
  key: 'limit-explorer',
  void: true,
  label: 'Limit explorer',
  description: 'Approach x → c from both sides; see the limit even where f(c) is a hole.',
  category: 'interactive',
  schema: z.object({
    equation: z.string().optional(),
    xRange: z.tuple([z.number(), z.number()]).optional(),
    c: z.number().optional(),
    title: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const equation = typeof attributes.equation === 'string' && attributes.equation.trim() ? attributes.equation : '(x^2 - 1)/(x - 1)';
    const xRange = (attributes.xRange as [number, number] | undefined) ?? [-1, 3];
    const title = attributes.title ?? 'Approaching a limit';
    const widget = <LimitExplorer equation={equation} xRange={xRange} c={attributes.c} title={title} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={title} onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="f(x) ="><TextField value={equation} mono placeholder="(x^2 - 1)/(x - 1)" onChange={(v) => updateAttributes({ equation: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="x window">
            <NumField value={xRange[0]} onChange={(v) => updateAttributes({ xRange: [v, xRange[1]] })} />
            <span className="text-muted-foreground">to</span>
            <NumField value={xRange[1]} onChange={(v) => updateAttributes({ xRange: [xRange[0], v] })} />
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

const derivationStepSchema = z.union([z.string(), z.object({ tex: z.string(), note: z.string().optional() })]);
const asSteps = (raw: unknown): Array<{ tex: string; note?: string }> => {
  if (!Array.isArray(raw)) return [{ tex: 'a^2 + b^2 = c^2' }];
  const out = raw.map((s) => (typeof s === 'string' ? { tex: s } : (s as { tex?: string; note?: string })))
    .filter((s): s is { tex: string; note?: string } => !!s && typeof s.tex === 'string');
  return out.length ? out : [{ tex: 'a^2 + b^2 = c^2' }];
};

export const DerivationBlock = defineBlock({
  key: 'derivation',
  void: true,
  label: 'Derivation (steps)',
  description: 'A step-by-step equation derivation in LaTeX, revealed one line at a time.',
  category: 'interactive',
  schema: z.object({ steps: z.array(derivationStepSchema).optional(), title: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const steps = asSteps(attributes.steps);
    const title = attributes.title ?? 'Derivation';
    const widget = <Derivation steps={steps} title={title} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const setStep = (i: number, patch: Partial<{ tex: string; note: string }>): void =>
      updateAttributes({ steps: steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={title} onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <div className="space-y-1.5">
            <span className="font-medium text-muted-foreground">Steps (LaTeX + optional note)</span>
            {steps.map((s, i) => (
              <div key={i} className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-muted-foreground">{i + 1}</span>
                <TextField value={s.tex} mono placeholder="\\frac{y-y_P}{x-x_P} = ..." onChange={(v) => setStep(i, { tex: v })} className="min-w-[12rem] flex-1" />
                <TextField value={s.note ?? ''} placeholder="why…" onChange={(v) => setStep(i, { note: v })} className="w-32" />
                {steps.length > 1 && <SmallButton tone="danger" onClick={() => updateAttributes({ steps: steps.filter((_, j) => j !== i) })}>✕</SmallButton>}
              </div>
            ))}
            <SmallButton onClick={() => updateAttributes({ steps: [...steps, { tex: '' }] })}>+ step</SmallButton>
          </div>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

function nextParamName(params: GraphParam[]): string {
  const used = new Set(params.map((p) => p.name));
  for (const n of ['a', 'b', 'c', 'd', 'k', 'm', 'n', 'p', 'q']) if (!used.has(n)) return n;
  return `p${params.length + 1}`;
}

/** System-of-equations render: two clue lines (slope-intercept) from scalar
 *  props, so the editor form + MDX stay simple number fields. */
export function LinearSystemView({ m1 = 1, b1 = 1, m2 = -1, b2 = 5 }: { m1?: number; b1?: number; m2?: number; b2?: number }): ReactNode {
  return <LinearSystemLab lines={[{ m: m1, b: b1, label: 'clue A' }, { m: m2, b: b2, label: 'clue B' }]} />;
}

export const LinearSystemBlock = defineBlock({
  key: 'linear-system',
  tag: 'LinearSystem',
  void: true,
  label: 'System of equations (x & y)',
  description: 'Two clue lines on a grid, drag to the crossing point that obeys both. The advanced "find x and y" lab.',
  category: 'interactive',
  schema: z.object({ m1: z.number().default(1), b1: z.number().default(1), m2: z.number().default(-1), b2: z.number().default(5) }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const { m1 = 1, b1 = 1, m2 = -1, b2 = 5 } = attributes;
    const widget = <LinearSystemView m1={m1} b1={b1} m2={m2} b2={b2} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="clue A: y ="><NumField value={m1} onChange={(v) => updateAttributes({ m1: v })} /><span className="text-muted-foreground">x +</span><NumField value={b1} onChange={(v) => updateAttributes({ b1: v })} /></ConfigRow>
          <ConfigRow label="clue B: y ="><NumField value={m2} onChange={(v) => updateAttributes({ m2: v })} /><span className="text-muted-foreground">x +</span><NumField value={b2} onChange={(v) => updateAttributes({ b2: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const NumberLineBlock = defineBlock({
  key: 'number-line',
  tag: 'NumberLine',
  void: true,
  label: 'Number line',
  description: 'A draggable marker on a number line (incl. below zero), optionally pose a target to land on.',
  category: 'interactive',
  schema: z.object({ min: z.number().default(-8), max: z.number().default(8), start: z.number().default(0), target: z.number().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const { min = -8, max = 8, start = 0, target } = attributes;
    const widget = <NumberLineLab min={min} max={max} start={start} target={target} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="from"><NumField value={min} onChange={(v) => updateAttributes({ min: v })} /></ConfigRow>
          <ConfigRow label="to"><NumField value={max} onChange={(v) => updateAttributes({ max: v })} /></ConfigRow>
          <ConfigRow label="start"><NumField value={start} onChange={(v) => updateAttributes({ start: v })} /></ConfigRow>
          <ConfigRow label="target"><NumField value={target ?? 0} onChange={(v) => updateAttributes({ target: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const MysteryBucketBlock = defineBlock({
  key: 'mystery-bucket',
  tag: 'MysteryBucket',
  void: true,
  label: 'Mystery bucket (weigh the unknown)',
  description: 'Essentials opener, add unit weights until a balance is level to discover the hidden weight. No symbols.',
  category: 'interactive',
  schema: z.object({ bucketWeight: z.number().default(5), bucketCount: z.number().default(1), maxWeights: z.number().default(12), start: z.number().default(0) }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const { bucketWeight = 5, bucketCount = 1, maxWeights = 12, start = 0 } = attributes;
    const widget = <MysteryBucketLab bucketWeight={bucketWeight} bucketCount={bucketCount} maxWeights={maxWeights} start={start} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="weight each"><NumField value={bucketWeight} onChange={(v) => updateAttributes({ bucketWeight: v })} /></ConfigRow>
          <ConfigRow label="buckets"><NumField value={bucketCount} onChange={(v) => updateAttributes({ bucketCount: v })} /></ConfigRow>
          <ConfigRow label="max weights"><NumField value={maxWeights} onChange={(v) => updateAttributes({ maxWeights: v })} /></ConfigRow>
          <ConfigRow label="start at"><NumField value={start} onChange={(v) => updateAttributes({ start: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const BalanceAlgebraBlock = defineBlock({
  key: 'balance-algebra',
  tag: 'BalanceAlgebra',
  void: true,
  label: 'Balance scale (algebra)',
  description: 'Drag x to balance a·x + b = c, learners solve a linear equation by balancing the scale.',
  category: 'interactive',
  schema: z.object({ coef: z.number().default(2), addend: z.number().default(1), rhs: z.number().default(7), answer: z.number().default(3), controlId: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const { coef = 2, addend = 1, rhs = 7, answer = 3 } = attributes;
    const widget = <BalanceAlgebraLab coef={coef} addend={addend} rhs={rhs} answer={answer} controlId={attributes.controlId} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="coefficient a"><NumField value={coef} onChange={(v) => updateAttributes({ coef: v })} /></ConfigRow>
          <ConfigRow label="addend b"><NumField value={addend} onChange={(v) => updateAttributes({ addend: v })} /></ConfigRow>
          <ConfigRow label="right side c"><NumField value={rhs} onChange={(v) => updateAttributes({ rhs: v })} /></ConfigRow>
          <ConfigRow label="answer x"><NumField value={answer} onChange={(v) => updateAttributes({ answer: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const VertexParabolaBlock = defineBlock({
  key: 'vertex-parabola',
  tag: 'VertexParabola',
  void: true,
  label: 'Parabola (drag the vertex)',
  description: 'Drag the vertex of y = a(x−h)² + k; the curve + equation update live.',
  category: 'interactive',
  schema: z.object({ a: z.number().default(1) }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const { a = 1 } = attributes;
    const widget = <VertexParabolaLab a={a} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return <div><ConfigPanel><ConfigRow label="stretch a"><NumField value={a} onChange={(v) => updateAttributes({ a: v })} /></ConfigRow></ConfigPanel>{widget}</div>;
  },
});

export const AreaModelBlock = defineBlock({
  key: 'area-model',
  tag: 'AreaModel',
  void: true,
  label: 'Area model (algebra tiles)',
  description: '(x+a)(x+b) as a partitioned rectangle, EXPAND (drag x) or FACTOR (find a, b).',
  category: 'interactive',
  schema: z.object({ a: z.number().default(3), b: z.number().default(2), mode: z.enum(['expand', 'factor']).default('expand'), controlId: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const { a = 3, b = 2, mode: m = 'expand' } = attributes;
    const widget = <AreaModelLab a={a} b={b} mode={m} controlId={attributes.controlId} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="a in (x+a)"><NumField value={a} onChange={(v) => updateAttributes({ a: v })} /></ConfigRow>
          <ConfigRow label="b in (x+b)"><NumField value={b} onChange={(v) => updateAttributes({ b: v })} /></ConfigRow>
          <ConfigRow label="mode">
            <ChipToggle active={m !== 'factor'} onClick={() => updateAttributes({ mode: 'expand' })}>expand</ChipToggle>
            <ChipToggle active={m === 'factor'} onClick={() => updateAttributes({ mode: 'factor' })}>factor</ChipToggle>
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const GrowingPatternBlock = defineBlock({
  key: 'growing-pattern',
  tag: 'GrowingPattern',
  void: true,
  label: 'Pattern → formula',
  description: 'A figure grows by a·n + b; learners find the rule (hidden predict row forces extrapolation).',
  category: 'interactive',
  schema: z.object({ a: z.number().default(2), b: z.number().default(3), steps: z.number().default(4), controlId: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const { a = 2, b = 3, steps = 4 } = attributes;
    const widget = <GrowingPatternLab a={a} b={b} steps={steps} controlId={attributes.controlId} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="per step a"><NumField value={a} onChange={(v) => updateAttributes({ a: v })} /></ConfigRow>
          <ConfigRow label="constant b"><NumField value={b} onChange={(v) => updateAttributes({ b: v })} /></ConfigRow>
          <ConfigRow label="figures shown"><NumField value={steps} onChange={(v) => updateAttributes({ steps: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

// ── interactive-problem ENGINE + representations: authored as blocks ──────────

const answerSchema = z.union([
  z.object({ kind: z.literal('number'), value: z.number(), tol: z.number().optional() }),
  z.object({ kind: z.literal('expression'), value: z.string() }),
]);
const askSchema = z.object({ prompt: z.string(), answer: answerSchema, placeholder: z.string().optional() });
const deriveSchema = z.object({
  kind: z.enum(['intersections', 'roots', 'tangent', 'normal', 'area']),
  of: z.union([z.number(), z.tuple([z.number(), z.number()])]).optional(),
  at: z.union([z.number(), z.string()]).optional(),
  between: z.tuple([z.number(), z.number()]).optional(),
  from: z.union([z.number(), z.string()]).optional(),
  to: z.union([z.number(), z.string()]).optional(),
  label: z.string().optional(),
});

const DERIVE_KINDS = ['intersections', 'roots', 'tangent', 'normal', 'area'];
type AskShape = { prompt: string; answer: { kind: 'number' | 'expression'; value: number | string; tol?: number }; placeholder?: string };

/** Shared "ask + check" authoring row, used by the engine and representation blocks. */
function AskEditor({ ask, onChange }: { ask: AskShape | undefined; onChange: (a: AskShape | undefined) => void }): ReactNode {
  if (!ask) return <SmallButton onClick={() => onChange({ prompt: '', answer: { kind: 'number', value: 0 } })}>+ question (checked answer)</SmallButton>;
  const isNum = ask.answer.kind === 'number';
  const setAns = (patch: Partial<AskShape['answer']>): void => onChange({ ...ask, answer: { ...ask.answer, ...patch } });
  return (
    <div className="space-y-1.5">
      <span className="font-medium text-muted-foreground">Question (graded)</span>
      <ConfigRow label="Prompt"><TextField value={ask.prompt} onChange={(v) => onChange({ ...ask, prompt: v })} className="flex-1" /></ConfigRow>
      <ConfigRow label="Answer is">
        <ChipToggle active={isNum} onClick={() => setAns({ kind: 'number', value: typeof ask.answer.value === 'number' ? ask.answer.value : 0 })}>a number</ChipToggle>
        <ChipToggle active={!isNum} onClick={() => setAns({ kind: 'expression', value: String(ask.answer.value ?? '') })}>an expression</ChipToggle>
      </ConfigRow>
      <ConfigRow label="Correct value">
        {isNum
          ? <NumField value={Number(ask.answer.value) || 0} onChange={(v) => setAns({ value: v })} />
          : <TextField value={String(ask.answer.value ?? '')} mono placeholder="6*x - 9" onChange={(v) => setAns({ value: v })} className="flex-1" />}
        {isNum && <><span className="text-muted-foreground">± tol</span><NumField value={ask.answer.tol ?? 0.01} onChange={(v) => setAns({ tol: v })} /></>}
        <SmallButton tone="danger" onClick={() => onChange(undefined)}>remove</SmallButton>
      </ConfigRow>
    </div>
  );
}

// ── lab question: typed OR multiple choice (used by the coordinate-geometry blocks) ──
const labChoiceSchema = z.object({ value: z.string(), label: z.string() });
const labAskSchema = z.object({
  prompt: z.string(),
  placeholder: z.string().optional(),
  answer: answerSchema.optional(),
  choices: z.array(labChoiceSchema).optional(),
  correct: z.string().optional(),
  explain: z.string().optional(),
});
type LabAskShape = { prompt: string; placeholder?: string; answer?: { kind: 'number' | 'expression'; value: number | string; tol?: number }; choices?: { value: string; label: string }[]; correct?: string; explain?: string };
const CHOICE_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];

/** Author a graded question as a typed answer (number/expression) OR multiple choice. */
function LabAskEditor({ ask, onChange }: { ask: LabAskShape | undefined; onChange: (a: LabAskShape | undefined) => void }): ReactNode {
  if (!ask) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <SmallButton onClick={() => onChange({ prompt: '', answer: { kind: 'number', value: 0 } })}>+ typed question</SmallButton>
        <SmallButton onClick={() => onChange({ prompt: '', choices: [{ value: 'a', label: '' }, { value: 'b', label: '' }], correct: 'a' })}>+ multiple choice</SmallButton>
      </div>
    );
  }
  const isMcq = Array.isArray(ask.choices);
  const isNum = ask.answer?.kind !== 'expression';
  const setAns = (patch: Partial<NonNullable<LabAskShape['answer']>>): void => onChange({ ...ask, answer: { ...(ask.answer ?? { kind: 'number', value: 0 }), ...patch } });
  const choices = ask.choices ?? [];
  const setChoice = (i: number, patch: Partial<{ value: string; label: string }>): void => onChange({ ...ask, choices: choices.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-medium text-muted-foreground">Question (graded)</span>
        <div className="flex gap-1.5">
          <ChipToggle active={!isMcq} onClick={() => onChange({ prompt: ask.prompt, placeholder: ask.placeholder, answer: ask.answer ?? { kind: 'number', value: 0 } })}>typed</ChipToggle>
          <ChipToggle active={isMcq} onClick={() => onChange({ prompt: ask.prompt, choices: choices.length ? choices : [{ value: 'a', label: '' }, { value: 'b', label: '' }], correct: ask.correct ?? 'a' })}>multiple choice</ChipToggle>
          <SmallButton tone="danger" onClick={() => onChange(undefined)}>remove</SmallButton>
        </div>
      </div>
      <ConfigRow label="Prompt"><TextField value={ask.prompt} onChange={(v) => onChange({ ...ask, prompt: v })} className="flex-1" /></ConfigRow>
      {isMcq ? (
        <div className="space-y-1.5">
          <span className="text-muted-foreground">Options (tap ✓ to mark the correct one)</span>
          {choices.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <ChipToggle active={ask.correct === c.value} onClick={() => onChange({ ...ask, correct: c.value })}>✓</ChipToggle>
              <TextField value={c.label} placeholder={`option ${c.value}`} onChange={(v) => setChoice(i, { label: v })} className="flex-1" />
              {choices.length > 2 && <SmallButton tone="danger" onClick={() => onChange({ ...ask, choices: choices.filter((_, j) => j !== i) })}>✕</SmallButton>}
            </div>
          ))}
          <div className="flex flex-wrap gap-1.5">
            <SmallButton onClick={() => { const v = CHOICE_LETTERS[choices.length] ?? String(choices.length); onChange({ ...ask, choices: [...choices, { value: v, label: '' }] }); }}>+ option</SmallButton>
          </div>
          <ConfigRow label="Explain"><TextField value={ask.explain ?? ''} placeholder="shown when correct" onChange={(v) => onChange({ ...ask, explain: v })} className="flex-1" /></ConfigRow>
        </div>
      ) : (
        <>
          <ConfigRow label="Answer is">
            <ChipToggle active={isNum} onClick={() => setAns({ kind: 'number', value: typeof ask.answer?.value === 'number' ? ask.answer.value : 0 })}>a number</ChipToggle>
            <ChipToggle active={!isNum} onClick={() => setAns({ kind: 'expression', value: String(ask.answer?.value ?? '') })}>an expression</ChipToggle>
          </ConfigRow>
          <ConfigRow label="Correct value">
            {isNum
              ? <NumField value={Number(ask.answer?.value) || 0} onChange={(v) => setAns({ value: v })} />
              : <TextField value={String(ask.answer?.value ?? '')} mono placeholder="-0.5*x + 5" onChange={(v) => setAns({ value: v })} className="flex-1" />}
            {isNum && <><span className="text-muted-foreground">± tol</span><NumField value={ask.answer?.tol ?? 0.01} onChange={(v) => setAns({ tol: v })} /></>}
          </ConfigRow>
          <ConfigRow label="Hint"><TextField value={ask.placeholder ?? ''} placeholder="placeholder e.g. y = ..." onChange={(v) => onChange({ ...ask, placeholder: v })} className="flex-1" /></ConfigRow>
        </>
      )}
    </div>
  );
}

export const InteractiveProblemBlock = defineBlock({
  key: 'interactive-problem',
  void: true,
  label: 'Interactive problem (engine)',
  description: 'Author equations + sliders, derive roots/intersections/tangent/normal/area, and grade a typed answer, no code.',
  category: 'interactive',
  schema: z.object({
    equations: z.array(equationSchema).optional(),
    params: z.array(paramSchema).optional(),
    xRange: z.tuple([z.number(), z.number()]).optional(),
    yRange: z.union([z.tuple([z.number(), z.number()]), z.literal('auto')]).optional(),
    derive: z.array(deriveSchema).optional(),
    ask: askSchema.optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const equations = asExprStrings(attributes.equations);
    const params = asParams(attributes.params);
    const xRange = (attributes.xRange as [number, number] | undefined) ?? [-6.5, 6.5];
    const yRange = (attributes.yRange as [number, number] | 'auto' | undefined) ?? 'auto';
    const derive = (Array.isArray(attributes.derive) ? attributes.derive : []) as Array<Record<string, unknown>>;
    const ask = attributes.ask as AskShape | undefined;
    const widget = <InteractiveProblem equations={equations} params={params} xRange={xRange} yRange={yRange} derive={derive as unknown as Derived[]} ask={ask as unknown as ProblemAsk} title={attributes.title ?? 'Interactive problem'} prompt={attributes.prompt} activity={attributes.activity ?? 'interactive-problem'} />;
    if (mode !== 'editing' || !updateAttributes) return widget;

    const upd = updateAttributes as (p: Record<string, unknown>) => void;   // loose writes for derive/ask (schema validates on load)
    const setEq = (i: number, v: string): void => updateAttributes({ equations: equations.map((e, j) => (j === i ? v : e)) });
    const setParam = (i: number, patch: Partial<GraphParam>): void => updateAttributes({ params: params.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
    const setDerive = (i: number, patch: Record<string, unknown>): void => upd({ derive: derive.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={attributes.title ?? ''} placeholder="Interactive problem" onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="Prompt"><TextField value={attributes.prompt ?? ''} placeholder="what the learner does" onChange={(v) => updateAttributes({ prompt: v })} className="flex-1" /></ConfigRow>

          <div className="space-y-1.5">
            <span className="font-medium text-muted-foreground">Equations (use x and your slider names)</span>
            {equations.map((eq, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">{i}: y =</span>
                <TextField value={eq} mono placeholder="abs(p*x - q)" onChange={(v) => setEq(i, v)} className="flex-1" />
                {equations.length > 1 && <SmallButton tone="danger" onClick={() => updateAttributes({ equations: equations.filter((_, j) => j !== i) })}>✕</SmallButton>}
              </div>
            ))}
            <SmallButton onClick={() => updateAttributes({ equations: [...equations, ''] })}>+ equation</SmallButton>
          </div>

          <div className="space-y-1.5">
            <span className="font-medium text-muted-foreground">Sliders (learner-draggable)</span>
            {params.map((p, i) => (
              <div key={i} className="flex flex-wrap items-center gap-1.5">
                <TextField value={p.name} mono placeholder="k" onChange={(v) => setParam(i, { name: v })} className="w-14" />
                <span className="text-muted-foreground">from</span><NumField value={p.min} onChange={(v) => setParam(i, { min: v })} />
                <span className="text-muted-foreground">to</span><NumField value={p.max} onChange={(v) => setParam(i, { max: v })} />
                <span className="text-muted-foreground">=</span><NumField value={p.value} onChange={(v) => setParam(i, { value: v })} />
                <SmallButton tone="danger" onClick={() => updateAttributes({ params: params.filter((_, j) => j !== i) })}>✕</SmallButton>
              </div>
            ))}
            <SmallButton onClick={() => updateAttributes({ params: [...params, { name: nextParamName(params), min: 0, max: 10, value: 1, step: 1 }] })}>+ slider</SmallButton>
          </div>

          <div className="space-y-1.5">
            <span className="font-medium text-muted-foreground">Derive (computed + drawn live)</span>
            {derive.map((d, i) => {
              const kind = String(d.kind ?? 'intersections');
              const ofA = Array.isArray(d.of) ? Number(d.of[0]) : Number(d.of ?? 0);
              const ofB = Array.isArray(d.of) ? Number(d.of[1] ?? 1) : 1;
              return (
                <div key={i} className="flex flex-wrap items-center gap-1.5">
                  <SelectField value={kind} options={DERIVE_KINDS} onChange={(v) => setDerive(i, { kind: v })} />
                  {(kind === 'intersections') && (<><span className="text-muted-foreground">of eq</span><NumField value={ofA} onChange={(v) => setDerive(i, { of: [v, ofB] })} /><span className="text-muted-foreground">&</span><NumField value={ofB} onChange={(v) => setDerive(i, { of: [ofA, v] })} /></>)}
                  {(kind === 'roots') && (<><span className="text-muted-foreground">of eq</span><NumField value={Number(d.of ?? 0)} onChange={(v) => setDerive(i, { of: v })} /></>)}
                  {(kind === 'tangent' || kind === 'normal') && (<><span className="text-muted-foreground">of eq</span><NumField value={Number(d.of ?? 0)} onChange={(v) => setDerive(i, { of: v })} /><span className="text-muted-foreground">at x</span><TextField value={String(d.at ?? '')} mono placeholder="2 or a param" onChange={(v) => setDerive(i, { at: /^-?\d*\.?\d+$/.test(v) ? Number(v) : v })} className="w-20" /></>)}
                  {(kind === 'area') && (<><span className="text-muted-foreground">eqs</span><NumField value={Array.isArray(d.between) ? Number(d.between[0]) : 0} onChange={(v) => setDerive(i, { between: [v, Array.isArray(d.between) ? Number(d.between[1] ?? 1) : 1] })} /><NumField value={Array.isArray(d.between) ? Number(d.between[1] ?? 1) : 1} onChange={(v) => setDerive(i, { between: [Array.isArray(d.between) ? Number(d.between[0]) : 0, v] })} /></>)}
                  <SmallButton tone="danger" onClick={() => upd({ derive: derive.filter((_, j) => j !== i) })}>✕</SmallButton>
                </div>
              );
            })}
            <SmallButton onClick={() => upd({ derive: [...derive, { kind: 'intersections', of: [0, 1] }] })}>+ derive</SmallButton>
          </div>

          <ConfigRow label="x window">
            <NumField value={xRange[0]} onChange={(v) => updateAttributes({ xRange: [v, xRange[1]] })} />
            <span className="text-muted-foreground">to</span>
            <NumField value={xRange[1]} onChange={(v) => updateAttributes({ xRange: [xRange[0], v] })} />
          </ConfigRow>
          <ConfigRow label="y window">
            <ChipToggle active={yRange === 'auto'} onClick={() => updateAttributes({ yRange: 'auto' })}>auto</ChipToggle>
            <ChipToggle active={yRange !== 'auto'} onClick={() => updateAttributes({ yRange: yRange === 'auto' ? [-10, 10] : yRange })}>fixed</ChipToggle>
            {yRange !== 'auto' && (<><NumField value={yRange[0]} onChange={(v) => updateAttributes({ yRange: [v, (yRange as [number, number])[1]] })} /><span className="text-muted-foreground">to</span><NumField value={yRange[1]} onChange={(v) => updateAttributes({ yRange: [(yRange as [number, number])[0], v] })} /></>)}
          </ConfigRow>

          <AskEditor ask={ask} onChange={(a) => upd({ ask: a })} />
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const TriangleTrigBlock = defineBlock({
  key: 'triangle-trig',
  void: true,
  label: 'Triangle trig (elevation/depression)',
  description: 'A right triangle for elevation/depression: give an angle + one side, solve the rest, grade a typed answer.',
  category: 'interactive',
  schema: z.object({
    angleDeg: z.number().optional(),
    leg: z.number().optional(),
    legKind: z.enum(['opposite', 'adjacent']).optional(),
    mode: z.enum(['elevation', 'depression', 'plain']).optional(),
    labels: z.object({ opposite: z.string().optional(), adjacent: z.string().optional(), hypotenuse: z.string().optional(), angle: z.string().optional() }).optional(),
    drive: z.array(z.enum(['angle', 'leg'])).optional(),
    ask: askSchema.optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const a = attributes as Partial<TriangleTrigProps>;
    const drive = (Array.isArray(a.drive) ? a.drive : ['angle']) as ('angle' | 'leg')[];
    const labels = a.labels ?? {};
    const ask = attributes.ask as AskShape | undefined;
    const widget = <TriangleTrig {...a} drive={drive} ask={ask as unknown as ProblemAsk} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const upd = updateAttributes as (p: Record<string, unknown>) => void;
    const toggleDrive = (k: 'angle' | 'leg'): void => updateAttributes({ drive: drive.includes(k) ? drive.filter((d) => d !== k) : [...drive, k] });
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={a.title ?? ''} placeholder="Angle of depression…" onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="Angle θ (°)"><NumField value={a.angleDeg ?? 31} onChange={(v) => updateAttributes({ angleDeg: v })} /></ConfigRow>
          <ConfigRow label="Given leg">
            <NumField value={a.leg ?? 15} onChange={(v) => updateAttributes({ leg: v })} />
            <SelectField value={a.legKind ?? 'opposite'} options={['opposite', 'adjacent']} onChange={(v) => upd({ legKind: v })} />
          </ConfigRow>
          <ConfigRow label="Framing"><SelectField value={a.mode ?? 'depression'} options={['depression', 'elevation', 'plain']} onChange={(v) => upd({ mode: v })} /></ConfigRow>
          <ConfigRow label="Labels">
            <TextField value={labels.opposite ?? ''} placeholder="opposite" onChange={(v) => updateAttributes({ labels: { ...labels, opposite: v } })} className="w-24" />
            <TextField value={labels.adjacent ?? ''} placeholder="adjacent" onChange={(v) => updateAttributes({ labels: { ...labels, adjacent: v } })} className="w-24" />
          </ConfigRow>
          <ConfigRow label="Draggable">
            <ChipToggle active={drive.includes('angle')} onClick={() => toggleDrive('angle')}>angle</ChipToggle>
            <ChipToggle active={drive.includes('leg')} onClick={() => toggleDrive('leg')}>given leg</ChipToggle>
          </ConfigRow>
          <AskEditor ask={ask} onChange={(a2) => upd({ ask: a2 })} />
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

const pointSchema = z.object({ x: z.number(), y: z.number() });

export const StraightLineBlock = defineBlock({
  key: 'straight-line',
  tag: 'StraightLine',
  void: true,
  label: 'Straight line (y = mx + c, parallel/⊥, intercepts)',
  description: 'Drag points/intercepts to build a line; covers gradient–intercept, two-point, intercept form, and parallel/perpendicular. Optional graded answer.',
  category: 'interactive',
  schema: z.object({
    mode: z.enum(['two-point', 'gradient-intercept', 'intercept-form', 'parallel', 'perpendicular']).optional(),
    pointA: pointSchema.optional(),
    pointB: pointSchema.optional(),
    given: z.object({ m: z.number(), c: z.number() }).optional(),
    through: pointSchema.optional(),
    showDistance: z.boolean().optional(),
    snap: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    ask: labAskSchema.optional(),
    activity: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const a = attributes as Partial<StraightLineProps>;
    const ask = attributes.ask as LabAskShape | undefined;
    const m = a.mode ?? 'two-point';
    const given = a.given ?? { m: 0.5, c: 2 };
    const widget = <StraightLineLab {...a} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const upd = updateAttributes as (p: Record<string, unknown>) => void;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={a.title ?? ''} placeholder="The straight line" onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="Form"><SelectField value={m} options={['two-point', 'gradient-intercept', 'intercept-form', 'parallel', 'perpendicular']} onChange={(v) => upd({ mode: v })} /></ConfigRow>
          {(m === 'parallel' || m === 'perpendicular') && (
            <ConfigRow label="Given line  y =">
              <NumField value={given.m} onChange={(v) => upd({ given: { ...given, m: v } })} /><span className="text-muted-foreground">x +</span><NumField value={given.c} onChange={(v) => upd({ given: { ...given, c: v } })} />
            </ConfigRow>
          )}
          {m === 'two-point' && <ConfigRow label="Extras"><ChipToggle active={!!a.showDistance} onClick={() => upd({ showDistance: !a.showDistance })}>show |AB| + midpoint</ChipToggle></ConfigRow>}
          <ConfigRow label="Snap"><NumField value={a.snap ?? 1} onChange={(v) => updateAttributes({ snap: v })} /></ConfigRow>
          <LabAskEditor ask={ask} onChange={(a2) => upd({ ask: a2 })} />
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const CircleBlock = defineBlock({
  key: 'circle-geometry',
  tag: 'CircleLab',
  void: true,
  label: 'Circle ((x−a)² + (y−b)² = r², tangent)',
  description: 'Drag the centre and rim; live standard + expanded equation, optional tangent (⊥ to the radius). Optional graded answer.',
  category: 'interactive',
  schema: z.object({
    center: pointSchema.optional(),
    radius: z.number().optional(),
    showTangent: z.boolean().optional(),
    showExpanded: z.boolean().optional(),
    tangentAngleDeg: z.number().optional(),
    snap: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    ask: labAskSchema.optional(),
    activity: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const a = attributes as Partial<CircleProps>;
    const ask = attributes.ask as LabAskShape | undefined;
    const widget = <CircleLab {...a} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const upd = updateAttributes as (p: Record<string, unknown>) => void;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={a.title ?? ''} placeholder="The circle" onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="Radius"><NumField value={a.radius ?? 4} onChange={(v) => updateAttributes({ radius: v })} /></ConfigRow>
          <ConfigRow label="Show">
            <ChipToggle active={!!a.showExpanded} onClick={() => upd({ showExpanded: !a.showExpanded })}>expanded form</ChipToggle>
            <ChipToggle active={!!a.showTangent} onClick={() => upd({ showTangent: !a.showTangent })}>tangent</ChipToggle>
          </ConfigRow>
          <ConfigRow label="Snap"><NumField value={a.snap ?? 1} onChange={(v) => updateAttributes({ snap: v })} /></ConfigRow>
          <LabAskEditor ask={ask} onChange={(a2) => upd({ ask: a2 })} />
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const ConicBlock = defineBlock({
  key: 'conic',
  tag: 'ConicLab',
  void: true,
  label: 'Conic (parabola / ellipse / hyperbola / reciprocal)',
  description: 'Drag a parabola (y²=4ax, focus+directrix), an ellipse (x²/a²+y²/b²=1, foci), a hyperbola (x²/a²−y²/b²=1, asymptotes), or the reciprocal xy=c. Optional graded answer.',
  category: 'interactive',
  schema: z.object({
    kind: z.enum(['parabola', 'ellipse', 'hyperbola', 'rectangular']).optional(),
    a: z.number().optional(),
    b: z.number().optional(),
    c: z.number().optional(),
    showFocusDirectrix: z.boolean().optional(),
    showAsymptotes: z.boolean().optional(),
    snap: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    ask: labAskSchema.optional(),
    activity: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const a = attributes as Partial<ConicProps>;
    const ask = attributes.ask as LabAskShape | undefined;
    const k = a.kind ?? 'parabola';
    const widget = <ConicLab {...a} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const upd = updateAttributes as (p: Record<string, unknown>) => void;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={a.title ?? ''} placeholder="The parabola" onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="Curve"><SelectField value={k} options={['parabola', 'ellipse', 'hyperbola', 'rectangular']} onChange={(v) => upd({ kind: v })} /></ConfigRow>
          {k === 'parabola' && <ConfigRow label="a"><NumField value={a.a ?? 1} onChange={(v) => updateAttributes({ a: v })} /></ConfigRow>}
          {k === 'ellipse' && <ConfigRow label="a, b"><NumField value={a.a ?? 4} onChange={(v) => updateAttributes({ a: v })} /><NumField value={a.b ?? 2.5} onChange={(v) => updateAttributes({ b: v })} /></ConfigRow>}
          {k === 'hyperbola' && <ConfigRow label="a, b"><NumField value={a.a ?? 2} onChange={(v) => updateAttributes({ a: v })} /><NumField value={a.b ?? 1.5} onChange={(v) => updateAttributes({ b: v })} /></ConfigRow>}
          {k === 'rectangular' && <ConfigRow label="c"><NumField value={a.c ?? 6} onChange={(v) => updateAttributes({ c: v })} /></ConfigRow>}
          <ConfigRow label="Snap"><NumField value={a.snap ?? 1} onChange={(v) => updateAttributes({ snap: v })} /></ConfigRow>
          <LabAskEditor ask={ask} onChange={(a2) => upd({ ask: a2 })} />
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const DomainRangeBlock = defineBlock({
  key: 'domain-range',
  tag: 'DomainRange',
  void: true,
  label: 'Domain & range (the two shadows)',
  description: 'Type any f(x); the curve casts a domain shadow (x-axis) and range shadow (y-axis). Drag the input probe: green = accepted, red = undefined. Teaches every domain type.',
  category: 'interactive',
  schema: z.object({
    equation: z.string().optional(),
    xRange: z.tuple([z.number(), z.number()]).optional(),
    restrict: z.tuple([z.number(), z.number()]).optional(),
    probe: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    ask: labAskSchema.optional(),
    activity: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const a = attributes as Partial<DomainRangeProps>;
    const ask = attributes.ask as LabAskShape | undefined;
    const xR = a.xRange ?? [-6, 6];
    const restricted = Array.isArray(a.restrict);
    const widget = <DomainRangeLab {...a} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const upd = updateAttributes as (p: Record<string, unknown>) => void;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={a.title ?? ''} placeholder="Domain & range" onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="f(x) ="><TextField value={a.equation ?? ''} mono placeholder="sqrt(9 - x^2)" onChange={(v) => updateAttributes({ equation: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="x window">
            <NumField value={xR[0]} onChange={(v) => updateAttributes({ xRange: [v, xR[1]] })} /><span className="text-muted-foreground">to</span><NumField value={xR[1]} onChange={(v) => updateAttributes({ xRange: [xR[0], v] })} />
          </ConfigRow>
          <ConfigRow label="Restrict domain">
            <ChipToggle active={!restricted} onClick={() => upd({ restrict: undefined })}>none</ChipToggle>
            <ChipToggle active={restricted} onClick={() => upd({ restrict: a.restrict ?? [-2, 2] })}>interval</ChipToggle>
            {restricted && <><NumField value={a.restrict![0]} onChange={(v) => upd({ restrict: [v, a.restrict![1]] })} /><span className="text-muted-foreground">to</span><NumField value={a.restrict![1]} onChange={(v) => upd({ restrict: [a.restrict![0], v] })} /></>}
          </ConfigRow>
          <LabAskEditor ask={ask} onChange={(a2) => upd({ ask: a2 })} />
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const LinearModelBlock = defineBlock({
  key: 'linear-model',
  tag: 'LinearModel',
  void: true,
  label: 'Proportion / rate (marbles → volume)',
  description: 'A concrete scene (a beaker filling with marbles) linked to a graph: drag the point to predict the value at the next input. Discover y = rate·x + base from data. Optional graded follow-up.',
  category: 'interactive',
  schema: z.object({
    slope: z.number().default(5),
    intercept: z.number().default(10),
    predictX: z.number().default(2),
    xMax: z.number().default(6),
    yMax: z.number().default(40),
    yStep: z.number().default(5),
    xLabel: z.string().default('Marbles'),
    yLabel: z.string().default('Volume'),
    unit: z.string().default('mL'),
    scene: z.string().default('vessel'),
    vesselObjects: z.boolean().default(true),
    vesselBinds: z.enum(['guess', 'truth']).default('guess'),
    objectLabel: z.string().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    ask: labAskSchema.optional(),
    activity: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const a = attributes as Partial<LinearModelProps> & { predictX?: number };
    const ask = attributes.ask as LabAskShape | undefined;
    const predictX = a.predictX ?? 2;
    const given = Array.from({ length: Math.max(1, predictX) }, (_, i) => i); // 0 … predictX-1
    const widget = <LinearModelLab {...a} predictX={predictX} given={given} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const upd = updateAttributes as (p: Record<string, unknown>) => void;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={a.title ?? ''} placeholder="Find the volume" onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="Rule: y ="><NumField value={a.slope ?? 5} onChange={(v) => updateAttributes({ slope: v })} /><span className="text-muted-foreground">· x +</span><NumField value={a.intercept ?? 10} onChange={(v) => updateAttributes({ intercept: v })} /></ConfigRow>
          <ConfigRow label="Predict at x ="><NumField value={predictX} onChange={(v) => updateAttributes({ predictX: v })} /></ConfigRow>
          <ConfigRow label="Axis labels"><TextField value={a.xLabel ?? 'Marbles'} onChange={(v) => updateAttributes({ xLabel: v })} className="w-28" /><TextField value={a.yLabel ?? 'Volume'} onChange={(v) => updateAttributes({ yLabel: v })} className="w-28" /></ConfigRow>
          <ConfigRow label="x / y max"><NumField value={a.xMax ?? 6} onChange={(v) => updateAttributes({ xMax: v })} /><NumField value={a.yMax ?? 40} onChange={(v) => updateAttributes({ yMax: v })} /></ConfigRow>
          <ConfigRow label="y step / unit"><NumField value={a.yStep ?? 5} onChange={(v) => updateAttributes({ yStep: v })} /><TextField value={a.unit ?? 'mL'} onChange={(v) => updateAttributes({ unit: v })} className="w-20" /></ConfigRow>
          <ConfigRow label="Concrete scene"><SelectField value={a.scene ?? 'vessel'} options={levelSceneOptions()} onChange={(v) => upd({ scene: v })} /></ConfigRow>
          {(a.scene ?? 'vessel') === 'vessel' && (
            <ConfigRow label="Drop objects in">
              <ChipToggle active={a.vesselObjects !== false} onClick={() => updateAttributes({ vesselObjects: !(a.vesselObjects !== false) })}>{a.vesselObjects !== false ? 'objects (marbles)' : 'just liquid'}</ChipToggle>
              {a.vesselObjects !== false && <TextField value={a.objectLabel ?? ''} placeholder="object word e.g. marbles" onChange={(v) => updateAttributes({ objectLabel: v })} className="w-36" />}
            </ConfigRow>
          )}
          <ConfigRow label="Twin level follows">
            <ChipToggle active={(a.vesselBinds ?? 'guess') === 'guess'} onClick={() => updateAttributes({ vesselBinds: (a.vesselBinds ?? 'guess') === 'guess' ? 'truth' : 'guess' })}>
              {(a.vesselBinds ?? 'guess') === 'guess' ? 'your drag (rises & falls live)' : 'the real lab level (you match it)'}
            </ChipToggle>
          </ConfigRow>
          <LabAskEditor ask={ask} onChange={(a2) => upd({ ask: a2 })} />
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const SequencePredictBlock = defineBlock({
  key: 'sequence-predict',
  tag: 'SequencePredict',
  void: true,
  label: 'Exponential / sequence (watch it grow)',
  description: 'A count shown as a growing crowd of dots (3 → 6 → 12, new ones lit up); the learner tap-fills the hidden terms. Geometric (×ratio) or arithmetic (+difference). The "joke that doubles" lesson.',
  category: 'interactive',
  schema: z.object({
    start: z.number().default(3),
    rule: z.enum(['geometric', 'arithmetic']).default('geometric'),
    factor: z.number().default(2),
    shown: z.number().default(1),
    predict: z.number().default(2),
    stepLabel: z.string().default('Day'),
    highlightNew: z.boolean().default(true),
    scene: z.string().default('cluster'),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const a = attributes as Partial<SequencePredictProps>;
    const r = a.rule ?? 'geometric';
    const widget = <SequencePredict {...a} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const upd = updateAttributes as (p: Record<string, unknown>) => void;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={a.title ?? ''} placeholder="How does it grow?" onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="Story / prompt"><TextField value={a.prompt ?? ''} placeholder="Each day the number doubles." onChange={(v) => updateAttributes({ prompt: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="Start value"><NumField value={a.start ?? 3} onChange={(v) => updateAttributes({ start: v })} /></ConfigRow>
          <ConfigRow label="Rule">
            <SelectField value={r} options={['geometric', 'arithmetic']} onChange={(v) => upd({ rule: v })} />
            <span className="text-muted-foreground">{r === 'geometric' ? '× by' : '+ by'}</span>
            <NumField value={a.factor ?? 2} onChange={(v) => updateAttributes({ factor: v })} />
          </ConfigRow>
          <ConfigRow label="Shown / predict"><NumField value={a.shown ?? 1} onChange={(v) => updateAttributes({ shown: v })} /><NumField value={a.predict ?? 2} onChange={(v) => updateAttributes({ predict: v })} /></ConfigRow>
          <ConfigRow label="Step label"><TextField value={a.stepLabel ?? 'Day'} onChange={(v) => updateAttributes({ stepLabel: v })} className="w-28" /></ConfigRow>
          <ConfigRow label="Count scene"><SelectField value={a.scene ?? 'cluster'} options={countSceneOptions()} onChange={(v) => upd({ scene: v })} /></ConfigRow>
          <ConfigRow label="Highlight new"><ChipToggle active={a.highlightNew !== false} onClick={() => updateAttributes({ highlightNew: !(a.highlightNew !== false) })}>light up added</ChipToggle></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

// Authorable percentage manipulative: one bar engine, any analogy. The whole +
// unit + an optional segment breakdown are all schema-authored (auto LabConfig
// form), so "make 25%", "25% of 80 students", a budget split, or a battery are
// the SAME block with different data.
export const PercentBarBlock = labBlock({
  key: 'percent-bar',
  label: 'Percentage bar',
  description: 'A bar is the whole (100%); drag the fill to a target percent and read both the percent and the amount (percent × whole). Author any analogy via whole + unit + an optional segment breakdown.',
  schema: z.object({
    whole: z.number().default(100),
    unit: z.string().default(''),
    target: z.number().optional(),
    start: z.number().default(0),
    snapPct: z.number().default(5),
    showValue: z.boolean().default(true),
    referenceLabel: z.string().optional(),
    segments: z.array(z.object({ frac: z.number(), label: z.string().optional(), color: z.string().optional() })).optional(),
    scene: z.enum(['none', 'pie', 'battery', 'jar', 'balloon', 'thermometer']).default('none'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: (a) => <PercentBarLab {...a} />,
});

// Authorable fraction / part-whole engine: shade k of n equal parts; reads as a
// fraction, decimal, percent and (with a whole) a quantity; optional compare
// strip shows the equivalent fraction. Any analogy via the data.
export const FractionBarBlock = labBlock({
  key: 'fraction-bar',
  label: 'Fraction strip',
  description: 'A strip cut into equal parts; drag to shade k/n. Reads as fraction, decimal, percent and (with a whole) a quantity. An optional compare strip shows the equivalent fraction.',
  schema: z.object({
    denom: z.number().default(4),
    num: z.number().default(0),
    target: z.number().optional(),
    whole: z.number().optional(),
    unit: z.string().default(''),
    compareDenom: z.number().optional(),
    showEquiv: z.boolean().default(true),
    scene: z.enum(['none', 'pie', 'battery', 'jar', 'balloon', 'thermometer']).default('none'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: (a) => <FractionBarLab {...a} />,
});

// Authorable "share in a ratio" engine: one bar, one draggable divider; any
// split whose simplified ratio is a:b solves it. Set a, b, total, unit, labels.
export const RatioShareBlock = labBlock({
  key: 'ratio-share',
  label: 'Share in a ratio',
  description: 'Split a quantity in the ratio a:b by dragging one divider. Reads back the amounts and the simplified ratio; any equivalent split (40:60 = 2:3) solves it.',
  schema: z.object({
    a: z.number().default(2),
    b: z.number().default(3),
    total: z.number().default(100),
    unit: z.string().default(''),
    labelA: z.string().default('A'),
    labelB: z.string().default('B'),
    step: z.number().default(1),
    scene: z.enum(['none', 'pie', 'battery', 'jar', 'balloon', 'thermometer']).default('none'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: (a) => <RatioShareLab {...a} />,
});

// Argand-plane lab on the complex kernel: drag a+bi; modes show modulus/argument,
// the ×i 90° rotation (why i²=−1), powers spiralling, or the roots of unity.
export const ComplexPlaneBlock = labBlock({
  key: 'complex-plane',
  label: 'Complex plane (Argand)',
  description: 'Drag a + bi on the Argand plane: read the modulus and argument (deg & rad). Modes: point, multiply (×i rotates 90°), power (De Moivre spiral), or roots (the nth-roots of unity 1, i, −1, −i, ω).',
  schema: z.object({
    start: z.object({ re: z.number(), im: z.number() }).optional(),
    mode: z.enum(['point', 'multiply', 'power', 'roots']).default('point'),
    rootsN: z.number().default(4),
    powerN: z.number().default(3),
    snap: z.number().default(1),
    range: z.number().default(6),
    target: z.object({ re: z.number(), im: z.number() }).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: (a) => <ComplexPlaneLab {...a} />,
});

// Unit-circle signs lab: drag the angle, see the quadrant + CAST letter, the
// sign-coloured cos/sin legs, the reference angle, and the exact special value.
export const TrigSignsBlock = labBlock({
  key: 'trig-signs',
  label: 'Unit circle — signs (CAST)',
  description: 'Drag the angle on the unit circle: the quadrant lights up with its CAST letter (which of sin/cos/tan are +), cos and sin draw green/red by sign, and special angles show their exact value (½, √3⁄2 …).',
  schema: z.object({
    startDeg: z.number().default(30),
    snapDeg: z.number().default(15),
    targetDeg: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: (a) => <TrigSignsLab {...a} />,
});

// The dynamic factor/solve TOOL: type a polynomial, see it factored or solved
// step by step (school method) on the canonical poly engine — no CAS dependency.
export const PolynomialSolverBlock = labBlock({
  key: 'polynomial-solver',
  label: 'Polynomial solver (factor / solve, step by step)',
  description: 'Type a polynomial in x; the engine factors it or solves =0 and shows the working (split the middle term; factor theorem for higher degree). Any-degree roots incl. complex, client-side.',
  schema: z.object({
    expr: z.string().default('x^2 + 5x + 6'),
    mode: z.enum(['factor', 'solve']).default('factor'),
    editable: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: (a) => <PolynomialSolverLab {...a} />,
});

// Count-driven proportion: drag the input, objects drop into the vessel and the
// quantity scales live (sibling of the reading-driven LinearModel block).
export const RateMachineBlock = labBlock({
  key: 'rate-machine',
  label: 'Proportion machine (drag the count, it scales)',
  description: 'Count-driven concrete → graph: drag the input up and down; objects drop into a vessel, the liquid level rises by the same rate each step, and a point rides up the line leaving a dot at every whole step. Proportionality you scrub. Skinnable (battery, jar, savings) and an optional "set it to N" goal.',
  schema: z.object({
    rate: z.number().default(5),
    base: z.number().default(0),
    maxCount: z.number().default(6),
    startCount: z.number().default(1),
    yMax: z.number().default(40),
    yStep: z.number().default(5),
    xLabel: z.string().default('Items'),
    yLabel: z.string().default('Cost'),
    unit: z.string().default('$'),
    itemLabel: z.string().optional(),
    scene: z.string().default('vessel'),
    showObjects: z.boolean().default(true),
    target: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: (a) => <RateMachineLab {...a} />,
});

export const GeoTransformBlock = defineBlock({
  key: 'geometry-transform',
  tag: 'GeoTransform',
  void: true,
  label: 'Transformations (translate / reflect / rotate / enlarge)',
  description: 'Send a shape onto ghost targets by filling the transform from a tile tray; on a correct fill the shape flies to the targets. One lab, four transformation types.',
  category: 'interactive',
  schema: z.object({
    kind: z.enum(['translate', 'reflect', 'rotate', 'enlarge']).default('translate'),
    byX: z.number().default(5),
    byY: z.number().default(1),
    axis: z.enum(['x', 'y', 'y=x', 'y=-x']).default('y'),
    deg: z.number().default(90),
    k: z.number().default(2),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const a = attributes as { kind?: 'translate' | 'reflect' | 'rotate' | 'enlarge'; byX?: number; byY?: number; axis?: ReflectAxis; deg?: number; k?: number; title?: string; prompt?: string };
    const kind = a.kind ?? 'translate';
    const transform: Transform =
      kind === 'translate' ? { kind, by: { x: a.byX ?? 5, y: a.byY ?? 1 } }
      : kind === 'reflect' ? { kind, axis: a.axis ?? 'y' }
      : kind === 'rotate' ? { kind, deg: a.deg ?? 90, about: { x: 0, y: 0 } }
      : { kind: 'enlarge', k: a.k ?? 2, about: { x: 0, y: 0 } };
    const widget = <TransformLab transform={transform} title={a.title} prompt={a.prompt} activity={attributes.activity} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const upd = updateAttributes as (p: Record<string, unknown>) => void;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={a.title ?? ''} placeholder="Transformations" onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="Type"><SelectField value={kind} options={['translate', 'reflect', 'rotate', 'enlarge']} onChange={(v) => upd({ kind: v })} /></ConfigRow>
          {kind === 'translate' && <ConfigRow label="by ("><NumField value={a.byX ?? 5} onChange={(v) => updateAttributes({ byX: v })} /><span className="text-muted-foreground">,</span><NumField value={a.byY ?? 1} onChange={(v) => updateAttributes({ byY: v })} /><span className="text-muted-foreground">)</span></ConfigRow>}
          {kind === 'reflect' && <ConfigRow label="Mirror line"><SelectField value={a.axis ?? 'y'} options={['x', 'y', 'y=x', 'y=-x']} onChange={(v) => upd({ axis: v })} /></ConfigRow>}
          {kind === 'rotate' && <ConfigRow label="Angle (° anticlockwise)"><SelectField value={String(a.deg ?? 90)} options={['90', '180', '270']} onChange={(v) => updateAttributes({ deg: Number(v) })} /></ConfigRow>}
          {kind === 'enlarge' && <ConfigRow label="Scale factor"><SelectField value={String(a.k ?? 2)} options={['2', '3', '4']} onChange={(v) => updateAttributes({ k: Number(v) })} /></ConfigRow>}
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

const receiptItemSchema = z.object({ qty: z.number(), name: z.string(), unit: z.number() });

export const ReceiptBlock = defineBlock({
  key: 'receipt-totals',
  tag: 'ReceiptTotals',
  void: true,
  label: 'Receipt totals (qty × price)',
  description: 'A shop receipt where the learner tap-fills the total items and total cost; classic "summed the prices, forgot the quantity" distractors. Multiplicative + additive reasoning grounded in a real bill.',
  category: 'interactive',
  schema: z.object({
    store: z.string().default('Half Foods'),
    currency: z.string().default('$'),
    items: z.array(receiptItemSchema).optional(),
    askItems: z.boolean().default(true),
    askCost: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const a = attributes as { store?: string; currency?: string; items?: ReceiptProps['items']; askItems?: boolean; askCost?: boolean; title?: string; prompt?: string };
    const items = (Array.isArray(a.items) && a.items.length ? a.items : undefined);
    const widget = <ReceiptLab store={a.store} currency={a.currency} items={items} ask={{ items: a.askItems !== false, cost: a.askCost !== false }} title={a.title} prompt={a.prompt} activity={attributes.activity} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const list = items ?? [{ qty: 6, name: 'Pineapples', unit: 5 }, { qty: 3, name: 'Mangoes', unit: 2 }];
    const setItem = (i: number, patch: Partial<{ qty: number; name: string; unit: number }>): void => updateAttributes({ items: list.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Store"><TextField value={a.store ?? 'Half Foods'} onChange={(v) => updateAttributes({ store: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="Currency"><TextField value={a.currency ?? '$'} onChange={(v) => updateAttributes({ currency: v })} className="w-16" /></ConfigRow>
          <div className="space-y-1.5">
            <span className="font-medium text-muted-foreground">Line items (qty × name @ price)</span>
            {list.map((it, i) => (
              <div key={i} className="flex flex-wrap items-center gap-1.5">
                <NumField value={it.qty} onChange={(v) => setItem(i, { qty: v })} />
                <TextField value={it.name} placeholder="Pineapples" onChange={(v) => setItem(i, { name: v })} className="w-32" />
                <span className="text-muted-foreground">@</span>
                <NumField value={it.unit} onChange={(v) => setItem(i, { unit: v })} />
                {list.length > 1 && <SmallButton tone="danger" onClick={() => updateAttributes({ items: list.filter((_, j) => j !== i) })}>✕</SmallButton>}
              </div>
            ))}
            <SmallButton onClick={() => updateAttributes({ items: [...list, { qty: 1, name: '', unit: 1 }] })}>+ item</SmallButton>
          </div>
          <ConfigRow label="Ask for">
            <ChipToggle active={a.askItems !== false} onClick={() => updateAttributes({ askItems: !(a.askItems !== false) })}>total items</ChipToggle>
            <ChipToggle active={a.askCost !== false} onClick={() => updateAttributes({ askCost: !(a.askCost !== false) })}>total cost</ChipToggle>
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const SystemSolveBlock = defineBlock({
  key: 'system-solve',
  tag: 'SystemSolve',
  void: true,
  label: 'System of equations (two clues, by elimination)',
  description: 'Two unknowns, two clues, solved by elimination (not just the graph crossing). Swappable concrete scene: a shop receipt, a bucket balance, or algebra tiles. Creators theme the same maths any way.',
  category: 'interactive',
  schema: z.object({
    scene: z.string().default('receipt'),
    symA: z.string().default('🍍'), labelA: z.string().default('Pineapple'), answerA: z.number().default(5),
    symB: z.string().default('🥭'), labelB: z.string().default('Mango'), answerB: z.number().default(2),
    a0: z.number().default(2), b0: z.number().default(1),
    a1: z.number().default(1), b1: z.number().default(1),
    currency: z.string().optional(), unit: z.string().optional(), store: z.string().optional(),
    title: z.string().optional(), prompt: z.string().optional(), activity: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const a = attributes as Record<string, unknown>;
    const num = (k: string, d: number): number => (typeof a[k] === 'number' ? (a[k] as number) : d);
    const str = (k: string, d: string): string => (typeof a[k] === 'string' ? (a[k] as string) : d);
    const scene = str('scene', 'receipt');
    const unknowns = [
      { sym: str('symA', '🍍'), label: str('labelA', 'Pineapple'), color: 'var(--stage-warn)', answer: num('answerA', 5) },
      { sym: str('symB', '🥭'), label: str('labelB', 'Mango'), color: 'var(--stage-good)', answer: num('answerB', 2) },
    ];
    const clues = [{ coeffs: [num('a0', 2), num('b0', 1)] }, { coeffs: [num('a1', 1), num('b1', 1)] }];
    const widget = <SystemSolveLab scene={scene} unknowns={unknowns} clues={clues} currency={a.currency as string | undefined} unit={a.unit as string | undefined} store={a.store as string | undefined} title={a.title as string | undefined} prompt={a.prompt as string | undefined} activity={a.activity as string | undefined} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={str('title', '')} placeholder="Two clues, two unknowns" onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="Scene"><SelectField value={scene} options={clueSceneOptions()} onChange={(v) => (updateAttributes as (p: Record<string, unknown>) => void)({ scene: v })} /></ConfigRow>
          <ConfigRow label="Item A"><TextField value={str('symA', '🍍')} onChange={(v) => updateAttributes({ symA: v })} className="w-16" /><TextField value={str('labelA', 'Pineapple')} onChange={(v) => updateAttributes({ labelA: v })} className="w-28" /><span className="text-muted-foreground">=</span><NumField value={num('answerA', 5)} onChange={(v) => updateAttributes({ answerA: v })} /></ConfigRow>
          <ConfigRow label="Item B"><TextField value={str('symB', '🥭')} onChange={(v) => updateAttributes({ symB: v })} className="w-16" /><TextField value={str('labelB', 'Mango')} onChange={(v) => updateAttributes({ labelB: v })} className="w-28" /><span className="text-muted-foreground">=</span><NumField value={num('answerB', 2)} onChange={(v) => updateAttributes({ answerB: v })} /></ConfigRow>
          <ConfigRow label="Clue 1"><NumField value={num('a0', 2)} onChange={(v) => updateAttributes({ a0: v })} /><span className="text-muted-foreground">A +</span><NumField value={num('b0', 1)} onChange={(v) => updateAttributes({ b0: v })} /><span className="text-muted-foreground">B</span></ConfigRow>
          <ConfigRow label="Clue 2"><NumField value={num('a1', 1)} onChange={(v) => updateAttributes({ a1: v })} /><span className="text-muted-foreground">A +</span><NumField value={num('b1', 1)} onChange={(v) => updateAttributes({ b1: v })} /><span className="text-muted-foreground">B</span></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

// No-code skin authoring: a creator builds a data scene (emoji / shape) with SceneStudio;
// rendering the block registers it, so any lab BELOW it can pick the new scene by name.
function customSceneSpec(a: Record<string, unknown>): DataSceneSpec {
  const name = (typeof a.name === 'string' && a.name.trim()) || 'custom';
  const label = typeof a.label === 'string' && a.label.trim() ? a.label : undefined;
  const v = a.variant;
  if (v === 'icons') return { name, label, kind: 'level', icon: (a.icon as string) || '⭐', slots: Number(a.slots) || 5 };
  if (v === 'shape') return { name, label, kind: 'level', shape: ((a.shape as 'box' | 'cup' | 'circle') || 'box'), color: (a.color as string) || '#7c83ff' };
  return { name, label, kind: 'count', icon: (a.icon as string) || '🔵' };
}
function customSceneAttrs(s: DataSceneSpec): Record<string, unknown> {
  if (s.kind === 'count') return { name: s.name, label: s.label ?? '', variant: 'count', icon: s.icon };
  if ('icon' in s) return { name: s.name, label: s.label ?? '', variant: 'icons', icon: s.icon, slots: s.slots ?? 5 };
  return { name: s.name, label: s.label ?? '', variant: 'shape', shape: s.shape, color: s.color ?? '#7c83ff' };
}

export const CustomSceneBlock = defineBlock({
  key: 'custom-scene',
  tag: 'CustomScene',
  void: true,
  label: 'Custom scene (no-code lab skin)',
  description: 'Invent a new lab skin from a form (an emoji or a shape) — no code. Place it ABOVE a lab and pick the new scene by name in that lab.',
  category: 'interactive',
  schema: z.object({
    name: z.string().default('custom'),
    label: z.string().optional(),
    variant: z.enum(['count', 'icons', 'shape']).default('count'),
    icon: z.string().default('🔵'),
    slots: z.number().default(5),
    shape: z.enum(['box', 'cup', 'circle']).default('box'),
    color: z.string().default('#7c83ff'),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const spec = customSceneSpec(attributes as Record<string, unknown>);
    registerDataScene(spec); // idempotent: makes the skin available to labs below
    if (mode !== 'editing' || !updateAttributes) {
      return <div className="not-prose" style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, color: 'var(--stage-good)', border: '1px solid var(--stage-good)' }}>✓ Scene “{spec.name}” is ready — choose it in a lab’s scene list below.</div>;
    }
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <SceneStudio spec={spec} onChange={(s) => (updateAttributes as (p: Record<string, unknown>) => void)(customSceneAttrs(s))} />
        <p style={{ fontSize: 12, color: 'var(--stage-muted)', margin: 0 }}>Tip: put this above a lab, then pick “{spec.name}” in that lab’s scene dropdown.</p>
      </div>
    );
  },
});

/** All math labs blocks, spread into a host's `defineBlock` list. */
export const mathBlocks = [
  TrigExplorerBlock,
  GraphBlock,
  PercentBarBlock,
  FractionBarBlock,
  RatioShareBlock,
  ComplexPlaneBlock,
  TrigSignsBlock,
  PolynomialSolverBlock,
  DerivativeExplorerBlock,
  GradientDescentBlock,
  IntegralExplorerBlock,
  LimitExplorerBlock,
  DerivationBlock,
  LinearSystemBlock,
  NumberLineBlock,
  MysteryBucketBlock,
  BalanceAlgebraBlock,
  VertexParabolaBlock,
  AreaModelBlock,
  GrowingPatternBlock,
  InteractiveProblemBlock,
  TriangleTrigBlock,
  StraightLineBlock,
  CircleBlock,
  ConicBlock,
  DomainRangeBlock,
  LinearModelBlock,
  RateMachineBlock,
  SequencePredictBlock,
  GeoTransformBlock,
  ReceiptBlock,
  SystemSolveBlock,
  CustomSceneBlock,
] as const;

/** The MDX tag → component render map slice for the math domain. */
export const mathComponents = {
  MysteryBucket: MysteryBucketLab,
  NumberLine: NumberLineLab,
  LinearSystem: LinearSystemView,
  BalanceAlgebra: BalanceAlgebraLab,
  VertexParabola: VertexParabolaLab,
  AreaModel: AreaModelLab,
  GrowingPattern: GrowingPatternLab,
  FunctionMachine: FunctionMachineLab,
  Graph: Grapher,
  DerivativeExplorer,
  IntegralExplorer,
  LimitExplorer,
  GradientDescent,
  Derivation,
  TrigExplorer,
  InteractiveProblem,
  TriangleTrig,
  StraightLine: StraightLineLab,
  CircleLab,
  ConicLab,
  DomainRange: DomainRangeLab,
  LinearModel: LinearModelLab,
  RateMachine: RateMachineLab,
  SequencePredict,
  PercentBar: PercentBarLab,
  FractionBar: FractionBarLab,
  RatioShare: RatioShareLab,
  ComplexPlane: ComplexPlaneLab,
  TrigSigns: TrigSignsLab,
  PolynomialSolver: PolynomialSolverLab,
  GeoTransform: TransformLab,
  ReceiptTotals: ReceiptLab,
  SystemSolve: SystemSolveLab,
} as const;
