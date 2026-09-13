import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const compactPickerFiles = [
  'src/math/measurement/preset.tsx',
  'src/math/geometry-foundations/preset.tsx',
  'src/math/area-rearrange/preset.tsx',
  'src/math/solid-net/preset.tsx',
  'src/chem/orbitals/preset.tsx',
  'src/chem/molecular-geometry/preset.tsx',
  'src/chem/electrochem/preset.tsx',
  'src/chem/stoichiometry/preset.tsx',
  'src/chem/gas-box/preset.tsx',
  'src/physics/efficiency/preset.tsx',
  'src/physics/expansion/preset.tsx',
  'src/physics/gas-process/preset.tsx',
  'src/physics/fluid-pressure/preset.tsx',
  'src/physics/stress-strain/preset.tsx',
  'src/physics/temperature-scales/preset.tsx',
  'src/physics/modern/nuclear/preset.tsx',
  'src/physics/modern/quantum/preset.tsx',
  'src/physics/modern/quantum/bloch-preset.tsx',
] as const;

describe('learning-control presentation policy', () => {
  it.each(compactPickerFiles)('%s uses the compact activity picker for crowded or long choices', (file) => {
    const source = readFileSync(resolve(file), 'utf8');
    expect(source).toContain('<ActivitySelect');
  });

  it('keeps the shared activity picker backed by the host shadcn Select', () => {
    const source = readFileSync(resolve('src/kit/controls.tsx'), 'utf8');
    expect(source).toContain("from '@/components/ui/select'");
    expect(source).toContain('<SelectGroup>');
  });
});
