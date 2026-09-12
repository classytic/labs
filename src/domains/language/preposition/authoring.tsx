'use client';

/** Preposition authoring — the item editor (before / noun / answer / options / figure / landmark /
 *  relation + per-wrong-pick feedback) + pedagogy rows. */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, TextField, RowsEditor, PedagogyRows } from '../../../blocks/authoring.js';
import { coerceArray, DEMO_PREP, PREP_RELATIONS, type PrepItem } from '../shared.js';

export default function PrepositionAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const items = coerceArray<PrepItem>(value.items, DEMO_PREP);
  return (
    <ConfigPanel>
      <ConfigRow label="items">
        <RowsEditor
          rows={items}
          onChange={(v) => onChange({ items: v })}
          columns={[
            { key: 'before', label: 'before', grow: true },
            { key: 'noun', label: 'noun', grow: true },
            { key: 'answer', label: 'answer' },
            { key: 'options', label: 'options (comma)', type: 'tags', grow: true },
            { key: 'figure', label: 'figure', type: 'icon' },
            { key: 'landmark', label: 'landmark', type: 'icon' },
            { key: 'scene', label: 'relation', type: 'select', options: PREP_RELATIONS },
            { key: 'note', label: 'note (on correct)', wide: true },
            {
              key: 'feedback',
              label: 'feedback per wrong pick',
              type: 'feedback',
              optionsKey: 'options',
              answerKey: 'answer',
            },
          ]}
          newRow={() => ({
            before: 'The bird is',
            noun: 'the tree.',
            answer: 'above',
            options: ['above', 'in', 'under'],
            scene: 'above' as const,
            figure: '🐦',
            landmark: '🌳',
          })}
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
