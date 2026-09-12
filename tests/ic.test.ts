import { describe, expect, it } from 'vitest';
import { CHIPS, behavesAs, evaluateChip, pin, type Wire } from '../src/logic/ic.js';

const POWER: Wire[] = [
  ['VCC', pin(14)],
  ['GND', pin(7)],
];
const nandOnGate1: Wire[] = [...POWER, ['A', pin(1)], ['B', pin(2)], ['LED', pin(3)]];

describe('the one fact that matters most: power', () => {
  it('does nothing at all without +5 V on pin 14 and ground on pin 7', () => {
    const result = evaluateChip(
      '7400',
      [
        ['A', pin(1)],
        ['B', pin(2)],
        ['LED', pin(3)],
      ],
      { A: false, B: false },
    );
    expect(result.powered).toBe(false);
    expect(result.led).toBeNull(); // dark, even though NAND(0, 0) would be 1
    expect(result.diagnostics.map((d) => d.code)).toContain('unpowered');
  });

  it('warns loudly when the supply is backwards', () => {
    const result = evaluateChip(
      '7400',
      [
        ['VCC', pin(7)],
        ['GND', pin(14)],
        ['LED', pin(3)],
      ],
      { A: false, B: false },
    );
    expect(result.diagnostics.map((d) => d.code)).toContain('reversed');
  });
});

describe('the datasheet pinouts', () => {
  it('puts a NAND on pins 1, 2 → 3 of a 7400', () => {
    expect(behavesAs('7400', nandOnGate1, (a, b) => !(a && b))).toBe(true);
  });

  it('shares that pinout across the quad 2-input family', () => {
    expect(behavesAs('7408', nandOnGate1, (a, b) => a && b)).toBe(true);
    expect(behavesAs('7432', nandOnGate1, (a, b) => a || b)).toBe(true);
    expect(behavesAs('7486', nandOnGate1, (a, b) => a !== b)).toBe(true);
  });

  it('puts the 7402 NOR output FIRST, the classic trap', () => {
    // Wired as if it were a 7400, pin 3 is an input: the LED just echoes switch B.
    const asIf7400 = evaluateChip('7402', nandOnGate1, { A: true, B: false });
    expect(asIf7400.diagnostics.map((d) => d.code)).toContain('led-on-input');
    const correct: Wire[] = [...POWER, ['A', pin(2)], ['B', pin(3)], ['LED', pin(1)]];
    expect(behavesAs('7402', correct, (a, b) => !(a || b))).toBe(true);
  });

  it('inverts pin 1 onto pin 2 in a 7404', () => {
    const wires: Wire[] = [...POWER, ['A', pin(1)], ['LED', pin(2)]];
    for (const A of [false, true]) expect(evaluateChip('7404', wires, { A, B: false }).led).toBe(!A);
  });

  it('keeps pin 14 as +5 V and pin 7 as ground on every chip', () => {
    for (const chip of Object.values(CHIPS)) {
      const used = chip.gates.flatMap((gate) => [...gate.inputs, gate.output]);
      expect(used).not.toContain(7);
      expect(used).not.toContain(14);
    }
  });
});

describe('the mistakes a first lab session makes', () => {
  it('reports a switch wired onto a gate output as two outputs fighting', () => {
    const result = evaluateChip('7400', [...POWER, ['A', pin(3)], ['LED', pin(3)]], { A: true, B: false });
    expect(result.diagnostics.map((d) => d.code)).toContain('contention');
  });

  it('refuses to guess a floating input', () => {
    const result = evaluateChip('7400', [...POWER, ['A', pin(1)], ['LED', pin(3)]], { A: true, B: false });
    expect(result.led).toBeNull();
    expect(result.diagnostics.map((d) => d.code)).toContain('floating');
  });

  it('notices an LED on an input pin', () => {
    const result = evaluateChip('7400', [...POWER, ['A', pin(1)], ['B', pin(2)], ['LED', pin(1)]], {
      A: true,
      B: true,
    });
    expect(result.diagnostics.map((d) => d.code)).toContain('led-on-input');
  });
});

describe('building with more than one gate', () => {
  it('makes AND out of two NANDs with jumpers between pins, all on one 7400', () => {
    const wires: Wire[] = [
      ...POWER,
      ['A', pin(1)],
      ['B', pin(2)],
      [pin(3), pin(4)], // the first NAND's output feeds both inputs of the second
      [pin(3), pin(5)],
      ['LED', pin(6)],
    ];
    expect(behavesAs('7400', wires, (a, b) => a && b)).toBe(true);
  });

  it('does not accept the single NAND as an AND', () => {
    expect(behavesAs('7400', nandOnGate1, (a, b) => a && b)).toBe(false);
  });
});
