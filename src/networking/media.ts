/**
 * The physical layer: what the signal actually travels through, and how the eight wires are ordered.
 *
 * Two things get memorised without being understood. The first is the T568B colour order, which
 * students chant and cannot reconstruct. The second is that "the cable" is one thing, when copper,
 * fibre and radio carry a signal by three different physical mechanisms with three different limits.
 *
 * The order is reconstructable once you see the PAIRS. Four twisted pairs go into eight pins, and
 * the blue pair sits in the middle at 4 and 5 so an RJ45 socket stays compatible with an older
 * two-wire telephone plug. That single constraint pushes the green pair apart, which is why pin 3
 * is white-green and pin 6 is green with two other wires between them. It looks arbitrary and is not.
 */

export type WireColor =
  'white-orange' | 'orange' | 'white-green' | 'green' | 'white-blue' | 'blue' | 'white-brown' | 'brown';

/**
 * Real wire colours, so they are fixed rather than themed. A green wire is green in both themes
 * for the same reason the link LED is green: the colour IS the information, and a student matching
 * this against a cable in their hand needs it to agree.
 */
export const WIRE_INK: Record<WireColor, string> = {
  'white-orange': 'oklch(0.72 0.16 55)',
  orange: 'oklch(0.68 0.19 48)',
  'white-green': 'oklch(0.70 0.15 150)',
  green: 'oklch(0.58 0.17 148)',
  'white-blue': 'oklch(0.70 0.13 250)',
  blue: 'oklch(0.55 0.18 255)',
  'white-brown': 'oklch(0.62 0.07 60)',
  brown: 'oklch(0.45 0.08 55)',
};

/** A striped wire is the pale half of its pair. */
export const isStriped = (wire: WireColor): boolean => wire.startsWith('white-');

export const WIRE_LABEL: Record<WireColor, string> = {
  'white-orange': 'white / orange',
  orange: 'orange',
  'white-green': 'white / green',
  green: 'green',
  'white-blue': 'white / blue',
  blue: 'blue',
  'white-brown': 'white / brown',
  brown: 'brown',
};

export type PinoutStandard = 'T568A' | 'T568B';

/** Pin 1 to pin 8, left to right with the clip facing away from you. */
export const PINOUTS: Record<PinoutStandard, WireColor[]> = {
  T568B: ['white-orange', 'orange', 'white-green', 'blue', 'white-blue', 'green', 'white-brown', 'brown'],
  T568A: ['white-green', 'green', 'white-orange', 'blue', 'white-blue', 'orange', 'white-brown', 'brown'],
};

/** The four twisted pairs, by the colour they are named after. */
export const PAIRS: { name: string; wires: [WireColor, WireColor] }[] = [
  { name: 'orange', wires: ['white-orange', 'orange'] },
  { name: 'green', wires: ['white-green', 'green'] },
  { name: 'blue', wires: ['white-blue', 'blue'] },
  { name: 'brown', wires: ['white-brown', 'brown'] },
];

/** Which pair a wire belongs to, 0-based, or -1 if the colour is not a pair member. */
export const pairOf = (wire: WireColor): number => PAIRS.findIndex((pair) => pair.wires.includes(wire));

/** The pin positions (1-based) each pair occupies under a standard. */
export function pairPins(standard: PinoutStandard, pairName: string): number[] {
  const order = PINOUTS[standard];
  const pair = PAIRS.find((item) => item.name === pairName);
  if (!pair) return [];
  return order.map((wire, index) => (pair.wires.includes(wire) ? index + 1 : 0)).filter((pin) => pin > 0);
}

/** True when a pair sits on two pins that are not next to each other. */
export const isSplitPair = (standard: PinoutStandard, pairName: string): boolean => {
  const pins = pairPins(standard, pairName);
  return pins.length === 2 && pins[1]! - pins[0]! !== 1;
};

export interface PinoutCheck {
  correct: boolean;
  /** 1-based pins that do not match the standard. */
  wrong: number[];
  placed: number;
}

