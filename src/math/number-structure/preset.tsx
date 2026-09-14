'use client';
import { useState, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { ActivitySelect, Stepper } from '../../kit/controls.js';
import { Field, LiveRegion } from '../../kit/frame.js';
import { ChallengeCard, useChallenge, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { arrayState, factorPairs, gcd, isPrime, lcm, type FactorSplitStrategy, type NumberStructureMode } from './core.js';
import { NumberStructureFigure } from './visuals.js';

export interface NumberStructureProps { mode?: NumberStructureMode; value?: number; rows?: number; a?: number; b?: number; splitStrategy?: FactorSplitStrategy; title?: string; prompt?: string; activity?: string }
const MODES = [{ value: 'factor-array', label: 'Factor array' }, { value: 'prime-tree', label: 'Prime factors' }, { value: 'gcd', label: 'GCD' }, { value: 'lcm', label: 'LCM' }, { value: 'divisibility', label: 'Divisibility' }] as { value: NumberStructureMode; label: string }[];
const SPLITS = [{ value: 'balanced', label: 'Balanced split' }, { value: 'smallest', label: 'Smallest factor' }] as { value: FactorSplitStrategy; label: string }[];

function numberChoices(answer: number, candidates: number[]) {
  const values = [...new Set([answer, ...candidates, answer + 1, answer + 2])].slice(0, 3);
  return values.map((value) => ({ value: String(value), label: String(value) }));
}

function question(mode: NumberStructureMode, value: number, a: number, b: number): ChallengeQuestion {
  if (mode === 'factor-array') return { id: mode, prompt: `Will ${value} make more than one exact rectangle?`, choices: [{ value: 'yes', label: 'Yes, it is composite' }, { value: 'no', label: 'No, it is prime' }], answer: isPrime(value) ? 'no' : 'yes', explain: `Its exact arrays are ${factorPairs(value).map(p => `${p.rows}×${p.columns}`).join(', ')}.` };
  if (mode === 'prime-tree') return { id: mode, prompt: 'If you split by a different factor pair, will the final prime inventory change?', choices: [{ value: 'no', label: 'No, only the route changes' }, { value: 'yes', label: 'Yes, the primes change' }], answer: 'no', explain: 'Different valid trees converge to the same sorted prime multiset.' };
  if (mode === 'gcd') { const answer = gcd(a, b); return { id: mode, prompt: `What is the largest group size that fits ${a} and ${b} exactly?`, choices: numberChoices(answer, [Math.min(a, b), Math.max(1, answer - 1), 1]), answer: String(answer), explain: 'The GCD takes the smaller exponent of every shared prime.' }; }
  if (mode === 'lcm') { const answer = lcm(a, b); return { id: mode, prompt: `Where do cycles of ${a} and ${b} first meet?`, choices: numberChoices(answer, [a + b, Math.max(a, b), answer + Math.min(a, b)]), answer: String(answer), explain: 'The LCM takes enough of every prime to contain both numbers.' }; }
  return { id: mode, prompt: `Which evidence tests whether ${value} is divisible by 3?`, choices: [{ value: 'sum', label: 'Its digit sum is a multiple of 3' }, { value: 'last', label: 'Its last digit is even' }, { value: 'pair', label: 'Its last two digits divide by 4' }], answer: 'sum', explain: 'Because every power of ten leaves remainder 1 modulo 3, a number and its digit sum have the same remainder.' };
}

export function NumberStructureLab({ mode: initial='factor-array', value: initialValue=24, rows: initialRows=5, a: initialA=18, b: initialB=24, splitStrategy: initialSplit='balanced', title, prompt, activity='number-structure' }: NumberStructureProps): ReactNode {
  const [mode, setMode] = useState(initial);
  const [value, setValue] = useState(initialValue);
  const [rows, setRows] = useState(initialRows);
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const [splitStrategy, setSplitStrategy] = useState(initialSplit);
  const questions = [question(mode, value, a, b)], challenge = useChallenge(questions);
  useCheckpoint({ solved: challenge.allCorrect, activity: `${activity}-${mode}`, attemptKey: mode });
  const array = arrayState(value, rows), result = mode === 'gcd' ? gcd(a,b) : mode === 'lcm' ? lcm(a,b) : value;
  return <Activity.Root className="math-number-structure" focusLayout="compact">
    <Activity.Header><Activity.Heading eyebrow="Number structure" title={title ?? 'Build the number, then read its structure'} description={prompt ?? 'Arrange equal groups, split them into primes, and use the same pieces to explain factors, GCD and LCM.'} /><Activity.FocusButton /></Activity.Header>
    <Activity.Status><span>{MODES.find((item) => item.value === mode)?.label}</span><span>{mode === 'factor-array' ? `${array.rows} × ${array.columns}${array.remainder ? ` + ${array.remainder}` : ''}` : mode === 'gcd' ? `GCD = ${result}` : mode === 'lcm' ? `LCM = ${result}` : `n = ${value}`}</span></Activity.Status>
    <Activity.Workspace><Activity.Canvas label="Number structure"><NumberStructureFigure mode={mode} value={value} rows={rows} a={a} b={b} splitStrategy={splitStrategy} /></Activity.Canvas><Activity.Dock>
      <Field label="model"><ActivitySelect value={mode} options={MODES} onChange={setMode} ariaLabel="choose number model" /></Field>
      {mode === 'factor-array' || mode === 'prime-tree' || mode === 'divisibility' ? <Field label="number"><Stepper value={value} min={2} max={144} onChange={setValue} label="number to investigate" /></Field> : null}
      {mode === 'factor-array' ? <Field label="rows"><Stepper value={Math.min(rows, value)} min={1} max={Math.min(value, 16)} onChange={setRows} label="rows in the array" /></Field> : null}
      {mode === 'prime-tree' ? <Field label="first split"><ActivitySelect value={splitStrategy} options={SPLITS} onChange={setSplitStrategy} ariaLabel="factor tree split strategy" /></Field> : null}
      {mode === 'gcd' || mode === 'lcm' ? <><Field label="first number"><Stepper value={a} min={2} max={120} onChange={setA} label="first number" /></Field><Field label="second number"><Stepper value={b} min={2} max={120} onChange={setB} label="second number" /></Field></> : null}
    </Activity.Dock></Activity.Workspace>
    <ChallengeCard questions={questions} state={challenge} />
    <LiveRegion>{mode}, result {result}.</LiveRegion>
  </Activity.Root>;
}
