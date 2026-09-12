import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(process.cwd(), 'src', 'three', 'biology');

describe('cell world architecture', () => {
  it('keeps shared vocabulary in the biology WebGL subpath', () => {
    const source = readFileSync(join(root, 'cell-world.tsx'), 'utf8');
    for (const name of ['CellBoundary', 'CellOrganelle', 'CellRoute', 'CargoFlow', 'Bilayer']) {
      expect(source).toContain(`function ${name}`);
    }
  });

  it('removes repeated cell-shell geometry from migrated scenes', () => {
    for (const file of [
      'cell-system.tsx',
      'cell-energy.tsx',
      'mitosis-explorer.tsx',
      'meiosis-explorer.tsx',
    ]) {
      expect(readFileSync(join(root, file), 'utf8')).not.toContain('<sphereGeometry args={[2.');
    }
  });
});
