'use client';

/**
 * CountingSlotsLab, counting made concrete, the FUN way (the tree drowns past ~8
 * leaves; this scales and reads friendly). The multiplication principle as filling
 * a row of POSITIONS: fill slot 1 from the whole pool, slot 2 from what's left, … ,
 * the pool shrinks, the product builds (4 × 3 × 2). It covers the whole family from
 * one model:
 *   • arrange (order matters)      → permutations nPr  (k = n ⇒ factorial n!)
 *   • arrange + repeats            → nᵏ  (PINs, with replacement)
 *   • choose (order doesn't)       → combinations nCr, and you WATCH the k! orderings
 *     of one selection collapse into a single group (the ÷k! correction, made literal)
 *
 * Predict-then-check; the kernel (nPr/nCr/factorial) is the source of truth.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { factorial, nPr, nCr } from '../core/combinatorics.js';
import { ActionButton, Chip, Stepper, IconButton } from '../../kit/controls.js';
import { Field, Readout } from '../../kit/frame.js';
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
import { AuthoredResponse } from '../../kit/authored-response.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';

export type SlotMode = 'arrange' | 'choose';
export interface CountingSlotsProps {
  items?: string[];
  slots?: number;
  positions?: string[]; // labels above each slot (e.g. 🥇 🥈 🥉)
  mode?: SlotMode;
  replacement?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const allPerms = <T,>(a: T[]): T[][] =>
  a.length <= 1
    ? [a]
    : a.flatMap((x, i) => allPerms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));

export function CountingSlotsLab({
  items = ['A', 'B', 'C', 'D'],
  slots = 3,
  positions,
  mode: mode0 = 'arrange',
  replacement: repl0 = false,
  title = 'Counting by filling slots',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: CountingSlotsProps): ReactNode {
  const n = items.length;
  const [mode, setMode] = useState<SlotMode>(mode0);
  const [repl, setRepl] = useState(repl0);
  const [k, setK] = useState(Math.min(slots, repl0 ? slots : n));
  const [step, setStep] = useState(0); // slots filled so far
  const [guess, setGuess] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const hints = useHints(hintList);
  const transferQuestions = useMemo<ChallengeQuestion[]>(
    () => [
      {
        id: 'unordered-overcount',
        prompt: 'Why do we divide ordered selections by k! when order does not matter?',
        choices: [
          { value: 'same-group', label: 'the k! orders describe the same selected group' },
          { value: 'smaller-pool', label: 'the item pool becomes k! times smaller' },
          { value: 'allow-repeats', label: 'division allows items to repeat' },
        ],
        answer: 'same-group',
        explain:
          'Each unordered group appears once for every ordering of its k members, so the ordered count overcounts it k! times.',
      },
    ],
    [],
  );
  const challenge = useChallenge(transferQuestions);

  const choices = (i: number): number => (repl ? n : n - i); // choices for slot i
  const arrangeTotal = useMemo(() => (repl ? n ** k : nPr(n, k)), [repl, n, k]);
  const total = mode === 'choose' ? nCr(n, k) : arrangeTotal;
  const sample = useMemo(
    () => Array.from({ length: k }, (_, i) => items[repl ? i % n : i]!),
    [items, k, repl, n],
  );
  const productSoFar = useMemo(() => {
    let p = 1;
    for (let i = 0; i < step; i++) p *= choices(i);
    return p;
  }, [step, repl, n]);
  const filled = step >= k;

  const clearAttempt = (): void => {
    setStep(0);
    setGuess(null);
    setChecked(false);
    setPeeked(false);
  };
  const reset = (): void => {
    setMode(mode0);
    setRepl(repl0);
    setK(Math.min(slots, repl0 ? slots : n));
    clearAttempt();
    challenge.reset();
  };
  const fillNext = (): void => {
    if (checked) setStep((s) => Math.min(k, s + 1));
  };
  const solved = checked && guess === total && filled && !peeked && challenge.allCorrect;
  useCheckpoint({ solved, activity: `counting-slots:${title}`, hintsUsed: hints.count });

  useControlSurface(controlId, {
    mode: {
      type: 'enum',
      label: 'order matters?',
      options: ['arrange', 'choose'],
      get: () => mode,
      set: (v) => {
        setMode(v as SlotMode);
        clearAttempt();
      },
    },
    replacement: {
      type: 'boolean',
      label: 'allow repeats',
      get: () => repl,
      set: (v) => {
        setRepl(v);
        clearAttempt();
      },
    },
    slots: {
      type: 'number',
      label: 'positions k',
      min: 1,
      max: repl ? 6 : n,
      step: 1,
      get: () => k,
      set: (v) => {
        setK(Math.max(1, Math.min(repl ? 6 : n, Math.round(v))));
        clearAttempt();
      },
    },
    fill: { type: 'action', label: 'fill the next slot', invoke: fillNext },
    reveal: {
      type: 'action',
      label: 'reveal the count',
      invoke: () => {
        setStep(k);
        setPeeked(true);
        setGuess(total);
        setChecked(true);
      },
    },
    reset: { type: 'action', label: 'restore authored setup', invoke: reset },
  });

  const used = new Set(repl ? [] : sample.slice(0, step));
  const collapse = mode === 'choose' && filled;

  // figure: pool of items + a row of slots that fill one at a time
  const figure = (
    <div className="discrete-counting-scene">
      <div>
        <p className="lab-field-label">
          the pool, {n} to pick from{!repl && ', each used once'}
        </p>
        <div className="discrete-token-row">
          {items.map((it, i) => (
            <span key={i} className="discrete-pool-token" data-used={used.has(it)}>
              {it}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="lab-field-label">
          {k} position{k === 1 ? '' : 's'} to fill{' '}
          {mode === 'choose' ? "(a group, order won't matter)" : '(in order)'}
        </p>
        <div className="discrete-slot-row">
          {Array.from({ length: k }, (_, i) => {
            const done = i < step,
              here = i === step;
            return (
              <div key={i} className="discrete-slot-stack">
                {positions?.[i] && <span className="discrete-slot-label">{positions[i]}</span>}
                <span className="discrete-slot" data-state={done ? 'done' : here ? 'current' : 'empty'}>
                  {done ? sample[i] : here ? '?' : ''}
                </span>
                <span className="discrete-choice-count" data-done={done}>
                  {done || here ? `${choices(i)}` : '·'}
                  <span> {done || here ? 'choices' : ''}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* the product builds as slots fill */}
      <div className="discrete-running-product">
        {step === 0 ? (
          <span className="discrete-prompt-muted">Fill the first slot, how many choices?</span>
        ) : (
          <>
            <Tex tex={Array.from({ length: step }, (_, i) => choices(i)).join(' \\times ')} />
            {step < k && (
              <span className="discrete-muted">
                {' '}
                <Tex tex={'\\times \\ldots'} />
              </span>
            )}
            {filled && (
              <>
                {' '}
                = <span className="discrete-answer">{arrangeTotal}</span>{' '}
                {mode === 'arrange' ? 'arrangements' : 'ordered'}
              </>
            )}
            {!filled && <> = {productSoFar} so far</>}
          </>
        )}
      </div>

      {/* combination collapse: k! orderings of one group → 1 */}
      {collapse && (
        <div className="discrete-collapse-panel">
          <p className="lab-field-label">order doesn't matter, these are all the SAME group</p>
          {factorial(k) <= 8 ? (
            <div className="discrete-permutation-row">
              {allPerms(sample).map((p, i) => (
                <span key={i} className="discrete-permutation-token">
                  {p.join('')}
                </span>
              ))}
              <span className="discrete-collapse-arrow">→</span>
              <span className="discrete-collapsed-token">{`{${sample.join(', ')}}`} = 1</span>
            </div>
          ) : (
            <p className="discrete-collapse-copy">
              Each group of {k} can be ordered in {k}! = {factorial(k)} ways, all the same selection.
            </p>
          )}
          <p className="discrete-collapse-equation">
            <Tex tex={`${arrangeTotal} \\div ${k}! = ${arrangeTotal} \\div ${factorial(k)} =`} />{' '}
            <span className="discrete-answer">{total}</span> groups
          </p>
        </div>
      )}

      {/* the closed-form FORMULA, derived from what just happened (not stated cold) */}
      {filled && (
        <div className="discrete-formula-panel">
          <span className="discrete-formula-label">📐 SO THE FORMULA IS </span>
          <br />
          {repl ? (
            <span>
              <Tex tex={`n^{k} = ${n}^{${k}} =`} /> <b className="discrete-answer">{arrangeTotal}</b>{' '}
              <span className="discrete-muted">(each slot has all {n} again)</span>
            </span>
          ) : mode === 'arrange' ? (
            <span>
              <Tex
                tex={
                  k === n
                    ? `n! = ${n}! =`
                    : `P(${n},${k}) = ${n} \\times \\ldots \\times ${n - k + 1} = ${n}! / (${n}-${k})! =`
                }
              />{' '}
              <b className="discrete-answer">{arrangeTotal}</b>{' '}
              <span className="discrete-muted">
                (the {k === n ? '' : 'unfilled '}tail {k === n ? '' : `${n - k}!`} cancels)
              </span>
            </span>
          ) : (
            <span>
              <Tex tex={`C(${n},${k}) = P(${n},${k}) / ${k}! = ${n}! / (${k}! \\cdot (${n}-${k})!) =`} />{' '}
              <b className="discrete-answer">{total}</b>
            </span>
          )}
        </div>
      )}
    </div>
  );

  const aside = (
    <>
      <Readout
        label={
          mode === 'choose'
            ? `choose ${k} of ${n}`
            : repl
              ? `${k} from ${n} (repeats ok)`
              : k === n
                ? `arrange all ${n}`
                : `arrange ${k} of ${n}`
        }
        value={checked ? total.toLocaleString() : 'Commit an estimate'}
        sub={mode === 'choose' ? `${n}C${k}` : repl ? `${n}^${k}` : k === n ? `${n}!` : `${n}P${k}`}
      />
      <AuthoredResponse
        key={`${mode}:${repl}:${k}`}
        question={{
          id: 'counting-estimate',
          kind: 'numeric',
          prompt: 'How many ways are possible?',
          answer: total,
          tolerance: 0,
          explain: `Correct: ${total.toLocaleString()} ways. Now build the product slot by slot.`,
          tryAgain: 'Commit the estimate, then use the shrinking number of choices in each slot as evidence.',
        }}
        onRespond={(result) => {
          setGuess(typeof result.response === 'number' ? result.response : null);
          setChecked(true);
        }}
      />
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      <Field label="order">
        <span className="discrete-choice-row">
          <Chip
            selected={mode === 'arrange'}
            onClick={() => {
              setMode('arrange');
              clearAttempt();
            }}
          >
            matters (arrange)
          </Chip>
          <Chip
            selected={mode === 'choose'}
            onClick={() => {
              setMode('choose');
              setRepl(false);
              clearAttempt();
            }}
          >
            doesn't (choose)
          </Chip>
        </span>
      </Field>
      {mode === 'arrange' && (
        <Field label="repeats">
          <Chip
            selected={repl}
            onClick={() => {
              setRepl((r) => !r);
              clearAttempt();
            }}
          >
            {repl ? 'allowed (nᵏ)' : 'each once'}
          </Chip>
        </Field>
      )}
      <Field label="positions k">
        <Stepper
          label="positions"
          value={k}
          onChange={(v) => {
            setK(Math.max(1, Math.min(repl ? 6 : n, v)));
            clearAttempt();
          }}
          min={1}
          max={repl ? 6 : n}
        />
      </Field>
    </div>
  );

  const footer = (
    <>
      <RevealSolution
        available={!filled || (checked && !solved)}
        buttonLabel="Show the count"
        solution={
          <>
            {mode === 'choose' ? `${n}C${k}` : repl ? `${n}^${k}` : k === n ? `${n}!` : `${n}P${k}`} ={' '}
            <b>{total}</b>
            {mode === 'choose' && (
              <>
                {' '}
                (={arrangeTotal} ÷ {k}!)
              </>
            )}
            .
          </>
        }
        onReveal={() => {
          setStep(k);
          setPeeked(true);
          setGuess(total);
          setChecked(true);
        }}
      />
      <ChallengeCard questions={transferQuestions} state={challenge} title="Explain the correction" />
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root className="discrete-counting-slots-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Permutations and combinations"
          title={title}
          description={
            prompt ??
            'Commit a count, then fill each position to expose the product and any overcount correction.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{checked ? `${total.toLocaleString()} ways` : 'Predict first'}</strong>
        <span>
          {step}/{k} slots
        </span>
        <span>{mode === 'choose' ? 'order ignored' : repl ? 'repeats allowed' : 'no repeats'}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Counting slots">{figure}</Activity.Canvas>
        <Activity.Inspector label="Estimate and counting setup">
          <div className="lab-activity-fields">
            {aside}
            {controls}
          </div>
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {filled
            ? mode === 'choose'
              ? `The ${arrangeTotal} ordered fillings collapse in groups of ${k}!, leaving ${total} selections.`
              : `The slot-by-slot product gives ${total} arrangements.`
            : 'Each filled slot exposes the number of choices still available at that position.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Counting-slots explanation and support">
        {footer}
      </section>
      <Activity.LiveRegion>
        {checked
          ? `${guess ?? 'Blank'} was committed. ${step} of ${k} slots are filled.`
          : `Estimate the number of ways before filling the ${k} slots.`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <IconButton label="Reset counting slots" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state">
          <strong>{checked ? 'Estimate committed' : 'Awaiting prediction'}</strong>
          <span>
            {step} of {k} slots
          </span>
        </div>
        <ActionButton onClick={fillNext} disabled={!checked || filled}>
          {filled ? 'Slots filled' : 'Fill next slot'}
        </ActionButton>
      </Activity.Transport>
    </Activity.Root>
  );
}
