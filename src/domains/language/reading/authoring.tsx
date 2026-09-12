'use client';

/** Reading authoring — passage textarea + question editor + optional L1 glossary editor. */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, TextArea, RowsEditor, PedagogyRows } from '../../../blocks/authoring.js';
import { coerceArray, DEMO_READING_Q, type ReadingQuestion, type GlossEntry } from '../shared.js';

export default function ReadingAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const questions = coerceArray<ReadingQuestion>(value.questions, DEMO_READING_Q);
  const gloss = coerceArray<GlossEntry>(value.gloss, []);
  return (
    <ConfigPanel>
      <ConfigRow label="passage">
        <TextArea
          value={value.passage as string}
          onChange={(v) => onChange({ passage: v })}
          placeholder="the text (blank line = new paragraph)"
          rows={5}
        />
      </ConfigRow>
      <ConfigRow label="questions">
        <RowsEditor
          rows={questions}
          onChange={(v) => onChange({ questions: v })}
          columns={[
            { key: 'q', label: 'question', wide: true },
            { key: 'options', label: 'options', type: 'tags', grow: true },
            { key: 'answer', label: 'correct' },
            { key: 'explain', label: 'why', wide: true },
          ]}
          newRow={() => ({ q: '', options: [], answer: '' })}
          addLabel="question"
        />
      </ConfigRow>
      <ConfigRow label="glossary">
        <RowsEditor
          rows={gloss}
          onChange={(v) => onChange({ gloss: v })}
          columns={[
            { key: 'word', label: 'word', grow: true },
            { key: 'meaning', label: 'meaning (L1)', grow: true },
          ]}
          newRow={() => ({ word: '', meaning: '' })}
          addLabel="word"
        />
      </ConfigRow>
      <PedagogyRows
        objectives={value.objectives as string[] | undefined}
        hints={value.hints as string[] | undefined}
        onObjectives={(v) => onChange({ objectives: v })}
        onHints={(v) => onChange({ hints: v })}
      />
    </ConfigPanel>
  );
}
