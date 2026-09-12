'use client';

/** Agreement authoring — the item editor (subject / options / correct + per-wrong-pick feedback
 *  derived from the row's options) + pedagogy rows. */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, TextField, RowsEditor, PedagogyRows } from '../../../blocks/authoring.js';
import { coerceArray, DEMO_AGREE, type AgreementItem } from '../shared.js';

export default function AgreementAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const items = coerceArray<AgreementItem>(value.items, DEMO_AGREE);
  return (
    <ConfigPanel>
      <ConfigRow label="items">
        <RowsEditor
          rows={items}
          onChange={(v) => onChange({ items: v })}
          columns={[
            { key: 'subject', label: 'subject', grow: true },
            { key: 'options', label: 'options (comma)', type: 'tags', grow: true },
            { key: 'correct', label: 'correct' },
            { key: 'tail', label: 'tail', grow: true },
            { key: 'note', label: 'note (on correct)', wide: true },
            {
              key: 'feedback',
              label: 'feedback per wrong pick',
              type: 'feedback',
              optionsKey: 'options',
              answerKey: 'correct',
            },
          ]}
          newRow={() => ({ subject: '', options: [], correct: '' })}
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
