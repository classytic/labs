/**
 * The previously-loose authoring schemas are now real discriminated unions (no z.any / z.unknown
 * escape hatches): an authored scene / component / construction is validated against the runtime's
 * actual shape, so a malformed scenario is caught at authoring time, not in the preview.
 */
import { describe, it, expect } from 'vitest';
import businessLesson from '../../src/domains/accounting/business-lesson/manifest.js';
import circuitBuilder from '../../src/domains/circuits/circuit-builder/manifest.js';
import circuitScene from '../../src/domains/circuits/circuit-scene/manifest.js';
import geometryBoard from '../../src/domains/geometry/geometry-board/manifest.js';

describe('hardened authoring schemas', () => {
  it('business-lesson validates a full scene script', () => {
    const good = {
      scenes: [
        { kind: 'narrate', text: 'Day 1 at the samosa stall.' },
        {
          kind: 'decide',
          prompt: 'Invest?',
          choices: [
            {
              label: 'Yes',
              actions: [
                { type: 'invest', amount: 1000 },
                { type: 'buyStock', qty: 50, unitCost: 5 },
              ],
              feedback: 'Capital in.',
            },
          ],
        },
        {
          kind: 'predict',
          prompt: 'Profit?',
          choices: [{ value: 'a', label: 'up' }],
          answer: 'a',
          explain: 'Sales exceed costs.',
        },
        { kind: 'report', show: 'income' },
      ],
      init: { cash: 500 },
    };
    expect(businessLesson.schema.safeParse(good).success).toBe(true);
    // unknown action type + unknown scene kind are rejected (were silently allowed by z.any).
    expect(
      businessLesson.schema.safeParse({
        scenes: [
          {
            kind: 'decide',
            prompt: 'x',
            choices: [{ label: 'y', actions: [{ type: 'teleport', amount: 1 }], feedback: 'z' }],
          },
        ],
      }).success,
    ).toBe(false);
    expect(businessLesson.schema.safeParse({ scenes: [{ kind: 'bogus' }] }).success).toBe(false);
  });

  it('circuit-builder validates typed components', () => {
    expect(
      circuitBuilder.schema.safeParse({
        components: [
          { type: 'bulb', ohms: 12 },
          { type: 'switch', closed: false },
          { type: 'resistor', ohms: 100, label: 'R' },
        ],
      }).success,
    ).toBe(true);
    expect(circuitBuilder.schema.safeParse({ components: [{ type: 'capacitor', farads: 1 }] }).success).toBe(
      false,
    ); // unknown type
    expect(circuitBuilder.schema.safeParse({ components: [{ type: 'resistor' }] }).success).toBe(false); // missing ohms
    expect(circuitBuilder.schema.safeParse({ battery: 25 }).success).toBe(false);
  });

  it('circuit-scene preserves and validates explicit authored wires', () => {
    const doc = {
      parts: [
        { id: 'cell', kind: 'cell', at: { x: 80, y: 80 }, pins: { p: 'n1', n: 'n2' } },
        { id: 'lamp', kind: 'bulb', at: { x: 220, y: 80 }, pins: { a: 'n3', b: 'n4' } },
      ],
      nodes: [],
      wires: [
        {
          id: 'w1',
          a: { partId: 'cell', pin: 'p' },
          b: { partId: 'lamp', pin: 'a' },
          mid: [{ x: 150, y: 50 }],
        },
      ],
      size: { w: 560, h: 300 },
    };
    const parsed = circuitScene.schema.parse({ doc });
    expect(parsed.doc?.wires).toEqual(doc.wires);
    expect(
      circuitScene.schema.safeParse({ doc: { ...doc, wires: [{ id: '', a: {}, b: {} }] } }).success,
    ).toBe(false);
  });

  it('geometry-board validates a construction', () => {
    expect(
      geometryBoard.schema.safeParse({
        scene: [
          { type: 'point', id: 'A', x: 0, y: 0 },
          { type: 'circle', id: 'c', center: 'A', radius: 3 },
          { type: 'intersect', id: 'X', of: ['c', 'l'] },
        ],
      }).success,
    ).toBe(true);
    expect(geometryBoard.schema.safeParse({ scene: [{ type: 'point', id: 'A' }] }).success).toBe(false); // missing x/y
    expect(geometryBoard.schema.safeParse({ scene: [{ type: 'wormhole', id: 'W' }] }).success).toBe(false); // unknown element
  });

  it('a blank config still parses (every authoring field is optional)', () => {
    expect(businessLesson.schema.safeParse({}).success).toBe(true);
    expect(circuitBuilder.schema.safeParse({}).success).toBe(true);
    expect(geometryBoard.schema.safeParse({}).success).toBe(true);
  });
});
