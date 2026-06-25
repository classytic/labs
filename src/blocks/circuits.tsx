/**
 * @classytic/labs/blocks — circuits lab block specs.
 *
 * `defineBlock` editor adapters for the circuits labs (one domain per file; the
 * registry is assembled in `./index.ts`). Each spec pairs a zod schema with a
 * render `Component` that, in `mode === 'editing'`, shows the authoring kit
 * (`./authoring`). `@classytic/cms-ui` + `zod` are optional peers touched only
 * by the blocks layer.
 */

import type { ReactNode } from 'react';
import { z } from 'zod';
import { defineBlock } from '@classytic/cms-ui/contract';
import { ConfigPanel, ConfigRow, ChipToggle, TextField, NumField, SmallButton } from './authoring.js';
import { CircuitLab, CircuitBuilder, CircuitNetworkLab, CapacitorLeakLab, type CircuitComponent, type CircuitComponentSpec } from '../circuits/index.js';

export const CircuitLabBlock = defineBlock({
  key: 'circuit-lab',
  void: true,
  label: 'Circuit lab',
  description: 'Series/parallel resistors — voltage & current divider rules, step by step.',
  category: 'interactive',
  schema: z.object({
    voltage: z.number().optional(),
    r1: z.number().optional(),
    r2: z.number().optional(),
    mode: z.enum(['series', 'parallel']).optional(),
    title: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = (
      <CircuitLab
        voltage={typeof attributes.voltage === 'number' ? attributes.voltage : 12}
        r1={typeof attributes.r1 === 'number' ? attributes.r1 : 100}
        r2={typeof attributes.r2 === 'number' ? attributes.r2 : 200}
        mode={attributes.mode === 'parallel' ? 'parallel' : 'series'}
        title={attributes.title ?? 'Series & parallel: how V and I divide'}
      />
    );
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={attributes.title ?? 'Series & parallel: how V and I divide'} onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="V"><NumField value={typeof attributes.voltage === 'number' ? attributes.voltage : 12} onChange={(v) => updateAttributes({ voltage: v })} /></ConfigRow>
          <ConfigRow label="R₁ / R₂">
            <NumField value={typeof attributes.r1 === 'number' ? attributes.r1 : 100} onChange={(v) => updateAttributes({ r1: v })} />
            <NumField value={typeof attributes.r2 === 'number' ? attributes.r2 : 200} onChange={(v) => updateAttributes({ r2: v })} />
          </ConfigRow>
          <ConfigRow label="mode">
            <ChipToggle active={attributes.mode !== 'parallel'} onClick={() => updateAttributes({ mode: 'series' })}>series</ChipToggle>
            <ChipToggle active={attributes.mode === 'parallel'} onClick={() => updateAttributes({ mode: 'parallel' })}>parallel</ChipToggle>
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

const asComponents = (raw: unknown): CircuitComponent[] => {
  if (!Array.isArray(raw) || !raw.length) return [{ type: 'switch', closed: false, label: 'switch' }, { type: 'bulb', ohms: 12, label: 'bulb' }];
  return raw as CircuitComponent[];
};

export const CircuitBuilderBlock = defineBlock({
  key: 'circuit-builder',
  void: true,
  label: 'Circuit builder (play)',
  description: 'Build a loop — battery, bulbs, switches, resistors. Flip switches, watch current & the bulb.',
  category: 'interactive',
  schema: z.object({
    battery: z.number().optional(),
    components: z.array(z.record(z.string(), z.unknown())).optional(),
    title: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const components = asComponents(attributes.components);
    const battery = typeof attributes.battery === 'number' ? attributes.battery : 6;
    const title = attributes.title ?? 'Build a circuit';
    const widget = <CircuitBuilder battery={battery} components={components} title={title} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const set = (next: CircuitComponent[]): void => updateAttributes({ components: next as unknown as Record<string, unknown>[] });
    const upd = (i: number, patch: Partial<CircuitComponent>): void => set(components.map((c, j) => (j === i ? ({ ...c, ...patch } as CircuitComponent) : c)));
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={title} onChange={(v) => updateAttributes({ title: v })} className="flex-1" /></ConfigRow>
          <ConfigRow label="battery V"><NumField value={battery} onChange={(v) => updateAttributes({ battery: v })} /></ConfigRow>
          <div className="space-y-1">
            <span className="font-medium text-muted-foreground">Components (series loop)</span>
            {components.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-1.5 rounded border border-border/50 bg-background/40 px-1.5 py-1">
                <span className="w-16 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{c.type}</span>
                {(c.type === 'resistor' || c.type === 'bulb') && <>Ω<NumField value={(c as { ohms: number }).ohms} onChange={(v) => upd(i, { ohms: v } as Partial<CircuitComponent>)} /></>}
                {c.type === 'switch' && <ChipToggle active={(c as { closed?: boolean }).closed !== false} onClick={() => upd(i, { closed: (c as { closed?: boolean }).closed === false } as Partial<CircuitComponent>)}>{(c as { closed?: boolean }).closed !== false ? 'closed' : 'open'}</ChipToggle>}
                <TextField value={c.label ?? ''} placeholder="label" onChange={(v) => upd(i, { label: v } as Partial<CircuitComponent>)} className="w-20" />
                <SmallButton tone="danger" onClick={() => set(components.filter((_, j) => j !== i))}>✕</SmallButton>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <SmallButton onClick={() => set([...components, { type: 'resistor', ohms: 100, label: 'R' }])}>+ resistor</SmallButton>
            <SmallButton onClick={() => set([...components, { type: 'bulb', ohms: 12, label: 'bulb' }])}>+ bulb</SmallButton>
            <SmallButton onClick={() => set([...components, { type: 'switch', closed: false, label: 'switch' }])}>+ switch</SmallButton>
          </div>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

/** Simple single-loop circuit authoring → the labs component's branches[][] API. */
export function CircuitPuzzle({ emf = 6, bulbOhms = 6, withSwitch = true, controlId }: { emf?: number; bulbOhms?: number; withSwitch?: boolean; controlId?: string }): ReactNode {
  const chain: CircuitComponentSpec[] = withSwitch
    ? [{ type: 'switch', closed: false }, { type: 'bulb', ohms: bulbOhms }]
    : [{ type: 'bulb', ohms: bulbOhms }];
  return <CircuitNetworkLab emf={emf} branches={[chain]} goal={{ kind: 'lightBulb' }} controlId={controlId} />;
}

export const CircuitBlock = defineBlock({
  key: 'circuit',
  tag: 'Circuit',
  void: true,
  label: 'Circuit (light the bulb)',
  description: 'Battery + switch + bulb — close the switch and tune the voltage to light it.',
  category: 'interactive',
  schema: z.object({ emf: z.number().default(6), bulbOhms: z.number().default(6), withSwitch: z.boolean().default(true), controlId: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const { emf = 6, bulbOhms = 6, withSwitch = true } = attributes;
    const widget = <CircuitPuzzle emf={emf} bulbOhms={bulbOhms} withSwitch={withSwitch} controlId={attributes.controlId} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="battery (V)"><NumField value={emf} onChange={(v) => updateAttributes({ emf: v })} /></ConfigRow>
          <ConfigRow label="bulb (Ω)"><NumField value={bulbOhms} onChange={(v) => updateAttributes({ bulbOhms: v })} /></ConfigRow>
          <ConfigRow label="switch">
            <ChipToggle active={withSwitch} onClick={() => updateAttributes({ withSwitch: true })}>yes</ChipToggle>
            <ChipToggle active={!withSwitch} onClick={() => updateAttributes({ withSwitch: false })}>no</ChipToggle>
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const CapacitorLeakBlock = defineBlock({
  key: 'capacitor-leak',
  tag: 'CapacitorLeak',
  void: true,
  label: 'Capacitor — charge & leak (RC)',
  description: 'A cell charges a capacitor through R; flip to "leak" and it self-discharges through its leakage resistance — the plate field thins, drips fall, Vc decays. Live Vc–t trace + τ readout.',
  category: 'interactive',
  schema: z.object({
    emf: z.number().default(6),
    rK: z.number().default(10),
    capU: z.number().default(100),
    leakK: z.number().default(200),
    startCharged: z.boolean().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = (
      <CapacitorLeakLab
        emf={attributes.emf} rK={attributes.rK} capU={attributes.capU} leakK={attributes.leakK}
        startCharged={attributes.startCharged} title={attributes.title} prompt={attributes.prompt}
      />
    );
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Charging & leaking a capacitor" /></ConfigRow>
          <ConfigRow label="EMF (V)"><NumField value={attributes.emf ?? 6} onChange={(v) => updateAttributes({ emf: v })} /></ConfigRow>
          <ConfigRow label="R (kΩ)"><NumField value={attributes.rK ?? 10} onChange={(v) => updateAttributes({ rK: v })} /></ConfigRow>
          <ConfigRow label="C (µF)"><NumField value={attributes.capU ?? 100} onChange={(v) => updateAttributes({ capU: v })} /></ConfigRow>
          <ConfigRow label="leak R (kΩ)"><NumField value={attributes.leakK ?? 200} onChange={(v) => updateAttributes({ leakK: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

/** All circuits lab blocks — spread into the registry in `./index.ts`. */
export const circuitsBlocks = [
  CircuitLabBlock,
  CircuitBuilderBlock,
  CircuitBlock,
  CapacitorLeakBlock,
] as const;

/** MDX tag → component render map slice for the circuits domain. */
export const circuitsComponents = {
  CapacitorLeak: CapacitorLeakLab,
  Circuit: CircuitPuzzle,
  CircuitBuilder,
  CircuitLab,
} as const;
