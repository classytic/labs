'use client';

/**
 * PartialFractions, where the graded decision is the FORM and the payoff is watching the pieces add.
 *
 * Two things a printed page cannot do, and both are the reason this is a lab.
 *
 * First, the form is a CHOICE. A learner picks the shape of the answer before any constant exists,
 * and the wrong shapes on the menu are the ones people actually write: one term over the squared
 * factor with the linear one missing, or a constant numerator over an irreducible quadratic. Being
 * told "a repeated factor needs a term at every power" is a rule; picking the version without it
 * and being shown that the system then has no solution is a reason.
 *
 * Second, the identity is VERIFIABLE. Drawing each simple fraction as its own curve and adding them
 * shows the complicated original appearing out of pieces, which is what "decomposition" means and
 * what a page of algebra never quite conveys. The largest disagreement is reported as a number, so
 * "they are the same function" is something the learner reads off rather than takes on trust.
 *
 * See ./core.ts for why an improper fraction is refused rather than approximated.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Axes, Grid, Polyline, Label, type Vec2 } from '@classytic/stage';
import { Tex } from '../../core/tex.js';
import { Chip, Segmented } from '../../kit/controls.js';
import { LiveRegion, Readout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Activity } from '../../kit/activity.js';
import { evalPoly, polyTex, type Poly } from '../poly/core.js';
import {
  denominator,
  formOf,
  maxDisagreement,
  partialFractionProblems,
  solveParts,
  termTex,
  type Factor,
  type Term,
} from './core.js';

/** A decomposition shape offered on the menu, right or wrong. */
export interface FormOption {
  id: string;
  /** The shape as LaTeX, e.g. "\\frac{A}{x-1} + \\frac{B}{(x+2)^2}". */
  tex: string;
  /** Set on the one that is correct. */
  correct?: boolean;
  /** Why this shape fails. Required on the wrong ones. */
  why?: string;
}

export interface PartialFractionsProps {
  /** Numerator coefficients, ascending: [1, 3] is 3x + 1. */
  numerator?: Poly;
  factors?: Factor[];
  /** The shapes to choose between. Exactly one must be marked correct. */
  options?: FormOption[];
  /**
   * Open with the form already chosen.
   *
   * For a lesson that has taught the form elsewhere and wants the graph: the decomposition drawn
   * as separate curves is worth showing on its own, without making the reader re-answer a question
   * the surrounding prose has already answered.
   */
  revealed?: boolean;
  title?: string;
  prompt?: string;
  activity?: string;
}

const DEFAULT_NUMERATOR: Poly = [1, 3];
const DEFAULT_FACTORS: Factor[] = [
  { kind: 'linear', a: 1, b: -1 },
  { kind: 'linear', a: 1, b: 2 },
];

const DEFAULT_OPTIONS: FormOption[] = [
  { id: 'right', tex: '\\frac{A}{x-1} + \\frac{B}{x+2}', correct: true },
  {
    id: 'swapped',
    tex: '\\frac{Ax+B}{x-1} + \\frac{C}{x+2}',
    why: 'A linear numerator belongs over an irreducible quadratic. Over a linear factor it gives more unknowns than equations.',
  },
  {
    id: 'single',
    tex: '\\frac{A}{(x-1)(x+2)}',
    why: 'That is the original fraction written again. Nothing has been split.',
  },
];

const C_ORIGINAL = 'var(--stage-accent)';
const C_SUM = 'var(--stage-warn)';
const PART_COLOURS = ['var(--stage-good)', 'var(--stage-accent-2)', 'var(--stage-warn)'];

/**
 * Sample a function into runs, broken at its poles.
 *
 * A rational function is not one curve, it is one curve per interval between asymptotes. Sampling
 * it into a single Polyline draws a near-vertical line across each pole joining +∞ to −∞, which
 * looks like part of the graph and is not.
 */
