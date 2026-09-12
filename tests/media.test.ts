import { describe, expect, it } from 'vitest';
import {
  MEDIA,
  PAIRS,
  PINOUTS,
  SCENARIOS,
  cableKind,
  checkPinout,
  isSplitPair,
  isStriped,
  pairOf,
  pairPins,
  ruleOut,
  type WireColor,
} from '../src/networking/media.js';

describe('the eight wires', () => {
  it('uses each colour exactly once in both standards', () => {
    for (const standard of ['T568A', 'T568B'] as const) {
      const order = PINOUTS[standard];
      expect(order).toHaveLength(8);
      expect(new Set(order).size).toBe(8);
    }
  });

  it('is built from four twisted pairs and nothing else', () => {
    const fromPairs = PAIRS.flatMap((pair) => pair.wires).sort();
    expect([...PINOUTS.T568B].sort()).toEqual(fromPairs);
    for (const wire of PINOUTS.T568B) expect(pairOf(wire)).toBeGreaterThanOrEqual(0);
  });

  it('pairs one striped wire with one solid wire', () => {
    for (const pair of PAIRS) {
      expect(pair.wires.filter(isStriped)).toHaveLength(1);
    }
  });

  it('keeps the blue pair on pins 4 and 5 in BOTH standards', () => {
    // This is the constraint everything else bends around: it keeps an RJ45 socket compatible
    // with an older two-wire telephone plug, which uses the middle position.
    expect(pairPins('T568B', 'blue')).toEqual([4, 5]);
    expect(pairPins('T568A', 'blue')).toEqual([4, 5]);
  });

  it('splits the green pair around it, which is why pin 3 and pin 6 are not adjacent', () => {
    expect(pairPins('T568B', 'green')).toEqual([3, 6]);
    expect(isSplitPair('T568B', 'green')).toBe(true);
    // Every other pair sits on neighbouring pins.
    for (const name of ['orange', 'blue', 'brown']) expect(isSplitPair('T568B', name)).toBe(false);
  });

  it('swaps only the orange and green pairs between the two standards', () => {
    expect(pairPins('T568A', 'orange')).toEqual(pairPins('T568B', 'green'));
    expect(pairPins('T568A', 'green')).toEqual(pairPins('T568B', 'orange'));
    expect(pairPins('T568A', 'brown')).toEqual(pairPins('T568B', 'brown'));
  });
});

describe('checking an attempt', () => {
  const right = PINOUTS.T568B;

  it('accepts the exact standard', () => {
    expect(checkPinout(right, 'T568B')).toMatchObject({ correct: true, wrong: [], placed: 8 });
  });

  it('names the pins that are wrong, 1-based', () => {
    const swapped: WireColor[] = [...right];
    [swapped[0], swapped[1]] = [swapped[1]!, swapped[0]!];
    const result = checkPinout(swapped, 'T568B');
    expect(result.correct).toBe(false);
    expect(result.wrong).toEqual([1, 2]);
  });

  it('treats an empty slot as unplaced rather than wrong', () => {
    const partial = [right[0], undefined, right[2]];
    const result = checkPinout(partial, 'T568B');
    expect(result.placed).toBe(2);
    expect(result.wrong).toEqual([]);
    expect(result.correct).toBe(false);
  });

  it('marks a correct T568B attempt as wrong against T568A, which is the point of two standards', () => {
    expect(checkPinout(right, 'T568A').correct).toBe(false);
  });
});

describe('what kind of cable you just made', () => {
  it('is straight-through when both ends match', () => {
    expect(cableKind('T568B', 'T568B')).toBe('straight-through');
    expect(cableKind('T568A', 'T568A')).toBe('straight-through');
  });

  it('is a crossover when the ends differ', () => {
    expect(cableKind('T568A', 'T568B')).toBe('crossover');
    expect(cableKind('T568B', 'T568A')).toBe('crossover');
  });
});

describe('choosing a medium', () => {
  it('describes three genuinely different carriers', () => {
    expect(MEDIA.map((medium) => medium.id)).toEqual(['copper', 'fibre', 'radio']);
    expect(new Set(MEDIA.map((medium) => medium.carrier)).size).toBe(3);
  });

  it('rules copper out on distance beyond 100 m', () => {
    const copper = MEDIA.find((medium) => medium.id === 'copper')!;
    const far = SCENARIOS.find((scenario) => scenario.id === 'buildings')!;
    expect(ruleOut(copper, far)).toContain('longer than 100');
  });

  it('rules copper out beside machinery even at a workable distance', () => {
    const copper = MEDIA.find((medium) => medium.id === 'copper')!;
    const factory = SCENARIOS.find((scenario) => scenario.id === 'factory')!;
    expect(factory.metres).toBeLessThan(copper.maxMetres);
    expect(ruleOut(copper, factory)).toContain('noise');
  });

  it('clears fibre for both of those, because light carries no current', () => {
    const fibre = MEDIA.find((medium) => medium.id === 'fibre')!;
    for (const id of ['buildings', 'factory']) {
      expect(
        ruleOut(
          fibre,
          SCENARIOS.find((scenario) => scenario.id === id)!,
        ),
      ).toBeNull();
    }
  });

  it('rules out every cable for a device that moves', () => {
    const phone = SCENARIOS.find((scenario) => scenario.id === 'phone')!;
    for (const medium of MEDIA) {
      const verdict = ruleOut(medium, phone);
      if (medium.id === 'radio') expect(verdict).toBeNull();
      else expect(verdict).toContain('plugged');
    }
  });

  it('has an answer for every scenario that is not ruled out', () => {
    for (const scenario of SCENARIOS) {
      const best = MEDIA.find((medium) => medium.id === scenario.best)!;
      expect(ruleOut(best, scenario)).toBeNull();
    }
  });

  it('marks radio as the only shared, overhearable medium', () => {
    expect(MEDIA.filter((medium) => medium.broadcast).map((medium) => medium.id)).toEqual(['radio']);
  });
});
