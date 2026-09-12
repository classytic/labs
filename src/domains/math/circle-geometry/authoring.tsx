'use client';

/** Circle authoring — radius, expanded-form / tangent toggles, snap, and a graded question. */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, ChipToggle, TextField, NumField } from '../../../blocks/authoring.js';
import { LabAskEditor, type LabAskShape } from '../authoring-kit.js';

export default function CircleAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const a = value as {
    radius?: number;
    showExpanded?: boolean;
    showTangent?: boolean;
    snap?: number;
    title?: string;
  };
  const ask = value.ask as LabAskShape | undefined;
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField
          value={a.title ?? ''}
          placeholder="The circle"
          onChange={(v) => onChange({ title: v })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="Radius">
        <NumField value={a.radius ?? 4} onChange={(v) => onChange({ radius: v })} />
      </ConfigRow>
      <ConfigRow label="Show">
        <ChipToggle active={!!a.showExpanded} onClick={() => onChange({ showExpanded: !a.showExpanded })}>
          expanded form
        </ChipToggle>
        <ChipToggle active={!!a.showTangent} onClick={() => onChange({ showTangent: !a.showTangent })}>
          tangent
        </ChipToggle>
      </ConfigRow>
      <ConfigRow label="Snap">
        <NumField value={a.snap ?? 1} onChange={(v) => onChange({ snap: v })} />
      </ConfigRow>
      <LabAskEditor ask={ask} onChange={(x) => onChange({ ask: x })} />
    </ConfigPanel>
  );
}
