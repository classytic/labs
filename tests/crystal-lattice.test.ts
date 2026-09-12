import { describe, expect, it } from 'vitest';
import { LATTICE_FACTS, latticePoints } from '../src/chem/crystal-lattice/core.js';

describe('crystal lattice model', () => {
  it('uses the standard cubic unit-cell counts and coordination numbers', () => {
    expect(LATTICE_FACTS['simple-cubic']).toMatchObject({ atomsPerCell: 1, coordination: 6 });
    expect(LATTICE_FACTS['body-centred']).toMatchObject({ atomsPerCell: 2, coordination: 8 });
    expect(LATTICE_FACTS['face-centred']).toMatchObject({ atomsPerCell: 4, coordination: 12 });
    expect(LATTICE_FACTS['simple-cubic'].packingEfficiency).toBeCloseTo(Math.PI / 6);
    expect(LATTICE_FACTS['body-centred'].packingEfficiency).toBeCloseTo((Math.sqrt(3) * Math.PI) / 8);
    expect(LATTICE_FACTS['face-centred'].packingEfficiency).toBeCloseTo(Math.PI / (3 * Math.sqrt(2)));
  });

  it('deduplicates sites shared by neighbouring rendered cells', () => {
    expect(latticePoints('simple-cubic', 1)).toHaveLength(8);
    expect(latticePoints('body-centred', 1)).toHaveLength(9);
    expect(latticePoints('face-centred', 1)).toHaveLength(14);
    expect(latticePoints('simple-cubic', 2)).toHaveLength(27);
    expect(new Set(latticePoints('face-centred', 2).map(({ x, y, z }) => `${x}:${y}:${z}`)).size).toBe(
      latticePoints('face-centred', 2).length,
    );
  });
});
