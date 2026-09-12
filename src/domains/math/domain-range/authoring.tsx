'use client';

/** Domain-range authoring — f(x), the x-window, an optional domain restriction, and a graded question. */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, ChipToggle, TextField, NumField } from '../../../blocks/authoring.js';
import { LabAskEditor, type LabAskShape } from '../authoring-kit.js';

export default function DomainRangeAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const a = value as {
    equation?: string;
    xRange?: [number, number];
    restrict?: [number, number];
    title?: string;
  };
  const ask = value.ask as LabAskShape | undefined;
  const xR = a.xRange ?? [-6, 6];
  const restricted = Array.isArray(a.restrict);
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField
          value={a.title ?? ''}
          placeholder="Domain & range"
          onChange={(v) => onChange({ title: v })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="f(x) =">
        <TextField
          value={a.equation ?? ''}
          mono
          placeholder="sqrt(9 - x^2)"
          onChange={(v) => onChange({ equation: v })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="x window">
        <NumField value={xR[0]} onChange={(v) => onChange({ xRange: [v, xR[1]] })} />
        <span className="text-muted-foreground">to</span>
        <NumField value={xR[1]} onChange={(v) => onChange({ xRange: [xR[0], v] })} />
      </ConfigRow>
      <ConfigRow label="Restrict domain">
        <ChipToggle active={!restricted} onClick={() => onChange({ restrict: undefined })}>
          none
        </ChipToggle>
        <ChipToggle active={restricted} onClick={() => onChange({ restrict: a.restrict ?? [-2, 2] })}>
          interval
        </ChipToggle>
        {restricted && (
          <>
            <NumField value={a.restrict![0]} onChange={(v) => onChange({ restrict: [v, a.restrict![1]] })} />
            <span className="text-muted-foreground">to</span>
            <NumField value={a.restrict![1]} onChange={(v) => onChange({ restrict: [a.restrict![0], v] })} />
          </>
        )}
      </ConfigRow>
      <LabAskEditor ask={ask} onChange={(x) => onChange({ ask: x })} />
    </ConfigPanel>
  );
}
