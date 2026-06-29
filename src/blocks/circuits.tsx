/**
 * @classytic/labs/blocks, circuits lab block specs.
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
import { CircuitLab, CircuitBuilder, CircuitNetworkLab, CapacitorLeakLab, MosfetInsideLab, PnJunctionLab, BjtInsideLab, SiliconLatticeLab, ConductionLab, HallEffectLab, RCChargingLab, DiodeLab, TransistorLab, RNmosNotLab, CmosInverterLab, CmosNandLab, CmosNorLab, BrownoutLab, type CircuitComponent, type CircuitComponentSpec } from '../circuits/index.js';
import { CircuitEditor, CircuitPlayer } from '../build/index.js';
import type { CircuitDoc } from '../build/index.js';

export const CircuitLabBlock = defineBlock({
  key: 'circuit-lab',
  void: true,
  label: 'Circuit lab',
  description: 'Series/parallel resistors, voltage & current divider rules, step by step.',
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
  description: 'Build a loop, battery, bulbs, switches, resistors. Flip switches, watch current & the bulb.',
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
  description: 'Battery + switch + bulb, close the switch and tune the voltage to light it.',
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
  label: 'Capacitor: charge & leak (RC)',
  description: 'A cell charges a capacitor through R; flip to "leak" and it self-discharges through its leakage resistance, the plate field thins, drips fall, Vc decays. Live Vc–t trace + τ readout.',
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

// ── the free-form scene builder: place/wire/tune any circuit, solved live ──
const cvec = z.object({ x: z.number(), y: z.number() });
const cPart = z.object({
  id: z.string(),
  kind: z.string(),
  at: cvec,
  orient: z.enum(['h', 'v']).optional(),
  props: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])).optional(),
  pins: z.record(z.string(), z.string()),
});
const cDoc = z.object({
  parts: z.array(cPart).default([]),
  nodes: z.array(z.object({ id: z.string(), at: cvec })).default([]),
  size: z.object({ w: z.number(), h: z.number() }).optional(),
});

const EMPTY_DOC: CircuitDoc = { parts: [], nodes: [], size: { w: 560, h: 300 } };

/** Render a stored doc for learners: a CircuitPlayer they can operate (tap switches). */
export function CircuitSceneView({ doc }: { doc?: CircuitDoc }): ReactNode {
  return <CircuitPlayer doc={doc ?? EMPTY_DOC} />;
}

export const CircuitSceneBlock = defineBlock({
  key: 'circuit-scene',
  tag: 'CircuitScene',
  void: true,
  label: 'Circuit builder (canvas)',
  description: 'Place parts on a canvas, drag to arrange, click pins to wire. Any topology (Kirchhoff), solved live. Learners tap switches to operate it.',
  category: 'interactive',
  schema: z.object({ doc: cDoc.optional(), title: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const doc = (attributes.doc as unknown as CircuitDoc | undefined) ?? EMPTY_DOC;
    if (mode !== 'editing' || !updateAttributes) return <CircuitSceneView doc={doc} />;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="Title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Build a circuit" className="flex-1" /></ConfigRow>
        </ConfigPanel>
        <CircuitEditor value={doc} onChange={(d) => updateAttributes({ doc: d as never })} />
      </div>
    );
  },
});

