'use client';

/**
 * Shared authoring widgets for the math labs' custom editors (loaded only in the CMS editor chunk):
 * the "ask + check" question editors (AskEditor for the engine, LabAskEditor for the coordinate-
 * geometry labs' typed-or-multiple-choice question) + the slider-name helper. Ported verbatim from
 * the runtime math barrel so authoring remains independently lazy.
 */
import type { ReactNode } from 'react';
import { ConfigRow, ChipToggle, TextField, NumField, SmallButton } from '../../blocks/authoring.js';
import type { GraphParam } from '../../math/index.js';

export type AskShape = {
  prompt: string;
  answer: { kind: 'number' | 'expression'; value: number | string; tol?: number };
  placeholder?: string;
};
export type LabAskShape = {
  prompt: string;
  placeholder?: string;
  answer?: { kind: 'number' | 'expression'; value: number | string; tol?: number };
  choices?: { value: string; label: string }[];
  correct?: string;
  explain?: string;
};

const CHOICE_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];

export function nextParamName(params: GraphParam[]): string {
  const used = new Set(params.map((p) => p.name));
  for (const n of ['a', 'b', 'c', 'd', 'k', 'm', 'n', 'p', 'q']) if (!used.has(n)) return n;
  return `p${params.length + 1}`;
}

/** Shared "ask + check" authoring row, used by the engine + triangle-trig blocks. */
export function AskEditor({
  ask,
  onChange,
}: {
  ask: AskShape | undefined;
  onChange: (a: AskShape | undefined) => void;
}): ReactNode {
  if (!ask)
    return (
      <SmallButton onClick={() => onChange({ prompt: '', answer: { kind: 'number', value: 0 } })}>
        + question (checked answer)
      </SmallButton>
    );
  const isNum = ask.answer.kind === 'number';
  const setAns = (patch: Partial<AskShape['answer']>): void =>
    onChange({ ...ask, answer: { ...ask.answer, ...patch } });
  return (
    <div className="space-y-1.5">
      <span className="font-medium text-muted-foreground">Question (graded)</span>
      <ConfigRow label="Prompt">
        <TextField value={ask.prompt} onChange={(v) => onChange({ ...ask, prompt: v })} className="flex-1" />
      </ConfigRow>
      <ConfigRow label="Answer is">
        <ChipToggle
          active={isNum}
          onClick={() =>
            setAns({ kind: 'number', value: typeof ask.answer.value === 'number' ? ask.answer.value : 0 })
          }
        >
          a number
        </ChipToggle>
        <ChipToggle
          active={!isNum}
          onClick={() => setAns({ kind: 'expression', value: String(ask.answer.value ?? '') })}
        >
          an expression
        </ChipToggle>
      </ConfigRow>
      <ConfigRow label="Correct value">
        {isNum ? (
          <NumField value={Number(ask.answer.value) || 0} onChange={(v) => setAns({ value: v })} />
        ) : (
          <TextField
            value={String(ask.answer.value ?? '')}
            mono
            placeholder="6*x - 9"
            onChange={(v) => setAns({ value: v })}
            className="flex-1"
          />
        )}
        {isNum && (
          <>
            <span className="text-muted-foreground">± tol</span>
            <NumField value={ask.answer.tol ?? 0.01} onChange={(v) => setAns({ tol: v })} />
          </>
        )}
        <SmallButton tone="danger" onClick={() => onChange(undefined)}>
          remove
        </SmallButton>
      </ConfigRow>
    </div>
  );
}

