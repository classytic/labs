/**
 * @classytic/labs/blocks — math lab block specs.
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
import { TrigExplorer, Grapher, DerivativeExplorer, GradientDescent, IntegralExplorer, LimitExplorer, MysteryBucketLab, BalanceAlgebraLab, VertexParabolaLab, AreaModelLab, GrowingPatternLab, FunctionMachineLab, LinearSystemLab, NumberLineLab, Derivation, InteractiveProblem, TriangleTrig, TRIG_FNS, type TrigFn, type GraphParam, type Derived, type ProblemAsk, type TriangleTrigProps } from '../math/index.js';

const resolveFns = (raw: unknown): TrigFn[] =>
  Array.isArray(raw) && raw.length ? (raw as TrigFn[]) : ['sin', 'cos'];

// ── block specs ─────────────────────────────────────────────────────────────

export const TrigExplorerBlock = defineBlock({
  key: 'trig-explorer',
  void: true,
  label: 'Trig explorer',
  description: 'Unit circle ↔ wave — drag the angle; sin & cos trace out. (tan/cot: use Graph)',
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
  description: 'Plot equations you type — y = a·sin(b·x), x^2, … with learner sliders.',
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
  description: 'Walk downhill on a loss surface f(x,y) using exact ∂f/∂x, ∂f/∂y — the calculus behind ML.',
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
  description: 'Area under a curve via Riemann rectangles — drag endpoints, add n, converge.',
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
  description: 'Two clue lines on a grid — drag to the crossing point that obeys both. The advanced "find x and y" lab.',
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
  description: 'A draggable marker on a number line (incl. below zero) — optionally pose a target to land on.',
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
  description: 'Essentials opener — add unit weights until a balance is level to discover the hidden weight. No symbols.',
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
  description: 'Drag x to balance a·x + b = c — learners solve a linear equation by balancing the scale.',
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
  description: '(x+a)(x+b) as a partitioned rectangle — EXPAND (drag x) or FACTOR (find a, b).',
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

export const InteractiveProblemBlock = defineBlock({
  key: 'interactive-problem',
  void: true,
  label: 'Interactive problem (engine)',
  description: 'Author equations + sliders, derive roots/intersections/tangent/normal/area, and grade a typed answer — no code.',
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

/** All math labs blocks — spread into a host's `defineBlock` list. */
export const mathBlocks = [
  TrigExplorerBlock,
  GraphBlock,
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
} as const;
