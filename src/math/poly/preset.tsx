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
import { LabFrame, ControlBar } from '../../kit/frame.js';
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
  expr = 'x^2 + 5x + 6', mode = 'factor', editable = true,
  title = mode === 'solve' ? 'Solve the polynomial' : 'Factor the polynomial',
  prompt = mode === 'solve' ? 'Type a polynomial; see it solved step by step.' : 'Type a polynomial; see it factored step by step.',
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
    const answerTex = mode === 'solve'
      ? sol.roots.map((r) => `x = ${toStr(r)}`).join(' \\quad\\text{or}\\quad ')
      : factorTex(p);
    return { p, sol, worked, answerTex, polyTex: polyTex(p) };
  }, [src, mode]);

  const figure = 'error' in result ? (
    <p className="lab-misconception" role="status"><span aria-hidden>⚠</span> {result.error}</p>
  ) : (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', fontSize: 19, padding: '6px 4px' }}>
        <Tex tex={`${result.polyTex}${mode === 'solve' ? ' = 0' : ''}`} block />
        <span style={{ color: 'var(--stage-muted)', fontSize: 22 }}>→</span>
        <Tex tex={result.answerTex} block />
      </div>
      <div>
        <button type="button" className="lab-chip" onClick={() => setShow((s) => !s)} aria-expanded={show}>
          {show ? '▾ hide the steps' : '▸ show the steps'}
        </button>
        {show && (
          <div style={{ marginTop: 10, border: '1px solid var(--stage-grid)', borderRadius: 12, padding: '12px 14px' }}>
            <WorkedSteps worked={result.worked} />
          </div>
        )}
      </div>
    </div>
  );

  const controls = editable ? (
    <ControlBar>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <span style={{ color: 'var(--stage-muted)', fontSize: 13 }}>{mode === 'solve' ? 'solve' : 'factor'}</span>
        <input
          value={src}
          onChange={(e) => { setSrc(e.target.value); setShow(false); }}
          aria-label="polynomial in x"
          spellCheck={false}
          style={{ flex: 1, minWidth: 180, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--stage-grid)', background: 'var(--stage-bg)', color: 'var(--stage-fg)', fontFamily: 'ui-monospace, monospace', fontSize: 14 }}
        />
      </label>
    </ControlBar>
  ) : undefined;

  return <LabFrame title={title} prompt={prompt} controls={controls}>{figure}</LabFrame>;
}
