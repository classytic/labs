import { describe, expect, it } from 'vitest';
import manifest from '../../../src/domains/chem/titration/manifest.js';

describe('titration authoring contract', () => {
  it('provides scientifically safe bounded defaults', () => {
    expect(manifest.schema.parse({})).toMatchObject({
      analyte: 'weak-acid',
      concAcid: 0.1,
      volAcidMl: 25,
      concBase: 0.1,
      pKa: 4.76,
      indicator: 'phenolphthalein',
    });
    expect(() => manifest.schema.parse({ concBase: 0 })).toThrow();
    expect(() => manifest.schema.parse({ pKa: 30 })).toThrow();
  });
});
