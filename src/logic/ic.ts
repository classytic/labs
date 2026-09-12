/**
 * A 14-pin logic chip on a breadboard, wired pin by pin.
 *
 * The first practical session of a digital logic course is not about logic. The truth tables are
 * already known; what goes wrong is the wiring. The chip was never powered. The LED was put on an
 * input pin. A switch was wired straight onto a gate's output. An unused input was left floating.
 * Pin 8 was counted as if it were next to pin 1. None of that can be learned from a truth table, and
 * all of it can be simulated honestly, because it is about connections rather than electronics.
 *
 * So this model is a netlist. Every wire joins two terminals (a pin, a switch, a supply rail or the
 * LED), terminals joined by wires form a net, and each net is driven by at most one thing. The chip
 * works only when pin 14 is on the +5 V net and pin 7 on the ground net, which is true of the whole
 * 7400 family and is the single most useful fact on the datasheet.
 *
 * The chips are the ones every lab kit has. Four of them share one pinout (quad two-input gates);
 * the 7402 NOR puts its outputs on the other side of each gate, and the 7404 has six inverters.
 * Floating inputs are treated as the modern 74HC parts treat them: undefined, not quietly high as
 * the older 74LS parts happened to behave.
 */

export type ChipId = '7400' | '7402' | '7404' | '7408' | '7432' | '7486';
export type GateFn = 'NAND' | 'NOR' | 'NOT' | 'AND' | 'OR' | 'XOR';

export interface ChipGate {
  inputs: number[];
  output: number;
}

export interface ChipSpec {
  id: ChipId;
  name: string;
  fn: GateFn;
  gates: ChipGate[];
}

export const VCC_PIN = 14;
export const GND_PIN = 7;

/** 7400, 7408, 7432, 7486: gate n has inputs then output, pins 1-2→3, 4-5→6, 9-10→8, 12-13→11. */
const QUAD_2_INPUT: ChipGate[] = [
  { inputs: [1, 2], output: 3 },
  { inputs: [4, 5], output: 6 },
  { inputs: [9, 10], output: 8 },
  { inputs: [12, 13], output: 11 },
];

export const CHIPS: Record<ChipId, ChipSpec> = {
  '7400': { id: '7400', name: 'quad 2-input NAND', fn: 'NAND', gates: QUAD_2_INPUT },
  '7408': { id: '7408', name: 'quad 2-input AND', fn: 'AND', gates: QUAD_2_INPUT },
  '7432': { id: '7432', name: 'quad 2-input OR', fn: 'OR', gates: QUAD_2_INPUT },
  '7486': { id: '7486', name: 'quad 2-input XOR', fn: 'XOR', gates: QUAD_2_INPUT },
  // The NOR puts each output FIRST: 1←2,3  4←5,6  10←8,9  13←11,12. The classic pinout trap.
  '7402': {
    id: '7402',
    name: 'quad 2-input NOR',
    fn: 'NOR',
    gates: [
      { inputs: [2, 3], output: 1 },
      { inputs: [5, 6], output: 4 },
      { inputs: [8, 9], output: 10 },
      { inputs: [11, 12], output: 13 },
    ],
  },
  '7404': {
    id: '7404',
    name: 'hex inverter',
    fn: 'NOT',
    gates: [
      { inputs: [1], output: 2 },
      { inputs: [3], output: 4 },
      { inputs: [5], output: 6 },
      { inputs: [9], output: 8 },
      { inputs: [11], output: 10 },
      { inputs: [13], output: 12 },
    ],
  },
};

const apply = (fn: GateFn, values: boolean[]): boolean => {
  switch (fn) {
    case 'AND':
      return values.every(Boolean);
    case 'NAND':
      return !values.every(Boolean);
    case 'OR':
      return values.some(Boolean);
    case 'NOR':
      return !values.some(Boolean);
    case 'XOR':
      return values.filter(Boolean).length % 2 === 1;
    case 'NOT':
      return !values[0];
  }
};

/** Terminals off the chip. Everything else is a pin, written `p1` to `p14`. */
export type Source = 'A' | 'B' | 'VCC' | 'GND' | 'LED';
export type Terminal = Source | `p${number}`;
export type Wire = [Terminal, Terminal];

export const pin = (n: number): Terminal => `p${n}` as Terminal;

export interface Diagnostic {
  code:
    'unpowered' | 'reversed' | 'contention' | 'floating' | 'led-on-input' | 'led-on-supply' | 'led-unwired';
  message: string;
}

export interface ChipResult {
  powered: boolean;
  /** true / false, or null when the LED's net has no defined level. */
  led: boolean | null;
  /** Level on every pin, null where undefined. */
  pins: Record<number, boolean | null>;
  diagnostics: Diagnostic[];
}

/** Union-find over terminals. */
function netsOf(wires: Wire[]): Map<Terminal, Terminal> {
  const parent = new Map<Terminal, Terminal>();
  const find = (t: Terminal): Terminal => {
    if (!parent.has(t)) parent.set(t, t);
    let root = t;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(t, root);
    return root;
  };
  for (const [a, b] of wires) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }
  // Normalise every known terminal to its root.
  const rootOf = new Map<Terminal, Terminal>();
  for (const t of parent.keys()) rootOf.set(t, find(t));
  return rootOf;
}

