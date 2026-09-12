'use client';

import { useState } from 'react';
import { HeapQuestLab } from '../../../algorithms/HeapQuestLab.js';
import {
  BooleanField,
  ConfigPanel,
  ConfigRow,
  NumField,
  SelectField,
  TextArea,
  TextField,
} from '../../../blocks/authoring.js';

type Props = { value: Record<string, unknown>; onChange: (patch: Record<string, unknown>) => void };
const DEFAULTS = [7, 2, 9, 1, 5, 8, 3];
export default function HeapQuestAuthoring({ value, onChange }: Props) {
  const values = Array.isArray(value.values)
    ? value.values.filter((item): item is number => typeof item === 'number')
    : DEFAULTS;
  const [draft, setDraft] = useState(values.join(', '));
  const kind = value.kind === 'max' ? 'max' : 'min';
  const operation = value.operation === 'insert' || value.operation === 'extract' ? value.operation : 'build';
  const inserted = typeof value.value === 'number' ? value.value : 0;
  const parsed = draft
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  const invalid = !parsed.length || parsed.some((item) => !Number.isFinite(item));
  const updateDraft = (next: string) => {
    setDraft(next);
    const numbers = next
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (numbers.length && numbers.every(Number.isFinite))
      onChange({ values: numbers.map(Math.trunc).slice(0, 15) });
  };
  return (
    <div className="heap-authoring tree-authoring">
      <section className="heap-authoring-preview">
        <HeapQuestLab
          values={values}
          kind={kind}
          operation={operation}
          value={inserted}
          predict={false}
          title="Learner preview"
        />
      </section>
      <section className="tree-authoring-controls">
        <ConfigPanel>
          <ConfigRow
            label="Values"
            hint={
              invalid
                ? 'Enter comma-separated whole numbers.'
                : `${parsed.length} items · maximum 15 for readable lessons`
            }
            error={invalid ? 'At least one valid whole number is required.' : undefined}
          >
            <TextArea rows={2} value={draft} onChange={updateDraft} placeholder="7, 2, 9, 1, 5" />
          </ConfigRow>
          <ConfigRow label="Heap kind">
            <SelectField
              value={kind}
              onChange={(kind) => onChange({ kind })}
              options={[
                { value: 'min', label: 'Min-heap' },
                { value: 'max', label: 'Max-heap' },
              ]}
            />
          </ConfigRow>
          <ConfigRow label="Mission">
            <SelectField
              value={operation}
              onChange={(operation) => onChange({ operation })}
              options={[
                { value: 'build', label: 'Build heap' },
                { value: 'insert', label: 'Insert / bubble up' },
                { value: 'extract', label: 'Extract root / sift down' },
              ]}
            />
            {operation === 'insert' ? (
              <NumField value={inserted} onChange={(inserted) => onChange({ value: inserted })} />
            ) : null}
          </ConfigRow>
          <BooleanField
            checked={value.predict !== false}
            onChange={(predict) => onChange({ predict })}
            label="Pause at meaningful decisions"
            hint="Learners predict the next heap operation before it is revealed."
          />
        </ConfigPanel>
        <ConfigPanel>
          <ConfigRow label="Title">
            <TextField
              value={typeof value.title === 'string' ? value.title : ''}
              onChange={(title) => onChange({ title: title || undefined })}
              placeholder="Generated automatically when empty"
              className="flex-1"
            />
          </ConfigRow>
          <ConfigRow label="Prompt">
            <TextArea
              rows={3}
              value={typeof value.prompt === 'string' ? value.prompt : ''}
              onChange={(prompt) => onChange({ prompt: prompt || undefined })}
              placeholder="What should learners notice?"
            />
          </ConfigRow>
        </ConfigPanel>
      </section>
    </div>
  );
}
