'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Check, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import { Activity } from '../../kit/activity.js';
import { ActionButton, AssessedChoiceGroup, IconButton } from '../../kit/controls.js';
import {
  answerOptions,
  expectedAnswer,
  validateStatementRounds,
  type StatementLogicRound,
} from './core.js';

export interface StatementLogicMessages {
  eyebrow: string;
  title: string;
  description: string;
  chooseAnswer: string;
  check: string;
  next: string;
  previous: string;
  reset: string;
  context: string;
  premise: string;
  conclusion: string;
  counterexampleHint: string;
  correct: string;
  tryAgain: string;
  proposition: string;
  openSentence: string;
  nonStatement: string;
  trueLabel: string;
  falseLabel: string;
}

export interface StatementLogicProps {
  rounds?: StatementLogicRound[];
  startAt?: number;
  title?: string;
  prompt?: string;
  messages?: Partial<StatementLogicMessages>;
}

const DEFAULT_MESSAGES: StatementLogicMessages = {
  eyebrow: 'Reasoning puzzle',
  title: 'Can you test the claim?',
  description: 'Read the situation, commit to an answer, then inspect the reason.',
  chooseAnswer: 'Choose one answer',
  check: 'Check reasoning',
  next: 'Next puzzle',
  previous: 'Previous puzzle',
  reset: 'Start again',
  context: 'What we know',
  premise: 'If',
  conclusion: 'then',
  counterexampleHint: 'Find the one case where the “if” part is true but the “then” part is false.',
  correct: 'Reason confirmed',
  tryAgain: 'Look at the evidence and try another choice',
  proposition: 'A statement with a truth value',
  openSentence: 'It depends on an unknown',
  nonStatement: 'A question or command',
  trueLabel: 'True',
  falseLabel: 'False',
};

export const DEFAULT_STATEMENT_ROUNDS: StatementLogicRound[] = [
  {
    id: 'classify-open',
    kind: 'classify',
    statement: 'The hidden number is greater than 8.',
    answer: 'open-sentence',
    explanation: 'Its truth depends on the hidden number, so it does not yet have one fixed truth value.',
  },
  {
    id: 'truth-context',
    kind: 'truth',
    context: 'A box contains 3 red counters and 2 blue counters.',
    statement: 'More than half of the counters are red.',
    answer: true,
    explanation: 'Three of the five counters are red, and 3/5 is more than one half.',
  },
  {
    id: 'negate-all',
    kind: 'negate',
    statement: 'Every lantern is lit.',
    choices: [
      { value: 'none', label: 'No lantern is lit.' },
      { value: 'one-dark', label: 'At least one lantern is not lit.' },
      { value: 'one-lit', label: 'At least one lantern is lit.' },
    ],
    answer: 'one-dark',
    explanation: 'To disprove “every,” one counterexample is enough: at least one lantern must be unlit.',
  },
  {
    id: 'implication-counterexample',
    kind: 'implication',
    statement: 'A card is blue.',
    conclusion: 'The card has a star.',
    worlds: [
      { id: 'blue-star', label: 'Blue card with a star', premiseTrue: true, conclusionTrue: true },
      { id: 'blue-circle', label: 'Blue card with a circle', premiseTrue: true, conclusionTrue: false },
      { id: 'red-circle', label: 'Red card with a circle', premiseTrue: false, conclusionTrue: false },
    ],
    answer: 'blue-circle',
    explanation: 'The blue circle satisfies the premise but not the conclusion, so it is the counterexample.',
  },
];

