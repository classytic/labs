'use client';

import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, NumField, TextField } from '../../blocks/authoring.js';

export type CalculusAuthoringKind = 'limit' | 'derivative' | 'integral' | 'fundamental-theorem';

const DEFAULTS = {
  limit: { title: 'Approaching a limit', equation: '(x^2 - 1)/(x - 1)', range: [-1, 3] as [number, number] },
  derivative: {
    title: 'The derivative is a slope',
    equation: '0.15*x^3 - x',
    range: [-4, 4] as [number, number],
  },
  integral: {
    title: 'The integral is an area',
    equation: '0.4*x^2 + 0.5',
    range: [-1, 4] as [number, number],
  },
  'fundamental-theorem': {
    title: 'Area becomes a new function',
    equation: '0.5*x^2 - 1',
    range: [-3, 4] as [number, number],
  },
} as const;

export function CalculusAuthoring({
  kind,
  value,
  onChange,
}: {
  kind: CalculusAuthoringKind;
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const defaults = DEFAULTS[kind];
  const range = (
    Array.isArray(value.xRange) && value.xRange.length === 2 ? value.xRange : defaults.range
  ) as [number, number];
  const rangeInvalid = !Number.isFinite(range[0]) || !Number.isFinite(range[1]) || range[1] <= range[0];
  const equation = typeof value.equation === 'string' ? value.equation : defaults.equation;
  const equationInvalid = equation.trim().length === 0;
  const pointKey =
    kind === 'limit'
      ? 'c'
      : kind === 'derivative'
        ? 'startX'
        : kind === 'fundamental-theorem'
          ? 'startX'
          : null;
  const pointLabel = kind === 'limit' ? 'Initial c' : kind === 'derivative' ? 'Initial x' : 'Initial probe';
  const pointDefault = kind === 'limit' ? 1 : kind === 'derivative' ? 1 : 2;

  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField
          value={(value.title as string) ?? ''}
          placeholder={defaults.title}
          onChange={(title) => onChange({ title })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="Function f(x)" error={equationInvalid ? 'Enter a function of x.' : undefined}>
        <TextField
          value={equation}
          mono
          placeholder="sin(x) + 1"
          invalid={equationInvalid}
          onChange={(next) => onChange({ equation: next })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow
        label="x window"
        error={rangeInvalid ? 'Maximum must be greater than minimum.' : undefined}
        hint="The visible graph interval; probes and bounds stay inside it."
      >
        <NumField
          value={range[0]}
          invalid={rangeInvalid}
          onChange={(minimum) => onChange({ xRange: [minimum, range[1]] })}
        />
        <span className="text-muted-foreground">to</span>
        <NumField
          value={range[1]}
          invalid={rangeInvalid}
          onChange={(maximum) => onChange({ xRange: [range[0], maximum] })}
        />
      </ConfigRow>
      {pointKey ? (
        <ConfigRow label={pointLabel}>
          <NumField
            value={typeof value[pointKey] === 'number' ? (value[pointKey] as number) : pointDefault}
            onChange={(point) => onChange({ [pointKey]: point })}
          />
        </ConfigRow>
      ) : null}
      {kind === 'integral' ? (
        <>
          <ConfigRow label="Initial bounds">
            <NumField value={(value.a as number) ?? 0} onChange={(a) => onChange({ a })} />
            <span className="text-muted-foreground">to</span>
            <NumField value={(value.b as number) ?? 3} onChange={(b) => onChange({ b })} />
          </ConfigRow>
          <ConfigRow label="Rectangles" hint="Learners can refine this from 1 to 80.">
            <NumField
              value={(value.n as number) ?? 8}
              min={1}
              max={80}
              step={1}
              onChange={(n) => onChange({ n: Math.round(Math.max(1, Math.min(80, n))) })}
            />
          </ConfigRow>
        </>
      ) : null}
      {kind === 'fundamental-theorem' ? (
        <ConfigRow
          label="Area starts at"
          hint="A(x) measures signed area from this fixed anchor to the moving probe."
        >
          <NumField value={(value.anchor as number) ?? -1} onChange={(anchor) => onChange({ anchor })} />
        </ConfigRow>
      ) : null}
    </ConfigPanel>
  );
}
