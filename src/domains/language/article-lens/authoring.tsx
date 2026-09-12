'use client';

/** Article-lens authoring — the item editor (before / noun / after / answer + per-wrong-pick
 *  feedback) + pedagogy rows. */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, TextField, RowsEditor, PedagogyRows } from '../../../blocks/authoring.js';
import { coerceArray, DEMO_ARTICLES, type ArticleItem } from '../shared.js';

export default function ArticleLensAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const items = coerceArray<ArticleItem>(value.items, DEMO_ARTICLES);
  return (
    <ConfigPanel>
      <ConfigRow label="items">
        <RowsEditor
          rows={items}
          onChange={(v) => onChange({ items: v })}
          columns={[
            { key: 'before', label: 'before', grow: true },
            { key: 'noun', label: 'noun', grow: true },
            { key: 'after', label: 'after', grow: true },
            { key: 'answer', label: 'answer', type: 'select', options: ['a', 'an', 'the', ', '] },
            { key: 'why', label: 'why (on correct)', wide: true },
            {
              key: 'feedback',
              label: 'feedback per wrong pick',
              type: 'feedback',
              optionsList: ['a', 'an', 'the', ', '],
              answerKey: 'answer',
            },
          ]}
          newRow={() => ({ before: '', noun: '', answer: 'a' as const })}
          addLabel="item"
        />
      </ConfigRow>
      <PedagogyRows
        objectives={value.objectives as string[] | undefined}
        hints={value.hints as string[] | undefined}
        onObjectives={(v) => onChange({ objectives: v })}
        onHints={(v) => onChange({ hints: v })}
      />
      <ConfigRow label="audio language">
        <TextField
          value={(value.lang as string) ?? ''}
          onChange={(v) => onChange({ lang: v || undefined })}
          placeholder="en-US (blank = no 🔊)"
        />
      </ConfigRow>
    </ConfigPanel>
  );
}
