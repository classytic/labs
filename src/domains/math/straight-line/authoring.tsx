'use client';

/** Straight-line authoring — the line form (two-point / gradient-intercept / parallel / ⊥ …),
 *  snap, and a typed-or-multiple-choice graded question. */
import type { ReactNode } from 'react';
import {
  ConfigPanel,
  ConfigRow,
  ChipToggle,
  TextField,
  NumField,
  SelectField,
} from '../../../blocks/authoring.js';
import { LabAskEditor, type LabAskShape } from '../authoring-kit.js';

export default function StraightLineAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const a = value as {
    mode?: string;
    given?: { m: number; c: number };
    showDistance?: boolean;
    snap?: number;
    title?: string;
  };
  const ask = value.ask as LabAskShape | undefined;
  const m = a.mode ?? 'two-point';
  const given = a.given ?? { m: 0.5, c: 2 };
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField
          value={a.title ?? ''}
          placeholder="The straight line"
          onChange={(v) => onChange({ title: v })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="Form">
        <SelectField
          value={m}
          options={['two-point', 'gradient-intercept', 'intercept-form', 'parallel', 'perpendicular']}
          onChange={(v) => onChange({ mode: v })}
        />
      </ConfigRow>
      {(m === 'parallel' || m === 'perpendicular') && (
        <ConfigRow label="Given line  y =">
          <NumField value={given.m} onChange={(v) => onChange({ given: { ...given, m: v } })} />
          <span className="text-muted-foreground">x +</span>
          <NumField value={given.c} onChange={(v) => onChange({ given: { ...given, c: v } })} />
        </ConfigRow>
      )}
      {m === 'two-point' && (
        <ConfigRow label="Extras">
          <ChipToggle active={!!a.showDistance} onClick={() => onChange({ showDistance: !a.showDistance })}>
            show |AB| + midpoint
          </ChipToggle>
        </ConfigRow>
      )}
      <ConfigRow label="Snap">
        <NumField value={a.snap ?? 1} onChange={(v) => onChange({ snap: v })} />
      </ConfigRow>
      <LabAskEditor ask={ask} onChange={(x) => onChange({ ask: x })} />
    </ConfigPanel>
  );
}
