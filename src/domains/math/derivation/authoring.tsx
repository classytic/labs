'use client';

/** Derivation authoring — the step editor (LaTeX + an optional "why" note per line). */
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, TextField, SmallButton } from '../../../blocks/authoring.js';
import { asSteps } from '../shared.js';

export default function DerivationAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const steps = asSteps(value.steps);
  const title = (value.title as string) ?? 'Derivation';
  const setStep = (i: number, patch: Partial<{ tex: string; note: string }>): void =>
    onChange({ steps: steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField value={title} onChange={(v) => onChange({ title: v })} className="flex-1" />
      </ConfigRow>
      <div className="space-y-1.5">
        <span className="font-medium text-muted-foreground">Steps (LaTeX + optional note)</span>
        {steps.map((s, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-muted-foreground">{i + 1}</span>
            <TextField
              value={s.tex}
              mono
              placeholder="\\frac{y-y_P}{x-x_P} = ..."
              onChange={(v) => setStep(i, { tex: v })}
              className="min-w-[12rem] flex-1"
            />
            <TextField
              value={s.note ?? ''}
              placeholder="why…"
              onChange={(v) => setStep(i, { note: v })}
              className="w-32"
            />
            {steps.length > 1 && (
              <SmallButton tone="danger" onClick={() => onChange({ steps: steps.filter((_, j) => j !== i) })}>
                ✕
              </SmallButton>
            )}
          </div>
        ))}
        <SmallButton onClick={() => onChange({ steps: [...steps, { tex: '' }] })}>+ step</SmallButton>
      </div>
    </ConfigPanel>
  );
}
