'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { AuthoredQuestion } from './activity-authoring.js';
import { AssessedChoiceGroup, choiceResponseLayout } from './controls.js';

export type AuthoredResponseValue = string | number | string[];
export interface AuthoredResponseResult {
  questionId: string;
  response: AuthoredResponseValue;
  correct: boolean | null;
}

export function evaluateAuthoredResponse(
  question: AuthoredQuestion,
  response: AuthoredResponseValue,
): boolean | null {
  if (question.kind === 'reflection')
    return typeof response === 'string' && response.trim().length > 0 ? null : false;
  if (question.kind === 'numeric')
    return typeof response === 'number' && Math.abs(response - question.answer) <= (question.tolerance ?? 0);
  if (question.kind === 'text')
    return (
      typeof response === 'string' &&
      question.answers.some((answer) =>
        question.caseSensitive
          ? response.trim() === answer.trim()
          : response.trim().toLocaleLowerCase() === answer.trim().toLocaleLowerCase(),
      )
    );
  if (question.kind === 'ordering')
    return (
      Array.isArray(response) &&
      response.length === question.answer.length &&
      response.every((value, index) => value === question.answer[index])
    );
  return typeof response === 'string' && response === question.answer;
}

/** Standard renderer for the portable authored response contract. */
export function AuthoredResponse({
  question,
  onRespond,
}: {
  question: AuthoredQuestion;
  onRespond?: (result: AuthoredResponseResult) => void;
}): ReactNode {
  const initialValue: AuthoredResponseValue =
    question.kind === 'ordering' ? question.items.map((item) => item.value) : '';
  const [value, setValue] = useState<AuthoredResponseValue>(initialValue);
  const [result, setResult] = useState<boolean | null | undefined>(undefined);
  const feedbackId = `lab-response-feedback-${question.id}`;
  const submit = (event?: FormEvent): void => {
    event?.preventDefault();
    const correct = evaluateAuthoredResponse(question, value);
    setResult(correct);
    onRespond?.({ questionId: question.id, response: value, correct });
  };
  const feedback =
    result === true
      ? (question.explain ?? 'Correct.')
      : result === false
        ? (('tryAgain' in question ? question.tryAgain : undefined) ??
          'Not yet. Revisit the evidence and try again.')
        : result === null
          ? 'Response saved. Compare it with the criteria.'
          : null;

  if (!question.kind || question.kind === 'choice') {
    const responseLayout = choiceResponseLayout(question.choices);
    const choose = (choiceValue: string): void => {
      setValue(choiceValue);
      const correct = evaluateAuthoredResponse(question, choiceValue);
      setResult(correct);
      onRespond?.({ questionId: question.id, response: choiceValue, correct });
    };
    return (
      <fieldset className="lab-challenge-q" data-response-layout={responseLayout}>
        <legend className="lab-challenge-prompt">{question.prompt}</legend>
        <AssessedChoiceGroup
          value={typeof value === 'string' && value ? value : undefined}
          onChange={choose}
          ariaLabel={typeof question.prompt === 'string' ? question.prompt : 'Answer choices'}
          options={question.choices.map((choice) => ({
            value: choice.value,
            label: choice.label,
            tone: value === choice.value && result !== undefined ? (result ? 'correct' : 'wrong') : undefined,
          }))}
        />
        {feedback && (
          <span className="lab-explain" data-state={result ? 'ok' : 'no'} role="status">
            {feedback}
          </span>
        )}
      </fieldset>
    );
  }

  if (question.kind === 'ordering') {
    const order = value as string[];
    const labels = new Map(question.items.map((item) => [item.value, item.label]));
    const move = (index: number, delta: number): void => {
      const next = [...order];
      const destination = index + delta;
      if (destination < 0 || destination >= next.length) return;
      [next[index], next[destination]] = [next[destination]!, next[index]!];
      setValue(next);
      setResult(undefined);
    };
    return (
      <div className="lab-challenge-q">
        <span className="lab-challenge-prompt">{question.prompt}</span>
        <ol className="lab-ordering-list">
          {order.map((item, index) => (
            <li key={item}>
              <span className="lab-ordering-rank" aria-hidden="true">
                {index + 1}
              </span>
              <span className="lab-ordering-label">{labels.get(item)}</span>
              <span className="lab-ordering-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${labels.get(item)} earlier`}
                >
                  <ArrowUp data-icon="inline-start" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                  aria-label={`Move ${labels.get(item)} later`}
                >
                  <ArrowDown data-icon="inline-start" />
                </Button>
              </span>
            </li>
          ))}
        </ol>
        <Button type="button" onClick={() => submit()}>
          Check order
        </Button>
        {feedback && (
          <span className="lab-explain" data-state={result ? 'ok' : 'no'} role="status">
            {feedback}
          </span>
        )}
      </div>
    );
  }

  const reflection = question.kind === 'reflection';
  return (
    <form className="lab-challenge-q" data-invalid={result === false || undefined} onSubmit={submit}>
      <label className="lab-challenge-prompt" htmlFor={`lab-response-${question.id}`}>
        {question.prompt}
      </label>
      <div
        className="lab-response-entry"
        data-invalid={result === false || undefined}
        data-multiline={reflection || undefined}
      >
        {reflection ? (
          <Textarea
            id={`lab-response-${question.id}`}
            className="lab-input"
            value={String(value)}
            placeholder={question.placeholder}
            required
            aria-invalid={result === false || undefined}
            aria-describedby={feedback ? feedbackId : undefined}
            onChange={(event) => {
              setValue(event.currentTarget.value);
              setResult(undefined);
            }}
          />
        ) : (
          <Input
            id={`lab-response-${question.id}`}
            className="lab-input"
            type={question.kind === 'numeric' ? 'number' : 'text'}
            step={question.kind === 'numeric' ? 'any' : undefined}
            value={String(value)}
            aria-invalid={result === false || undefined}
            aria-describedby={feedback ? feedbackId : undefined}
            onChange={(event) => {
              setValue(
                question.kind === 'numeric' ? event.currentTarget.valueAsNumber : event.currentTarget.value,
              );
              setResult(undefined);
            }}
          />
        )}
        <Button type="submit">{reflection ? 'Save response' : 'Check'}</Button>
      </div>
      {feedback && (
        <span
          id={feedbackId}
          className="lab-explain"
          data-state={result === false ? 'no' : 'ok'}
          role={result === false ? 'alert' : 'status'}
        >
          {feedback}
        </span>
      )}
      {reflection && result === null && (
        <div className="lab-reflection-rubric">
          <p>Review your response against:</p>
          <ul>
            {question.rubric.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
