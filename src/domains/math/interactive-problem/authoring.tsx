'use client';

/** Interactive-problem authoring — equations + sliders + the derive list (computed & drawn) +
 *  windows + a graded question. */
import type { ReactNode } from 'react';
import {
  ConfigPanel,
  ConfigRow,
  ChipToggle,
  TextField,
  NumField,
  SmallButton,
  SelectField,
} from '../../../blocks/authoring.js';
import { asExprStrings, asParams, type GraphParam } from '../shared.js';
import { AskEditor, nextParamName, type AskShape } from '../authoring-kit.js';

const DERIVE_KINDS = ['intersections', 'roots', 'tangent', 'normal', 'area'];

export default function InteractiveProblemAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const equations = asExprStrings(value.equations);
  const params = asParams(value.params);
  const xRange = (value.xRange as [number, number] | undefined) ?? [-6.5, 6.5];
  const yRange = (value.yRange as [number, number] | 'auto' | undefined) ?? 'auto';
  const derive = (Array.isArray(value.derive) ? value.derive : []) as Array<Record<string, unknown>>;
  const ask = value.ask as AskShape | undefined;
  const setEq = (i: number, v: string): void =>
    onChange({ equations: equations.map((e, j) => (j === i ? v : e)) });
  const setParam = (i: number, patch: Partial<GraphParam>): void =>
    onChange({ params: params.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const setDerive = (i: number, patch: Record<string, unknown>): void =>
    onChange({ derive: derive.map((d, j) => (j === i ? { ...d, ...patch } : d)) });
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField
          value={(value.title as string) ?? ''}
          placeholder="Interactive problem"
          onChange={(v) => onChange({ title: v })}
          className="flex-1"
        />
      </ConfigRow>
      <ConfigRow label="Prompt">
        <TextField
          value={(value.prompt as string) ?? ''}
          placeholder="what the learner does"
          onChange={(v) => onChange({ prompt: v })}
          className="flex-1"
        />
      </ConfigRow>

      <div className="space-y-1.5">
        <span className="font-medium text-muted-foreground">Equations (use x and your slider names)</span>
        {equations.map((eq, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground">{i}: y =</span>
            <TextField
              value={eq}
              mono
              placeholder="abs(p*x - q)"
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
              placeholder="k"
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
              params: [...params, { name: nextParamName(params), min: 0, max: 10, value: 1, step: 1 }],
            })
          }
        >
          + slider
        </SmallButton>
      </div>

      <div className="space-y-1.5">
        <span className="font-medium text-muted-foreground">Derive (computed + drawn live)</span>
        {derive.map((d, i) => {
          const kind = String(d.kind ?? 'intersections');
          const ofA = Array.isArray(d.of) ? Number(d.of[0]) : Number(d.of ?? 0);
          const ofB = Array.isArray(d.of) ? Number(d.of[1] ?? 1) : 1;
          return (
            <div key={i} className="flex flex-wrap items-center gap-1.5">
              <SelectField value={kind} options={DERIVE_KINDS} onChange={(v) => setDerive(i, { kind: v })} />
              {kind === 'intersections' && (
                <>
                  <span className="text-muted-foreground">of eq</span>
                  <NumField value={ofA} onChange={(v) => setDerive(i, { of: [v, ofB] })} />
                  <span className="text-muted-foreground">&</span>
                  <NumField value={ofB} onChange={(v) => setDerive(i, { of: [ofA, v] })} />
                </>
              )}
              {kind === 'roots' && (
                <>
                  <span className="text-muted-foreground">of eq</span>
                  <NumField value={Number(d.of ?? 0)} onChange={(v) => setDerive(i, { of: v })} />
                </>
              )}
              {(kind === 'tangent' || kind === 'normal') && (
                <>
                  <span className="text-muted-foreground">of eq</span>
                  <NumField value={Number(d.of ?? 0)} onChange={(v) => setDerive(i, { of: v })} />
                  <span className="text-muted-foreground">at x</span>
                  <TextField
                    value={String(d.at ?? '')}
                    mono
                    placeholder="2 or a param"
                    onChange={(v) => setDerive(i, { at: /^-?\d*\.?\d+$/.test(v) ? Number(v) : v })}
                    className="w-20"
                  />
                </>
              )}
              {kind === 'area' && (
                <>
                  <span className="text-muted-foreground">eqs</span>
                  <NumField
                    value={Array.isArray(d.between) ? Number(d.between[0]) : 0}
                    onChange={(v) =>
                      setDerive(i, { between: [v, Array.isArray(d.between) ? Number(d.between[1] ?? 1) : 1] })
                    }
                  />
                  <NumField
                    value={Array.isArray(d.between) ? Number(d.between[1] ?? 1) : 1}
                    onChange={(v) =>
                      setDerive(i, { between: [Array.isArray(d.between) ? Number(d.between[0]) : 0, v] })
                    }
                  />
                </>
              )}
              <SmallButton
                tone="danger"
                onClick={() => onChange({ derive: derive.filter((_, j) => j !== i) })}
              >
                ✕
              </SmallButton>
            </div>
          );
        })}
        <SmallButton onClick={() => onChange({ derive: [...derive, { kind: 'intersections', of: [0, 1] }] })}>
          + derive
        </SmallButton>
      </div>

      <ConfigRow label="x window">
        <NumField value={xRange[0]} onChange={(v) => onChange({ xRange: [v, xRange[1]] })} />
        <span className="text-muted-foreground">to</span>
        <NumField value={xRange[1]} onChange={(v) => onChange({ xRange: [xRange[0], v] })} />
      </ConfigRow>
      <ConfigRow label="y window">
        <ChipToggle active={yRange === 'auto'} onClick={() => onChange({ yRange: 'auto' })}>
          auto
        </ChipToggle>
        <ChipToggle
          active={yRange !== 'auto'}
          onClick={() => onChange({ yRange: yRange === 'auto' ? [-10, 10] : yRange })}
        >
          fixed
        </ChipToggle>
        {yRange !== 'auto' && (
          <>
            <NumField
              value={yRange[0]}
              onChange={(v) => onChange({ yRange: [v, (yRange as [number, number])[1]] })}
            />
            <span className="text-muted-foreground">to</span>
            <NumField
              value={yRange[1]}
              onChange={(v) => onChange({ yRange: [(yRange as [number, number])[0], v] })}
            />
          </>
        )}
      </ConfigRow>

      <AskEditor ask={ask} onChange={(x) => onChange({ ask: x })} />
    </ConfigPanel>
  );
}
