'use client';

/**
 * TruthTableEngine, the GENERAL authorable truth-table tool. A creator declares
 * any propositional formula (¬ ∧ ∨ ⊕ → ↔, unicode or ASCII) and a mode; the lab
 * derives EVERYTHING from the stage logic kernel (parse → truth table → classify
 * → equivalence). No per-problem widget, one tool covers all of propositional
 * logic, from "fill the implication table" to "are these two equivalent?".
 *
 * Modes:
 *   • show    , full reference table with sub-expression columns built up
 *                textbook-style (vars → ¬p → q∧r → … → the whole formula).
 *   • fill    , learner toggles each output cell, then Check (graded per cell).
 *   • classify, learner judges tautology / contradiction / contingency.
 * Pass `compare` to put a second formula beside the first + an equivalence verdict
 * (De Morgan, contrapositive, p→q ≡ ¬p∨q …). Agent-drivable via `controlId`.
 */

import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useControlSurface, useLearner } from '@classytic/stage';
import { ToggleSwitch, Lamp } from '../../kit/logic-gates/display.js';
import { Tex } from '../../core/tex.js';
import { Chip, CheckButton, StatusPill } from '../../kit/controls.js';
import { Activity } from '../../kit/activity.js';
import {
  useHints,
  HintLadder,
  RevealSolution,
  useCheckpoint,
  useChallenge,
  ChallengeCard,
  type ChallengeQuestion,
} from '../../kit/pedagogy.js';
import {
  compileLogic,
  evalBool,
  classify,
  equivalent,
  logicToLatex,
  type LNode,
  type Classification,
} from '../index.js';

export type TruthTableMode = 'show' | 'fill' | 'classify';

export interface TruthTableProps {
  formula: string;
  /** Optional second formula → side-by-side columns + an equivalence verdict. */
  compare?: string;
  mode?: TruthTableMode;
  /** Show the built-up sub-expression columns (show mode). Default true. */
  breakdown?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const CLASSES: Classification[] = ['tautology', 'contradiction', 'contingency'];
/** 2^n rows: past this a truth table is impractical to render and unsafe for 32-bit shifts. */
const MAX_VARS = 12;

/** Sub-expressions in build-up (post-order) order, deduped, vars/consts excluded;
 *  the root formula is last. */
function subformulas(n: LNode): LNode[] {
  const out: LNode[] = [];
  const seen = new Set<string>();
  const walk = (x: LNode): void => {
    if (x.kind === 'not') walk(x.a);
    else if (x.kind === 'bin') {
      walk(x.a);
      walk(x.b);
    }
    if (x.kind === 'var' || x.kind === 'const') return;
    const key = logicToLatex(x);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(x);
    }
  };
  walk(n);
  return out;
}

const TF = (v: boolean): ReactNode => (
  <span className="logic-truth-value" data-value={v}>
    {v ? 'T' : 'F'}
  </span>
);

