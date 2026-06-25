/**
 * @classytic/labs/blocks — ICT lab block specs.
 *
 * `defineBlock` editor adapters for the ICT labs (one domain per file; the
 * registry is assembled in `./index.ts`). Each spec pairs a real zod schema
 * with a render `Component` that, in `mode === 'editing'`, shows the row-based
 * authoring kit (`./authoring`). `@classytic/cms-ui` + `zod` are optional peers
 * touched only by the blocks layer.
 */

import { z } from 'zod';
import { defineBlock } from '@classytic/cms-ui/contract';
import { ConfigPanel, ConfigRow, TextField, NumField } from './authoring.js';
import { PlaceValueDialLab, BitGrouperLab, BaseOdometerLab } from '../ict/index.js';

export const PlaceValueDialBlock = defineBlock({
  key: 'place-value-dial',
  tag: 'PlaceValueDial',
  void: true,
  label: 'Place-value dial (count in any base)',
  description: 'Odometer wheels in base-N: +1 ripples a carry left while the power-of-N place values light up and sum to the live value; base-2 shows ON/OFF bit cells.',
  category: 'interactive',
  schema: z.object({
    base: z.number().default(2),
    width: z.number().default(4),
    start: z.number().default(0),
    target: z.number().optional(),
    showWeights: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <PlaceValueDialLab base={attributes.base} width={attributes.width} start={attributes.start} target={attributes.target} showWeights={attributes.showWeights} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Place-value dial" /></ConfigRow>
          <ConfigRow label="base"><NumField value={attributes.base ?? 2} onChange={(v) => updateAttributes({ base: v })} /></ConfigRow>
          <ConfigRow label="width"><NumField value={attributes.width ?? 4} onChange={(v) => updateAttributes({ width: v })} /></ConfigRow>
          <ConfigRow label="target"><NumField value={attributes.target ?? 0} onChange={(v) => updateAttributes({ target: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const BitGrouperBlock = defineBlock({
  key: 'bit-grouper',
  tag: 'BitGrouper',
  void: true,
  label: 'Bit grouper (nibbles → hex/octal)',
  description: 'Tappable bits auto-slice into groups from the right — 4 per hex digit, 3 per octal — translating live; shows why a byte = two clean hex digits but a wasteful octal top.',
  category: 'interactive',
  schema: z.object({
    width: z.number().default(8),
    groupSize: z.number().default(4),
    start: z.number().default(0),
    showColor: z.boolean().default(false),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <BitGrouperLab width={attributes.width} groupSize={attributes.groupSize} start={attributes.start} showColor={attributes.showColor} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Bit grouper" /></ConfigRow>
          <ConfigRow label="width (bits)"><NumField value={attributes.width ?? 8} onChange={(v) => updateAttributes({ width: v })} /></ConfigRow>
          <ConfigRow label="group size"><NumField value={attributes.groupSize ?? 4} onChange={(v) => updateAttributes({ groupSize: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const BaseOdometerBlock = defineBlock({
  key: 'base-odometer',
  tag: 'BaseOdometer',
  void: true,
  label: 'Base odometer (every base at once)',
  description: 'Stacked odometer rows driven by one shared integer — binary/octal/decimal/hex roll in lockstep (binary fastest), proving base is a representation, not a different number. Race toggle animates the cascade.',
  category: 'interactive',
  schema: z.object({
    max: z.number().default(255),
    start: z.number().default(0),
    race: z.boolean().default(false),
    speed: z.number().default(2),
    highlightBase: z.number().optional(),
    target: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <BaseOdometerLab max={attributes.max} start={attributes.start} race={attributes.race} speed={attributes.speed} highlightBase={attributes.highlightBase} target={attributes.target} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Base odometer" /></ConfigRow>
          <ConfigRow label="max"><NumField value={attributes.max ?? 255} onChange={(v) => updateAttributes({ max: v })} /></ConfigRow>
          <ConfigRow label="speed"><NumField value={attributes.speed ?? 2} onChange={(v) => updateAttributes({ speed: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const ictBlocks = [
  PlaceValueDialBlock,
  BitGrouperBlock,
  BaseOdometerBlock,
] as const;

export const ictComponents = {
  PlaceValueDial: PlaceValueDialLab,
  BitGrouper: BitGrouperLab,
  BaseOdometer: BaseOdometerLab,
} as const;
