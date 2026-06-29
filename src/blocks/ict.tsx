/**
 * @classytic/labs/blocks, ICT lab block specs.
 *
 * `defineBlock` editor adapters for the ICT labs (one domain per file; the
 * registry is assembled in `./index.ts`). Each spec pairs a real zod schema
 * with a render `Component` that, in `mode === 'editing'`, shows the row-based
 * authoring kit (`./authoring`). `@classytic/cms-ui` + `zod` are optional peers
 * touched only by the blocks layer.
 */

import { z } from 'zod';
import { defineBlock } from '@classytic/cms-ui/contract';
import { ConfigPanel, ConfigRow, ChipToggle, TextField, NumField } from './authoring.js';
import { PlaceValueDialLab, BitGrouperLab, BaseOdometerLab } from '../ict/index.js';
import { LogicGateLab, BinaryDisplayLab, LogicBuildLab, LOGIC_PRESETS } from '../logic/index.js';

const LOGIC_KEYS = Object.keys(LOGIC_PRESETS);

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
  description: 'Tappable bits auto-slice into groups from the right, 4 per hex digit, 3 per octal, translating live; shows why a byte = two clean hex digits but a wasteful octal top.',
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
  description: 'Stacked odometer rows driven by one shared integer, binary/octal/decimal/hex roll in lockstep (binary fastest), proving base is a representation, not a different number. Race toggle animates the cascade.',
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

export const LogicGateBlock = defineBlock({
  key: 'logic-gate',
  tag: 'LogicGate',
  void: true,
  label: 'Logic gate circuit (propagation / predict)',
  description: 'A data-driven gate network: wires glow where the signal is HIGH so learners watch it propagate. Pick a preset (AND…NAND universality, half/full adder), let them toggle inputs (explore) or predict the output, with a live truth table.',
  category: 'interactive',
  schema: z.object({
    preset: z.enum(['and', 'or', 'xor', 'nand-not', 'nand-and', 'nand-or', 'xor-nand', 'half-adder', 'full-adder']).default('and'),
    mode: z.enum(['explore', 'predict']).default('explore'),
    steps: z.boolean().default(false),
    showTable: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <LogicGateLab preset={attributes.preset} mode={attributes.mode} steps={attributes.steps} showTable={attributes.showTable} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Logic gates" className="flex-1" /></ConfigRow>
          <ConfigRow label="circuit">
            <div className="flex flex-wrap gap-1.5">
              {LOGIC_KEYS.map((k) => <ChipToggle key={k} active={(attributes.preset ?? 'and') === k} onClick={() => updateAttributes({ preset: k as typeof attributes.preset })}>{LOGIC_PRESETS[k]?.title ?? k}</ChipToggle>)}
            </div>
          </ConfigRow>
          <ConfigRow label="mode">
            <ChipToggle active={(attributes.mode ?? 'explore') === 'explore'} onClick={() => updateAttributes({ mode: 'explore' })}>explore</ChipToggle>
            <ChipToggle active={attributes.mode === 'predict'} onClick={() => updateAttributes({ mode: 'predict' })}>predict</ChipToggle>
          </ConfigRow>
          <ConfigRow label="step reveal">
            <ChipToggle active={!attributes.steps} onClick={() => updateAttributes({ steps: false })}>off</ChipToggle>
            <ChipToggle active={!!attributes.steps} onClick={() => updateAttributes({ steps: true })}>on</ChipToggle>
          </ConfigRow>
          <ConfigRow label="truth table">
            <ChipToggle active={attributes.showTable !== false} onClick={() => updateAttributes({ showTable: true })}>show</ChipToggle>
            <ChipToggle active={attributes.showTable === false} onClick={() => updateAttributes({ showTable: false })}>hide</ChipToggle>
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const BinaryDisplayBlock = defineBlock({
  key: 'binary-display',
  tag: 'BinaryDisplay',
  void: true,
  label: 'Binary display (bits → seven-segment)',
  description: 'A row of weighted bit switches (8 4 2 1) drives a seven-segment LED digit through a decoder, with live binary / decimal / hex readouts. The "number LED" payoff for DLD projects; set a target digit to make it a goal.',
  category: 'interactive',
  schema: z.object({
    bits: z.number().default(4),
    start: z.number().default(0),
    target: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <BinaryDisplayLab bits={attributes.bits} start={attributes.start} target={attributes.target} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Build a number from bits" className="flex-1" /></ConfigRow>
          <ConfigRow label="bits"><NumField value={attributes.bits ?? 4} onChange={(v) => updateAttributes({ bits: v })} /></ConfigRow>
          <ConfigRow label="target digit"><NumField value={attributes.target ?? 0} onChange={(v) => updateAttributes({ target: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const LogicBuilderBlock = defineBlock({
  key: 'logic-builder',
  tag: 'LogicBuilder',
  void: true,
  label: 'Logic builder (drag-and-drop gate circuit)',
  description: 'A Logisim-style canvas: drag sources, gates and LEDs from the palette, wire output dots to input slots, flip switches and watch the signal glow. Leave the goal on "sandbox" for open building, or pick a target (half-adder, NAND→AND…) to grade the learner against its truth table.',
  category: 'interactive',
  schema: z.object({
    goal: z.enum(['sandbox', 'and', 'or', 'xor', 'nand-not', 'nand-and', 'nand-or', 'half-adder', 'full-adder']).default('sandbox'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const graded = attributes.goal && attributes.goal !== 'sandbox';
    const widget = <LogicBuildLab goal={graded ? attributes.goal : undefined} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Build the circuit" className="flex-1" /></ConfigRow>
          <ConfigRow label="goal">
            <div className="flex flex-wrap gap-1.5">
              <ChipToggle active={(attributes.goal ?? 'sandbox') === 'sandbox'} onClick={() => updateAttributes({ goal: 'sandbox' })}>sandbox</ChipToggle>
              {LOGIC_KEYS.map((k) => <ChipToggle key={k} active={attributes.goal === k} onClick={() => updateAttributes({ goal: k as typeof attributes.goal })}>{LOGIC_PRESETS[k]?.title ?? k}</ChipToggle>)}
            </div>
          </ConfigRow>
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
  LogicGateBlock,
  BinaryDisplayBlock,
  LogicBuilderBlock,
] as const;

export const ictComponents = {
  PlaceValueDial: PlaceValueDialLab,
  BitGrouper: BitGrouperLab,
  BaseOdometer: BaseOdometerLab,
  LogicGate: LogicGateLab,
  BinaryDisplay: BinaryDisplayLab,
  LogicBuilder: LogicBuildLab,
} as const;
