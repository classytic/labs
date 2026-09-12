'use client';

/**
 * Circuit-builder authoring — a custom editor (loaded only in the CMS editor chunk). The series
 * loop is a free-form component array, so this is an add/remove/tune list (resistor/bulb Ω,
 * switch open/closed, label) rather than the schema-driven form.
 */

import type { ReactNode } from 'react';
import {
  ConfigPanel,
  ConfigRow,
  ChipToggle,
  TextField,
  NumField,
  SmallButton,
} from '../../../blocks/authoring.js';
import { asComponents, type CircuitComponent } from './shared.js';
import { Plus, Trash2 } from 'lucide-react';

export default function CircuitBuilderAuthoring({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  const components = asComponents(value.components);
  const battery = typeof value.battery === 'number' ? value.battery : 6;
  const title = (value.title as string) ?? 'Build a circuit';
  const prompt =
    (value.prompt as string) ?? 'Complete the path, tune the source, and explain how the current changes.';
  const height = typeof value.height === 'number' ? value.height : 320;
  const set = (next: CircuitComponent[]): void =>
    onChange({ components: next as unknown as Record<string, unknown>[] });
  const upd = (i: number, patch: Partial<CircuitComponent>): void =>
    set(components.map((c, j) => (j === i ? ({ ...c, ...patch } as CircuitComponent) : c)));
  return (
    <ConfigPanel>
      <ConfigRow label="Title">
        <TextField value={title} onChange={(v) => onChange({ title: v })} className="flex-1" />
      </ConfigRow>
      <ConfigRow label="Prompt">
        <TextField value={prompt} onChange={(v) => onChange({ prompt: v })} className="flex-1" />
      </ConfigRow>
      <ConfigRow label="Battery">
        <NumField value={battery} min={1} max={24} step={1} onChange={(v) => onChange({ battery: v })} /> V
      </ConfigRow>
      <ConfigRow label="Canvas">
        <NumField value={height} min={240} max={720} step={20} onChange={(v) => onChange({ height: v })} /> px
      </ConfigRow>
      <div className="space-y-1">
        <span className="font-medium text-muted-foreground">Components (series loop)</span>
        {components.map((c, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-1.5 rounded border border-border/50 bg-background/40 px-1.5 py-1"
          >
            <span className="w-16 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {c.type}
            </span>
            {(c.type === 'resistor' || c.type === 'bulb') && (
              <>
                Ω
                <NumField
                  value={(c as { ohms: number }).ohms}
                  onChange={(v) => upd(i, { ohms: v } as Partial<CircuitComponent>)}
                />
              </>
            )}
            {c.type === 'switch' && (
              <ChipToggle
                active={(c as { closed?: boolean }).closed !== false}
                onClick={() =>
                  upd(i, {
                    closed: (c as { closed?: boolean }).closed === false,
                  } as Partial<CircuitComponent>)
                }
              >
                {(c as { closed?: boolean }).closed !== false ? 'closed' : 'open'}
              </ChipToggle>
            )}
            <TextField
              value={c.label ?? ''}
              placeholder="label"
              onChange={(v) => upd(i, { label: v } as Partial<CircuitComponent>)}
              className="w-20"
            />
            <SmallButton
              tone="danger"
              ariaLabel={`Remove ${c.label ?? c.type}`}
              onClick={() => set(components.filter((_, j) => j !== i))}
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
            </SmallButton>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <SmallButton onClick={() => set([...components, { type: 'resistor', ohms: 100, label: 'R' }])}>
          <Plus aria-hidden="true" className="mr-1 inline size-3" />
          Resistor
        </SmallButton>
        <SmallButton onClick={() => set([...components, { type: 'bulb', ohms: 12, label: 'bulb' }])}>
          <Plus aria-hidden="true" className="mr-1 inline size-3" />
          Bulb
        </SmallButton>
        <SmallButton onClick={() => set([...components, { type: 'switch', closed: false, label: 'switch' }])}>
          <Plus aria-hidden="true" className="mr-1 inline size-3" />
          Switch
        </SmallButton>
      </div>
    </ConfigPanel>
  );
}