export function TruthTableLab({
  formula,
  compare,
  mode: mode0 = 'fill',
  breakdown = true,
  title = 'Truth table',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: TruthTableProps): ReactNode {
  const compiled = useMemo(() => compileLogic(formula), [formula]);
  const cmp = useMemo(() => (compare ? compileLogic(compare) : null), [compare]);

  const [mode, setMode] = useState<TruthTableMode>(compare ? 'show' : mode0);
  const [highlight, setHighlight] = useState(-1); // agent's pointing finger / hover
  const [filled, setFilled] = useState<(boolean | null)[]>([]);
  const [guess, setGuess] = useState<Classification | null>(null);
  const [checked, setChecked] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const [live, setLive] = useState<Record<string, boolean>>({});
  const hints = useHints(hintList);
  const transferQuestions = useMemo<ChallengeQuestion[]>(
    () => [
      {
        id: 'classification-transfer',
        prompt: 'A formula’s final column contains at least one T and at least one F. How is it classified?',
        choices: [
          { value: 'contingency', label: 'contingency' },
          { value: 'tautology', label: 'tautology' },
          { value: 'contradiction', label: 'contradiction' },
        ],
        answer: 'contingency',
        explain:
          'A contingency is true for some assignments and false for others; tautologies and contradictions have uniform final columns.',
      },
    ],
    [],
  );
  const challenge = useChallenge(transferQuestions);
  const learner = useLearner();

  const ast = compiled.ok ? compiled.ast : null;
  const vars = useMemo(() => {
    if (!ast) return [];
    const s = new Set(compiled.ok ? compiled.vars : []);
    if (cmp?.ok) cmp.vars.forEach((v) => s.add(v));
    return [...s].sort();
  }, [ast, compiled, cmp]);

  // every assignment (MSB = first var), evaluated lazily per column
  const envs = useMemo(() => {
    if (vars.length > MAX_VARS) return []; // guarded below; don't enumerate 2^n
    const rows: Record<string, boolean>[] = [];
    for (let m = 0; m < 2 ** vars.length; m++) {
      const env: Record<string, boolean> = {};
      vars.forEach((v, i) => {
        env[v] = (m & (1 << (vars.length - 1 - i))) !== 0;
      });
      rows.push(env);
    }
    return rows;
  }, [vars]);

  const cols = useMemo<LNode[]>(() => {
    if (!ast) return [];
    if (cmp?.ok) return [ast, cmp.ast]; // compare: roots only
    return mode === 'show' && breakdown ? subformulas(ast) : [ast];
  }, [ast, cmp, mode, breakdown]);

  const truth = (row: number): boolean => evalBool(ast!, envs[row]!); // the final column's truth
  const cls = useMemo(() => (ast ? classify(ast) : 'contingency'), [ast]);
  const equiv = ast && cmp?.ok ? equivalent(ast, cmp.ast) : null;

  // fill grading
  const allFilledCorrect = mode === 'fill' && envs.length > 0 && envs.every((_, i) => filled[i] === truth(i));
  const solved =
    (mode === 'classify' ? guess === cls && checked : allFilledCorrect && checked) && challenge.allCorrect;
  useCheckpoint({ solved: solved && !peeked, activity: `truth-table:${formula}`, hintsUsed: hints.count });

  const cycle = (i: number): void => {
    if (peeked) return;
    setChecked(false);
    setFilled((f) => {
      const n = f.slice();
      n[i] = n[i] == null ? true : n[i] === true ? false : null;
      return n;
    });
  };
  const check = (): void => setChecked(true);
  const reset = (): void => {
    setFilled([]);
    setGuess(null);
    setChecked(false);
    setPeeked(false);
    challenge.reset();
  };
  const revealAll = (): void => {
    setPeeked(true);
    setFilled(envs.map((_, i) => truth(i)));
    setGuess(cls);
    setChecked(true);
    if (learner)
      learner.report({
        activity: `truth-table:${formula}`,
        correct: false,
        completion: true,
        score: { raw: 0, max: 1 },
      });
  };

  // ── agent control surface (uniform discrete vocabulary) ──
  useControlSurface(controlId, {
    mode: {
      type: 'enum',
      label: 'interaction mode',
      options: ['show', 'fill', 'classify'],
      get: () => mode,
      set: (v) => setMode(v as TruthTableMode),
    },
    highlight: {
      type: 'number',
      label: 'spotlight row (−1 clears)',
      min: -1,
      max: Math.max(0, envs.length - 1),
      get: () => highlight,
      set: (v) => setHighlight(Math.round(v)),
    },
    step: {
      type: 'action',
      label: 'advance the spotlighted row',
      invoke: () => setHighlight((h) => (h + 1) % Math.max(1, envs.length)),
    },
    reveal: { type: 'action', label: 'reveal the answer', invoke: revealAll },
    check: { type: 'action', label: 'grade the current attempt', invoke: check },
    reset: { type: 'action', label: 'clear the attempt', invoke: reset },
  });

  if (!compiled.ok) {
    return (
      <Activity.Root>
        <Activity.Header>
          <Activity.Heading eyebrow="Propositional logic" title={title} />
        </Activity.Header>
        <Activity.Feedback>
          <span>Formula error</span>
          <div>
            Couldn’t parse <code>{formula}</code>: {compiled.error}
          </div>
        </Activity.Feedback>
      </Activity.Root>
    );
  }

  if (vars.length > MAX_VARS) {
    return (
      <Activity.Root>
        <Activity.Header>
          <Activity.Heading eyebrow="Propositional logic" title={title} />
        </Activity.Header>
        <Activity.Feedback>
          <span>Table limit</span>
          <div>
            This truth table has {vars.length} variables ({2 ** vars.length} rows). Keep it to {MAX_VARS} or
            fewer.
          </div>
        </Activity.Feedback>
      </Activity.Root>
    );
  }

  const finalIdx = cols.length - 1;

  const figure = (
    <>
      {/* live evaluator, flip the inputs, the output lamp lights, the row glows */}
      {!compare &&
        ast &&
        vars.length >= 1 &&
        vars.length <= 4 &&
        (() => {
          const liveEnv = Object.fromEntries(vars.map((v) => [v, live[v] ?? false]));
          const liveOut = evalBool(ast, liveEnv);
          const flip = (v: string): void =>
            setLive((L) => {
              const n = { ...L, [v]: !(L[v] ?? false) };
              const row = vars.reduce(
                (a, vv, i) => a | (((n[vv] ?? false) ? 1 : 0) << (vars.length - 1 - i)),
                0,
              );
              setHighlight(row);
              return n;
            });
          const sw = 54,
            lampX = vars.length * sw + 56;
          return (
            <div className="logic-live-evaluator">
              <span className="logic-live-label">try it:</span>
              <svg
                className="logic-live-svg"
                viewBox={`0 0 ${lampX + 56} 56`}
                role="img"
                aria-label={`inputs ${vars.map((v) => `${v}=${live[v] ? 'T' : 'F'}`).join(', ')}, output ${liveOut ? 'true' : 'false'}`}
              >
                {vars.map((v, i) => (
                  <g
                    key={v}
                    className="logic-live-toggle"
                    onClick={() => flip(v)}
                    onKeyDown={(event: KeyboardEvent<SVGGElement>) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        flip(v);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={!!live[v]}
                    aria-label={`toggle ${v}, currently ${live[v] ? 'true' : 'false'}`}
                  >
                    <rect x={i * sw} y={6} width={sw} height={44} fill="transparent" />
                    <ToggleSwitch x={i * sw + 4} y={22} w={44} h={24} on={!!live[v]} label={v} />
                  </g>
                ))}
                <line
                  x1={vars.length * sw + 2}
                  y1={34}
                  x2={lampX - 18}
                  y2={34}
                  stroke={liveOut ? 'var(--stage-live)' : 'var(--stage-wire)'}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                <Lamp cx={lampX} cy={34} r={15} on={liveOut} />
              </svg>
              <span className="logic-live-output" data-value={liveOut}>
                {liveOut ? 'TRUE' : 'FALSE'}
              </span>
            </div>
          );
        })()}

      <div className="logic-table-scroll">
        <table className="logic-truth-table">
          <thead>
            <tr>
              {vars.map((v) => (
                <th key={v} data-variable>
                  {v}
                </th>
              ))}
              {cols.map((c, ci) => (
                <th key={ci} data-expression-start={ci === 0} data-final={ci === finalIdx}>
                  <Tex tex={logicToLatex(c)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {envs.map((env, i) => (
              <tr key={i} onMouseEnter={() => setHighlight(i)} data-highlighted={highlight === i}>
                {vars.map((v) => (
                  <td key={v}>{TF(env[v]!)}</td>
                ))}
                {cols.map((c, ci) => {
                  const val = evalBool(c, env);
                  const isFinal = ci === finalIdx && !compare;
                  // fill mode: the final column is interactive
                  if (mode === 'fill' && isFinal) {
                    const f = filled[i];
                    const right = checked && f === val;
                    const wrong = checked && f != null && f !== val;
                    return (
                      <td key={ci} data-expression-start={ci === 0}>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => cycle(i)}
                          aria-label={`row ${i + 1} output`}
                          className="logic-answer-cell"
                          data-state={
                            right ? 'correct' : wrong ? 'wrong' : f == null ? 'empty' : f ? 'true' : 'false'
                          }
                          disabled={peeked}
                        >
                          {f == null ? '?' : f ? 'T' : 'F'}
                        </Button>
                      </td>
                    );
                  }
                  return (
                    <td key={ci} data-expression-start={ci === 0} data-final={isFinal}>
                      {TF(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* equivalence verdict (compare mode) */}
      {compare && equiv !== null && (
        <div className="lab-bar">
          <StatusPill ok={equiv}>
            {equiv ? 'Equivalent ✓, identical columns' : 'NOT equivalent, columns differ'}
          </StatusPill>
        </div>
      )}
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      {!compare && (
        <>
          {(['show', 'fill', 'classify'] as TruthTableMode[]).map((m) => (
            <Chip
              key={m}
              selected={mode === m}
              onClick={() => {
                setMode(m);
                reset();
              }}
            >
              {m}
            </Chip>
          ))}
        </>
      )}
      {/* classify mode */}
      {!compare && mode === 'classify' && (
        <>
          {CLASSES.map((k) => (
            <Chip
              key={k}
              selected={guess === k}
              onClick={() => {
                setGuess(k);
                setChecked(false);
              }}
            >
              {k}
            </Chip>
          ))}
          <CheckButton onClick={check} disabled={!guess}>
            Check
          </CheckButton>
          {checked && (
            <StatusPill ok={guess === cls}>
              {guess === cls ? `✓ ${cls}` : `Not quite, it’s a ${cls}`}
            </StatusPill>
          )}
        </>
      )}
      {/* fill mode controls */}
      {!compare && mode === 'fill' && (
        <>
          <CheckButton onClick={check} disabled={filled.filter((x) => x != null).length !== envs.length}>
            Check
          </CheckButton>
          {checked && (
            <StatusPill ok={allFilledCorrect}>
              {allFilledCorrect ? 'All correct ✓' : 'Some cells are off, fix the red ones'}
            </StatusPill>
          )}
        </>
      )}
    </div>
  );

  const footer = (
    <>
      {!compare && mode !== 'show' && (
        <RevealSolution
          available={checked && !solved}
          solution={
            mode === 'classify' ? (
              <>
                This formula is a <b>{cls}</b>.
              </>
            ) : (
              <>
                The full column is <b>{envs.map((_, i) => (truth(i) ? 'T' : 'F')).join(' ')}</b> (top→bottom).
                Remember: <Tex tex={'p \\rightarrow q'} /> is false <i>only</i> when p is true and q is false.
              </>
            )
          }
          onReveal={revealAll}
        />
      )}
      {!compare && mode !== 'show' && (
        <ChallengeCard
          questions={transferQuestions}
          state={challenge}
          title="Transfer the classification rule"
        />
      )}
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root className="discrete-truth-table-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Propositional logic"
          title={title}
          description={
            prompt ??
            'Change inputs, complete or inspect the output column, and connect its pattern to logical classification.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          {compare ? (equiv ? 'Equivalent' : 'Not equivalent') : mode === 'classify' && checked ? cls : mode}
        </strong>
        <span>{vars.length} variables</span>
        <span>{envs.length} rows</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Truth table and live evaluator">{figure}</Activity.Canvas>
        <Activity.Inspector label="Truth-table mode and grading">{controls}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {compare
            ? 'Equivalent formulas produce identical final columns for every assignment.'
            : mode === 'fill'
              ? 'Each row is one complete input assignment; the final column records the formula’s result.'
              : 'Classification depends on whether the final column is always true, always false, or mixed.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Truth-table explanation and support">
        {footer}
      </section>
      {!compare && mode !== 'show' ? (
        <Activity.LiveRegion>
          {mode === 'fill'
            ? `${filled.filter((value) => value != null).length} of ${envs.length} output cells completed.`
            : guess
              ? `${guess} selected for classification.`
              : 'Choose a classification.'}
        </Activity.LiveRegion>
      ) : null}
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{checked ? 'Attempt checked' : 'Evaluate every assignment'}</strong>
          <span>
            {filled.filter((value) => value != null).length} of {envs.length} outputs
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