export const MosfetInsideBlock = defineBlock({
  key: 'mosfet-inside',
  tag: 'MosfetInside',
  void: true,
  label: 'Inside the transistor (NMOS channel)',
  description: 'Cross-section of an NMOS: raise the gate and watch a depletion region, then an electron channel, form between source and drain. Carriers move; engine-solved.',
  category: 'interactive',
  schema: z.object({ pmos: z.boolean().default(false), vth: z.number().default(1.5), k: z.number().default(0.02), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <MosfetInsideLab pmos={attributes.pmos} vth={attributes.vth} k={attributes.k} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Inside the transistor" className="flex-1" /></ConfigRow>
          <ConfigRow label="type">
            <ChipToggle active={!attributes.pmos} onClick={() => updateAttributes({ pmos: false })}>NMOS</ChipToggle>
            <ChipToggle active={!!attributes.pmos} onClick={() => updateAttributes({ pmos: true })}>PMOS</ChipToggle>
          </ConfigRow>
          <ConfigRow label="threshold Vth (V)"><NumField value={attributes.vth ?? 1.5} onChange={(v) => updateAttributes({ vth: v })} /></ConfigRow>
          <ConfigRow label="gain k"><NumField value={attributes.k ?? 0.02} onChange={(v) => updateAttributes({ k: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const PnJunctionBlock = defineBlock({
  key: 'pn-junction',
  tag: 'PnJunction',
  void: true,
  label: 'Inside the diode (PN junction)',
  description: 'Cross-section of a PN junction: n and p regions, the depletion region of fixed ions, and carriers flooding across under forward bias. Engine-solved diode current.',
  category: 'interactive',
  schema: z.object({ title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <PnJunctionLab title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Inside the diode" className="flex-1" /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const BjtInsideBlock = defineBlock({
  key: 'bjt-inside',
  tag: 'BjtInside',
  void: true,
  label: 'Inside the BJT (NPN / PNP)',
  description: 'Cross-section of a bipolar transistor: carriers stream emitter→thin base→collector, and a small base current controls a large collector current (β).',
  category: 'interactive',
  schema: z.object({ pnp: z.boolean().default(false), beta: z.number().default(100), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <BjtInsideLab pnp={attributes.pnp} beta={attributes.beta} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Inside the BJT" className="flex-1" /></ConfigRow>
          <ConfigRow label="type">
            <ChipToggle active={!attributes.pnp} onClick={() => updateAttributes({ pnp: false })}>NPN</ChipToggle>
            <ChipToggle active={!!attributes.pnp} onClick={() => updateAttributes({ pnp: true })}>PNP</ChipToggle>
          </ConfigRow>
          <ConfigRow label="gain β"><NumField value={attributes.beta ?? 100} onChange={(v) => updateAttributes({ beta: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const SiliconLatticeBlock = defineBlock({
  key: 'silicon-lattice',
  tag: 'SiliconLattice',
  void: true,
  label: 'What is a semiconductor? (Si lattice + doping)',
  description: 'Silicon covalent lattice: switch between pure / n-type / p-type doping and raise temperature to free electron-hole pairs. The conceptual intro to diodes, MOSFETs and BJTs.',
  category: 'interactive',
  schema: z.object({
    mode: z.enum(['intrinsic', 'n', 'p']).default('intrinsic'),
    temperature: z.number().default(0.2),
    lockDoping: z.boolean().default(false),
    showTemperature: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode: editMode, updateAttributes }) => {
    const widget = <SiliconLatticeLab mode={attributes.mode} temperature={attributes.temperature} lockDoping={attributes.lockDoping} showTemperature={attributes.showTemperature} title={attributes.title} prompt={attributes.prompt} />;
    if (editMode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="What is a semiconductor?" className="flex-1" /></ConfigRow>
          <ConfigRow label="opens on">
            <ChipToggle active={(attributes.mode ?? 'intrinsic') === 'intrinsic'} onClick={() => updateAttributes({ mode: 'intrinsic' })}>pure</ChipToggle>
            <ChipToggle active={attributes.mode === 'n'} onClick={() => updateAttributes({ mode: 'n' })}>n-type</ChipToggle>
            <ChipToggle active={attributes.mode === 'p'} onClick={() => updateAttributes({ mode: 'p' })}>p-type</ChipToggle>
          </ConfigRow>
          <ConfigRow label="focus on this doping (hide toggle)">
            <ChipToggle active={!attributes.lockDoping} onClick={() => updateAttributes({ lockDoping: false })}>let learner switch</ChipToggle>
            <ChipToggle active={!!attributes.lockDoping} onClick={() => updateAttributes({ lockDoping: true })}>lock</ChipToggle>
          </ConfigRow>
          <ConfigRow label="temperature slider">
            <ChipToggle active={attributes.showTemperature !== false} onClick={() => updateAttributes({ showTemperature: true })}>show</ChipToggle>
            <ChipToggle active={attributes.showTemperature === false} onClick={() => updateAttributes({ showTemperature: false })}>hide</ChipToggle>
          </ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const ConductionBlock = defineBlock({
  key: 'conduction',
  tag: 'Conduction',
  void: true,
  label: 'Why current flows (drift + Ohm\'s law)',
  description: 'Free electrons drift through a field among fixed ion cores: the field-driven drift IS the current, and current ∝ voltage is Ohm\'s law from the inside.',
  category: 'interactive',
  schema: z.object({ title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <ConductionLab title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Why current flows" className="flex-1" /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const HallEffectBlock = defineBlock({
  key: 'hall-effect',
  tag: 'HallEffect',
  void: true,
  label: 'The Hall effect (electrons vs holes)',
  description: 'A current in a magnetic field deflects carriers to one edge; the sign of the Hall voltage reveals whether they are electrons (n) or holes (p). How carrier type is measured.',
  category: 'interactive',
  schema: z.object({ title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <HallEffectLab title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="The Hall effect" className="flex-1" /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

// ── electronics schematic labs (engine-solved): the diode / transistor / RC primitives and the
//    transistor→CMOS-gate family. One block each so creators can place and tune them in a lesson. ──

/** A "show" chooser shared by the labs that pair a schematic with a graph. */
function ShowRow({ value, onChange }: { value?: 'both' | 'circuit' | 'graph'; onChange: (v: 'both' | 'circuit' | 'graph') => void }): ReactNode {
  const v = value ?? 'both';
  return (
    <ConfigRow label="show">
      <ChipToggle active={v === 'both'} onClick={() => onChange('both')}>both</ChipToggle>
      <ChipToggle active={v === 'circuit'} onClick={() => onChange('circuit')}>schematic</ChipToggle>
      <ChipToggle active={v === 'graph'} onClick={() => onChange('graph')}>graph</ChipToggle>
    </ConfigRow>
  );
}

export const RCChargingBlock = defineBlock({
  key: 'rc-charging',
  tag: 'RCCharging',
  void: true,
  label: 'RC charging (fill the capacitor)',
  description: 'A capacitor fills through a resistor like a bucket through a pipe; the V(t) curve is the real Backward-Euler transient solve. Drag R and C to change τ = R·C, or flip to discharge.',
  category: 'interactive',
  schema: z.object({ volts: z.number().optional(), resistanceK: z.number().optional(), capacitanceU: z.number().optional(), show: z.enum(['both', 'circuit', 'graph']).optional(), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <RCChargingLab volts={attributes.volts} resistanceK={attributes.resistanceK} capacitanceU={attributes.capacitanceU} show={attributes.show} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="RC charging" className="flex-1" /></ConfigRow>
          <ConfigRow label="supply (V)"><NumField value={attributes.volts ?? 5} onChange={(v) => updateAttributes({ volts: v })} /></ConfigRow>
          <ConfigRow label="R (kΩ)"><NumField value={attributes.resistanceK ?? 10} onChange={(v) => updateAttributes({ resistanceK: v })} /></ConfigRow>
          <ConfigRow label="C (µF)"><NumField value={attributes.capacitanceU ?? 10} onChange={(v) => updateAttributes({ capacitanceU: v })} /></ConfigRow>
          <ShowRow value={attributes.show} onChange={(v) => updateAttributes({ show: v })} />
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const DiodeBlock = defineBlock({
  key: 'diode',
  tag: 'Diode',
  void: true,
  label: 'Diode: a one-way valve',
  description: 'Drive a diode through a resistor. Forward, past the ~0.6 V knee, the valve opens; reverse it and it blocks. The operating point is the real nonlinear (Shockley) solve. Flip orientation and predict.',
  category: 'interactive',
  schema: z.object({ volts: z.number().optional(), resistanceK: z.number().optional(), show: z.enum(['both', 'circuit', 'graph']).optional(), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <DiodeLab volts={attributes.volts} resistanceK={attributes.resistanceK} show={attributes.show} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="The diode" className="flex-1" /></ConfigRow>
          <ConfigRow label="battery (V)"><NumField value={attributes.volts ?? 2} onChange={(v) => updateAttributes({ volts: v })} /></ConfigRow>
          <ConfigRow label="R (kΩ)"><NumField value={attributes.resistanceK ?? 1} onChange={(v) => updateAttributes({ resistanceK: v })} /></ConfigRow>
          <ShowRow value={attributes.show} onChange={(v) => updateAttributes({ show: v })} />
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const TransistorBlock = defineBlock({
  key: 'transistor',
  tag: 'Transistor',
  void: true,
  label: 'Transistor: a small input controls a big current',
  description: 'Turn the gate voltage of an NMOS: below threshold the channel is shut, past it the gate steers a much larger drain current up the square-law transfer curve. The switch (and amplifier) at the heart of every chip.',
  category: 'interactive',
  schema: z.object({ supply: z.number().optional(), vth: z.number().optional(), loadK: z.number().optional(), show: z.enum(['both', 'circuit', 'graph']).optional(), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <TransistorLab supply={attributes.supply} vth={attributes.vth} loadK={attributes.loadK} show={attributes.show} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="The transistor" className="flex-1" /></ConfigRow>
          <ConfigRow label="supply (V)"><NumField value={attributes.supply ?? 5} onChange={(v) => updateAttributes({ supply: v })} /></ConfigRow>
          <ConfigRow label="threshold Vth (V)"><NumField value={attributes.vth ?? 2} onChange={(v) => updateAttributes({ vth: v })} /></ConfigRow>
          <ConfigRow label="load R (kΩ)"><NumField value={attributes.loadK ?? 1} onChange={(v) => updateAttributes({ loadK: v })} /></ConfigRow>
          <ShowRow value={attributes.show} onChange={(v) => updateAttributes({ show: v })} />
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const RNmosNotBlock = defineBlock({
  key: 'rnmos-not',
  tag: 'RNmosNot',
  void: true,
  label: 'NOT from one transistor (+ pull-up)',
  description: 'One NMOS and a pull-up resistor already invert: HIGH pulls the output to ground, LOW lets the resistor pull it up. Engine-solved. It also shows the static-power "catch" that motivated CMOS.',
  category: 'interactive',
  schema: z.object({ vdd: z.number().optional(), vth: z.number().optional(), rpull: z.number().optional(), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <RNmosNotLab vdd={attributes.vdd} vth={attributes.vth} rpull={attributes.rpull} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="A NOT gate from one transistor" className="flex-1" /></ConfigRow>
          <ConfigRow label="VDD (V)"><NumField value={attributes.vdd ?? 5} onChange={(v) => updateAttributes({ vdd: v })} /></ConfigRow>
          <ConfigRow label="threshold Vth (V)"><NumField value={attributes.vth ?? 2} onChange={(v) => updateAttributes({ vth: v })} /></ConfigRow>
          <ConfigRow label="pull-up R (Ω)"><NumField value={attributes.rpull ?? 2000} onChange={(v) => updateAttributes({ rpull: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const CmosInverterBlock = defineBlock({
  key: 'cmos-inverter',
  tag: 'CmosInverter',
  void: true,
  label: 'CMOS inverter (NOT gate)',
  description: 'A PMOS pull-up and an NMOS pull-down share one input and output: low in → high out, high in → low out. The output voltage is engine-solved, so the transfer curve shows the real sharp transition near VDD/2.',
  category: 'interactive',
  schema: z.object({ vdd: z.number().optional(), vth: z.number().optional(), show: z.enum(['both', 'circuit', 'graph']).optional(), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <CmosInverterLab vdd={attributes.vdd} vth={attributes.vth} show={attributes.show} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="CMOS inverter" className="flex-1" /></ConfigRow>
          <ConfigRow label="VDD (V)"><NumField value={attributes.vdd ?? 5} onChange={(v) => updateAttributes({ vdd: v })} /></ConfigRow>
          <ConfigRow label="threshold Vth (V)"><NumField value={attributes.vth ?? 2} onChange={(v) => updateAttributes({ vth: v })} /></ConfigRow>
          <ShowRow value={attributes.show} onChange={(v) => updateAttributes({ show: v })} />
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const CmosNandBlock = defineBlock({
  key: 'cmos-nand',
  tag: 'CmosNand',
  void: true,
  label: 'CMOS NAND (the universal gate)',
  description: 'Four transistors: a parallel PMOS pull-up and a series NMOS pull-down make Y = (A·B)′, solved for all four inputs. NAND alone is universal, so this is the brick every gate and CPU is built from.',
  category: 'interactive',
  schema: z.object({ vdd: z.number().optional(), vth: z.number().optional(), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <CmosNandLab vdd={attributes.vdd} vth={attributes.vth} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="CMOS NAND" className="flex-1" /></ConfigRow>
          <ConfigRow label="VDD (V)"><NumField value={attributes.vdd ?? 5} onChange={(v) => updateAttributes({ vdd: v })} /></ConfigRow>
          <ConfigRow label="threshold Vth (V)"><NumField value={attributes.vth ?? 2} onChange={(v) => updateAttributes({ vth: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const CmosNorBlock = defineBlock({
  key: 'cmos-nor',
  tag: 'CmosNor',
  void: true,
  label: 'CMOS NOR (the De Morgan twin)',
  description: 'The NAND with each network swapped: series PMOS pull-up, parallel NMOS pull-down, giving Y = (A+B)′. NOR is the other universal gate, so series-vs-parallel is AND-logic-vs-OR-logic in silicon.',
  category: 'interactive',
  schema: z.object({ vdd: z.number().optional(), vth: z.number().optional(), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <CmosNorLab vdd={attributes.vdd} vth={attributes.vth} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="CMOS NOR" className="flex-1" /></ConfigRow>
          <ConfigRow label="VDD (V)"><NumField value={attributes.vdd ?? 5} onChange={(v) => updateAttributes({ vdd: v })} /></ConfigRow>
          <ConfigRow label="threshold Vth (V)"><NumField value={attributes.vth ?? 2} onChange={(v) => updateAttributes({ vth: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const BrownoutBlock = defineBlock({
  key: 'brownout',
  tag: 'Brownout',
  void: true,
  label: 'Brown-out (supply too low → logic invalid)',
  description: 'Drag the battery EMF down and the CMOS gate stops working: as VDD falls toward the transistor threshold the output loses its swing and drifts to mid-rail. Connects EMF and supply voltage to whether logic works at all.',
  category: 'interactive',
  schema: z.object({ vth: z.number().optional(), vmax: z.number().optional(), title: z.string().optional(), prompt: z.string().optional() }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <BrownoutLab vth={attributes.vth} vmax={attributes.vmax} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Brown-out" className="flex-1" /></ConfigRow>
          <ConfigRow label="threshold Vth (V)"><NumField value={attributes.vth ?? 2} onChange={(v) => updateAttributes({ vth: v })} /></ConfigRow>
          <ConfigRow label="max supply (V)"><NumField value={attributes.vmax ?? 6} onChange={(v) => updateAttributes({ vmax: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

/** All circuits lab blocks, spread into the registry in `./index.ts`. */
export const circuitsBlocks = [
  CircuitLabBlock,
  CircuitBuilderBlock,
  CircuitSceneBlock,
  CircuitBlock,
  SiliconLatticeBlock,
  ConductionBlock,
  HallEffectBlock,
  PnJunctionBlock,
  MosfetInsideBlock,
  BjtInsideBlock,
  CapacitorLeakBlock,
  RCChargingBlock,
  DiodeBlock,
  TransistorBlock,
  RNmosNotBlock,
  CmosInverterBlock,
  CmosNandBlock,
  CmosNorBlock,
  BrownoutBlock,
] as const;

/** MDX tag → component render map slice for the circuits domain. */
export const circuitsComponents = {
  CapacitorLeak: CapacitorLeakLab,
  Circuit: CircuitPuzzle,
  CircuitBuilder,
  CircuitLab,
  CircuitScene: CircuitSceneView,
  MosfetInside: MosfetInsideLab,
  PnJunction: PnJunctionLab,
  BjtInside: BjtInsideLab,
  SiliconLattice: SiliconLatticeLab,
  Conduction: ConductionLab,
  HallEffect: HallEffectLab,
  RCCharging: RCChargingLab,
  Diode: DiodeLab,
  Transistor: TransistorLab,
  RNmosNot: RNmosNotLab,
  CmosInverter: CmosInverterLab,
  CmosNand: CmosNandLab,
  CmosNor: CmosNorLab,
  Brownout: BrownoutLab,
} as const;