export function evaluateChip(chipId: ChipId, wires: Wire[], inputs: { A: boolean; B: boolean }): ChipResult {
  const chip = CHIPS[chipId];
  const rootOf = netsOf(wires);
  const net = (t: Terminal): Terminal => rootOf.get(t) ?? t;
  const same = (a: Terminal, b: Terminal): boolean => net(a) === net(b);
  const diagnostics: Diagnostic[] = [];

  const reversed = same(pin(VCC_PIN), 'GND') && same(pin(GND_PIN), 'VCC');
  const powered = same(pin(VCC_PIN), 'VCC') && same(pin(GND_PIN), 'GND') && !same('VCC', 'GND');
  if (reversed) {
    diagnostics.push({
      code: 'reversed',
      message: '+5 V is on pin 7 and ground on pin 14. The supply is backwards, which destroys a real chip.',
    });
  } else if (!powered) {
    diagnostics.push({
      code: 'unpowered',
      message: 'The chip has no power. Every 74-series chip needs +5 V on pin 14 and ground on pin 7.',
    });
  }

  // Drivers on each net: switches, rails, and (once powered) the gate outputs.
  const outputPins = new Set(chip.gates.map((gate) => gate.output));
  const fixedDrivers = new Map<Terminal, { name: string; value: boolean }[]>();
  const addDriver = (t: Terminal, name: string, value: boolean): void => {
    const root = net(t);
    fixedDrivers.set(root, [...(fixedDrivers.get(root) ?? []), { name, value }]);
  };
  if (rootOf.has('A')) addDriver('A', 'switch A', inputs.A);
  if (rootOf.has('B')) addDriver('B', 'switch B', inputs.B);
  if (rootOf.has('VCC')) addDriver('VCC', '+5 V', true);
  if (rootOf.has('GND')) addDriver('GND', 'ground', false);

  // A net with two drivers is a short, whatever their levels happen to be right now.
  const outputNets = powered
    ? chip.gates.map((gate) => ({ root: net(pin(gate.output)), pinNo: gate.output }))
    : [];
  const driverCount = new Map<Terminal, string[]>();
  for (const [root, list] of fixedDrivers)
    driverCount.set(
      root,
      list.map((d) => d.name),
    );
  for (const { root, pinNo } of outputNets)
    driverCount.set(root, [...(driverCount.get(root) ?? []), `output pin ${pinNo}`]);
  for (const names of driverCount.values()) {
    if (names.length > 1) {
      diagnostics.push({
        code: 'contention',
        message: `${names.join(' and ')} are wired together, so two outputs fight over one wire.`,
      });
    }
  }

  // Settle the gates. Each pass reads every input net and recomputes every output.
  const levels = new Map<Terminal, boolean | null>();
  for (const [root, list] of fixedDrivers) levels.set(root, list.length === 1 ? list[0]!.value : null);
  const outputs = new Map<number, boolean | null>();
  for (let pass = 0; pass < 8 && powered; pass++) {
    let changed = false;
    for (const gate of chip.gates) {
      const values = gate.inputs.map((p) => levels.get(net(pin(p))) ?? null);
      const out = values.every((v) => v !== null) ? apply(chip.fn, values as boolean[]) : null;
      if (outputs.get(gate.output) !== out) {
        outputs.set(gate.output, out);
        changed = true;
      }
      const root = net(pin(gate.output));
      if ((driverCount.get(root)?.length ?? 0) === 1) levels.set(root, out);
    }
    if (!changed) break;
  }

  const pins: Record<number, boolean | null> = {};
  for (let p = 1; p <= 14; p++) {
    pins[p] = outputPins.has(p)
      ? powered
        ? (outputs.get(p) ?? null)
        : null
      : (levels.get(net(pin(p))) ?? null);
  }

  // Floating inputs: only the gates the LED can actually see are worth a warning.
  const ledRoot = rootOf.has('LED') ? net('LED') : null;
  if (ledRoot === null) {
    diagnostics.push({ code: 'led-unwired', message: 'The LED is not connected to anything yet.' });
  } else {
    const ledPins = Array.from({ length: 14 }, (_, i) => i + 1).filter((p) => net(pin(p)) === ledRoot);
    if (same('LED', 'VCC') || same('LED', 'GND')) {
      diagnostics.push({
        code: 'led-on-supply',
        message: 'The LED is wired straight to a supply rail, so it can only ever be on or off.',
      });
    } else if (ledPins.length && ledPins.every((p) => !outputPins.has(p))) {
      diagnostics.push({
        code: 'led-on-input',
        message: `The LED is on pin ${ledPins[0]}, which is an input. It will only show what is fed into that pin.`,
      });
    }
    if (powered) {
      for (const gate of chip.gates) {
        const reachesLed = net(pin(gate.output)) === ledRoot;
        const floating = gate.inputs.filter((p) => (levels.get(net(pin(p))) ?? null) === null);
        if (reachesLed && floating.length) {
          diagnostics.push({
            code: 'floating',
            message: `Pin ${floating.join(' and ')} ${floating.length > 1 ? 'are' : 'is'} not connected, so the input floats. A 74HC chip can read that as either level.`,
          });
        }
      }
    }
  }

  // Rails and switches drive their nets whether or not the chip has power; gate outputs only exist
  // once it does. So an LED on a gate output of an unpowered chip has no level at all: it is dark.
  const led = ledRoot === null ? null : (levels.get(ledRoot) ?? null);
  return { powered, led, pins, diagnostics };
}

/** Does the LED follow `rule` for all four switch combinations, with no warnings? */
export function behavesAs(chipId: ChipId, wires: Wire[], rule: (a: boolean, b: boolean) => boolean): boolean {
  return [false, true].every((A) =>
    [false, true].every((B) => {
      const result = evaluateChip(chipId, wires, { A, B });
      return result.powered && result.diagnostics.length === 0 && result.led === rule(A, B);
    }),
  );
}