function runsOf(fn: (x: number) => number, from: number, to: number, steps = 480): Vec2[][] {
  const runs: Vec2[][] = [[]];
  let previous: number | null = null;
  for (let i = 0; i <= steps; i++) {
    const x = from + ((to - from) * i) / steps;
    const y = fn(x);
    // A jump across a pole shows up as a sign flip with a large magnitude on both sides.
    const broke =
      !Number.isFinite(y) ||
      Math.abs(y) > 40 ||
      (previous !== null && Math.sign(y) !== Math.sign(previous) && Math.abs(y - previous) > 12);
    if (broke) {
      if (runs.at(-1)!.length) runs.push([]);
      previous = null;
      continue;
    }
    runs.at(-1)!.push({ x, y });
    previous = y;
  }
  return runs.filter((r) => r.length > 1);
}

const factorValue = (f: Factor, x: number): number =>
  f.kind === 'linear' ? f.a * x + f.b : f.a * x * x + f.b * x + f.c;

/** Each solved term as its own function of x, in the order the form lists them. */
function partFunctions(factors: readonly Factor[], parts: readonly Term[]): ((x: number) => number)[] {
  const fns: ((x: number) => number)[] = [];
  let at = 0;
  for (const f of factors) {
    if (f.kind === 'linear') {
      const power = f.power ?? 1;
      for (let k = 1; k <= power; k++) {
        const value = parts[at]?.value?.[0] ?? 0;
        const pow = k;
        fns.push((x) => value / Math.pow(factorValue(f, x), pow));
        at++;
      }
    } else {
      const [c = 0, b = 0] = parts[at]?.value ?? [];
      fns.push((x) => (b * x + c) / factorValue(f, x));
      at++;
    }
  }
  return fns;
}