/** Compare an attempt against a standard. Empty slots count as not yet placed, not as wrong. */
export function checkPinout(
  attempt: readonly (WireColor | undefined)[],
  standard: PinoutStandard,
): PinoutCheck {
  const target = PINOUTS[standard];
  const wrong: number[] = [];
  let placed = 0;
  target.forEach((wire, index) => {
    const got = attempt[index];
    if (!got) return;
    placed++;
    if (got !== wire) wrong.push(index + 1);
  });
  return { correct: placed === 8 && wrong.length === 0, wrong, placed };
}

/**
 * A cable with the same standard at both ends is straight-through; different ends make a crossover.
 * Modern gear auto-detects, which is worth saying, because it is why crossover cables have
 * essentially disappeared and why the distinction still appears in every exam.
 */
export const cableKind = (endA: PinoutStandard, endB: PinoutStandard): 'straight-through' | 'crossover' =>
  endA === endB ? 'straight-through' : 'crossover';

export type MediumId = 'copper' | 'fibre' | 'radio';

export interface Medium {
  id: MediumId;
  label: string;
  /** What physically carries the signal. */
  carrier: string;
  /** Practical maximum for one run, in metres. Radio is a typical indoor figure. */
  maxMetres: number;
  typicalGbps: number;
  /** Survives electrical noise from motors, lighting and power cable runs. */
  emiImmune: boolean;
  /** Can anyone within range receive the signal without touching anything. */
  broadcast: boolean;
  note: string;
}

export const MEDIA: Medium[] = [
  {
    id: 'copper',
    label: 'Twisted pair copper',
    carrier: 'a changing voltage along a wire',
    maxMetres: 100,
    typicalGbps: 1,
    emiImmune: false,
    broadcast: false,
    note: 'Cheap, and every device already has the socket. The 100 m limit is the reason wiring closets exist.',
  },
  {
    id: 'fibre',
    label: 'Optical fibre',
    carrier: 'pulses of light in a glass core',
    maxMetres: 40_000,
    typicalGbps: 10,
    emiImmune: true,
    broadcast: false,
    note: 'Light carries no current, so it ignores electrical noise entirely and can cross a city.',
  },
  {
    id: 'radio',
    label: 'Radio (Wi-Fi)',
    carrier: 'radio waves through open air',
    maxMetres: 40,
    typicalGbps: 1,
    emiImmune: false,
    broadcast: true,
    note: 'No cable at all, and the medium is shared: everyone in range competes for it and can hear it.',
  },
];

export interface Scenario {
  id: string;
  need: string;
  metres: number;
  /** True when the run passes heavy electrical machinery. */
  noisy: boolean;
  mustMove: boolean;
  best: MediumId;
  why: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'desk',
    need: 'A desktop to the switch in the same room',
    metres: 15,
    noisy: false,
    mustMove: false,
    best: 'copper',
    why: 'Short, fixed and cheap. Copper is already on both ends and there is nothing to gain by paying for anything else.',
  },
  {
    id: 'buildings',
    need: 'Between two buildings 800 m apart',
    metres: 800,
    noisy: false,
    mustMove: false,
    best: 'fibre',
    why: 'Copper stops working at about 100 m. Distance alone rules it out before any other argument.',
  },
  {
    id: 'factory',
    need: 'Across a factory floor beside large motors',
    metres: 60,
    noisy: true,
    mustMove: false,
    best: 'fibre',
    why: 'The distance suits copper, but motors throw electrical noise into it. Light carries no current, so the interference cannot reach the signal.',
  },
  {
    id: 'phone',
    need: 'A phone carried around a café',
    metres: 20,
    noisy: false,
    mustMove: true,
    best: 'radio',
    why: 'Nothing that moves can stay plugged in. That decides it before speed or cost are even considered.',
  },
];

/** Is a medium usable for a scenario at all, and if not, why not. */
export function ruleOut(medium: Medium, scenario: Scenario): string | null {
  if (scenario.mustMove && !scenario.metres) return null;
  if (scenario.mustMove && medium.id !== 'radio') return 'a moving device cannot stay plugged into a cable';
  if (scenario.metres > medium.maxMetres) return `the run is longer than ${medium.maxMetres} m`;
  if (scenario.noisy && !medium.emiImmune)
    return 'electrical noise from the machinery would corrupt the signal';
  return null;
}
