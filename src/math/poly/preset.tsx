'use client';

/**
 * PolynomialSolverLab, the dynamic "factor & solve" TOOL (the solver path, vs the
 * curated lesson path). Type or author a polynomial; the engine factors it / solves
 * it = 0 and SHOWS THE WORKING using the school method (split the middle term;
 * factor theorem for higher degree). Runs entirely client-side on the canonical
 * poly core — no heavy CAS dependency. "Show the steps" is a reveal so the learner
 * can try first.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { compileExpr } from '@classytic/stage';
import { Tex } from '../../core/tex.js';
import { Activity } from '../../kit/activity.js';
import { Chip, TextInput } from '../../kit/controls.js';
import { WorkedSteps } from '../../kit/rule.js';
import { toStr } from '../complex/core.js';
import { fromAst, factorTex, solve, polyTex } from './core.js';
import { factorSteps, solveSteps } from './steps.js';

export type SolverMode = 'factor' | 'solve';

export interface PolynomialSolverProps {
  /** The polynomial in x, e.g. "x^2 + 5x + 6" or "x^3 - 6x^2 + 11x - 6". */
  expr?: string;
  mode?: SolverMode;
  /** Let the learner edit the polynomial (the live solver). Default true. */
  editable?: boolean;
  height?: number;
  title?: string;
  prompt?: string;
}

export function PolynomialSolverLab({
  expr = 'x^2 + 5x + 6',
  mode = 'factor',
  editable = true,
  title = mode === 'solve' ? 'Solve the polynomial' : 'Factor the polynomial',
  prompt = mode === 'solve'
    ? 'Type a polynomial; see it solved step by step.'
    : 'Type a polynomial; see it factored step by step.',
}: PolynomialSolverProps = {}): ReactNode {
  const [src, setSrc] = useState(expr);
  const [show, setShow] = useState(false);

  const result = useMemo(() => {
    const c = compileExpr(src);
    if (c.error || !c.ast) return { error: 'Could not read that expression.' as const };
    const p = fromAst(c.ast);
    if (!p) return { error: 'That is not a polynomial in x.' as const };
    if (p.length <= 1) return { error: 'Enter a polynomial in x (degree ≥ 1).' as const };
    const sol = solve(p)!;
    const worked = mode === 'solve' ? solveSteps(p) : factorSteps(p);
    const answerTex =
      mode === 'solve'
        ? sol.roots.map((r) => `x = ${toStr(r)}`).join(' \\quad\\text{or}\\quad ')
        : factorTex(p);
    return { p, sol, worked, answerTex, polyTex: polyTex(p) };
  }, [src, mode]);

  const figure =
    'error' in result ? (
      <p className="lab-misconception" role="status">
        <span aria-hidden>⚠</span> {result.error}
      </p>
    ) : (
      <div className="math-polynomial-result">
        <div className="math-polynomial-equation">
          <Tex tex={`${result.polyTex}${mode === 'solve' ? ' = 0' : ''}`} block />
          <span className="math-polynomial-arrow">→</span>
          <Tex tex={result.answerTex} block />
        </div>
        <div>
          <Chip selected={show} onClick={() => setShow((s) => !s)} aria-pressed={show}>
            {show ? '▾ hide the steps' : '▸ show the steps'}
          </Chip>
          {show && (
            <div className="math-polynomial-steps">
              <WorkedSteps worked={result.worked} />
            </div>
          )}
        </div>
      </div>
    );

  const controls = editable ? (
    <div className="lab-activity-fields">
      <label className="math-polynomial-input">
        <span>{mode === 'solve' ? 'solve' : 'factor'}</span>
        <TextInput
          value={src}
          onChange={(value) => {
            setSrc(value);
            setShow(false);
          }}
          label="polynomial in x"
          mono
        />
      </label>
    </div>
  ) : undefined;

  const hasError = 'error' in result;
  return (
    <Activity.Root className="math-polynomial-solver-activity">
      <Activity.Header>
        <Activity.Heading eyebrow="Polynomial tools" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          {hasError ? 'Check the expression' : mode === 'solve' ? 'Polynomial solved' : 'Polynomial factored'}
        </strong>
        <span>{mode}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Polynomial result">{figure}</Activity.Canvas>
        {controls ? <Activity.Inspector label="Polynomial input">{controls}</Activity.Inspector> : null}
      </Activity.Workspace>
      <Activity.Feedback>
        <span>{hasError ? 'Input' : 'Method'}</span>
        <div>
          {hasError ? result.error : 'Reveal the working when you are ready to compare each algebraic step.'}
        </div>
      </Activity.Feedback>
      <Activity.LiveRegion>
        {hasError ? result.error : `${mode === 'solve' ? 'Solution' : 'Factorization'} ready.`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{show ? 'Working revealed' : 'Try it first'}</strong>
          <span>{editable ? 'edit the polynomial to explore another case' : mode}</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