export function PartialFractions({
  numerator = DEFAULT_NUMERATOR,
  factors = DEFAULT_FACTORS,
  options = DEFAULT_OPTIONS,
  revealed = false,
  title = 'Partial fractions: the form is the first decision',
  prompt = 'Choose the shape of the answer before finding any constant. A wrong shape cannot be rescued by careful arithmetic later.',
  activity = 'partial-fractions',
}: PartialFractionsProps = {}): ReactNode {
  const [picked, setPicked] = useState<string | null>(
    revealed ? (options.find((o) => o.correct)?.id ?? null) : null,
  );
  const [view, setView] = useState<'together' | 'parts'>(revealed ? 'parts' : 'together');

  const authoring = partialFractionProblems(numerator, factors);
  const parts = authoring.length ? null : solveParts(numerator, factors);
  const chosen = options.find((o) => o.id === picked) ?? null;
  const solved = chosen?.correct === true && parts !== null;

  useCheckpoint({ solved, activity });

  const den = denominator(factors);
  const original = (x: number): number => evalPoly(numerator, x) / evalPoly(den, x);
  const fns = parts ? partFunctions(factors, parts) : [];
  const sum = (x: number): number => fns.reduce((total, f) => total + f(x), 0);
  const disagreement = parts ? maxDisagreement(numerator, factors, parts) : Number.NaN;

  const box = { xMin: -6, xMax: 6, yMin: -8, yMax: 8 };

  const figure = (
    <Stage
      view={box}
      height={320}
      preserveAspect={false}
      ariaLabel="The original fraction and its decomposition, plotted together"
    >
      <Grid />
      <Axes labels ticks stepX={2} stepY={2} />
      {runsOf(original, box.xMin, box.xMax).map((run, i) => (
        <Polyline key={`o${i}`} points={run} color={C_ORIGINAL} weight={3} />
      ))}
      {solved && view === 'together'
        ? runsOf(sum, box.xMin, box.xMax).map((run, i) => (
            <Polyline key={`s${i}`} points={run} color={C_SUM} weight={1.8} dashed />
          ))
        : null}
      {solved && view === 'parts'
        ? fns.flatMap((fn, j) =>
            runsOf(fn, box.xMin, box.xMax).map((run, i) => (
              <Polyline
                key={`p${j}-${i}`}
                points={run}
                color={PART_COLOURS[j % PART_COLOURS.length]!}
                weight={1.8}
              />
            )),
          )
        : null}
      {solved ? (
        <Label
          x={(box.xMin + box.xMax) / 2}
          y={box.yMax - 0.7}
          text={view === 'together' ? 'dashed: the sum of the parts' : 'each part drawn separately'}
          color={view === 'together' ? C_SUM : 'var(--stage-muted)'}
          size={12}
        />
      ) : null}
    </Stage>
  );

  const claimTex = `\\frac{${polyTex(numerator)}}{${factors
    .map((f) =>
      f.kind === 'linear'
        ? `(${polyTex([f.b, f.a])})${(f.power ?? 1) > 1 ? `^${f.power}` : ''}`
        : `(${polyTex([f.c, f.b, f.a])})`,
    )
    .join('')}}`;

  return (
    <Activity.Root className="math-partial-fractions">
      <Activity.Header>
        <Activity.Heading eyebrow="Algebra" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{formOf(factors).length} terms</strong>
        <span>{formOf(factors).reduce((n, t) => n + t.unknowns, 0)} unknowns</span>
        <span>denominator degree {den.length - 1}</span>
      </Activity.Status>

      <Activity.Workspace>
        <Activity.Canvas label="The fraction and its decomposition">
          <div className="lab-proof-claim">
            <span className="lab-eyebrow">Split into partial fractions</span>
            <Tex tex={claimTex} block />
            {solved ? (
              <>
                <span className="lab-eyebrow">which splits into</span>
                <Tex tex={parts.map(termTex).join(' + ')} block />
              </>
            ) : null}
          </div>
          {figure}
        </Activity.Canvas>

        <Activity.Dock>
          <div className="lab-proof-choice">
            <span className="lab-field-label">Which form does the answer take?</span>
            <div className="lab-proof-menu">
              {options.map((option) => (
                <Chip key={option.id} selected={picked === option.id} onClick={() => setPicked(option.id)}>
                  <Tex tex={option.tex} />
                </Chip>
              ))}
            </div>
          </div>
          {solved ? (
            <Segmented
              value={view}
              options={[
                { value: 'together', label: 'Original vs the sum' },
                { value: 'parts', label: 'Each part alone' },
              ]}
              onChange={(v) => setView(v as 'together' | 'parts')}
              ariaLabel="what the graph shows"
            />
          ) : null}
        </Activity.Dock>

        {authoring.length ? (
          <Readout value="This example cannot be split" sub={authoring.join('; ')} />
        ) : solved ? (
          <Readout
            value="The two expressions are the same function"
            sub={`Largest disagreement over 40 sample points: ${disagreement.toExponential(1)}, which is rounding error rather than a difference.`}
          />
        ) : chosen ? (
          <Readout value="That form will not work" sub={chosen.why ?? 'It does not match the factors.'} />
        ) : (
          <Readout
            value="Count the unknowns first"
            sub={`The denominator has degree ${den.length - 1}, so the right form has exactly that many unknowns.`}
          />
        )}
      </Activity.Workspace>

      <Activity.Feedback>
        <span>Choosing the form</span>
        <div>
          A linear factor raised to a power needs a term at <strong>every</strong> power up to it, not just
          the highest. An irreducible quadratic needs a <strong>linear</strong> numerator, Bx + C. And the
          fraction must be proper: if the numerator's degree is not smaller than the denominator's, divide
          first. Count the unknowns and check they equal the denominator's degree, which is the quickest way
          to catch a wrong form before spending any time on it.
        </div>
      </Activity.Feedback>

      <LiveRegion>
        {solved
          ? `Decomposition found. Largest disagreement ${disagreement.toExponential(1)}.`
          : 'Choose the form of the decomposition.'}
      </LiveRegion>
    </Activity.Root>
  );
}
