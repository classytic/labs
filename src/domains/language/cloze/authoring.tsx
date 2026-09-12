'use client';

/** Cloze authoring — the item editor (sentence with ___ blanks, answers, wrong tiles) + pedagogy. */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, TextField, RowsEditor, PedagogyRows } from '../../../blocks/authoring.js';
import { coerceArray, DEMO_CLOZE, type ClozeItem } from '../shared.js';

export default function ClozeAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const items = coerceArray<ClozeItem>(value.items, DEMO_CLOZE);
  return (
    <ConfigPanel>
      <ConfigRow label="items">
        <RowsEditor
          rows={items}
          onChange={(v) => onChange({ items: v })}
          columns={[
            { key: 'text', label: 'sentence (blanks = ___)', wide: true },
            { key: 'answers', label: 'answers', type: 'tags', grow: true },
            { key: 'distractors', label: 'wrong tiles', type: 'tags', grow: true },
            { key: 'why', label: 'why', wide: true },
            { key: 'gloss', label: 'gloss', grow: true },
          ]}
          newRow={() => ({ text: '', answers: [] })}
          addLabel="item"
        />
      </ConfigRow>
      <ConfigRow label="speaker language">
        <TextField
          value={(value.lang as string) ?? ''}
          onChange={(v) => onChange({ lang: v || undefined })}
          placeholder="en-US (blank = no audio)"
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
