'use client';

/**
 * Iteration, and the cobweb that says whether a rearrangement will work.
 *
 * A learner is handed x_{n+1} = F(x_n) and told to use it. They never find out why THAT
 * rearrangement, when the same equation could have been rearranged half a dozen ways. So this lab
 * offers two rearrangements of one equation: both algebraically correct, both with the same root,
 * one marching in and one flying apart from the same starting value.
 *
 * The cobweb is what makes the difference visible. Each step goes vertically to y = F(x), which is
 * "evaluate F", then horizontally to y = x, which is "feed the answer back in". A shallow curve
 * traps the path in a shrinking box. A steep one throws it outward in a widening staircase, and no
 * starting value rescues it.
 *
 * See ./core.ts for the single number that decides it: the gradient of F at the root.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Stage, Grid, Polyline, Dot, Label, type Vec2 } from '@classytic/stage';
import { PlaneAxes, clearOfLabel } from '../../kit/coords.js';
import { compileExpr, evaluate } from '@classytic/stage';
import { Tex } from '../../core/tex.js';
import { Segmented, Slider } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Activity } from '../../kit/activity.js';
import { cobweb, iterationProblems, run, verdict } from './core.js';

/** One rearrangement of the equation, as the author writes it. */
export interface Rearrangement {
  id: string;
  /** F(x) as an expression in x, e.g. "(x+1)^(1/3)". */
  expr: string;
  /** How it reads on screen, as LaTeX. */
  tex: string;
}

