'use client';

/** Conic authoring — the curve chooser + its shape parameters, snap, and a graded question. */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, TextField, NumField, SelectField } from '../../../blocks/authoring.js';
import { LabAskEditor, type LabAskShape } from '../authoring-kit.js';

export default function ConicAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const a = value as { kind?: string; a?: number; b?: number; c?: number; snap?: number; title?: string };
  const ask = value.ask as LabAskShape | undefined;
  const k = a.kind ?? 'parabola';
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField
          value={a.title ?? ''}
          placeholder="The parabola"
          onChange={(v) => onChange({ title: v })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="Curve">
        <SelectField
          value={k}
          options={['parabola', 'ellipse', 'hyperbola', 'rectangular']}
          onChange={(v) => onChange({ kind: v })}
        />
      </ConfigRow>
      {k === 'parabola' && (
        <ConfigRow label="a">
          <NumField value={a.a ?? 1} onChange={(v) => onChange({ a: v })} />
        </ConfigRow>
      )}
      {k === 'ellipse' && (
        <ConfigRow label="a, b">
          <NumField value={a.a ?? 4} onChange={(v) => onChange({ a: v })} />
          <NumField value={a.b ?? 2.5} onChange={(v) => onChange({ b: v })} />
        </ConfigRow>
      )}
      {k === 'hyperbola' && (
        <ConfigRow label="a, b">
          <NumField value={a.a ?? 2} onChange={(v) => onChange({ a: v })} />
          <NumField value={a.b ?? 1.5} onChange={(v) => onChange({ b: v })} />
        </ConfigRow>
      )}
      {k === 'rectangular' && (
        <ConfigRow label="c">
          <NumField value={a.c ?? 6} onChange={(v) => onChange({ c: v })} />
        </ConfigRow>
      )}
      <ConfigRow label="Snap">
        <NumField value={a.snap ?? 1} onChange={(v) => onChange({ snap: v })} />
      </ConfigRow>
      <LabAskEditor ask={ask} onChange={(x) => onChange({ ask: x })} />
    </ConfigPanel>
  );
}
