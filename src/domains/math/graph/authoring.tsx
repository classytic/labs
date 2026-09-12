'use client';

/** Graph authoring — the equation list + learner-slider editors + x-window and y-scale. */
import type { ReactNode } from 'react';
import {
  ConfigPanel,
  ConfigRow,
  ChipToggle,
  TextField,
  NumField,
  SmallButton,
} from '../../../blocks/authoring.js';
import { asExprStrings, asParams, type GraphParam } from '../shared.js';
import { nextParamName } from '../authoring-kit.js';

export default function GraphAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const equations = asExprStrings(value.equations);
  const params = asParams(value.params);
  const xRange = (value.xRange as [number, number] | undefined) ?? [-6.5, 6.5];
  const yScale = value.yScale === 'log' ? 'log' : 'linear';
  const title = (value.title as string) ?? 'Graph';
  const setEq = (i: number, v: string): void =>
    onChange({ equations: equations.map((e, j) => (j === i ? v : e)) });
  const setParam = (i: number, patch: Partial<GraphParam>): void =>
    onChange({ params: params.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField value={title} onChange={(v) => onChange({ title: v })} className="flex-1" />
      </ConfigRow>
      <div className="space-y-1.5">
        <span className="font-medium text-muted-foreground">Equations (use x and your slider names)</span>
        {equations.map((eq, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground">y =</span>
            <TextField
              value={eq}
              mono
              placeholder="a*sin(b*x) + c"
              onChange={(v) => setEq(i, v)}
              className="flex-1"
            />
            {equations.length > 1 && (
              <SmallButton
                tone="danger"
                onClick={() => onChange({ equations: equations.filter((_, j) => j !== i) })}
              >
                ✕
              </SmallButton>
            )}
          </div>
        ))}
        <SmallButton onClick={() => onChange({ equations: [...equations, ''] })}>+ equation</SmallButton>
      </div>
      <div className="space-y-1.5">
        <span className="font-medium text-muted-foreground">Sliders (learner-draggable)</span>
        {params.map((p, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5">
            <TextField
              value={p.name}
              mono
              placeholder="a"
              onChange={(v) => setParam(i, { name: v })}
              className="w-14"
            />
            <span className="text-muted-foreground">from</span>
            <NumField value={p.min} onChange={(v) => setParam(i, { min: v })} />
            <span className="text-muted-foreground">to</span>
            <NumField value={p.max} onChange={(v) => setParam(i, { max: v })} />
            <span className="text-muted-foreground">=</span>
            <NumField value={p.value} onChange={(v) => setParam(i, { value: v })} />
            <SmallButton tone="danger" onClick={() => onChange({ params: params.filter((_, j) => j !== i) })}>
              ✕
            </SmallButton>
          </div>
        ))}
        <SmallButton
          onClick={() =>
            onChange({
              params: [...params, { name: nextParamName(params), min: 0, max: 3, value: 1, step: 0.1 }],
            })
          }
        >
          + slider
        </SmallButton>
      </div>
      <ConfigRow label="x window">
        <NumField value={xRange[0]} onChange={(v) => onChange({ xRange: [v, xRange[1]] })} />
        <span className="text-muted-foreground">to</span>
        <NumField value={xRange[1]} onChange={(v) => onChange({ xRange: [xRange[0], v] })} />
      </ConfigRow>
      <ConfigRow label="y scale">
        <ChipToggle active={yScale !== 'log'} onClick={() => onChange({ yScale: 'linear' })}>
          linear
        </ChipToggle>
        <ChipToggle active={yScale === 'log'} onClick={() => onChange({ yScale: 'log' })}>
          log
        </ChipToggle>
      </ConfigRow>
    </ConfigPanel>
  );
}
