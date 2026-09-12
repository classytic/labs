'use client';

/** Transform authoring — instruction/note + the given (from) and answer (to) tile editors. */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, TextField, RowsEditor, PedagogyRows } from '../../../blocks/authoring.js';
import { coerceArray, DEMO_TRANSFORM_FROM, DEMO_TRANSFORM_TO, type TransformTile } from '../shared.js';

const tileCols = [
  { key: 'text', label: 'word', grow: true },
  { key: 'pos', label: 'part', type: 'pos' as const },
  { key: 'gloss', label: 'gloss', grow: true },
];

export default function TransformAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const from = coerceArray<TransformTile>(value.from, DEMO_TRANSFORM_FROM);
  const to = coerceArray<TransformTile>(value.to, DEMO_TRANSFORM_TO);
  return (
    <ConfigPanel>
      <ConfigRow label="instruction">
        <TextField
          value={(value.instruction as string) ?? ''}
          onChange={(v) => onChange({ instruction: v })}
          placeholder="e.g. Make it a question"
        />
      </ConfigRow>
      <ConfigRow label="note">
        <TextField
          value={(value.note as string) ?? ''}
          onChange={(v) => onChange({ note: v })}
          placeholder="what changed + why"
        />
      </ConfigRow>
      <ConfigRow label="from (given)">
        <RowsEditor
          rows={from}
          onChange={(v) => onChange({ from: v })}
          columns={tileCols}
          newRow={() => ({ text: '', pos: 'other' as const })}
          addLabel="word"
        />
      </ConfigRow>
      <ConfigRow label="to (answer)">
        <RowsEditor
          rows={to}
          onChange={(v) => onChange({ to: v })}
          columns={tileCols}
          newRow={() => ({ text: '', pos: 'other' as const })}
          addLabel="word"
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