/** Author a graded question as a typed answer (number/expression) OR multiple choice. */
export function LabAskEditor({
  ask,
  onChange,
}: {
  ask: LabAskShape | undefined;
  onChange: (a: LabAskShape | undefined) => void;
}): ReactNode {
  if (!ask) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <SmallButton onClick={() => onChange({ prompt: '', answer: { kind: 'number', value: 0 } })}>
          + typed question
        </SmallButton>
        <SmallButton
          onClick={() =>
            onChange({
              prompt: '',
              choices: [
                { value: 'a', label: '' },
                { value: 'b', label: '' },
              ],
              correct: 'a',
            })
          }
        >
          + multiple choice
        </SmallButton>
      </div>
    );
  }
  const isMcq = Array.isArray(ask.choices);
  const isNum = ask.answer?.kind !== 'expression';
  const setAns = (patch: Partial<NonNullable<LabAskShape['answer']>>): void =>
    onChange({ ...ask, answer: { ...(ask.answer ?? { kind: 'number', value: 0 }), ...patch } });
  const choices = ask.choices ?? [];
  const setChoice = (i: number, patch: Partial<{ value: string; label: string }>): void =>
    onChange({ ...ask, choices: choices.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-medium text-muted-foreground">Question (graded)</span>
        <div className="flex gap-1.5">
          <ChipToggle
            active={!isMcq}
            onClick={() =>
              onChange({
                prompt: ask.prompt,
                placeholder: ask.placeholder,
                answer: ask.answer ?? { kind: 'number', value: 0 },
              })
            }
          >
            typed
          </ChipToggle>
          <ChipToggle
            active={isMcq}
            onClick={() =>
              onChange({
                prompt: ask.prompt,
                choices: choices.length
                  ? choices
                  : [
                      { value: 'a', label: '' },
                      { value: 'b', label: '' },
                    ],
                correct: ask.correct ?? 'a',
              })
            }
          >
            multiple choice
          </ChipToggle>
          <SmallButton tone="danger" onClick={() => onChange(undefined)}>
            remove
          </SmallButton>
        </div>
      </div>
      <ConfigRow label="Prompt">
        <TextField value={ask.prompt} onChange={(v) => onChange({ ...ask, prompt: v })} className="flex-1" />
      </ConfigRow>
      {isMcq ? (
        <div className="space-y-1.5">
          <span className="text-muted-foreground">Options (tap ✓ to mark the correct one)</span>
          {choices.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <ChipToggle
                active={ask.correct === c.value}
                onClick={() => onChange({ ...ask, correct: c.value })}
              >
                ✓
              </ChipToggle>
              <TextField
                value={c.label}
                placeholder={`option ${c.value}`}
                onChange={(v) => setChoice(i, { label: v })}
                className="flex-1"
              />
              {choices.length > 2 && (
                <SmallButton
                  tone="danger"
                  onClick={() => onChange({ ...ask, choices: choices.filter((_, j) => j !== i) })}
                >
                  ✕
                </SmallButton>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-1.5">
            <SmallButton
              onClick={() => {
                const v = CHOICE_LETTERS[choices.length] ?? String(choices.length);
                onChange({ ...ask, choices: [...choices, { value: v, label: '' }] });
              }}
            >
              + option
            </SmallButton>
          </div>
          <ConfigRow label="Explain">
            <TextField
              value={ask.explain ?? ''}
              placeholder="shown when correct"
              onChange={(v) => onChange({ ...ask, explain: v })}
              className="flex-1"
            />
          </ConfigRow>
        </div>
      ) : (
        <>
          <ConfigRow label="Answer is">
            <ChipToggle
              active={isNum}
              onClick={() =>
                setAns({
                  kind: 'number',
                  value: typeof ask.answer?.value === 'number' ? ask.answer.value : 0,
                })
              }
            >
              a number
            </ChipToggle>
            <ChipToggle
              active={!isNum}
              onClick={() => setAns({ kind: 'expression', value: String(ask.answer?.value ?? '') })}
            >
              an expression
            </ChipToggle>
          </ConfigRow>
          <ConfigRow label="Correct value">
            {isNum ? (
              <NumField value={Number(ask.answer?.value) || 0} onChange={(v) => setAns({ value: v })} />
            ) : (
              <TextField
                value={String(ask.answer?.value ?? '')}
                mono
                placeholder="-0.5*x + 5"
                onChange={(v) => setAns({ value: v })}
                className="flex-1"
              />
            )}
            {isNum && (
              <>
                <span className="text-muted-foreground">± tol</span>
                <NumField value={ask.answer?.tol ?? 0.01} onChange={(v) => setAns({ tol: v })} />
              </>
            )}
          </ConfigRow>
          <ConfigRow label="Hint">
            <TextField
              value={ask.placeholder ?? ''}
              placeholder="placeholder e.g. y = ..."
              onChange={(v) => onChange({ ...ask, placeholder: v })}
              className="flex-1"
            />
          </ConfigRow>
        </>
      )}
    </div>
  );
}
