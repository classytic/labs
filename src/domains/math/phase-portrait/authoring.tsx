'use client';
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, NumField, TextField } from '../../../blocks/authoring.js';
export default function PhasePortraitAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const xRange = (value.xRange as [number, number] | undefined) ?? [-4, 4],
    yRange = (value.yRange as [number, number] | undefined) ?? [-4, 4],
    initial = (value.initial as [number, number] | undefined) ?? [3, 0];
  const xInvalid = xRange[1] <= xRange[0],
    yInvalid = yRange[1] <= yRange[0];
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField
          value={(value.title as string) ?? ''}
          placeholder="See a system evolve in state space"
          onChange={(title) => onChange({ title })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="dx/dt" hint="Expressions may use x, y, and t.">
        <TextField
          value={(value.dx as string) ?? 'y'}
          mono
          onChange={(dx) => onChange({ dx })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="dy/dt">
        <TextField
          value={(value.dy as string) ?? '-x - 0.25*y'}
          mono
          onChange={(dy) => onChange({ dy })}
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
      <ConfigRow label="Initial state">
        <span className="text-muted-foreground">x₀</span>
        <NumField value={initial[0]} onChange={(x) => onChange({ initial: [x, initial[1]] })} />
        <span className="text-muted-foreground">y₀</span>
        <NumField value={initial[1]} onChange={(y) => onChange({ initial: [initial[0], y] })} />
      </ConfigRow>
      <ConfigRow label="Trace">
        <span className="text-muted-foreground">duration</span>
        <NumField
          value={(value.duration as number) ?? 10}
          min={1}
          max={40}
          step={0.5}
          onChange={(duration) => onChange({ duration: clamp(duration, 1, 40) })}
        />
        <span className="text-muted-foreground">step h</span>
        <NumField
          value={(value.stepSize as number) ?? 0.16}
          min={0.02}
          max={1}
          step={0.02}
          onChange={(stepSize) => onChange({ stepSize: clamp(stepSize, 0.02, 1) })}
        />
      </ConfigRow>
    </ConfigPanel>
  );
}
const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