export interface IterationProps {
  /** The equation being solved, as LaTeX, for the heading only. */
  equationTex?: string;
  /** Two or three rearrangements of it. At least one should converge and one should not. */
  rearrangements?: Rearrangement[];
  /** Where the iteration starts. */
  start?: number;
  /** Roughly where the root is, used to measure the gradient and to mark the axis. */
  root?: number;
  /** Half-width of the window around the root. Widen it for an iteration that ranges further. */
  span?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

/**
 * cos x = x, rearranged two ways.
 *
 * Chosen over the tidier x³ − x − 1 = 0 for one reason: the cobweb has to be VISIBLE. That cubic's
 * convergent form has a gradient of 0.19 at the root, so it lands within a pixel of the answer in
 * two steps and the staircase this lab exists to draw never appears on screen. cos has a gradient
 * of −0.67, which spirals inward over eight or more steps, and its partner arccos has −1.48 and
 * escapes the domain. Both are correct rearrangements of one equation with the same root.
 *
 * Note `acos`, not `arccos`: the parser accepts both names but only evaluates the first, so the
 * other silently returns NaN and draws nothing.
 */
const DEFAULT_REARRANGEMENTS: Rearrangement[] = [
  { id: 'cos', expr: 'cos(x)', tex: 'x_{n+1} = \\cos x_n' },
  { id: 'acos', expr: 'acos(x)', tex: 'x_{n+1} = \\cos^{-1} x_n' },
];

const C_CURVE = 'var(--stage-accent)';
const C_LINE = 'var(--stage-muted)';
const C_WEB = 'var(--stage-warn)';

export function IterationLab({
  equationTex = '\\cos x = x',
  rearrangements = DEFAULT_REARRANGEMENTS,
  start = 0.2,
  root = 0.739085,
  span = 0.85,
  title = 'Two rearrangements of one equation',
  prompt = 'Both are correct algebra and both have the same root. Only one of them finds it, and the cobweb shows why.',
  activity = 'iteration',
}: IterationProps = {}): ReactNode {
  const [pickedId, setPickedId] = useState(rearrangements[0]?.id ?? '');
  const [shown, setShown] = useState(6);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const picked = rearrangements.find((r) => r.id === pickedId) ?? rearrangements[0]!;

  const model = useMemo(() => {
    const res = compileExpr(picked.expr);
    if (!res.ast) return null;
    const ast = res.ast;
    return (x: number): number => evaluate(ast, { x });
  }, [picked.expr]);

  const F = model ?? ((x: number): number => x);
  const result = run(F, start, shown);
  const v = verdict(F, root);
  const authoring = model ? iterationProblems(F, start, root) : ['F could not be compiled'];

  const choose = (id: string): void => {
    setPickedId(id);
    setSeen((s) => new Set(s).add(id));
  };
  // Solved once BOTH rearrangements have been tried, because the comparison is the lesson.
  useCheckpoint({ solved: seen.size >= Math.min(2, rearrangements.length), activity });

  // The window is built around the root so the cobweb stays on screen even when it escapes; a
  // diverging path would otherwise drag the view out to a million and flatten everything to a dot.
  const box = { xMin: root - span, xMax: root + span, yMin: root - span, yMax: root + span };
  const clamp = (p: Vec2): Vec2 => ({
    x: Math.max(box.xMin, Math.min(box.xMax, p.x)),
    y: Math.max(box.yMin, Math.min(box.yMax, p.y)),
  });

  const curve: Vec2[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = box.xMin + ((box.xMax - box.xMin) * i) / 200;
    const y = F(x);
    if (Number.isFinite(y)) curve.push({ x, y });
  }
  const web = cobweb(result.steps).map(clamp);

  const figure = (
    <Stage
      view={box}
      height={330}
      preserveAspect={false}
      ariaLabel={`Cobweb diagram for ${picked.expr}, ${result.outcome}`}
    >
      <Grid />
      <PlaneAxes
        labels
        ticks
        stepX={0.5}
        stepY={0.5}
        keepClear={[{ x: root, y: root }, clearOfLabel(root, root, 'root', { size: 11, dy: -10, dx: 14 })]}
      />
      {/* y = x, the line the iteration bounces off. Without it the cobweb is meaningless. */}
      <Polyline
        points={[
          { x: box.xMin, y: box.xMin },
          { x: box.xMax, y: box.xMax },
        ]}
        color={C_LINE}
        weight={1.4}
        dashed
      />
      <Polyline points={curve} color={C_CURVE} weight={2.5} />
      <Polyline points={web} color={C_WEB} weight={1.8} />
      <Dot x={root} y={root} r={4.5} color="var(--stage-good)" />
      <Label x={root} y={root} text="root" color="var(--stage-good)" size={11} dy={-10} dx={14} />
      {/* Starts past the y numbers, which sit just inside the left edge: centred on the edge, it
          was printed over the "1.5". */}
      <Label
        x={box.xMin + (box.xMax - box.xMin) * 0.07}
        y={box.yMax - (box.yMax - box.yMin) * 0.06}
        text="y = F(x)"
        color={C_CURVE}
        size={12}
        anchor="start"
      />
    </Stage>
  );

  const last = result.steps.at(-1);

  return (
    <Activity.Root className="math-iteration">
      <Activity.Header>
        <Activity.Heading eyebrow="Numerical methods" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          {result.outcome === 'converged'
            ? 'converges'
            : result.outcome === 'diverged'
              ? 'diverges'
              : 'still moving'}
        </strong>
        <span>start {start}</span>
        <span>{shown} steps</span>
      </Activity.Status>

      <Activity.Workspace>
        <Activity.Canvas label="Cobweb diagram">
          <div className="lab-proof-claim">
            <span className="lab-eyebrow">Solving</span>
            <Tex tex={equationTex} block />
            <Tex tex={picked.tex} block />
          </div>
          {figure}
        </Activity.Canvas>

        <Activity.Dock>
          <Segmented
            value={picked.id}
            options={rearrangements.map((r) => ({ value: r.id, label: r.expr }))}
            onChange={choose}
            ariaLabel="which rearrangement"
          />
          <Field label="steps" value={String(shown)}>
            <Slider value={shown} min={1} max={20} step={1} onChange={setShown} ariaLabel="steps shown" />
          </Field>
        </Activity.Dock>

        {authoring.length ? (
          <Readout value="This rearrangement is not usable" sub={authoring.join('; ')} />
        ) : (
          <Readout
            value={
              result.outcome === 'converged'
                ? `Settled on ${result.root?.toFixed(6)}`
                : result.outcome === 'diverged'
                  ? 'Escaped: no root will be found'
                  : `After ${shown} steps: ${last?.next.toFixed(6)}`
            }
            sub={v.why}
          />
        )}
      </Activity.Workspace>

      <Activity.Feedback>
        <span>What decides it</span>
        <div>
          Each step goes <strong>up to the curve</strong>, which is evaluating F, then{' '}
          <strong>across to the line y = x</strong>, which is feeding the answer back in. If the curve is
          shallower than the line at the root, the box shrinks and the path is trapped. If it is steeper, the
          staircase widens and no starting value can save it. The test is whether the gradient of F at the
          root is smaller than 1 in size.
        </div>
      </Activity.Feedback>

      <LiveRegion>
        {`${picked.expr} from ${start}: ${result.outcome}. ${result.root !== null ? `Root ${result.root.toFixed(6)}.` : ''}`}
      </LiveRegion>
    </Activity.Root>
  );
}
