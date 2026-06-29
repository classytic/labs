'use client';

/**
 * @classytic/labs/blocks, lesson / pedagogy blocks (domain-neutral).
 *
 * `PredictBlock` is the missing primitive that lets a CREATOR, not a developer , 
 * author a predict-first lesson: a multiple-choice question the learner commits to
 * before the reveal. A correct pick shows the "why" and reports completion through
 * the learner/step seam, so dropping one between or after any lab turns a sequence
 * of widgets into a gated, guided lesson. The creator authors the prompt, the
 * choices (mark the correct one), and the explanation, entirely in the editor.
 *
 * This is the authorable version of the predict-first card that the "Why ice floats"
 * reference lesson used in code: same ChallengeCard + useCheckpoint underneath, now
 * exposed as a block so creators bring their own questions.
 */

import { z } from 'zod';
import type { ReactNode } from 'react';
import { defineBlock } from '@classytic/cms-ui/contract';
import { ConfigPanel, ConfigRow, TextField, RowsEditor } from './authoring.js';
import { useChallenge, useCheckpoint, ChallengeCard, type ChallengeQuestion } from '../kit/index.js';

interface Choice { label: string; correct: boolean }
const DEFAULT_CHOICES: Choice[] = [{ label: 'Option A', correct: true }, { label: 'Option B', correct: false }];

/** Render a predict-first question and report completion when answered correctly. */
export function PredictWidget({ prompt, choices, explain, title }: { prompt?: string; choices?: Choice[]; explain?: string; title?: string }): ReactNode {
  const list = Array.isArray(choices) && choices.length ? choices : DEFAULT_CHOICES;
  const answerIdx = Math.max(0, list.findIndex((c) => c.correct));
  const q: ChallengeQuestion = {
    id: 'q',
    prompt: prompt ?? 'What do you predict?',
    choices: list.map((c, i) => ({ value: String(i), label: c.label })),
    answer: String(answerIdx),
    explain,
  };
  return <PredictRunner q={q} title={title} />;
}

function PredictRunner({ q, title }: { q: ChallengeQuestion; title?: string }): ReactNode {
  const ch = useChallenge([q]);
  useCheckpoint({ solved: ch.allCorrect, activity: 'predict' });
  return <ChallengeCard questions={[q]} state={ch} title={title ?? 'Predict first'} />;
}

export const PredictBlock = defineBlock({
  key: 'predict',
  tag: 'Predict',
  void: true,
  label: 'Predict / quiz question',
  description: 'A predict-first multiple-choice question. The learner commits to an answer; a correct pick reveals the explanation and completes the step (so it can gate a guided lesson). Author your own prompt, choices and explanation, drop it before or after any lab.',
  category: 'interactive',
  schema: z.object({
    prompt: z.string().default('What do you predict?'),
    choices: z.array(z.object({ label: z.string(), correct: z.boolean() })).default(DEFAULT_CHOICES),
    explain: z.string().optional(),
    title: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const choices: Choice[] = Array.isArray(attributes.choices) && attributes.choices.length ? attributes.choices : DEFAULT_CHOICES;
    const widget = <PredictWidget prompt={attributes.prompt} choices={choices} explain={attributes.explain} title={attributes.title} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="prompt"><TextField value={attributes.prompt ?? ''} onChange={(v) => updateAttributes({ prompt: v })} placeholder="What do you predict?" /></ConfigRow>
          <ConfigRow label="card title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Predict first" /></ConfigRow>
          <ConfigRow label="explain (on correct)"><TextField value={attributes.explain ?? ''} onChange={(v) => updateAttributes({ explain: v })} placeholder="Why it's right…" /></ConfigRow>
        </ConfigPanel>
        <RowsEditor
          rows={choices}
          onChange={(rows) => updateAttributes({ choices: rows })}
          columns={[{ key: 'label', label: 'choice', type: 'text', grow: true }, { key: 'correct', label: 'correct', type: 'bool' }]}
          newRow={() => ({ label: '', correct: false })}
          addLabel="choice"
        />
        {widget}
      </div>
    );
  },
});

export const lessonBlocks = [PredictBlock] as const;
export const lessonComponents = { Predict: PredictWidget } as const;
