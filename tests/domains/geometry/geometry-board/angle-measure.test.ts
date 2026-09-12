import { describe, expect, it } from 'vitest';
import { geoSceneToDoc, type GeoElement } from '../../../../src/geometry/board/preset.js';
import manifest from '../../../../src/domains/geometry/geometry-board/manifest.js';

const VIEW = { xMin: -1, xMax: 11, yMin: -5, yMax: 5 };

/**
 * The board could only ever measure a DISTANCE, which is why every angle lesson in
 * O Level geometry had to ship without a lab: you cannot ask a learner to verify
 * that two angles stay equal if the figure never shows either of them. Stage has
 * had `op: 'angle'` all along; only this adapter was missing.
 */
describe('geometry-board angle measurement', () => {
  it('maps a three-point measure onto stage’s angle op, vertex in the middle', () => {
    const scene: GeoElement[] = [
      { type: 'point', id: 'A', x: 0, y: 0 },
      { type: 'point', id: 'B', x: 4, y: 0, draggable: true },
      { type: 'point', id: 'C', x: 4, y: 3 },
      { type: 'measure', kind: 'angle', of: ['A', 'B', 'C'], label: 'ABC' },
    ];
    const doc = geoSceneToDoc(scene, VIEW);
    const measure = doc.elements.at(-1);
    expect(measure?.kind).toBe('measure');
    expect(measure?.def).toEqual({
      op: 'angle',
      of: [{ ref: 'A' }, { ref: 'B' }, { ref: 'C' }],
    });
  });

  it('still maps a two-point measure onto the distance op', () => {
    const scene: GeoElement[] = [
      { type: 'point', id: 'A', x: 0, y: 0 },
      { type: 'point', id: 'B', x: 3, y: 4 },
      { type: 'measure', kind: 'distance', of: ['A', 'B'] },
    ];
    const doc = geoSceneToDoc(scene, VIEW);
    expect(doc.elements.at(-1)?.def).toEqual({
      op: 'distance',
      of: [{ ref: 'A' }, { ref: 'B' }],
    });
  });

  it('accepts an authored angle scene and still accepts a blank insert', () => {
    expect(manifest.schema.safeParse({}).success).toBe(true);
    expect(
      manifest.schema.safeParse({
        scene: [
          { type: 'point', id: 'A', x: 0, y: 0 },
          { type: 'point', id: 'B', x: 4, y: 0 },
          { type: 'point', id: 'C', x: 4, y: 3 },
          { type: 'measure', kind: 'angle', of: ['A', 'B', 'C'] },
        ],
      }).success,
    ).toBe(true);
  });

  it('rejects an angle measure given only two points, and a distance given three', () => {
    // Without this the author ships a measure the resolver cannot evaluate, and the
    // figure silently shows nothing where the number was supposed to be.
    expect(
      manifest.schema.safeParse({ scene: [{ type: 'measure', kind: 'angle', of: ['A', 'B'] }] }).success,
    ).toBe(false);
    expect(
      manifest.schema.safeParse({ scene: [{ type: 'measure', kind: 'distance', of: ['A', 'B', 'C'] }] })
        .success,
    ).toBe(false);
  });

  it('defaults an unlabelled kind to distance, so existing scenes keep working', () => {
    const parsed = manifest.schema.safeParse({
      scene: [{ type: 'measure', of: ['A', 'B'] }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const el = parsed.data.scene?.[0] as { kind: string };
      expect(el.kind).toBe('distance');
    }
  });
});
