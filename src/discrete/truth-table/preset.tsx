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

import { useMemo, useState, type ReactNode } from 'react';
import { useControlSurface, useLearner } from '@classytic/stage';
import { ToggleSwitch, Lamp } from '../../kit/logic-gates.js';
import { Tex } from '../../core/tex.js';
import { Chip, CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { useHints, HintLadder, RevealSolution, useCheckpoint } from '../../kit/pedagogy.js';
import {
  compileLogic, evalBool, classify, equivalent, logicToLatex,
  type LNode, type Classification,
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
    else if (x.kind === 'bin') { walk(x.a); walk(x.b); }
    if (x.kind === 'var' || x.kind === 'const') return;
    const key = logicToLatex(x);
    if (!seen.has(key)) { seen.add(key); out.push(x); }
  };
  walk(n);
  return out;
}

const TF = (v: boolean): ReactNode => (
  <span style={{ fontWeight: 700, color: v ? 'var(--stage-good)' : 'var(--stage-muted)' }}>{v ? 'T' : 'F'}</span>
);

export function TruthTableLab({
  formula, compare, mode: mode0 = 'fill', breakdown = true,
  title = 'Truth table', prompt, objectives, hints: hintList, controlId,
}: TruthTableProps): ReactNode {
  const compiled = useMemo(() => compileLogic(formula), [formula]);
  const cmp = useMemo(() => (compare ? compileLogic(compare) : null), [compare]);

  const [mode, setMode] = useState<TruthTableMode>(compare ? 'show' : mode0);
  const [highlight, setHighlight] = useState(-1);     // agent's pointing finger / hover
  const [filled, setFilled] = useState<(boolean | null)[]>([]);
  const [guess, setGuess] = useState<Classification | null>(null);
  const [checked, setChecked] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const [live, setLive] = useState<Record<string, boolean>>({});
  const hints = useHints(hintList);
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
      vars.forEach((v, i) => { env[v] = (m & (1 << (vars.length - 1 - i))) !== 0; });
      rows.push(env);
    }
    return rows;
  }, [vars]);

  const cols = useMemo<LNode[]>(() => {
    if (!ast) return [];
    if (cmp?.ok) return [ast, cmp.ast];                       // compare: roots only
    return mode === 'show' && breakdown ? subformulas(ast) : [ast];
  }, [ast, cmp, mode, breakdown]);

  const truth = (row: number): boolean => evalBool(ast!, envs[row]!);   // the final column's truth
  const cls = useMemo(() => (ast ? classify(ast) : 'contingency'), [ast]);
  const equiv = ast && cmp?.ok ? equivalent(ast, cmp.ast) : null;

  // fill grading
  const allFilledCorrect = mode === 'fill' && envs.length > 0 && envs.every((_, i) => filled[i] === truth(i));
  const solved = mode === 'classify' ? guess === cls && checked : allFilledCorrect && checked;
  useCheckpoint({ solved: solved && !peeked, activity: `truth-table:${formula}`, hintsUsed: hints.count });

  const cycle = (i: number): void => {
    if (peeked) return;
    setChecked(false);
    setFilled((f) => { const n = f.slice(); n[i] = n[i] == null ? true : n[i] === true ? false : null; return n; });
  };
  const check = (): void => setChecked(true);
  const reset = (): void => { setFilled([]); setGuess(null); setChecked(false); };
  const revealAll = (): void => {
    setPeeked(true);
    setFilled(envs.map((_, i) => truth(i)));
    setGuess(cls);
    setChecked(true);
    if (learner) learner.report({ activity: `truth-table:${formula}`, correct: false, completion: true, score: { raw: 0, max: 1 } });
  };

  // ── agent control surface (uniform discrete vocabulary) ──
  useControlSurface(controlId, {
    mode: { type: 'enum', label: 'interaction mode', options: ['show', 'fill', 'classify'], get: () => mode, set: (v) => setMode(v as TruthTableMode) },
    highlight: { type: 'number', label: 'spotlight row (−1 clears)', min: -1, max: Math.max(0, envs.length - 1), get: () => highlight, set: (v) => setHighlight(Math.round(v)) },
    step: { type: 'action', label: 'advance the spotlighted row', invoke: () => setHighlight((h) => (h + 1) % Math.max(1, envs.length)) },
    reveal: { type: 'action', label: 'reveal the answer', invoke: revealAll },
    check: { type: 'action', label: 'grade the current attempt', invoke: check },
    reset: { type: 'action', label: 'clear the attempt', invoke: reset },
  });

  if (!compiled.ok) {
    return (
      <LabFrame title={title}>
        <p className="lab-misconception" role="status"><span aria-hidden>⚠</span> Couldn’t parse <code>{formula}</code>: {compiled.error}</p>
      </LabFrame>
    );
  }

  if (vars.length > MAX_VARS) {
    return (
      <LabFrame title={title}>
        <p className="lab-misconception" role="status"><span aria-hidden>⚠</span> This truth table has {vars.length} variables ({2 ** vars.length} rows). Keep it to {MAX_VARS} or fewer.</p>
      </LabFrame>
    );
  }

  const th: React.CSSProperties = { padding: '6px 12px', fontWeight: 700, borderBottom: '2px solid var(--stage-grid)', textAlign: 'center', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '4px 12px', textAlign: 'center', borderBottom: '1px solid var(--stage-grid)' };
  const finalIdx = cols.length - 1;

  const figure = (
    <>
      {/* live evaluator, flip the inputs, the output lamp lights, the row glows */}
      {!compare && ast && vars.length >= 1 && vars.length <= 4 && (() => {
        const liveEnv = Object.fromEntries(vars.map((v) => [v, live[v] ?? false]));
        const liveOut = evalBool(ast, liveEnv);
        const flip = (v: string): void => setLive((L) => {
          const n = { ...L, [v]: !(L[v] ?? false) };
          const row = vars.reduce((a, vv, i) => a | (((n[vv] ?? false) ? 1 : 0) << (vars.length - 1 - i)), 0);
          setHighlight(row);
          return n;
        });
        const sw = 54, lampX = vars.length * sw + 56;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '8px 0', padding: '6px 12px', borderRadius: 10, background: 'color-mix(in oklab, var(--stage-accent) 5%, var(--stage-bg))', border: '1px solid var(--stage-grid)' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--stage-muted)' }}>try it:</span>
            <svg viewBox={`0 0 ${lampX + 56} 56`} style={{ height: 52, maxWidth: lampX + 56 }} role="img" aria-label={`inputs ${vars.map((v) => `${v}=${live[v] ? 'T' : 'F'}`).join(', ')}, output ${liveOut ? 'true' : 'false'}`}>
              {vars.map((v, i) => (
                <g key={v} onClick={() => flip(v)} style={{ cursor: 'pointer' }} role="button" aria-pressed={!!live[v]}>
                  <rect x={i * sw} y={6} width={sw} height={44} fill="transparent" />
                  <ToggleSwitch x={i * sw + 4} y={22} w={44} h={24} on={!!live[v]} label={v} />
                </g>
              ))}
              <line x1={vars.length * sw + 2} y1={34} x2={lampX - 18} y2={34} stroke={liveOut ? 'var(--stage-live)' : 'var(--stage-wire)'} strokeWidth={2.5} strokeLinecap="round" />
              <Lamp cx={lampX} cy={34} r={15} on={liveOut} />
            </svg>
            <span style={{ fontWeight: 800, color: liveOut ? 'var(--stage-good)' : 'var(--stage-muted)' }}>{liveOut ? 'TRUE' : 'FALSE'}</span>
          </div>
        );
      })()}

      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--stage-grid)', margin: '10px 0' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontVariantNumeric: 'tabular-nums' }}>
          <thead>
            <tr>
              {vars.map((v) => <th key={v} style={{ ...th, color: 'var(--stage-accent)' }}>{v}</th>)}
              {cols.map((c, ci) => (
                <th key={ci} style={{ ...th, borderLeft: ci === 0 ? '2px solid var(--stage-grid)' : undefined, background: ci === finalIdx ? 'color-mix(in oklab, var(--stage-accent) 8%, transparent)' : undefined }}>
                  <Tex tex={logicToLatex(c)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {envs.map((env, i) => (
              <tr
                key={i}
                onMouseEnter={() => setHighlight(i)}
                style={{ background: highlight === i ? 'color-mix(in oklab, var(--stage-accent) 12%, transparent)' : undefined }}
              >
                {vars.map((v) => <td key={v} style={td}>{TF(env[v]!)}</td>)}
                {cols.map((c, ci) => {
                  const val = evalBool(c, env);
                  const isFinal = ci === finalIdx && !compare;
                  // fill mode: the final column is interactive
                  if (mode === 'fill' && isFinal) {
                    const f = filled[i];
                    const right = checked && f === val;
                    const wrong = checked && f != null && f !== val;
                    return (
                      <td key={ci} style={{ ...td, borderLeft: ci === 0 ? '2px solid var(--stage-grid)' : undefined }}>
                        <button
                          type="button" onClick={() => cycle(i)}
                          aria-label={`row ${i + 1} output`}
                          style={{ minWidth: 30, padding: '2px 8px', borderRadius: 7, fontWeight: 700, cursor: peeked ? 'default' : 'pointer',
                            border: `1.5px solid ${right ? 'var(--stage-good)' : wrong ? 'var(--stage-danger)' : 'var(--stage-grid)'}`,
                            background: right ? 'color-mix(in oklab, var(--stage-good) 16%, transparent)' : wrong ? 'color-mix(in oklab, var(--stage-danger) 14%, transparent)' : 'transparent',
                            color: f == null ? 'var(--stage-muted)' : f ? 'var(--stage-good)' : 'var(--stage-fg)' }}>
                          {f == null ? '?' : f ? 'T' : 'F'}
                        </button>
                      </td>
                    );
                  }
                  return <td key={ci} style={{ ...td, borderLeft: ci === 0 ? '2px solid var(--stage-grid)' : undefined, background: isFinal ? 'color-mix(in oklab, var(--stage-accent) 5%, transparent)' : undefined }}>{TF(val)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* equivalence verdict (compare mode) */}
      {compare && equiv !== null && (
        <div className="lab-bar"><StatusPill ok={equiv}>{equiv ? 'Equivalent ✓, identical columns' : 'NOT equivalent, columns differ'}</StatusPill></div>
      )}
    </>
  );

  const controls = (
    <ControlBar>
      {!compare && (
        <>
          {(['show', 'fill', 'classify'] as TruthTableMode[]).map((m) => (
            <Chip key={m} selected={mode === m} onClick={() => { setMode(m); reset(); setPeeked(false); }}>{m}</Chip>
          ))}
        </>
      )}
      {/* classify mode */}
      {!compare && mode === 'classify' && (
        <>
          {CLASSES.map((k) => <Chip key={k} selected={guess === k} onClick={() => { setGuess(k); setChecked(false); }}>{k}</Chip>)}
          <CheckButton onClick={check} disabled={!guess}>Check</CheckButton>
          {checked && <StatusPill ok={guess === cls}>{guess === cls ? `✓ ${cls}` : `Not quite, it’s a ${cls}`}</StatusPill>}
        </>
      )}
      {/* fill mode controls */}
      {!compare && mode === 'fill' && (
        <>
          <CheckButton onClick={check} disabled={filled.filter((x) => x != null).length === 0}>Check</CheckButton>
          {checked && <StatusPill ok={allFilledCorrect}>{allFilledCorrect ? 'All correct ✓' : 'Some cells are off, fix the red ones'}</StatusPill>}
        </>
      )}
    </ControlBar>
  );

  const footer = (
    <>
      {!compare && mode !== 'show' && (
        <RevealSolution
          available={checked && !solved}
          solution={mode === 'classify'
            ? <>This formula is a <b>{cls}</b>.</>
            : <>The full column is <b>{envs.map((_, i) => (truth(i) ? 'T' : 'F')).join(' ')}</b> (top→bottom). Remember: <Tex tex={'p \\rightarrow q'} /> is false <i>only</i> when p is true and q is false.</>}
          onReveal={revealAll}
        />
      )}
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
