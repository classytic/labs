'use client';
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, NumField, TextField } from '../../../blocks/authoring.js';

export default function DifferentialEquationAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const xRange = (value.xRange as [number, number] | undefined) ?? [-3, 3];
  const yRange = (value.yRange as [number, number] | undefined) ?? [-3, 3];
  const initial = (value.initial as [number, number] | undefined) ?? [0, 1];
  const xInvalid = xRange[1] <= xRange[0],
    yInvalid = yRange[1] <= yRange[0];
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField
          value={(value.title as string) ?? ''}
          placeholder="Trace a solution through a slope field"
          onChange={(title) => onChange({ title })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow
        label="Slope f(x,y)"
        hint="Define y′ using x and y, for example x - y, y*(1-y), or sin(x)-0.3*y."
      >
        <TextField
          value={(value.equation as string) ?? 'x - y'}
          mono
          onChange={(equation) => onChange({ equation })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="x window" error={xInvalid ? 'Maximum must be greater than minimum.' : undefined}>
        <NumField
          value={xRange[0]}
          invalid={xInvalid}
          onChange={(minimum) => onChange({ xRange: [minimum, xRange[1]] })}
        />
        <span className="text-muted-foreground">to</span>
        <NumField
          value={xRange[1]}
          invalid={xInvalid}
          onChange={(maximum) => onChange({ xRange: [xRange[0], maximum] })}
        />
      </ConfigRow>
      <ConfigRow label="y window" error={yInvalid ? 'Maximum must be greater than minimum.' : undefined}>
        <NumField
          value={yRange[0]}
          invalid={yInvalid}
          onChange={(minimum) => onChange({ yRange: [minimum, yRange[1]] })}
        />
        <span className="text-muted-foreground">to</span>
        <NumField
          value={yRange[1]}
          invalid={yInvalid}
          onChange={(maximum) => onChange({ yRange: [yRange[0], maximum] })}
        />
      </ConfigRow>
      <ConfigRow label="Initial condition">
        <span className="text-muted-foreground">x₀</span>
        <NumField value={initial[0]} onChange={(x) => onChange({ initial: [x, initial[1]] })} />
        <span className="text-muted-foreground">y₀</span>
        <NumField value={initial[1]} onChange={(y) => onChange({ initial: [initial[0], y] })} />
      </ConfigRow>
      <ConfigRow label="Numerical setup">
        <span className="text-muted-foreground">step h</span>
        <NumField
          value={(value.stepSize as number) ?? 0.4}
          min={0.02}
          step={0.02}
          onChange={(stepSize) => onChange({ stepSize: Math.max(0.02, stepSize) })}
        />
        <span className="text-muted-foreground">probe x</span>
        <NumField value={(value.probe as number) ?? 2.5} onChange={(probe) => onChange({ probe })} />
      </ConfigRow>
    </ConfigPanel>
  );
}
