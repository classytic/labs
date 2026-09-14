'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Tex } from '../../core/tex.js';
import { Activity } from '../../kit/activity.js';
import { ActionButton, AssessedChoiceGroup, IconButton } from '../../kit/controls.js';
import {
  DEFAULT_EXPRESSION_ORDER_ROUNDS,
  expressionLatex,
  validateExpressionOrderRounds,
  type ExpressionOrderRound,
} from './core.js';

export interface ExpressionOrderMessages {
  eyebrow: string;
  title: string;
  description: string;
  choose: string;
  check: string;
  nextStep: string;
  nextPuzzle: string;
  previous: string;
  reset: string;
  correct: string;
  tryAgain: string;
  /** Fallback only. A round that names its own distractors says something better than this. */
  tryAgainWhy: string;
  start: string;
  result: string;
}

export interface ExpressionOrderProps {
  rounds?: ExpressionOrderRound[];
  startAt?: number;
  title?: string;
  prompt?: string;
  messages?: Partial<ExpressionOrderMessages>;
}

const DEFAULT_MESSAGES: ExpressionOrderMessages = {
  eyebrow: 'Order of operations', title: 'Make every operation wait its turn',
  description: 'Predict the first move, then reduce one valid step at a time.', choose: 'Choose the first operation',
  check: 'Check', nextStep: 'Show next step', nextPuzzle: 'Next puzzle', previous: 'Previous puzzle', reset: 'Start again',
  correct: 'Good first move', tryAgain: 'That operation must wait',
  tryAgainWhy: 'Check which operations share a level, and which brackets the sign sits inside.',
  start: 'Start', result: 'Result',
};

export function ExpressionOrderLab({ rounds = DEFAULT_EXPRESSION_ORDER_ROUNDS, startAt = 0, title, prompt, messages }: ExpressionOrderProps = {}): ReactNode {
  const copy = { ...DEFAULT_MESSAGES, ...messages };
  const issues = useMemo(() => validateExpressionOrderRounds(rounds), [rounds]);
  const safeStart = Math.max(0, Math.min(rounds.length - 1, startAt));
  const [index, setIndex] = useState(safeStart);
  const [selected, setSelected] = useState('');
  const [checked, setChecked] = useState(false);
  const [step, setStep] = useState(0);
  const round = rounds[index];

  if (!round || issues.length > 0) return <Activity.Root><Activity.Feedback><strong>Activity configuration needs attention.</strong><span>{issues[0] ?? 'Add a round.'}</span></Activity.Feedback></Activity.Root>;
  const correct = selected === round.answer;
  const fullyReduced = checked && correct && step === round.steps.length;
  const shownExpression = step === 0 ? round.expression : round.steps[step - 1]!.expression;
  const changeRound = (next: number): void => { setIndex(next); setSelected(''); setChecked(false); setStep(0); };
  const reset = (): void => changeRound(safeStart);

  return <Activity.Root className="expression-order-activity" focusLayout="compact" dir="auto">
    <Activity.Header><Activity.Heading eyebrow={copy.eyebrow} title={title ?? copy.title} description={prompt ?? copy.description} /><Activity.FocusButton /></Activity.Header>
    <Activity.Status><span>Puzzle {index + 1} of {rounds.length}</span><span>{step === 0 ? copy.start : `Step ${step} of ${round.steps.length}`}</span></Activity.Status>
    <Activity.Workspace><Activity.Canvas label={`Expression-order puzzle ${index + 1}`}>
      <div className="expression-order-scene">
        <div className="expression-order-formula" aria-label={shownExpression}><Tex tex={expressionLatex(shownExpression)} /></div>
        {step === 0 ? <section className="expression-order-question"><strong>{round.prompt}</strong><AssessedChoiceGroup value={selected} onChange={(value) => { setSelected(value); setChecked(false); }} options={round.choices.map((choice) => ({ ...choice, tone: checked && choice.value === selected ? correct ? 'correct' : 'wrong' : undefined }))} ariaLabel={copy.choose} /></section> : null}
        {step > 0 ? <div className="expression-order-rule"><span>{step}</span><p>{round.steps[step - 1]!.rule}</p></div> : null}
        <ol className="expression-order-trail" aria-label="Revealed evaluation steps">
          <li data-current={step === 0 || undefined}><span>{copy.start}</span><Tex tex={expressionLatex(round.expression)} /></li>
          {round.steps.slice(0, step).map((item, itemIndex) => <li key={`${round.id}-${itemIndex}`} data-visible="true" data-current={itemIndex + 1 === step || undefined}><span>{itemIndex + 1 === round.steps.length ? copy.result : `Step ${itemIndex + 1}`}</span><Tex tex={expressionLatex(item.expression)} /></li>)}
        </ol>
      </div>
    </Activity.Canvas></Activity.Workspace>
    {checked ? <Activity.Feedback><span>{correct ? copy.correct : copy.tryAgain}</span><p>{round.choices.find((choice) => choice.value === selected)?.feedback ?? (correct ? round.steps[0]?.rule : copy.tryAgainWhy)}</p></Activity.Feedback> : null}
    <Activity.Transport>
      <IconButton label={copy.reset} onClick={reset}><RotateCcw aria-hidden="true" /></IconButton>
      <IconButton label={copy.previous} onClick={() => changeRound(Math.max(0, index - 1))} disabled={index === 0}><ChevronLeft aria-hidden="true" /></IconButton>
      {!checked || !correct ? <ActionButton onClick={() => setChecked(true)} disabled={!selected}><Check aria-hidden="true" />{copy.check}</ActionButton>
        : !fullyReduced ? <ActionButton onClick={() => setStep((value) => Math.min(round.steps.length, value + 1))}>{copy.nextStep}<ChevronRight aria-hidden="true" /></ActionButton>
        : index < rounds.length - 1 ? <ActionButton onClick={() => changeRound(index + 1)}>{copy.nextPuzzle}<ChevronRight aria-hidden="true" /></ActionButton> : <strong>{copy.result}</strong>}
    </Activity.Transport>
  </Activity.Root>;
}
