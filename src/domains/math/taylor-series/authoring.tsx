'use client';
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, NumField, TextField } from '../../../blocks/authoring.js';
export default function TaylorSeriesAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const range = (value.xRange as [number, number] | undefined) ?? [-6.3, 6.3];
  const invalid = range[1] <= range[0];
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField
          value={(value.title as string) ?? ''}
          placeholder="Build a function from its derivatives"
          onChange={(title) => onChange({ title })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow
        label="Function f(x)"
        hint="Use expressions supported by the symbolic differentiator, such as sin(x), exp(x), or a polynomial."
      >
        <TextField
          value={(value.equation as string) ?? 'sin(x)'}
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
      <ConfigRow label="Center a">
        <NumField value={(value.center as number) ?? 0} onChange={(center) => onChange({ center })} />
        <span className="text-muted-foreground">initial order</span>
        <NumField
          value={(value.order as number) ?? 5}
          min={0}
          max={8}
          step={1}
          onChange={(order) => onChange({ order: Math.round(Math.min(8, Math.max(0, order))) })}
        />
      </ConfigRow>
      <ConfigRow label="Error probe">
        <NumField value={(value.probe as number) ?? 2} onChange={(probe) => onChange({ probe })} />
      </ConfigRow>
    </ConfigPanel>
  );
}
