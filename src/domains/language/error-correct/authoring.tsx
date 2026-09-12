'use client';

/** Error-correct authoring — the item editor (sentence with the mistake, wrong word, correction). */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, RowsEditor } from '../../../blocks/authoring.js';
import { coerceArray, DEMO_ERRORS, type ErrorItem } from '../shared.js';

export default function ErrorCorrectAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const items = coerceArray<ErrorItem>(value.items, DEMO_ERRORS);
  return (
    <ConfigPanel>
      <ConfigRow label="items">
        <RowsEditor
          rows={items}
          onChange={(v) => onChange({ items: v })}
          columns={[
            { key: 'text', label: 'sentence (with the mistake)', wide: true },
            { key: 'wrong', label: 'wrong word' },
            { key: 'fix', label: 'correction' },
            { key: 'why', label: 'why', wide: true },
          ]}
          newRow={() => ({ text: '', wrong: '', fix: '' })}
          addLabel="item"
        />
      </ConfigRow>
    </ConfigPanel>
  );
}