export function StatementLogicLab({
  rounds = DEFAULT_STATEMENT_ROUNDS,
  startAt = 0,
  title,
  prompt,
  messages,
}: StatementLogicProps): ReactNode {
  const copy = { ...DEFAULT_MESSAGES, ...messages };
  const issues = useMemo(() => validateStatementRounds(rounds), [rounds]);
  const safeStart = Math.max(0, Math.min(rounds.length - 1, startAt));
  const [index, setIndex] = useState(safeStart);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const round = rounds[index];

  if (!round || issues.length > 0) {
    return (
      <Activity.Root className="statement-logic-activity">
        <Activity.Header>
          <Activity.Heading eyebrow={copy.eyebrow} title={title ?? copy.title} />
        </Activity.Header>
        <Activity.Feedback>
          <strong>Activity configuration needs attention.</strong>
          <span>{issues[0] ?? 'Add at least one round.'}</span>
        </Activity.Feedback>
      </Activity.Root>
    );
  }

  const selected = answers[round.id] ?? '';
  const revealed = checked[round.id] === true;
  const correct = selected === expectedAnswer(round);
  const localizedOptions = round.kind === 'classify'
    ? [
        { value: 'proposition', label: copy.proposition },
        { value: 'open-sentence', label: copy.openSentence },
        { value: 'non-statement', label: copy.nonStatement },
      ]
    : round.kind === 'truth'
      ? [{ value: 'true', label: copy.trueLabel }, { value: 'false', label: copy.falseLabel }]
      : answerOptions(round);
  const options = localizedOptions.map((choice) => ({
    ...choice,
    tone: revealed && choice.value === selected ? (correct ? ('correct' as const) : ('wrong' as const)) : undefined,
  }));
  const choose = (value: string): void => {
    setAnswers((current) => ({ ...current, [round.id]: value }));
    setChecked((current) => ({ ...current, [round.id]: false }));
  };
  const reset = (): void => {
    setIndex(safeStart);
    setAnswers({});
    setChecked({});
  };

  return (
    <Activity.Root className="statement-logic-activity" focusLayout="compact" dir="auto">
      <Activity.Header>
        <Activity.Heading
          eyebrow={copy.eyebrow}
          title={title ?? copy.title}
          description={prompt ?? copy.description}
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <Activity.ItemProgress done={index} total={rounds.length} label="Complete" />
        <span>{round.kind.replace('-', ' ')}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label={`Reasoning puzzle ${index + 1}`}>
          <div className="statement-logic-scene">
            {round.kind === 'truth' && round.context ? (
              <section className="statement-logic-context">
                <span>{copy.context}</span>
                <p>{round.context}</p>
              </section>
            ) : null}
            {round.kind === 'implication' ? (
              <div className="statement-logic-implication" aria-label={`${copy.premise} ${round.statement}, ${copy.conclusion} ${round.conclusion}`}>
                <span><small>{copy.premise}</small>{round.statement}</span>
                <ChevronRight aria-hidden="true" />
                <span><small>{copy.conclusion}</small>{round.conclusion}</span>
              </div>
            ) : (
              <blockquote>{round.statement}</blockquote>
            )}
            <div className="statement-logic-response">
              <AssessedChoiceGroup
                value={selected}
                onChange={choose}
                options={options}
                ariaLabel={copy.chooseAnswer}
              />
            </div>
          </div>
        </Activity.Canvas>
      </Activity.Workspace>
      {revealed ? (
        <Activity.Feedback>
          <span className="statement-logic-verdict" data-correct={correct || undefined}>
            {correct ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
            {correct ? copy.correct : copy.tryAgain}
          </span>
          <p>{round.explanation}</p>
        </Activity.Feedback>
      ) : round.kind === 'implication' ? (
        <Activity.Feedback><span>Hint</span><p>{copy.counterexampleHint}</p></Activity.Feedback>
      ) : null}
      <Activity.Transport>
        <IconButton label={copy.reset} onClick={reset}><RotateCcw aria-hidden="true" /></IconButton>
        <IconButton label={copy.previous} onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
          <ChevronLeft aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state"><strong>{index + 1} / {rounds.length}</strong></div>
        {revealed && correct && index < rounds.length - 1 ? (
          <ActionButton onClick={() => setIndex((value) => value + 1)}>{copy.next}<ChevronRight aria-hidden="true" /></ActionButton>
        ) : (
          <ActionButton onClick={() => setChecked((current) => ({ ...current, [round.id]: true }))} disabled={!selected}>
            <Check aria-hidden="true" />{copy.check}
          </ActionButton>
        )}
      </Activity.Transport>
      <Activity.LiveRegion>{revealed ? `${correct ? copy.correct : copy.tryAgain}. ${round.explanation}` : ''}</Activity.LiveRegion>
    </Activity.Root>
  );
}
