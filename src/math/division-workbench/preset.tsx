'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { ActivitySelect, Stepper } from '../../kit/controls.js';
import { Field, LiveRegion } from '../../kit/frame.js';
import { ChallengeCard, useChallenge, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { divisionModel, formatQuotient, type DivisionMode } from './core.js';
import { DivisionFigure } from './visuals.js';

export interface DivisionWorkbenchProps { mode?: DivisionMode; dividend?: number; divisor?: number; precision?: number; title?: string; prompt?: string; activity?: string }
const MODES = [{ value:'share', label:'Share equally' }, { value:'written', label:'Written method' }, { value:'decimal', label:'Decimal divisor' }] as { value: DivisionMode; label: string }[];

function rotateChoices<T>(choices: T[], seed: number): T[] {
  const offset = Math.abs(seed) % choices.length;
  return [...choices.slice(offset), ...choices.slice(0, offset)];
}

function distinctDistractors(answer: string, candidates: number[]): string[] {
  const choices = candidates.map(String).filter((value, index, values) => value !== answer && values.indexOf(value) === index);
  for (let next = 1; choices.length < 2; next += 1) {
    const value = String(Number(answer) + next);
    if (value !== answer && !choices.includes(value)) choices.push(value);
  }
  return choices.slice(0, 2);
}

function buildQuestion(mode: DivisionMode, dividend: number, divisor: number): ChallengeQuestion {
  const model = divisionModel(dividend, divisor), answer = formatQuotient(model.quotient);
  const seed = Math.round(dividend * 10) + Math.round(divisor * 10) + mode.length;
  if (mode === 'decimal') return { id:`${mode}-${dividend}-${divisor}`, prompt:'Why may both numbers be multiplied by the same power of ten?', choices:rotateChoices([{value:'ratio',label:'The ratio and quotient stay unchanged'},{value:'round',label:'It rounds both numbers equally'},{value:'larger',label:'A larger divisor is easier'}], seed), answer:'ratio', explain:'Scaling dividend and divisor equally creates an equivalent division.' };
  const [first, second] = distinctDistractors(answer, [model.integerQuotient + 1, model.remainder, model.integerQuotient, Math.ceil(model.quotient)]);
  return { id:`${mode}-${dividend}-${divisor}`, prompt:`What is ${dividend} ÷ ${divisor}?`, choices:rotateChoices([{value:'correct',label:answer},{value:'near',label:first},{value:'remainder',label:second}], seed), answer:'correct', explain:model.remainder ? `${model.integerQuotient} whole groups remain, with ${model.remainder} normalized unit(s) left to partition.` : 'Every unit is distributed into equal groups with nothing left over.' };
}

export function DivisionWorkbenchLab({ mode: initial='share', dividend: initialDividend=156, divisor: initialDivisor=4, precision=4, title, prompt, activity='division-workbench' }: DivisionWorkbenchProps): ReactNode {
  const [mode,setMode] = useState(initial), [dividend,setDividend] = useState(initialDividend), [divisor,setDivisor] = useState(initialDivisor);
  const safeDivisor = Math.max(mode === 'decimal' ? 0.1 : 1, divisor);
  const model = useMemo(() => divisionModel(dividend, safeDivisor), [dividend, safeDivisor]);
  const questions = useMemo(() => [buildQuestion(mode, dividend, safeDivisor)], [mode, dividend, safeDivisor]);
  const challenge = useChallenge(questions);
  useCheckpoint({ solved:challenge.allCorrect, activity:`${activity}-${mode}`, attemptKey:`${mode}-${dividend}-${safeDivisor}` });
  const result = formatQuotient(model.quotient, precision);
  const setOperand = (setter: (value: number) => void) => (value: number) => setter(mode === 'decimal' ? Math.round(value * 10) / 10 : value);
  return <Activity.Root className="math-division-workbench" focusLayout="compact">
    <Activity.Header><Activity.Heading eyebrow="Division and place value" title={title ?? 'Exchange, share, and make every digit accountable'} description={prompt ?? 'Build division from equal sharing, then connect each exchange to the written method and decimal notation.'} /><Activity.FocusButton /></Activity.Header>
    <Activity.Status><span>{dividend} ÷ {safeDivisor}</span><span>quotient {result}</span>{model.remainder ? <span>remainder {model.remainder}</span> : <span>exact</span>}</Activity.Status>
    <Activity.Workspace><Activity.Canvas label="Division workbench"><DivisionFigure mode={mode} model={model} /></Activity.Canvas><Activity.Dock>
      <Field label="representation"><ActivitySelect value={mode} options={MODES} onChange={(next) => { setMode(next); if (next === 'decimal' && Number.isInteger(safeDivisor)) { setDividend(12.6); setDivisor(0.3); } }} ariaLabel="division representation" /></Field>
      <Field label="dividend"><Stepper value={dividend} min={mode === 'decimal' ? 0.1 : 1} max={mode === 'decimal' ? 30 : 240} step={mode === 'decimal' ? 0.1 : 1} onChange={setOperand(setDividend)} label="dividend" /></Field>
      <Field label="divisor"><Stepper value={safeDivisor} min={mode === 'decimal' ? 0.1 : 1} max={mode === 'decimal' ? 5 : 12} step={mode === 'decimal' ? 0.1 : 1} onChange={setOperand(setDivisor)} label="divisor" /></Field>
    </Activity.Dock></Activity.Workspace>
    <ChallengeCard questions={questions} state={challenge} />
    <LiveRegion>{dividend} divided by {safeDivisor} is {result}.</LiveRegion>
  </Activity.Root>;
}
