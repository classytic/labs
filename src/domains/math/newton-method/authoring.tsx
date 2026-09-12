'use client';
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, NumField, TextField } from '../../../blocks/authoring.js';
export default function NewtonMethodAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const range = (value.xRange as [number, number] | undefined) ?? [-3, 3];
  const invalid = range[1] <= range[0];
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField
          value={(value.title as string) ?? ''}
          placeholder="Find a root with tangents"
          onChange={(title) => onChange({ title })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="Function f(x)">
        <TextField
          value={(value.equation as string) ?? 'x^3 - x - 2'}
          mono
          onChange={(equation) => onChange({ equation })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="x window" error={invalid ? 'Maximum must be greater than minimum.' : undefined}>
        <NumField
          value={range[0]}
          invalid={invalid}
          onChange={(minimum) => onChange({ xRange: [minimum, range[1]] })}
        />
        <span className="text-muted-foreground">to</span>
        <NumField
          value={range[1]}
          invalid={invalid}
          onChange={(maximum) => onChange({ xRange: [range[0], maximum] })}
        />
      </ConfigRow>
      <ConfigRow label="Initial guess">
        <NumField value={(value.startX as number) ?? 1.8} onChange={(startX) => onChange({ startX })} />
      </ConfigRow>
      <ConfigRow
        label="Iteration cap"
        hint="A safety cap, not a target. The lab stops earlier when it converges."
      >
        <NumField
          value={(value.maxSteps as number) ?? 12}
          min={1}
          max={30}
          step={1}
          onChange={(maxSteps) => onChange({ maxSteps: Math.round(clampValue(maxSteps, 1, 30)) })}
        />
      </ConfigRow>
    </ConfigPanel>
  );
}
const clampValue = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
