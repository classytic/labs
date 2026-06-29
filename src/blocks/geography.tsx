/**
 * @classytic/labs/blocks, geography lab block specs.
 *
 * `defineBlock` editor adapter for the general CycleLab. A creator/agent picks a
 * canned cycle (water / rock / carbon) OR pastes their own nodes + edges JSON, and
 * chooses the challenge. One domain per file; assembled in `./index.ts` and
 * exported at `@classytic/labs/blocks/geography`.
 */

import { z } from 'zod';
import { defineBlock } from '@classytic/cms-ui/contract';
import { ConfigPanel, ConfigRow, ChipToggle, TextField, JsonArea } from './authoring.js';
import { CycleLab } from '../geography/index.js';
import { CYCLE_PRESETS, type CyclePresetKey } from '../geography/cycles.js';

export const CycleBlock = defineBlock({
  key: 'cycle',
  tag: 'Cycle',
  void: true,
  label: 'Cycle diagram (water / rock / carbon / custom)',
  description: 'A general directed-cycle lab: stages laid around a ring with process-labelled arrows. Trace mode lights a stage’s outgoing processes (great for branched rock/carbon cycles); label-process mode strips the process names into a tray to match back onto the arrows. Pick a preset or author your own nodes + edges.',
  category: 'interactive',
  schema: z.object({
    preset: z.enum(['water', 'rock', 'carbon', 'custom']).default('water'),
    challenge: z.enum(['trace', 'label-process']).default('label-process'),
    nodes: z.array(z.object({ id: z.string(), label: z.string(), tone: z.string().optional() })).optional(),
    edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional() })).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const preset = (attributes.preset ?? 'water') as CyclePresetKey | 'custom';
    const spec = preset === 'custom'
      ? { nodes: attributes.nodes ?? [], edges: attributes.edges ?? [] }
      : CYCLE_PRESETS[preset];
    const widget = <CycleLab nodes={spec.nodes} edges={spec.edges} challenge={attributes.challenge} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    const cyclePreset = (): void => {
      const order: (CyclePresetKey | 'custom')[] = ['water', 'rock', 'carbon', 'custom'];
      updateAttributes({ preset: order[(order.indexOf(preset) + 1) % order.length] });
    };
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="The water cycle" /></ConfigRow>
          <ConfigRow label="cycle"><ChipToggle active onClick={cyclePreset}>{preset}</ChipToggle></ConfigRow>
          <ConfigRow label="trace mode"><ChipToggle active={attributes.challenge === 'trace'} onClick={() => updateAttributes({ challenge: attributes.challenge === 'trace' ? 'label-process' : 'trace' })}>trace</ChipToggle></ConfigRow>
          {preset === 'custom' && <ConfigRow label="nodes"><JsonArea value={attributes.nodes ?? []} onChange={(v) => updateAttributes({ nodes: v })} /></ConfigRow>}
          {preset === 'custom' && <ConfigRow label="edges"><JsonArea value={attributes.edges ?? []} onChange={(v) => updateAttributes({ edges: v })} /></ConfigRow>}
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

/** This domain's block specs + tag→component render map. */
export const geographyBlocks = [CycleBlock] as const;
export const geographyComponents = {
  Cycle: CycleLab,
} as const;
