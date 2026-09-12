'use client';

import { GridPathLab } from '../../../algorithms/GridPathLab.js';
import { ConfigPanel, ConfigRow, NumField, TextArea, TextField } from '../../../blocks/authoring.js';

type Props = { value: Record<string, unknown>; onChange: (patch: Record<string, unknown>) => void };

const bounded = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.max(2, Math.min(8, Math.trunc(value)))
    : fallback;

export default function GridPathAuthoring({ value, onChange }: Props) {
  const rows = bounded(value.rows, 4);
  const cols = bounded(value.cols, 5);
  const title = typeof value.title === 'string' && value.title ? value.title : undefined;
  const prompt = typeof value.prompt === 'string' && value.prompt ? value.prompt : undefined;
  const previewKey = `${rows}|${cols}|${title ?? ''}|${prompt ?? ''}`;

  return (
    <div className="tree-authoring">
      <section className="tree-authoring-preview" aria-label="Learner preview">
        <GridPathLab key={previewKey} rows={rows} cols={cols} title={title} prompt={prompt} />
      </section>
      <section className="tree-authoring-controls" aria-label="Dynamic programming lab settings">
        <ConfigPanel>
          <ConfigRow
            label="Grid size"
            hint={`${rows * cols} states · 2–8 rows and columns keeps the table readable`}
          >
            <span className="flex items-center gap-2">
              <NumField
                value={rows}
                min={2}
                max={8}
                onChange={(rows) => onChange({ rows: bounded(rows, 4) })}
              />
              <span className="text-muted-foreground">×</span>
              <NumField
                value={cols}
                min={2}
                max={8}
                onChange={(cols) => onChange({ cols: bounded(cols, 5) })}
              />
            </span>
          </ConfigRow>
        </ConfigPanel>
        <ConfigPanel>
          <ConfigRow label="Title">
            <TextField
              value={title ?? ''}
              onChange={(next) => onChange({ title: next || undefined })}
              placeholder="Count paths with dynamic programming"
              className="flex-1"
            />
          </ConfigRow>
          <ConfigRow label="Prompt">
            <TextArea
              rows={3}
              value={prompt ?? ''}
              onChange={(next) => onChange({ prompt: next || undefined })}
              placeholder="What should learners notice about state reuse?"
            />
          </ConfigRow>
        </ConfigPanel>
      </section>
    </div>
  );
}
