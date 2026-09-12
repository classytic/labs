'use client';

import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, NumField, TextField } from '../../../blocks/authoring.js';

export default function GradientDescentAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const range = (value.range as [number, number] | undefined) ?? [-3, 3];
  const start = (value.start as [number, number] | undefined) ?? [2.4, 1.8];
  const invalidRange = range[1] <= range[0];
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField
          value={(value.title as string) ?? ''}
          placeholder="Gradient descent"
          onChange={(title) => onChange({ title })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="Loss f(x,y)" hint="Use x and y, for example x^2 + 2*y^2.">
        <TextField
          value={(value.equation as string) ?? 'x^2 + 2*y^2'}
          mono
          onChange={(equation) => onChange({ equation })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow
        label="Surface range"
        error={invalidRange ? 'Maximum must be greater than minimum.' : undefined}
      >
        <NumField
          value={range[0]}
          invalid={invalidRange}
          onChange={(minimum) => onChange({ range: [minimum, range[1]] })}
        />
        <span className="text-muted-foreground">to</span>
        <NumField
          value={range[1]}
          invalid={invalidRange}
          onChange={(maximum) => onChange({ range: [range[0], maximum] })}
        />
      </ConfigRow>
      <ConfigRow label="Start (x, y)">
        <NumField value={start[0]} onChange={(x) => onChange({ start: [x, start[1]] })} />
        <NumField value={start[1]} onChange={(y) => onChange({ start: [start[0], y] })} />
      </ConfigRow>
      <ConfigRow label="Learning rate" hint="Learners can tune this between 0.01 and 0.60.">
        <NumField
          value={(value.learningRate as number) ?? 0.1}
          min={0.01}
          max={0.6}
          step={0.01}
          onChange={(learningRate) => onChange({ learningRate: Math.max(0.01, Math.min(0.6, learningRate)) })}
        />
      </ConfigRow>
    </ConfigPanel>
  );
}
