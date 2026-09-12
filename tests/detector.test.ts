import { describe, expect, it } from 'vitest';
import {
  backEdges,
  bitsToFireAgain,
  borderOf,
  buildDetector,
  partialFallbacks,
  runDetector,
} from '../src/logic/detector.js';

describe('how soon it can fire again', () => {
  it('finds the part of the end that is also the start', () => {
    expect(borderOf('101')).toBe('1');
    expect(borderOf('1010')).toBe('10');
    expect(borderOf('110')).toBe('');
    expect(borderOf('11')).toBe('1');
  });

  it('agrees with actually running the machine, for every pattern up to 4 bits', () => {
    for (let length = 2; length <= 4; length++) {
      for (let value = 0; value < 2 ** length; value++) {
        const pattern = value.toString(2).padStart(length, '0');
        for (const overlap of [true, false]) {
          const need = bitsToFireAgain(pattern, overlap);
          // Feed the pattern, then the shortest continuation that could finish another match.
          const tail = overlap ? pattern.slice(borderOf(pattern).length) : pattern;
          const { detections } = runDetector(buildDetector(pattern, overlap), pattern + tail);
          expect(tail.length).toBe(need);
          expect(detections.at(-1)).toBe(pattern.length + need - 1);
          // And nothing shorter fires: no detection between the two.
          expect(
            detections.filter((at) => at > pattern.length - 1 && at < pattern.length + need - 1),
          ).toEqual([]);
        }
      }
    }
  });
});

describe('building a detector from its pattern', () => {
  it('has one state per matched prefix, plus the start', () => {
    const machine = buildDetector('101');
    expect(machine.states.map((state) => state.matched)).toEqual(['', '1', '10', '101']);
    expect(machine.states.map((state) => state.output)).toEqual([false, false, false, true]);
  });

  it('gives every state exactly one move for 0 and one for 1', () => {
    for (const pattern of ['1', '10', '101', '110', '1011', '0110']) {
      const machine = buildDetector(pattern);
      expect(machine.next).toHaveLength(pattern.length + 1);
      for (const [zero, one] of machine.next) {
        expect(zero).toBeGreaterThanOrEqual(0);
        expect(one).toBeLessThanOrEqual(pattern.length);
      }
    }
  });

  it('rejects anything that is not bits', () => {
    expect(() => buildDetector('12')).toThrow();
  });
});

describe('the state really is "how much of the pattern have I matched"', () => {
  // Deterministic pseudo-random streams, so a failure is reproducible.
  const stream = (seed: number, length: number): string => {
    let x = seed;
    return Array.from({ length }, () => {
      x = (x * 1103515245 + 12345) % 2147483648;
      return x % 2 === 0 ? '0' : '1';
    }).join('');
  };

  it('ends every prefix of the input in the state a brute-force search would give', () => {
    for (const pattern of ['101', '110', '1011', '0010']) {
      const machine = buildDetector(pattern);
      const bits = stream(pattern.length * 7 + 3, 60);
      const { path } = runDetector(machine, bits);
      for (let end = 1; end <= bits.length; end++) {
        const seen = bits.slice(0, end);
        let expected = 0;
        for (let length = Math.min(pattern.length, seen.length); length > 0; length--) {
          if (seen.endsWith(pattern.slice(0, length))) {
            expected = length;
            break;
          }
        }
        expect(path[end]).toBe(expected);
      }
    }
  });

  it('fires exactly where the pattern ends, when overlapping', () => {
    const bits = stream(99, 80);
    for (const pattern of ['101', '11', '1001']) {
      const expected: number[] = [];
      for (let index = pattern.length - 1; index < bits.length; index++) {
        if (bits.slice(index - pattern.length + 1, index + 1) === pattern) expected.push(index);
      }
      expect(runDetector(buildDetector(pattern), bits).detections).toEqual(expected);
    }
  });
});

describe('overlapping against non-overlapping', () => {
  it('finds 101 twice in 10101 when matches may share bits', () => {
    expect(runDetector(buildDetector('101', true), '10101').detections).toEqual([2, 4]);
  });

  it('finds it once when they may not, because the shared 1 was used up', () => {
    expect(runDetector(buildDetector('101', false), '10101').detections).toEqual([2]);
  });

  it('keeps firing on a run of ones for an overlapping 11 detector', () => {
    expect(runDetector(buildDetector('11', true), '1111').detections).toEqual([1, 2, 3]);
    expect(runDetector(buildDetector('11', false), '1111').detections).toEqual([1, 3]);
  });
});

describe('Mealy against Moore', () => {
  const allPatterns = (): string[] =>
    [2, 3, 4].flatMap((length) =>
      Array.from({ length: 2 ** length }, (_, v) => v.toString(2).padStart(length, '0')),
    );
  const stream = (seed: number, length: number): string => {
    let x = seed;
    return Array.from({ length }, () => {
      x = (x * 1103515245 + 12345) % 2147483648;
      return x % 2 === 0 ? '0' : '1';
    }).join('');
  };

  it('needs exactly one fewer state, because the output lives on an arrow', () => {
    for (const pattern of allPatterns()) {
      expect(buildDetector(pattern, true, 'mealy').states).toHaveLength(pattern.length);
      expect(buildDetector(pattern, true, 'moore').states).toHaveLength(pattern.length + 1);
    }
  });

  it('finds the pattern at exactly the same places, for every pattern and both overlap rules', () => {
    for (const pattern of allPatterns()) {
      for (const overlap of [true, false]) {
        const bits = stream(pattern.length * 31 + (overlap ? 1 : 2), 70);
        expect(runDetector(buildDetector(pattern, overlap, 'mealy'), bits).detections).toEqual(
          runDetector(buildDetector(pattern, overlap, 'moore'), bits).detections,
        );
      }
    }
  });

  it('puts the 1 on the arrow that completes 101 and lands where the next match can start', () => {
    const overlapping = buildDetector('101', true, 'mealy');
    expect(overlapping.outputs[2]).toEqual([false, true]); // from "10", a 1 completes it
    expect(overlapping.next[2]![1]).toBe(1); // and keeps the final 1
    const fresh = buildDetector('101', false, 'mealy');
    expect(fresh.next[2]![1]).toBe(0); // non-overlapping forgets it
  });

  it('never marks a Mealy state as an output state', () => {
    expect(buildDetector('110', true, 'mealy').states.every((state) => !state.output)).toBe(true);
  });
});

describe('the arrows students draw wrong', () => {
  it('sends 110 back to "11", not to the start, after a third 1', () => {
    // Seen 1, 1 and then another 1: the last two bits are still the start of 110.
    const machine = buildDetector('110');
    expect(machine.next[2]![1]).toBe(2);
  });

  it('sends 101 from "10" on a 0 all the way back, because "100" contains no start of 101', () => {
    expect(buildDetector('101').next[2]![0]).toBe(0);
  });

  it('sends 1011 from "101" on a 0 to "10", keeping part of what it saw', () => {
    const machine = buildDetector('1011');
    expect(machine.next[3]![0]).toBe(2);
    expect(partialFallbacks(machine)).toContainEqual({ from: 3, bit: 0, to: 2 });
  });

  it('lists back edges without counting self-loops', () => {
    for (const edge of backEdges(buildDetector('110'))) expect(edge.to).toBeLessThan(edge.from);
  });
});
